# API Gateway Security Controls With Consistent Enforcement Across Routes
### Adaptive Route Security Analyzer (ARSA) • Final-Year B.Tech CSE Cybersecurity Project

---

## 1. Project Objective

In modern microservices and distributed systems, APIs are exposed across multiple domains with varying security requirements. Inconsistent security controls—such as missing authentication, lack of authorization guardrails, absent rate limiting, or omitted audit trails—leave routes vulnerable to unauthorized access, brute-force attacks, and data leakage.

This project delivers a production-ready, defense-in-depth API Security Gateway architecture featuring:
1. **Perimeter Traffic Defense:** Centralized gateway enforcement of IP filtering, rate limiting, and CORS.
2. **Identity & Access Management:** JWT authentication and fine-grained Role-Based Access Control (RBAC).
3. **Input Sanitization:** Strong schema and Jakarta Bean Validation.
4. **Accountability:** Centralized, immutable security audit logging in MySQL.
5. **Security Intelligence & Governance:** The **Adaptive Route Security Analyzer (ARSA)**—an automated engine with an interactive React dashboard that audits all configured routes, calculates compliance scores, categorizes risk tiers, detects control gaps, and generates actionable remediation guidance.

---

## 2. System Architecture

```
                                  +-----------------------+
                                  |   Client / Browser    |
                                  |  (React + Vite :5174) |
                                  +-----------+-----------+
                                              |
                                              | HTTPS / REST (CORS)
                                              v
                              +---------------+---------------+
                              |    Spring Cloud Gateway       |
                              |          (Port 8081)          |
                              +---------------+---------------+
                                      |               |
             +------------------------+               +------------------------+
             |                                                                 |
             | 1. IP Filtering (CIDR / Whitelist / Blacklist)                  |
             | 2. Token Bucket Rate Limiting (HTTP 429)                        |
             | 3. CORS Preflight & Header Management                           |
             | 4. Protected Inter-Service Ingestion Channel                    |
             v                                                                 v
+-------------------------------+                             +-------------------------------+
|     Backend Service           | <===== Shared Secret =====> | Gateway AuditLogClient        |
|     Spring Boot (:8080)       |      X-Internal-Gateway-Key | (Asynchronous event logging)  |
+---------------+---------------+                             +-------------------------------+
        |       |
        |       +---------------------------------------------+
        |                                                     |
        | 1. JWT Verification (HMAC-SHA256)                   |
        | 2. Role-Based Access Control (ADMIN / USER)         |
        | 3. Jakarta Bean Validation (@Valid)                 |
        | 4. Centralized Audit Logging Service                |
        | 5. ARSA Route Security Analysis Engine              |
        v                                                     v
+-------+-----------------------+             +---------------+---------------+
|       MySQL Database          |             |   ARSA Security Intelligence  |
|      (api_security_db)        |             |   - Route Posture Auditing    |
|   - users & roles             |             |   - Deterministic Compliance  |
|   - audit_logs                |             |   - Risk Tiers & Remediation  |
+-------------------------------+             +-------------------------------+
```

---

## 3. Technologies Used

| Tier | Technology | Version | Purpose |
|---|---|---|---|
| **API Gateway** | Spring Cloud Gateway | `2023.0.3` (WebFlux/Netty) | Non-blocking reactive perimeter security |
| **Backend Core** | Spring Boot | `3.3.4` (Java 17 / 21) | Core REST APIs, business logic, security |
| **Security** | Spring Security & JJWT | `0.12.6` | JWT generation, token parsing, RBAC filters |
| **Data Access** | Spring Data JPA / Hibernate | `6.5.3` | ORM, parameterized queries, schema management |
| **Database** | MySQL Server | `9.0+` / `8.0+` | Persistent user credentials and audit logs |
| **Frontend** | React & Vite | React 18, Vite 5 | Interactive cyber intelligence dashboard |
| **Icons & UI** | Lucide React | `0.446.0` | Cybersecurity themed dashboard icons |
| **Backend Testing**| JUnit 5, MockMvc, Mockito | Latest | Automated testing across all controllers/services |
| **Frontend Testing**| Vitest, Testing Library, JSDOM | Vitest 2.1 | Automated component & RBAC UI tests |

---

## 4. The 6 Core Security Controls

Each API route in the system is evaluated across 6 fundamental security controls:

1. **JWT Authentication (`jwtAuth`):** Cryptographically validates signed Bearer JWTs using HMAC-SHA256. Prevents unauthenticated access.
2. **Role-Based Access Control (`rbac`):** Enforces least-privilege principles (`ROLE_ADMIN` vs `ROLE_USER`) using Spring Security authorities.
3. **Request Validation (`requestValidation`):** Validates payload schema, boundary constraints, and non-null rules via Jakarta Bean Validation.
4. **Rate Limiting (`rateLimiting`):** In-memory Token Bucket rate limiter on the Gateway that restricts requests per IP/route, returning `429 Too Many Requests`.
5. **IP Filtering (`ipFiltering`):** Gateway filter supporting IPv4 address normalization, subnet CIDR matching, whitelists, and blacklists.
6. **Centralized Audit Logging (`auditLogging`):** Failure-safe security audit logger capturing events, IPs, paths, methods, users, and statuses into MySQL.

---

## 5. ARSA (Adaptive Route Security Analyzer)

ARSA is the core intelligence engine that automates compliance monitoring across all system routes.

### Deterministic Scoring Formula:
$$\text{Compliance Score} = \left( \frac{\text{Active Controls Count}}{6} \right) \times 100\%$$

### Risk Rating Tiers:
| Score Range | Risk Rating | Status / Guidance |
|:---:|:---:|:---|
| **90.0% – 100.0%** | `LOW` | Optimal security posture; full control enforcement. |
| **70.0% – 89.99%** | `MEDIUM` | Acceptable security posture; minor control gaps exist. |
| **40.0% – 69.99%** | `HIGH` | Elevated risk; missing critical controls (e.g. absent validation or audit logging). |
| **0.0% – 39.99%** | `CRITICAL` | Severe vulnerability exposure; missing fundamental authentication or authorization. |

### ARSA API Endpoints (Strictly Restricted to `ROLE_ADMIN`):
* `GET /api/arsa/routes` — Returns security audits and compliance scores for all 11 system routes.
* `GET /api/arsa/route?path={path}` — Returns the security audit for a single route.
* `GET /api/arsa/summary` — Returns overall average compliance score, risk distribution, and missing control counts.
* `POST /api/arsa/evaluate` — Interactive sandbox evaluator simulating compliance scores and remediation recommendations for custom route designs.

---

## 6. Complete API Route Summary

| Method | Endpoint | Access Level | Description | Security Controls |
|---|---|---|---|---|
| `GET` | `/api/health` | Public | System liveness probe | Rate Limit, IP Filter |
| `POST` | `/api/auth/login` | Public | Authenticates credentials & issues JWT | Validation, Rate Limit, IP Filter, Audit Log |
| `GET` | `/api/public/products` | Public | Browses public product catalog | Rate Limit, IP Filter |
| `GET` | `/api/public/products/{id}` | Public | Fetches single product specification | Rate Limit, IP Filter |
| `POST` | `/api/orders` | `USER`, `ADMIN` | Creates customer purchase order | JWT, RBAC, Validation, Rate Limit, IP Filter, Audit Log |
| `GET` | `/api/orders` | `USER`, `ADMIN` | Lists customer purchase orders | JWT, RBAC, Rate Limit, IP Filter, Audit Log |
| `POST` | `/api/payments/process`| `ADMIN` | Executes financial payment settlement | JWT, RBAC, Validation, Rate Limit, IP Filter, Audit Log |
| `GET` | `/api/payments` | `ADMIN` | Inspects financial transaction ledger | JWT, RBAC, Rate Limit, IP Filter, Audit Log |
| `POST` | `/api/users` | `ADMIN` | Registers system user accounts | JWT, RBAC, Validation, Rate Limit, IP Filter, Audit Log |
| `GET` | `/api/users` | `ADMIN` | Lists registered system users | JWT, RBAC, Rate Limit, IP Filter, Audit Log |
| `GET` | `/api/audit-logs` | `ADMIN` | Queries immutable security audit trail | JWT, RBAC, Rate Limit, IP Filter, Audit Log |
| `GET` | `/api/audit-logs/paged`| `ADMIN` | Paginated security audit trail | JWT, RBAC, Rate Limit, IP Filter, Audit Log |
| `POST` | `/api/audit-logs/internal`| Gateway Internal | Ingests async perimeter security events | `X-Internal-Gateway-Key` Secret Protected |
| `GET` | `/api/arsa/**` | `ADMIN` | Route security audits & intelligence | JWT, RBAC, Rate Limit, IP Filter, Audit Log |

---

## 7. Demo / Test Accounts (DEMO USE ONLY)

> [!WARNING]
> **ACADEMIC DEMO ACCOUNTS ONLY:** The credentials below are pre-seeded in the development database exclusively for laboratory evaluation and academic grading. **Never use these credentials or default seeds in a production deployment.**

| Role | Username | Password (Demo) | Granted Authorities |
|---|---|---|---|
| **Security Administrator** | `admin` | `Admin@12345` | `ROLE_ADMIN` (Full dashboard, payments, users, audit logs, ARSA) |
| **Standard User** | `alice_dev` | `SecurePassword@123` | `ROLE_USER` (Orders, public catalog; forbidden from ARSA and payments) |

---

## 8. Database Setup (MySQL)

Ensure MySQL 8.0 or 9.0 is installed and running on port `3306`. Execute the provided `setup_database.sql` script or create the database manually using Windows Command Prompt (CMD):

```cmd
mysql -u root -p < setup_database.sql
```

Or execute directly in MySQL console:
```sql
CREATE DATABASE IF NOT EXISTS `api_security_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The database tables (`roles`, `users`, `audit_logs`) and default security accounts (`admin` and `alice_dev`) are automatically initialized on backend startup via `DataInitializer.java` using BCrypt password hashing.

---

## 9. How to Run the Complete System (Windows CMD)

### Option A: Automated 1-Click Startup (Recommended)

Double-click `start_all.bat` in the project root, or execute it from Windows Command Prompt (CMD):
```cmd
start_all.bat
```
*This script checks MySQL connectivity on port 3306, spawns Backend (:8080), Gateway (:8081), and Frontend (:5174) in dedicated CMD windows, and automatically opens the ARSA Dashboard at `http://localhost:5174`.*

To shut down all services cleanly:
```cmd
stop_all.bat
```

### Option B: Manual Step-by-Step Startup (Windows CMD)

Open three separate Command Prompt (`cmd.exe`) windows:

**Window 1: Start the Backend Service (Port 8080)**
```cmd
cd backend
java -jar target\backend-0.0.1-SNAPSHOT.jar
```
*(Or compile & run directly: `mvn spring-boot:run`)*

**Window 2: Start the Spring Cloud Gateway (Port 8081)**
```cmd
cd gateway
java -jar target\gateway-0.0.1-SNAPSHOT.jar
```
*(Or compile & run directly: `mvn spring-boot:run`)*

**Window 3: Start the React + Vite Frontend (Port 5174)**
```cmd
cd frontend
npm run dev
```

Then open `http://localhost:5174/` in your browser.

---

## 10. Step-by-Step Demonstration Plan for Madam & HOD Sir

Follow this scripted 5-minute walkthrough during your project viva/presentation:

1. **Architecture Introduction (1 min):**
   * Open `http://localhost:5174/`. Explain the 3-tier perimeter architecture: React Frontend $\rightarrow$ Spring Cloud Gateway (:8081) $\rightarrow$ Spring Boot Backend (:8080) $\rightarrow$ MySQL (:3306).
   * Highlight the 6 uniform security controls: JWT Auth, RBAC, Bean Validation, Token Bucket Rate Limiting, IP Filtering, and Centralized Audit Logging.

2. **Standard User Portal & RBAC Least-Privilege Verification (1.5 min):**
   * Click **"Authenticate with JWT"** $\rightarrow$ Click **"User (ROLE_USER)"** (`alice_dev` / `SecurePassword@123`).
   * Show that Alice has access to business APIs:
     * View the **Product Catalog** (`GET /api/public/products`).
     * View and create a new **Business Order** (`POST /api/orders`). Show the order confirmed.
   * Click the **"RBAC Enforcement Verification"** tab:
     * Click **"Test Permission with ROLE_USER"** on `/api/arsa/summary`.
     * Point out the live **`HTTP 403 Forbidden`** response card, proving that Spring Security and Gateway method-level security strictly prevent standard users from viewing administrative intelligence.

3. **Administrator ARSA Cybersecurity Intelligence Dashboard (1.5 min):**
   * Click **"Switch to Admin Account"** $\rightarrow$ Select **"Admin (ROLE_ADMIN)"** (`admin` / `Admin@12345`) $\rightarrow$ Click **"Sign In"**.
   * Walk through the live metrics:
     * **Overall Compliance Score Gauge:** Live estate score (72.7%) across all 11 routes.
     * **Risk Distribution:** 3 Low, 0 Medium, 1 High, 3 Critical risk routes.
     * **Security Controls Coverage:** Visual percentage progress bars across all 6 controls.
     * **Route Security Analysis Table:** Show all 11 routes with pass/fail checkmarks. Filter by "CRITICAL" to show unprotected public routes.
     * **Inspect Route Modal:** Click "Inspect" on `/api/public/products` to show missing controls and automated remediation recommendations.
     * **ARSA Sandbox Evaluator:** Click "Evaluate Route", toggle security controls, and demonstrate instant real-time risk recalculation.

4. **Centralized Security Audit Stream (1 min):**
   * Click the **"Centralized Audit Logs"** tab in the admin navigation bar.
   * Show the live immutable security ledger populated with real events from the Gateway (`LOGIN_SUCCESS`, `ORDER_CREATED`, `ACCESS_DENIED`, etc.).
   * Use the search bar to filter by `alice_dev` or `403` to show tamper-evident auditing of security denial events.

---

## 10. Automated Test Results

The test suite contains **91 automated tests** covering security, token lifecycle, role hierarchies, input validation boundaries, rate limiting algorithms, IP CIDR matching, and UI rendering:

```
================================================================================
          PROJECT AUTOMATED TEST SUITE SUMMARY
================================================================================
  1. Backend Module   (JUnit 5, MockMvc, Spring Security Test) : 64 / 64 PASSED
  2. Gateway Module   (Spring Cloud Gateway, Reactive Test)    : 21 / 21 PASSED
  3. Frontend Module  (Vitest, JSDOM, React Testing Library)   :  6 /  6 PASSED
--------------------------------------------------------------------------------
  TOTAL AUTOMATED TESTS                                       : 91 / 91 (100%)
  FAILURES / ERRORS                                           : 0
================================================================================
```

To run all automated tests:
* **Backend Tests:** `cd backend && mvn test`
* **Gateway Tests:** `cd gateway && mvn test`
* **Frontend Tests:** `cd frontend && npm test`

---

## 11. Production Build Information

All three modules produce clean, standalone production artifacts:

* **Backend Spring Boot Executable JAR:**  
  `backend/target/backend-0.0.1-SNAPSHOT.jar`
* **Spring Cloud Gateway Executable JAR:**  
  `gateway/target/gateway-0.0.1-SNAPSHOT.jar`
* **Frontend Optimized Static Distribution:**  
  `frontend/dist/`  
  - `dist/index.html` (0.80 kB)  
  - `dist/assets/index-D-8DhYaN.css` (13.51 kB)  
  - `dist/assets/index-BmU-6oGj.js` (176.63 kB)

---

## 12. Project Folder Structure

```
API Gateway/
├── .env.example                          # Environment configuration template
├── README.md                             # Comprehensive project documentation
├── setup_database.sql                    # Database initialization script
├── start_all.bat                         # 1-Click Windows CMD system startup script
├── stop_all.bat                          # 1-Click Windows CMD system shutdown script
├── backend/                              # Spring Boot REST API & ARSA Engine
│   ├── pom.xml                           # Maven dependencies (Java 17/21, Spring Boot 3.3.4)
│   └── src/
│       ├── main/
│       │   ├── java/com/project/security/
│       │   │   ├── BackendApplication.java
│       │   │   ├── arsa/                 # ARSA Analyzer, Models, Controller, Service
│       │   │   ├── config/               # SecurityConfig, CORS, DataInitializer
│       │   │   ├── controller/           # Auth, User, Order, Payment, Audit, Product
│       │   │   ├── dto/                  # Request & Response Data Transfer Objects
│       │   │   ├── entity/               # User, Role, AuditLog JPA Entities
│       │   │   ├── exception/            # GlobalExceptionHandler, Custom Exceptions
│       │   │   ├── repository/           # User, Role, AuditLog Spring Data Repositories
│       │   │   ├── security/             # JwtUtils, JwtFilter, AccessDeniedHandler
│       │   │   ├── service/              # User, AuditLog Services
│       │   │   └── util/                 # IpUtil IP Resolution Helper
│       │   └── resources/
│       │       └── application.properties # Backend runtime configuration
│       └── test/                         # 64 Automated Backend Tests
├── gateway/                              # Spring Cloud Gateway Service
│   ├── pom.xml                           # Maven dependencies (Spring Cloud 2023.0.3)
│   └── src/
│       ├── main/
│       │   ├── java/com/project/gateway/
│       │   │   ├── GatewayApplication.java
│       │   │   ├── filter/               # RateLimiter & IpFilter GatewayFilterFactories
│       │   │   ├── service/              # TokenBucket, IpFilterService, AuditLogClient
│       │   │   └── util/                 # ClientIpResolver
│       │   └── resources/
│       │       └── application.yml       # Gateway routes, predicates, filters, CORS
│       └── test/                         # 21 Automated Gateway Tests
└── frontend/                             # React 18 + Vite Cybersecurity Dashboard
    ├── package.json                      # Dependencies (React 18, Vite 5, Lucide)
    ├── vite.config.js                    # Vite dev proxy & Vitest configuration
    ├── index.html                        # Application entry HTML
    ├── dist/                             # Production build assets
    └── src/
        ├── App.jsx                       # Root component with AuthProvider & Navigation
        ├── main.jsx                      # DOM mount point
        ├── index.css                     # Global reset & typography
        ├── App.css                       # Dark cybersecurity UI theme & glassmorphism
        ├── api/                          # apiClient.js with automatic Bearer injection
        ├── context/                      # AuthContext.jsx with login/logout/RBAC state
        ├── components/                   # Navbar, ScoreGauge, RiskCard, RouteTable, Modals
        │   ├── AuditLogViewer.jsx        # Live searchable audit log explorer
        │   └── UserPortal.jsx            # ROLE_USER portal & 403 Forbidden demo
        ├── pages/                        # Dashboard.jsx with live metrics & route audit
        └── test/                         # 6 Vitest UI component & RBAC guard tests
```

---

## 13. Teammate Setup & Prerequisites (Running on Another Windows Laptop)

If sharing this project folder with teammates to run on their Windows machine, ensure they have the following prerequisites installed:

### Prerequisites:
1. **Java Development Kit (JDK 17 or JDK 21):**
   - Check in CMD: `java -version`
2. **Apache Maven (3.8+ or 3.9+):**
   - Check in CMD: `mvn -version`
3. **Node.js (v18+ or v20+) and npm:**
   - Check in CMD: `node -v` and `npm -v`
4. **MySQL Server (8.0+ or 9.0+) running on port 3306:**
   - Service name: `MySQL80` or `MySQL90` (can be started via `net start MySQL80` or `net start MySQL90` in Administrator CMD).

### Teammate Setup Steps (CMD):
1. **Initialize Database:**
   ```cmd
   mysql -u root -p < setup_database.sql
   ```
   *(Enter MySQL root password. This creates `api_security_db`.)*
2. **Verify Database Credentials:**
   Check `backend\src\main\resources\application.properties`. If MySQL root password on their machine is different from empty/blank, set:
   ```properties
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```
   Or set the environment variable in CMD before running:
   ```cmd
   set DB_PASSWORD=YOUR_MYSQL_PASSWORD
   ```
3. **Install Frontend Dependencies:**
   ```cmd
   cd frontend
   npm install
   cd ..
   ```
4. **Launch Everything:**
   Double-click `start_all.bat` or run:
   ```cmd
   start_all.bat
   ```

---

## 14. Manual ZIP Packaging Instructions (For Submission)

When manually creating your project submission `.zip` file for evaluation, follow these best practices to keep the archive compact and clean:

### Folders & Files to INCLUDE:
* `backend/` (all source files `src/`, `pom.xml`, `mvnw`, `mvnw.cmd`)
* `backend/target/backend-0.0.1-SNAPSHOT.jar` (the compiled production executable)
* `gateway/` (all source files `src/`, `pom.xml`, `mvnw`, `mvnw.cmd`)
* `gateway/target/gateway-0.0.1-SNAPSHOT.jar` (the compiled production executable)
* `frontend/` (all source files `src/`, `package.json`, `package-lock.json`, `vite.config.js`, `index.html`)
* `frontend/dist/` (compiled production bundle)
* `README.md` (complete project guide)
* `.env.example` (environment configuration template)
* `setup_database.sql` (schema setup script)
* `start_all.bat` (startup script)
* `stop_all.bat` (shutdown script)

### Folders & Files to EXCLUDE:
* `frontend/node_modules/` (can be reinstalled via `npm install` on any machine; saves ~200MB)
* `mysql_runtime/` (local machine database files; teammates should use their own MySQL instance)
* `.git/` (git version history if not required for submission)
* Intermediate build junk (e.g. `backend/target/classes`, `gateway/target/classes`, except for the `.jar` files)

---

## 15. Production Deployment & Security Guidelines

> [!IMPORTANT]
> When deploying this architecture into staging or production:
> 1. **Externalize All Secrets:** Never rely on default property values. Supply `DB_PASSWORD`, `JWT_SECRET`, and `INTERNAL_GATEWAY_KEY` through container environment variables, HashiCorp Vault, or cloud secret managers (AWS Secrets Manager, GCP Secret Manager).
> 2. **Cryptographic Key Strength:** Ensure `JWT_SECRET` is generated using at least 256 bits of cryptographically secure entropy (`openssl rand -base64 32`).
> 3. **CORS Configuration:** Set `CORS_ALLOWED_ORIGINS` to the exact fully-qualified domain name(s) of your production web frontends. Never enable wildcard `*` with credentials.
> 4. **Network Perimeter Isolation:** In production, place the Backend service in a private subnet. Configure firewall/VPC rules so Backend port `8080` only accepts traffic from the Spring Cloud Gateway IP.
> 5. **HTTPS Termination:** Terminate TLS 1.3 at the Gateway or reverse proxy load balancer (NGINX/Cloudflare) to ensure all in-transit tokens and payloads are encrypted.
