# ARSA API GATEWAY SECURITY – EXAMINER QUICK START GUIDE
**Academic Project:** Final Year B.Tech CSE Project Demonstration  
**Project Title:** API Gateway Security Controls With Consistent Enforcement Across Routes  
**Key Feature:** Adaptive Route Security Analyzer (ARSA)  
**Demonstration Date:** 25 November 2026, 7:00 AM  
**Application URL:** [http://localhost:5174/](http://localhost:5174/)  

---

## 1. EXECUTIVE SUMMARY (FOR PROJECT GUIDE & HOD SIR)

In modern microservices architectures, inconsistent security policy enforcement across routes creates critical vulnerabilities (OWASP API Security Top 10). Traditional backend security requires developers to repeatedly implement authentication, rate limiting, and input validation on each microservice, leading to configuration drift, overlooked routes, and authorization bypasses.

**ARSA (Adaptive Route Security Analyzer)** solves this by:
1. **Centralizing Perimeter Defense:** Routing all ingress traffic through a reactive Spring Cloud Gateway (:8081).
2. **Standardizing 6 Core Security Controls:** JWT HMAC-SHA256 Authentication, Role-Based Access Control (RBAC), Token-Bucket Rate Limiting, CIDR IP Filtering, Payload Schema Validation, and Tamper-Evident Audit Logging.
3. **Automated Continuous Route Auditing:** Real-time compliance scoring across all registered microservice routes with risk categorization (LOW, MEDIUM, HIGH, CRITICAL).
4. **Interactive Security Testing Console:** Real-time simulation of attacks (JWT forgery, privilege escalation, rate-limit bursts) with live HTTP status verification.

---

## 2. HOW TO RUN THE PROJECT (WINDOWS CMD ONLY)

All services have automated single-command execution scripts for Windows CMD.

### Method A: One-Click Startup (Recommended)
1. Double-click **`start_all.bat`** in the project root directory `E:\API Gateway\`.
2. The script will sequentially:
   - Verify MySQL Database connectivity on port **3306**.
   - Start Spring Boot Backend on port **8080** (`backend-0.0.1-SNAPSHOT.jar`).
   - Start Spring Cloud Gateway on port **8081** (`gateway-0.0.1-SNAPSHOT.jar`).
   - Start React + Vite Frontend on port **5174**.
   - Automatically launch your web browser to **`http://localhost:5174/`**.

### Method B: Manual CMD Startup (Order of Execution)
Open 4 separate **Windows Command Prompt (cmd.exe)** windows:

```cmd
:: Window 1: MySQL Database (Ensure MySQL service is active on port 3306)
net start MySQL80

:: Window 2: Spring Boot Backend (Port 8080)
cd /d "E:\API Gateway\backend"
"C:\Program Files\Java\jdk-21\bin\java.exe" -jar target\backend-0.0.1-SNAPSHOT.jar

:: Window 3: Spring Cloud Gateway (Port 8081)
cd /d "E:\API Gateway\gateway"
"C:\Program Files\Java\jdk-21\bin\java.exe" -jar target\gateway-0.0.1-SNAPSHOT.jar

:: Window 4: React Frontend (Port 5174)
cd /d "E:\API Gateway\frontend"
npm run dev
```

### Shutdown Script
- Double-click **`stop_all.bat`** in `E:\API Gateway\` to safely stop ports 8080, 8081, and 5174 without disturbing any other applications or port 5173.

---

## 3. DEMONSTRATION ACCOUNTS & CREDENTIALS

| Account Role | Username | Password | Purpose & Access Level |
| :--- | :--- | :--- | :--- |
| **Security Administrator** | `admin` | `Admin@12345` | **Full Command Center Access:** ARSA 11-route intelligence matrix, live telemetry feed, interactive security attack simulator, RBAC user management, CSV exports. |
| **Standard Business User** | `alice_dev` | `SecurePassword@123` | **Limited Access:** Standard business operations (`/api/orders`, `/api/products`). Demonstrates HTTP 403 Forbidden enforcement when attempting to access admin APIs. |

> **Quick Login Tip:** On the login screen, click **"Demo: Admin"** or **"Demo: User"** for instant 1-click credential filling.

---

## 4. SYSTEM ARCHITECTURE & PORT ALLOCATION

```
[ Browser / Client ]  --->  Port 5174 (React 18 + Vite SPA - FYNTIX Command Center)
                                 |
                                 v  (All API calls route through Gateway perimeter)
[ Spring Cloud Gateway ] ---> Port 8081 (Reactive Netty - Token Bucket & IP Filters)
                                 |
                                 v  (Proxied Ingress with Internal Gateway Secret)
[ Spring Boot Backend ]  ---> Port 8080 (REST Controllers, JWT Validator, ARSA Engine)
                                 |
                                 v
[ MySQL Database ]       ---> Port 3306 (api_security_db: Users, Roles, Audit Logs)
```

> **Important Port Safety Note:** Port **5173** is reserved for another project on this machine and is strictly untouched. This project operates on **5174**.

---

## 5. 7-STAGE EXAMINER DEMONSTRATION WORKFLOW

Follow this sequence to present the project to your Project Guide (Madam) and HOD Sir:

### Stage 1: UI/UX & Dark/Light Theme Presentation
- Open `http://localhost:5174/` and log in as `admin`.
- Point out the **FYNTIX Cybersecurity Command Center layout**: Deep navy/charcoal styling, glowing live status beacons, and responsive operations sidebar.
- Click the **Sun/Moon icon** in the top navigation bar to toggle between **Dark Mode** (cyber command center) and **Light Mode** (high-contrast projector view).

### Stage 2: ARSA Route Intelligence Matrix
- Navigate to the **ARSA Intelligence** tab.
- Show the **Overall Compliance Score Gauge (72.73%)** computed over all 11 registered routes.
- Show the **Risk Distribution** breakdown:
  - 3 LOW risk routes (fully secured: authentication, RBAC, rate limiting, validation).
  - 4 MEDIUM risk routes.
  - 1 HIGH risk route.
  - 3 CRITICAL risk routes (e.g., endpoints missing authentication or rate limiting).
- Click on any route row (e.g., `GET /api/orders`) to open the **Route Security Inspector Drawer**, showing control-by-control analysis.
- Click **"Evaluate Custom Route"** to simulate how a newly added developer route (`/api/finance/transfer`) is dynamically audited and scored.

### Stage 3: Interactive Security Testing Console (Live Attack Simulation)
- Click the **Security Test Console** tab in the sidebar.
- Click **"Run Complete Security Suite"** or test each control individually:
  1. **TC-01 (Valid JWT Authentication):** Verifies HMAC-SHA256 signed token passes with `HTTP 200 OK`.
  2. **TC-02 (Forged JWT Signature Attack):** Injects a tampered token payload; verifies Gateway rejects with `HTTP 401 Unauthorized`.
  3. **TC-03 (Missing Token Ingress):** Sends unauthenticated request; verifies perimeter block with `HTTP 401`.
  4. **TC-04 (RBAC Privilege Escalation):** Simulates `alice_dev` attempting to read administrative intelligence; verifies `HTTP 403 Forbidden`.
  5. **TC-05 (Payload Schema Validation):** Sends malformed JSON order; verifies `HTTP 400 Bad Request`.
  6. **TC-06 (Volumetric Burst Attack):** Fires rapid requests; verifies Token Bucket rate limiter intercepts with `HTTP 429 Too Many Requests`.
  7. **TC-07 (IP Whitelist Filter):** Probes spoofed client IP address; verifies Gateway perimeter rejection.
  8. **TC-08 (Audit Vault Integrity):** Verifies every blocked/passed request is written to MySQL audit table.
- **Key Technical Merit:** The test console executes all penetration simulations in isolated test contexts without corrupting or logging out the active admin session.

### Stage 4: Real-Time Threat Telemetry & Incident Feed
- Navigate to the **Perimeter Monitor** tab.
- Show the real-time counters dynamically aggregated from MySQL audit records:
  - Total Audited Events
  - 403 Forbidden Violations
  - 401 Auth Denials
  - 429 Rate-Limit Throttles
  - 200 OK Authorized Ingress
- Show the **Incident Feed** listing timestamped ingress events with client IP, HTTP status, and action tags.

### Stage 5: User & Access Governance (RBAC in MySQL)
- Navigate to the **User & Access (RBAC)** tab.
- Show the registered identities loaded directly from MySQL table `users`:
  - `admin` (ROLE_ADMIN, Primary Admin)
  - `alice_dev` (ROLE_USER)
- Click **"Suspend"** on `alice_dev`: Note the immediate state change to `Disabled / Suspended`.
- Click **"Activate"** to restore account access.
- Demonstrate security protection: Click action on `admin` — system blocks modification ("Primary administrator account status cannot be modified").
- Click **"Provision New Security Identity"** to show real-time account creation with BCrypt hashed credentials.

### Stage 6: Centralized Audit Log Vault & CSV Export
- Navigate to the **Audit Log Vault** tab.
- Filter logs by action (e.g., `LOGIN_SUCCESS`, `RATE_LIMIT_EXCEEDED`, `FORBIDDEN_ACCESS`).
- Click the **"Export CSV"** button: The browser instantly downloads `ARSA_Audit_Logs_YYYY-MM-DD.csv` for external compliance archiving.

### Stage 7: Executive Compliance Reports
- Navigate to the **Security Reports** tab.
- Download the **11 Routes Matrix CSV** (`ARSA_11_Routes_Matrix_YYYY-MM-DD.csv`).
- Click **"Download Markdown"** under Executive Assessment to export a complete project security audit report.

---

## 6. ANSWERS TO TYPICAL EXAMINER / HOD QUESTIONS

**Q1: Why did you implement security at the API Gateway instead of inside each backend microservice?**  
*Answer:* Implementing security inside individual microservices leads to policy fragmentation, duplicate code, and human error where developers forget to add security annotations. Centralizing enforcement at the Spring Cloud Gateway ensures that 100% of external traffic is validated before reaching internal microservices, providing zero-trust perimeter defense.

**Q2: How does the ARSA analyzer calculate the compliance score?**  
*Answer:* ARSA evaluates 6 core security controls for each route: Authentication (25%), Authorization/RBAC (20%), Rate Limiting (20%), Input Validation (15%), IP Whitelisting (10%), and Audit Logging (10%). The route score is a weighted sum (0–100%), and the system compliance score is the arithmetic mean across all registered routes.

**Q3: How does the Gateway prevent clients from bypassing it and calling the Backend directly?**  
*Answer:* The Backend validates a shared internal header key (`X-Gateway-Internal-Key`) populated exclusively by the Gateway Netty filter. Direct requests to the backend without this cryptographic key are rejected.

**Q4: How does the Rate Limiter work?**  
*Answer:* The Gateway employs a Token-Bucket rate limiting algorithm via Spring Cloud Gateway RequestRateLimiter filter. It allocates tokens per client IP address. When burst traffic depletes the bucket, incoming requests are immediately rejected with `HTTP 429 Too Many Requests`.
