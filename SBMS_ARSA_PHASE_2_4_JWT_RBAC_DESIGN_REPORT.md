# Phase 2.4: Sri Balaji Medi Systems – JWT Authentication Compatibility & Gateway RBAC Design

**Execution Date:** 25 November 2026  
**Primary Project:** API Gateway Security Controls With Consistent Enforcement Across Routes (ARSA)  
**Integrated Application:** Sri Balaji Medi Systems (SBMS) E-Commerce Platform  
**Scope:** Technical Inspection, Compatibility Audit, RBAC Mapping & Architectural Design (Inspection & Design Only)  
**Status:** **AUDIT & DESIGN COMPLETE — READY FOR REVIEW**

---

## 1. Executive Summary

Phase 2.4 performs an in-depth security audit and compatibility design for handling authentication and authorization across Sri Balaji Medi Systems requests traversing the ARSA API Gateway.

### Primary Discoveries:
1. **Secret & Key Derivation Incompatibility:** ARSA decodes its secret from a Base64 string into raw bytes, whereas Sri Balaji decodes its secret as raw UTF-8 string bytes. If ARSA Gateway attempted to validate Sri Balaji tokens using its standard decoding, signature verification would immediately fail.
2. **Missing Claims Architecture in SBMS:** Sri Balaji JWTs contain **no role claims**. The token payload consists solely of `{"identifier": "..."}` and subject. User roles (`USER`, `OWNER`, `ADMIN`, `TECHNICIAN`) are retrieved dynamically on every request by querying the MySQL table `medical_equipment.users`.
3. **Database-Driven Authorization:** Sri Balaji's security model links role assignment and account block status (`blocked = true/false`) to real-time database state rather than immutable token claims.
4. **Current Perimeter Defense is Active & Effective:** The ARSA Gateway currently enforces IP Filtering, token-bucket Rate Limiting, CORS, and Centralized Security Event Audit Logging at the `/sbms/**` edge, while downstream Spring Security in Sri Balaji enforces fine-grained user authentication and RBAC.

---

## 2. Step 1: Forensic Inspection of Existing JWT Implementations

A side-by-side comparative analysis of the JWT components in both projects:

| Architectural Dimension | ARSA Platform (`E:\API Gateway`) | Sri Balaji Medi Systems (`E:\website`) |
|---|---|---|
| **Primary Code Artifacts** | `JwtUtils.java`, `JwtAuthenticationFilter.java` | `JwtUtil.java`, `JwtAuthenticationFilter.java` |
| **Library Version** | `io.jsonwebtoken:jjwt-api:0.12.x` (Modern API) | `io.jsonwebtoken:jjwt-api:0.11.5` (Builder API) |
| **Signature Algorithm** | `HS256` (`Jwts.SIG.HS256`) | `HS256` (`SignatureAlgorithm.HS256`) |
| **Secret Encoding & Derivation** | **Base64 Decoded:** `Decoders.BASE64.decode(jwtSecret)` -> `Keys.hmacShaKeyFor(keyBytes)` | **Raw UTF-8 Bytes:** `secret.getBytes()` -> `Keys.hmacShaKeyFor(secret.getBytes())` |
| **Default Secret Property** | `app.jwt.secret` = `404E635266556A586E327235...` | `jwt.secret` = `yourSecretKey12345yourSecretKey...` |
| **Token Expiration Period** | `86400000 ms` (24 Hours) | `86400 s` (24 Hours) |
| **Issuer (`iss`) & Audience (`aud`)** | Not defined / None | Not defined / None |
| **Subject (`sub`) Claim** | Username (`admin`, `alice_dev`) | User Identifier (Email or 10-digit Phone) |
| **User ID & Role Claims** | **Contains explicit role claim:** `claims.put("role", role)` (`ROLE_ADMIN` / `ROLE_USER`) | **NO ROLE CLAIM IN TOKEN.** Only `claims.put("identifier", identifier)` |
| **Token Extraction** | `Authorization: Bearer <token>` | `Authorization: Bearer <token>` (checks null/"null"/"undefined") |
| **User-Role Loading Logic** | Loads `UserDetails` from `api_security_db.users` & assigns authorities | Queries `medical_equipment.users` on **every request**, checks `isBlocked()`, maps to `ROLE_<ROLE>` |
| **Refresh Token Support** | **None** (Stateless single access token) | **None** (Stateless single access token) |
| **Authentication Error Handling** | Custom `JwtAuthenticationEntryPoint` & `CustomAccessDeniedHandler` -> JSON 401/403 with audit log | Default Spring Security filters -> 401/403 HTTP status |

### Incompatibility Root Cause:
If ARSA Gateway were configured today to validate Sri Balaji tokens using ARSA's standard `JwtUtils`, validation would fail for two reasons:
1. **Cryptographic Mismatch:** Parsing a token signed with raw UTF-8 key bytes using a Base64-decoded key generates a `SignatureException` (Invalid HMAC signature).
2. **Missing Role Information:** Even if the cryptographic key were matched, ARSA Gateway cannot extract `ROLE_OWNER` or `ROLE_USER` from the token because Sri Balaji does not encode roles into JWT claims.

---

## 3. Step 2: Analysis & Comparison of Integration Options

We evaluate three potential architectural designs for managing Sri Balaji authentication through the ARSA Gateway:

### Option A: Dual-Secret Gateway JWT Filter
*The ARSA Gateway implements a dedicated filter recognizing Sri Balaji tokens using Sri Balaji's raw UTF-8 secret key.*

- **Security Advantages:** Rejects expired or forged tokens at the gateway edge before reaching port `8082`.
- **Security Disadvantages / Pitfalls:** 
  - Cannot enforce RBAC at the gateway because the JWT contains no role claims.
  - Does not know if a user has been blocked in `medical_equipment.users` without querying the database.
  - Leaks Sri Balaji's JWT secret into the gateway configuration.
- **Implementation Complexity:** Medium (Custom `GatewayFilterFactory` reading separate configuration keys).
- **Token Compatibility:** Compatible for signature verification only; incompatible for role-based route gating.
- **Role Synchronization:** Impossible without database coupling or token schema migration.
- **Revocation & Expiration:** Honors token expiry time (`exp`), but cannot detect mid-session role revocations or account blocks.
- **Downstream Effectiveness:** Downstream Spring Security must still execute its database check and RBAC filter, making gateway validation largely redundant.

---

### Option B: Gateway Calling Centralized Auth Service (Introspection)
*The Gateway intercepts `/sbms/**` requests and makes an internal REST call to Sri Balaji (`http://localhost:8082/api/auth/me` or an internal introspection endpoint) to validate token and retrieve user role.*

- **Security Advantages:** Guarantees real-time authorization, account block validation, and role freshness.
- **Security Disadvantages / Pitfalls:** 
  - Severe latency penalty (adds an extra internal HTTP hop of 15–40ms to every incoming request).
  - High load on downstream server (doubles the request volume hitting port `8082`).
  - Potential circular dependencies or deadlock during connection pool exhaustion.
- **Implementation Complexity:** High (Requires non-blocking WebClient introspection filter in Spring Cloud Gateway with caching).
- **Token Compatibility:** 100% compatible.
- **Role Synchronization:** Immediate and consistent.
- **Revocation & Expiration:** Instantaneous.
- **Downstream Effectiveness:** Redundant duplication of downstream security checks.

---

### Option C: Reverse Proxy Perimeter Defense + Downstream Spring Security (Current & Recommended)
*The ARSA Gateway enforces perimeter defenses (Rate Limiting, IP Filtering, Request Sanitization, and Security Violation Audit Logging), while transparently forwarding the `Authorization` header to Sri Balaji Backend, which enforces zero-trust DB-backed authentication and RBAC.*

- **Security Advantages:**
  - **Zero Trust Architecture:** Downstream service never relies on an edge proxy for user identity; it strictly verifies credentials against the definitive user database.
  - **Immediate Account Enforcement:** If an owner blocks a malicious user (`blocked = true`), access is revoked on their very next request without cache invalidation delays.
  - **Zero Database Coupling:** Gateway remains decoupled from `medical_equipment` database schemas and secrets.
  - **High Performance:** No duplicate token parsing or internal HTTP introspection hops.
  - **Perimeter Protection:** Brute force on `/api/auth/send-otp` is stopped at the Gateway edge (Rate Limit: 5 req / 120s) before hitting the backend.
- **Security Disadvantages:** Malformed or expired JWTs travel to port `8082` before being rejected with HTTP 403.
- **Implementation Complexity:** Low (Already verified, tested, and operational in Phase 2.3).
- **Token Compatibility:** 100% compatible.
- **Role Synchronization:** Native to Sri Balaji database.
- **Revocation & Expiration:** Handled natively by downstream Spring Security.
- **Downstream Effectiveness:** 100% effective and authoritative.

---

### Comparison Matrix

| Evaluation Criteria | Option A: Dual-Secret Gateway Filter | Option B: Introspection Service | Option C: Perimeter Proxy + Downstream RBAC |
|---|---|---|---|
| **Edge Token Rejection** | Signature & Expiry Only | Full Authentication | Network/Rate Limit Only |
| **RBAC Enforcement at Edge** | ❌ (No role claims in JWT) | ✅ (Via network hop) | ⚠️ (Delegated Downstream) |
| **Real-Time Account Blocks** | ❌ (Stale token allowed) | ✅ (Live DB lookup) | ✅ (Live DB lookup) |
| **Performance Overhead** | +1-2 ms | +20-50 ms | **< 0.5 ms (Fastest)** |
| **Microservice Decoupling** | Medium | Low | **High (Cleanest)** |
| **Implementation Risk** | Medium | High | **Low (Zero breaking changes)** |
| **Safest Recommendation** | Secondary Candidate | Not Recommended | **RECOMMENDED PRIMARY** |

**Recommendation:** Adopt **Option C** for current operational stability and zero-trust security. For future phases (Phase 2.5), if gateway-level RBAC is strictly mandated by examiners, implement a dual-phase upgrade: update Sri Balaji's `createToken` to embed the `role` claim in the JWT payload, and subsequently activate an ARSA Gateway RBAC filter.

---

## 4. Step 3: Role-Based Access Control (RBAC) Architecture

### Existing Roles in Sri Balaji Medi Systems:
1. `ROLE_USER`: Standard customer account (verified via OTP). Can view catalog, manage personal cart, place orders, view own order history, and submit customer service requests.
2. `ROLE_OWNER`: Platform superuser and store owner (`sribalajimedisystemsofficial@gmail.com`). Full administrative control over products, inventory, orders, customer management, service engineer dispatch, and settings.
3. `ROLE_ADMIN`: Administrative operator with platform oversight permissions.
4. `ROLE_TECHNICIAN`: Field service engineer. Accesses assigned repair tickets, logs site visits, reserves spare parts, and marks job completions.

---

### Route Authorization Matrix

The matrix below reflects the actual security configuration derived from `SecurityConfig.java` and controller `@PreAuthorize` rules:

| Route Path / Pattern | HTTP Method | Sri Balaji Controller | Security Rule / Annotation | Required Authority |
|---|---|---|---|---|
| `/sbms/api/products/**` | `GET` | `ProductController` | `.permitAll()` | Public / Anonymous |
| `/sbms/api/meta/**` | `GET` | `MetaController` | `.permitAll()` | Public / Anonymous |
| `/sbms/api/reviews/product/**` | `GET` | `ReviewController` | `.permitAll()` | Public / Anonymous |
| `/sbms/api/auth/send-otp` | `POST` | `AuthController` | `.permitAll()` | Public / Anonymous |
| `/sbms/api/auth/verify-otp` | `POST` | `AuthController` | `.permitAll()` | Public / Anonymous |
| `/sbms/api/auth/resend-otp` | `POST` | `AuthController` | `.permitAll()` | Public / Anonymous |
| `/sbms/api/auth/me` | `GET` | `AuthController` | `.anyRequest().authenticated()` | Any Authenticated Role |
| `/sbms/api/cart/**` | `GET, POST, PUT, DELETE` | `CartController` | `.anyRequest().authenticated()` | `ROLE_USER`, `ROLE_OWNER`, `ROLE_ADMIN` |
| `/sbms/api/wishlist/**` | `GET, POST, DELETE` | `WishlistController` | `.anyRequest().authenticated()` | `ROLE_USER`, `ROLE_OWNER`, `ROLE_ADMIN` |
| `/sbms/api/reviews` | `POST` | `ReviewController` | `.anyRequest().authenticated()` | `ROLE_USER`, `ROLE_OWNER`, `ROLE_ADMIN` |
| `/sbms/api/orders/my-orders` | `GET` | `OrderController` | `@PreAuthorize("isAuthenticated()")` | Any Authenticated Role |
| `/sbms/api/orders/{id}` | `GET` | `OrderController` | `@PreAuthorize("isAuthenticated()")` | Any Authenticated Role |
| `/sbms/api/orders` | `POST` | `OrderController` | `@PreAuthorize("isAuthenticated()")` | Any Authenticated Role |
| `/sbms/api/payments/razorpay/**` | `POST` | `PaymentController` | `@PreAuthorize("isAuthenticated()")` | Any Authenticated Role |
| `/sbms/api/services/customer/**` | `GET, POST` | `CustomerServiceController` | `@PreAuthorize("hasRole('USER')")` | `ROLE_USER` |
| `/sbms/api/orders` | `GET` (All orders) | `OrderController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/orders/{id}/status` | `PUT` | `OrderController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/orders/{id}/cancel` | `PUT` | `OrderController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/orders/{id}/return` | `PUT` | `OrderController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/orders/{id}/refund` | `PUT` | `OrderController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/products` | `POST` (Create) | `ProductController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/products/{id}` | `PUT, DELETE` | `ProductController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/products/{id}/restore` | `POST` | `ProductController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/products/{id}/duplicate` | `POST` | `ProductController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/owner/**` | `GET, POST, DELETE` | `OwnerController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/services/owner/**` | `GET, POST, PUT` | `OwnerServiceController` | `@PreAuthorize("hasRole('OWNER')")` | `ROLE_OWNER` |
| `/sbms/api/services/technician/**` | `GET, POST, PUT` | `TechnicianServiceController` | `@PreAuthorize("hasRole('TECHNICIAN')")` | `ROLE_TECHNICIAN` |

---

## 5. Step 4: Security Risk Inspection & Vulnerability Assessment

### 1. Direct Port Reachability (Port 8082 Bypass Risk)
- **Finding:** Sri Balaji Backend currently binds to `0.0.0.0:8082`.
- **Risk:** Clients on the local network (LAN) can send requests directly to `http://<HOST_IP>:8082`, completely bypassing ARSA Gateway rate limiting, IP filtering, and centralized audit logging.
- **Mitigation:** In the production startup configuration, set `server.address=127.0.0.1` in Sri Balaji's `application.properties`, or configure Windows Defender Firewall to drop inbound connections to port 8082 originating from external interfaces.

### 2. Client-Supplied Role Header Spoofing
- **Finding:** Neither ARSA Gateway nor Sri Balaji Backend reads headers such as `X-User-Role`, `X-Role`, or `X-Forwarded-Role`.
- **Verdict:** **SAFE.** Sri Balaji solely extracts the identity from the verified JWT subject and loads authorities directly from the database table `medical_equipment.users`. Header spoofing cannot bypass authorization.

### 3. Gateway IP Forwarding Trust (`X-Forwarded-For`)
- **Finding:** `ClientIpResolver.java` in ARSA Gateway extracts the client IP using:
  ```java
  String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
  if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
      return xForwardedFor.split(",")[0].trim();
  }
  ```
- **Risk:** If ARSA Gateway is exposed directly to clients without an upstream reverse proxy (e.g., Nginx or Cloudflare) that strips untrusted client headers, an attacker can spoof `X-Forwarded-For: 127.0.0.1` to bypass IP blacklisting.
- **Mitigation:** Gateway should only trust `X-Forwarded-For` when `request.getRemoteAddress()` matches an explicitly configured trusted proxy CIDR block.

### 4. CORS Policy Restriction
- **Finding:** 
  - ARSA Gateway restricts CORS to `allowedOriginPatterns: http://localhost:5174,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5174,http://127.0.0.1:5173`.
  - Sri Balaji `SecurityConfig.java` currently uses wildcard patterns `http://localhost:*`, `http://127.0.0.1:*`, `https://*.onrender.com`.
- **Verdict:** When requests traverse Gateway port `8081`, ARSA's strict CORS configuration governs the preflight responses, correctly restricting traffic to frontend ports.

### 5. Sensitive Information Disclosure (`/api/meta/db-verification`)
- **Finding:** The endpoint `GET /api/meta/db-verification` in `MetaController.java` returns exact table counts for `users`, `orders`, `payment_transactions`, `service_requests`, and `audit_logs` without authentication.
- **Risk:** Allows external actors to enumerate customer volume and transaction activity.
- **Mitigation:** Remove this endpoint or secure it with `@PreAuthorize("hasRole('OWNER')")`.

### 6. OTP Endpoint Rate Limiting & Brute Force Defense
- **Finding:** 
  - **Gateway Edge:** `sbms-auth-route` enforces Token Bucket Rate Limiting (Capacity: 5, Refill: 5, Duration: 120s), effectively blocking automated brute-force attempts at the network edge.
  - **Downstream Application:** `OtpService.java` enforces account lockout (`lockedUntil`) after repeated failed verification attempts.
- **Verdict:** **STRONG DEFENSE-IN-DEPTH.** Attackers are throttled at the gateway (HTTP 429) and locked out in the database if failed attempts accumulate.

### 7. Payment Payload & HMAC Signature Integrity
- **Finding:** Gateway routing uses `StripPrefix=1` without payload modification or JSON transformation.
- **Verdict:** **SAFE.** Razorpay payment creation (`PaymentOrderRequest`) and signature verification (`PaymentVerificationRequest` containing `razorpaySignature`) pass through bit-for-bit unchanged.

### 8. Sensitive Data in Application Logs
- **Finding:**
  1. `OtpService.java` line 150: If Brevo email delivery fails, the exception thrown includes `(For testing, copy this OTP code: <CODE>)`. `AuthController.java` catches this and returns it in the HTTP 400 response body, leaking the plain OTP code to the caller.
  2. `OtpService.java` line 197: If SMS provider is not configured, plain OTP codes are written to application logs: `log.info("SMS Provider not configured. PHONE OTP - To: {}, OTP: {}", phone, otpCode)`.
  3. `OtpService.java` line 50: Hardcoded fallback administrative password `"SBMS@2026"` exists in the code.
- **Mitigation:** Remove OTP codes from test exception messages and disable plaintext OTP logging in production.

---

## 6. Phase 2.5 Roadmap & Action Plan

To advance to Phase 2.5 while maintaining continuous operation:
1. **Frontend Base URL Configuration:** Point Sri Balaji Frontend (`E:\website\frontend`) to `http://localhost:8081/sbms` to begin routing browser traffic through ARSA.
2. **Optional JWT Claim Enrichment (Future Token Evolution):** Update `JwtUtil.createToken` in Sri Balaji to include `claims.put("role", user.getRole().name())` so tokens carry self-contained role metadata, enabling future Gateway-level RBAC filtering if desired.
3. **Bind Port 8082 to Localhost:** Prevent direct perimeter bypass by binding downstream Tomcat to `127.0.0.1`.
