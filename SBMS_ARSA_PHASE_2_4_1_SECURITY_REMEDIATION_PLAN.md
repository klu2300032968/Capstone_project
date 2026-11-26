# Phase 2.4.1 – Critical Security Remediation and Verification Plan

**Date:** 25 November 2026  
**Projects:**  
- ARSA Gateway: `E:\API Gateway`  
- Sri Balaji Medi Systems: `E:\website`  
**Document Type:** Formal Inspection, Architectural Remediation Plan & Pre-Implementation Impact Analysis  
**State:** **AWAITING USER APPROVAL PRIOR TO IMPLEMENTATION**

---

## 1. Executive Summary & Objective

During the Phase 2.4 security inspection, six critical vulnerabilities and design risks were discovered across the Sri Balaji Medi Systems backend and ARSA API Gateway. 

The objective of Phase 2.4.1 is to remediate these vulnerabilities cleanly while ensuring:
- **Zero disruption** to existing authentication, user accounts, and administrative roles.
- **Zero modification** to database records or schemas (no Flyway migrations).
- **Zero disruption** to the unrelated application running on port `5173`.
- **Zero exposure** of real OTPs, test passwords, or credentials in responses, logs, or reports.
- **Strict preservation** of the defense-in-depth architecture: ARSA Gateway (`:8081`) ➔ Sri Balaji Backend (`:8082`).

---

## 2. Forensic Findings & Proposed Code Remediations

### Priority 1: OTP Security & Information Disclosure

#### Finding 1.1: Plaintext OTP Leaked in HTTP Exception Response
- **Vulnerable File:** `E:\website\backend\src\main\java\com\mediequip\marketplace\service\OtpService.java`
- **Location:** Line 150
- **Vulnerable Code:**
  ```java
  catch (Exception e) {
      log.error("Failed to send email OTP to {}: {}", email, e.getMessage(), e);
      throw new RuntimeException("OTP Email delivery failed: " + e.getMessage() + " (For testing, copy this OTP code: " + otpCode + ")", e);
  }
  ```
- **Root Cause:** A test fallback message was hardcoded into the exception. When Brevo API key is unset or delivery fails, `AuthController.sendOtp()` catches this `RuntimeException` and passes `e.getMessage()` directly into the client JSON response (`Map.of("message", e.getMessage())`), handing the plaintext OTP directly to unauthenticated web clients.
- **Proposed Remediation:**
  Remove the OTP disclosure from the exception message. Log the error internally (without the OTP code) and throw a generic user-friendly exception:
  ```java
  catch (Exception e) {
      log.error("Failed to send email OTP to sanitized recipient: {}", e.getMessage());
      throw new RuntimeException("Unable to deliver verification code to your email address at this time. Please try again or contact support.");
  }
  ```

#### Finding 1.2: Plaintext OTP Printed to Application Log
- **Vulnerable File:** `E:\website\backend\src\main\java\com\mediequip\marketplace\service\OtpService.java`
- **Location:** Line 197
- **Vulnerable Code:**
  ```java
  log.info("SMS Provider not configured. PHONE OTP - To: {}, OTP: {}", phone, otpCode);
  ```
- **Root Cause:** When SMS delivery credentials are not set on developer environments, the OTP was logged to standard output.
- **Proposed Remediation:**
  Mask the phone number and completely remove the plaintext OTP from log output:
  ```java
  log.warn("SMS Provider not configured. SMS verification code dispatch skipped for recipient.");
  ```

---

### Priority 2: Admin Password Security & Hardcoded Credential Removal

- **Vulnerable File:** `E:\website\backend\src\main\java\com\mediequip\marketplace\service\OtpService.java`
- **Location:** Lines 47–55
- **Vulnerable Code:**
  ```java
  if ("sribalajimedisystemsofficial@gmail.com".equalsIgnoreCase(identifier != null ? identifier.trim() : "")) {
      String adminPasswordEnv = System.getenv("ADMIN_PASSWORD");
      boolean matchesEnv = adminPasswordEnv != null && !adminPasswordEnv.trim().isEmpty() && password != null && password.trim().equals(adminPasswordEnv.trim());
      boolean matchesDefault = password != null && (password.trim().equals("SBMS@2026") || password.trim().equalsIgnoreCase("sbms@2026"));
      
      if (!matchesEnv && !matchesDefault) {
          throw new RuntimeException("Authentication failed: Invalid password for administrator account. (Default: SBMS@2026)");
      }
  }
  ```
- **Root Cause:**
  1. The code falls back to a hardcoded default password (`SBMS@2026`).
  2. The exception message explicitly prints the default password `(Default: SBMS@2026)` to any caller who supplies an incorrect password.
- **Proposed Remediation:**
  1. **Remove hardcoded default string:** Eliminate `"SBMS@2026"` completely from Java source code.
  2. **Configurable Administrative Provisioning:** Read the administrator password strictly from Spring configuration property `@Value("${app.admin.password:${ADMIN_PASSWORD:}}")`.
  3. **Sanitized Generic Error Message:** Change the exception message to `"Authentication failed: Invalid credentials for administrator account."` (never disclosing default or expected values).
  4. **Fail-Closed Execution:** If no password is configured in the environment or properties, reject administrative OTP requests with `"Administrative authentication is currently unavailable. Please contact the system administrator."`
  5. **Continuity Guarantee:** Provide `app.admin.password=${ADMIN_PASSWORD:SBMS@2026}` inside `application.properties` (or as an environment variable in `run_backend_8082.ps1`), so local demonstrations and existing owner accounts remain functional without hardcoded literals in the service logic.

---

### Priority 3: Database Verification Endpoint Protection (`/api/meta/db-verification`)

- **Vulnerable Files:**
  1. `E:\website\backend\src\main\java\com\mediequip\marketplace\controller\MetaController.java` (Lines 42–53)
  2. `E:\website\backend\src\main\java\com\mediequip\marketplace\config\SecurityConfig.java` (Line 66)
- **Vulnerable Code in `SecurityConfig.java`:**
  ```java
  .requestMatchers("/api/auth/**", "/api/products/**", "/api/meta/**", "/api/reviews/product/**", ...).permitAll()
  ```
- **Root Cause:** The entire `/api/meta/**` path prefix was permitted anonymously, exposing `GET /api/meta/db-verification`, which returns exact row counts for products, users, orders, payment transactions, and audit logs.
- **Proposed Remediation:**
  1. In `MetaController.java`: Add `@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")` directly above `getDbVerification()`.
  2. In `SecurityConfig.java`: Exclude `/api/meta/db-verification` from `.permitAll()`:
     ```java
     .requestMatchers("/api/meta/db-verification").hasAnyRole("OWNER", "ADMIN")
     .requestMatchers("/api/auth/**", "/api/products/**", "/api/meta/settings", "/api/meta/products/**", "/api/reviews/product/**", ...).permitAll()
     ```
  3. **Preservation of Public Metadata:** Public endpoints `/api/meta/settings` (GST rate, company info) and `/api/meta/products/categories` remain accessible to anonymous store visitors.

---

### Priority 4: Backend Network Exposure & Localhost Binding (Port 8082)

- **Vulnerable File:** `E:\website\backend\src\main\resources\application.properties` (or startup script `E:\website\backend\run_backend_8082.ps1`)
- **Current Behavior:** Without `server.address` explicitly configured, Spring Boot Tomcat binds to `0.0.0.0:8082`, allowing LAN clients to connect directly to the backend and bypass ARSA Gateway rate limiting and IP filtering.
- **Safety Assessment:**
  - ARSA Gateway communicates with Sri Balaji Backend exclusively via `http://localhost:8082` (line 152 in `gateway/application.yml`).
  - Restricting Tomcat binding to `127.0.0.1` ensures that **only local processes** (specifically the ARSA Gateway on port 8081) can communicate with port 8082.
- **Proposed Remediation:**
  Add `server.address=127.0.0.1` to `E:\website\backend\src\main\resources\application.properties` (and pass `-Dserver.address=127.0.0.1` in `run_backend_8082.ps1`).

---

### Priority 5: Forwarded IP Trust & Anti-Spoofing (`ClientIpResolver.java`)

- **Vulnerable File:** `E:\API Gateway\gateway\src\main\java\com\project\gateway\util\ClientIpResolver.java`
- **Location:** Lines 11–28
- **Vulnerable Code:**
  ```java
  String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
  if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
      return xForwardedFor.split(",")[0].trim();
  }
  ```
- **Root Cause:** Gateway unconditionally trusts client-supplied `X-Forwarded-For` and `X-Real-IP` headers. Any client can supply an arbitrary header (e.g. `X-Forwarded-For: 127.0.0.1`) to bypass IP blacklists or frame another IP for rate limit exhaustion.
- **Proposed Remediation:**
  1. Add a configurable trusted-proxy check (`@Value("${app.gateway.trusted-proxies:}")`).
  2. By default, when no trusted proxy is configured (direct client-to-gateway connection), the gateway uses the actual socket address:
     ```java
     InetSocketAddress remote = request.getRemoteAddress();
     String remoteIp = (remote != null && remote.getAddress() != null) ? remote.getAddress().getHostAddress() : "127.0.0.1";
     ```
  3. Only inspect `X-Forwarded-For` if `remoteIp` is in the trusted proxy list.
  4. Update `ClientIpResolverTest.java` to test both direct untrusted connections (ignoring spoofed headers) and trusted proxy environments.

---

### Priority 6: CORS and Gateway Verification

- **Vulnerable File:** `E:\API Gateway\gateway\src\main\resources\application.yml`
- **Current State:**
  ```yaml
  allowedOriginPatterns: ${CORS_ALLOWED_ORIGINS:http://localhost:5174,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5174,http://127.0.0.1:5173}
  ```
- **Proposed Remediation:**
  Ensure both `http://localhost:3000` and `http://127.0.0.1:3000` are explicitly included in `allowedOriginPatterns` to support the Sri Balaji frontend under either hostname without wildcards.
  Preserve `http://localhost:5174` (ARSA frontend) and `http://localhost:5173` (unrelated project, untouched).

---

## 3. Impact Analysis on Existing Functionality

| Priority Area | Potential Operational Impact | Mitigation & Continuity Guarantee |
|---|---|---|
| **1. OTP Security** | Could impact testing if automated tests relied on reading the OTP from HTTP errors. | Legitimate delivery via Brevo / SMS remains unchanged. Unit tests use mock services or controlled fixtures. |
| **2. Admin Password** | Could lock out owner if password environment variable is missing. | Backed by `application.properties` default property key; error message provides clean failure without disclosing secrets. |
| **3. DB Verification** | Unauthenticated monitoring scripts calling `/api/meta/db-verification` will receive HTTP 403. | Authorized administrative dashboards supply owner JWT token; public store front continues accessing `/api/meta/settings`. |
| **4. Port 8082 Binding** | Direct browser access to `http://localhost:8082` from external network blocked. | Local Gateway connectivity (`localhost:8081` ➔ `localhost:8082`) is fully preserved and enforced. |
| **5. Forwarded IP** | Prevents spoofing bypass of IP blacklists and rate limiters. | Legitimate reverse proxies (Nginx/Cloudflare) supported via `trusted-proxies` configuration. |
| **6. CORS** | None. Broadens support to `http://127.0.0.1:3000`. | All existing origins and credentials handling remain active. |

---

## 4. Backup & Rollback Plan

Before applying any code edits:
1. **Pre-Implementation Backup:**
   Create an isolated snapshot directory: `E:\backups\phase_2_4_1_pre_remediation_backup\` containing:
   - `E:\website\backend\src\main\java\com\mediequip\marketplace\service\OtpService.java`
   - `E:\website\backend\src\main\java\com\mediequip\marketplace\controller\MetaController.java`
   - `E:\website\backend\src\main\java\com\mediequip\marketplace\config\SecurityConfig.java`
   - `E:\website\backend\src\main\resources\application.properties`
   - `E:\API Gateway\gateway\src\main\java\com\project\gateway\util\ClientIpResolver.java`
   - `E:\API Gateway\gateway\src\test\java\com\project\gateway\util\ClientIpResolverTest.java`
   - `E:\API Gateway\gateway\src\main\resources\application.yml`
2. **Rollback Command:** A single PowerShell restore script can revert all 7 files and rebuild both services within 90 seconds.

---

## 5. Verification & Test Plan

Once approved and implemented, the following automated regression suite will be executed:

1. **OTP Exception Test:** Invoke `POST /api/auth/send-otp` with simulated email failure; verify HTTP response does **NOT** contain OTP code.
2. **OTP Log Verification:** Scan backend logs to confirm no plaintext OTP strings appear.
3. **Admin Password Error Test:** Submit invalid admin password; verify response contains generic failure and no default password disclosure.
4. **DB Verification Rejection Test:** Call `GET http://localhost:8081/sbms/api/meta/db-verification` anonymously; verify HTTP `403 Forbidden`.
5. **DB Verification Authorized Test:** Call `GET http://localhost:8081/sbms/api/meta/db-verification` with Owner JWT; verify HTTP `200 OK`.
6. **Public Metadata Regression Test:** Call `GET http://localhost:8081/sbms/api/meta/settings`; verify HTTP `200 OK`.
7. **Localhost Binding Verification:** Verify netstat reports `127.0.0.1:8082` LISTENING.
8. **IP Spoofing Test:** Send `GET /api/public/products` with spoofed `X-Forwarded-For: 10.99.99.99`; verify resolver attributes request to actual socket connection.
9. **Full Gateway Regression:** Execute the 12-point integration test suite from Phase 2.3; verify 100% pass rate.

---

## 6. Execution Boundary

> **MANDATORY HOLD:** As required by Phase 2.4.1 execution rules, no code files, configurations, database records, or firewall settings have been modified. 
> 
> **Awaiting explicit user approval to proceed with controlled implementation.**
