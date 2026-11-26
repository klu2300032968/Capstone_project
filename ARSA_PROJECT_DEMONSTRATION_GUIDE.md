# ARSA API GATEWAY SECURITY — PROJECT DEMONSTRATION GUIDE
**Project Title:** API Gateway Security Controls With Consistent Enforcement Across Routes  
**Key Feature:** Adaptive Route Security Analyzer (ARSA)  
**Academic Target:** Final-Year B.Tech CSE Project Viva & Capstone Demonstration  
**Target Audience:** Project Guide / Madam, Head of Department (HOD) Sir, External Examiner  
**Demonstration URL:** [http://localhost:5174/](http://localhost:5174/)  
**Demonstration Duration:** 8 to 10 Minutes (Scripted Walkthrough)

---

## 1. Project Concept & Core Definitions (Quick Reference for Viva)

### Q: What is an API Gateway?
> **Answer:** An **API Gateway** acts as the single reverse-proxy entry point for all external client requests entering a microservices ecosystem. Instead of having each microservice independently handle security, TLS, rate limiting, and routing, the Gateway enforces these cross-cutting security concerns uniformly at the network perimeter.

### Q: Why is consistent security enforcement necessary across routes?
> **Answer:** In modern microservice architectures, different services are developed by different teams. Without centralized perimeter enforcement, security controls are applied inconsistently—some endpoints have rate limiting, others don't; some validate input, others don't. Attackers exploit the weakest endpoint (e.g., an unauthenticated or unthrottled route) to breach the entire backend network. ARSA guarantees **consistent, measurable enforcement across 100% of routes**.

### Q: What is JWT (JSON Web Token)?
> **Answer:** JWT is an open standard (RFC 7519) for securely transmitting information between parties as a compact, URL-safe JSON object. In our project, it enables **stateless authentication**: the backend signs the token using HMAC-SHA256 containing user identity and roles. The Gateway validates and forwards this token, eliminating server-side session storage bottlenecks.

### Q: What is RBAC (Role-Based Access Control)?
> **Answer:** RBAC restricts system access based on the authorized roles of authenticated users. Our project implements the **Principle of Least Privilege**:
- `ROLE_ADMIN`: Can manage security postures, evaluate custom routes, view audit logs, provision users, and execute financial transactions.
- `ROLE_USER`: Can only browse products and submit business purchase orders. Administrative routes strictly return **HTTP 403 Forbidden**.

### Q: What is ARSA (Adaptive Route Security Analyzer)?
> **Answer:** ARSA is the **novel core contribution of our project**. It is an automated security intelligence engine and interactive dashboard that audits all gateway routes in real time. It calculates an objective **Compliance Score** (0–100%) based on 6 critical security controls, classifies routes into **Risk Tiers** (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), detects control gaps, generates remediation recommendations, and provides a **Sandbox Evaluator** to test proposed routes before they go live.

---

## 2. Timed 8-Minute Demonstration Script

### Segment 1: Landing Page & Architecture Introduction (2 Minutes)
1. Open the browser to **`http://localhost:5174/`**.
2. **What Madam and HOD will see:** The dark-themed cybersecurity intelligence portal.
3. **What to say:**
   > *"Good morning, Madam / Sir. Our capstone project addresses a critical cybersecurity challenge in enterprise microservices: inconsistent security enforcement across API routes. We have designed a 4-tier architecture comprising React 18, Spring Cloud Gateway on port 8081, Spring Boot on port 8080, and MySQL 8.0 on port 3306. Our system enforces six uniform security controls across all routes: JWT Authentication, Role-Based Access Control, Request Validation, Token-Bucket Rate Limiting, IP Filtering, and Centralized Audit Logging."*
4. Point to the interactive **4-Tier Architecture Flow Banner** on the screen:
   - `React + Vite (:5174)` $\rightarrow$ `Cloud Gateway (:8081)` $\rightarrow$ `Spring Boot API (:8080)` $\rightarrow$ `MySQL (:3306)`.

---

### Segment 2: Standard User Portal & RBAC Least-Privilege Verification (2.5 Minutes)
1. On the landing page, click **"Authenticate with JWT"** or click the quick button:  
   **"User (ROLE_USER)"** (`alice_dev` / `SecurePassword@123`).
2. Click **"Sign In with Secure Perimeter"**.
3. **What the screen shows:** The **Standard User Portal**.
4. **Demonstrate permitted operations:**
   - Show the **Live Product Catalog** loaded via unauthenticated public GET route `/api/public/products`.
   - Scroll to **"Place Purchase Order"**:
     - Item: `"High-Speed Enterprise Router"`, Quantity: `2`, Price: `$149.99`.
     - Click **"Submit Order"**.
     - Point out the instant green success card: Order placed successfully with authenticated user `alice_dev`.
5. **Demonstrate RBAC Enforcement (The 403 Proof):**
   - Scroll down to the **"RBAC Least-Privilege Enforcement Verification"** section.
   - Click the button: **"Test Permission with ROLE_USER on /api/arsa/summary"**.
   - **What happens:** The screen displays an unmistakable **`HTTP 403 Forbidden`** security violation card:
     > *"Access Forbidden: Your account (alice_dev with role ROLE_USER) lacks ROLE_ADMIN privileges to access ARSA security intelligence reports."*
   - **What to say:**
     > *"Madam, this live 403 response proves that our Spring Security method-level authorization `@PreAuthorize` and gateway filters strictly block standard users from accessing administrative endpoints, preventing privilege escalation."*

---

### Segment 3: Administrator Intelligence Suite & ARSA Telemetry (3.5 Minutes)
1. Click the top-right user menu $\rightarrow$ Click **"Sign Out"**.
2. Click **"Admin (ROLE_ADMIN)"** (`admin` / `Admin@12345`) $\rightarrow$ Click **"Sign In with Secure Perimeter"**.
3. **What the screen shows:** The **Full ARSA Security Intelligence Suite**.
4. **Walk through the telemetry metrics:**
   - **Top Quick Counter Banner:**
     - **Audited Routes:** `11`
     - **Estate Compliance Index:** `72.7`
     - **JWT Protected:** `7 / 11`
     - **Perimeter Shield:** `Active (Port 8081)`
   - **ScoreGauge Widget:** Show the radial dial displaying the overall compliance index of **72.73%**.
   - **RiskCard Widget:** Explain the risk distribution: `3 LOW`, `4 MEDIUM`, `1 HIGH`, `3 CRITICAL`.
   - **Control Coverage Meter:** Point out the progress bars for JWT, RBAC, Validation, Rate Limiting, IP Filtering, and Audit Logging.
5. **Demonstrate Route Table & Live Filters:**
   - Click the risk filter pills: click **"LOW (3)"** $\rightarrow$ shows `/api/payments/process`, `/api/orders`, `/api/users`.
   - Click **"CRITICAL (3)"** $\rightarrow$ shows `/api/public/products`, `/api/public/products/{id}`, `/api/health`.
   - Type `"payment"` into the search box $\rightarrow$ instant reactive filtering to the 2 payment routes.
6. **Demonstrate Route Inspection Modal:**
   - Click **"Inspect"** on `/api/payments/process`.
   - Point out the modal displaying all 6 controls enabled (green checkmarks) and the recommendation section confirming full compliance.
   - Now click **"Inspect"** on `/api/public/products`.
   - Point out that it shows missing controls (JWT and RBAC are absent because it is an intentionally public catalog) and actionable recommendations.
7. **Demonstrate the ARSA Custom Route Evaluator Sandbox:**
   - Click the gradient button **"Evaluate Custom Route"** at the top right.
   - Enter route details:
     - Route Path: `/api/v1/clinical-records`
     - HTTP Method: `POST`
     - Description: `"Healthcare patient diagnostic record ingestion"`
   - Toggle switches: Turn ON all 6 controls:
     - [x] JWT Authentication
     - [x] Role-Based Access (RBAC)
     - [x] Request Body Validation
     - [x] Token-Bucket Rate Limiter
     - [x] Perimeter IP Filtering
     - [x] Centralized Audit Logging
   - Click **"Evaluate Security Posture"**.
   - **What happens:** ARSA dynamically sends the payload to backend `/api/arsa/evaluate`, recalculates the score in real time, and displays:  
     **`Compliance Score: 100.0%` | `Risk Rating: LOW`**.
8. **Demonstrate Centralized Audit Logs:**
   - Click the **"Centralized Audit Logs"** tab at the top.
   - Show the live table of events stored in MySQL:
     - Point out the timestamps, usernames (`admin`, `alice_dev`), client IPs (`127.0.0.1`), HTTP methods, actions (`LOGIN_SUCCESS`, `ORDER_CREATED`, `USERS_VIEWED`), and HTTP status codes (`200`, `403`).
9. **Demonstrate Gateway Perimeter Monitor:**
   - Click the **"Gateway Perimeter Monitor"** tab.
   - Show the live gateway status badge (`ONLINE`), reactive pipeline diagram, and route configuration table.

---

## 3. Anticipated Viva / Examination Questions & Impressive Answers

### Q1: Why did you place Rate Limiting at the Gateway instead of inside each backend service?
> **Answer:** *"Placing rate limiting at the Gateway protects our entire internal network from volumetric Distributed Denial-of-Service (DDoS) and brute-force attacks. If rate limiting were inside the backend service, malicious volumetric traffic would still traverse the gateway, consume network sockets, and invoke application thread pools before being rejected. By terminating abusive requests at the gateway Netty layer with HTTP 429, backend CPU, memory, and database connections are preserved."*

### Q2: What algorithm does your rate limiter use, and how does it work?
> **Answer:** *"We implemented the **Token Bucket Algorithm** (`RateLimiterGatewayFilterFactory`). A bucket is configured with a maximum capacity (e.g., 10 tokens) and refills at a steady rate (e.g., 10 tokens every 60 seconds). Each incoming request consumes one token. If tokens are available, the request proceeds; if the bucket is empty, the gateway immediately rejects the request with HTTP 429 Too Many Requests and includes a `Retry-After` header. This allows burst traffic while preventing sustained volumetric abuse."*

### Q3: Why does your estate compliance score equal 72.73%? How is it computed?
> **Answer:** *"The ARSA engine calculates each route's score as the percentage of active controls out of 6. Among our 11 routes:
> - 3 routes have 6/6 controls = 100% (300 points)
> - 4 routes have 5/6 controls = 83.33% (333.32 points)
> - 1 route has 4/6 controls = 66.67% (66.67 points)
> - 3 public routes have 2/6 controls = 33.33% (99.99 points)
> Total points = 799.98 / 11 routes = **72.73%**.
> Public routes like `/api/public/products` have a 33.33% score because they intentionally omit JWT and RBAC to permit anonymous browsing. ARSA accurately highlights this trade-off so security officers can evaluate whether public exposure is justified."*

### Q4: How do you prevent users from bypassing the Gateway and calling backend port 8080 directly?
> **Answer:** *"In our architecture, the backend service uses an **Inter-Service Gateway Secret Key** (`app.security.internal-key`). In a production deployment, backend port 8080 is placed inside a private virtual private cloud (VPC) subnet inaccessible from the internet, while only the Gateway port 8081 is exposed publicly. Requests that do not originate from the Gateway with the expected signature are rejected."*

### Q5: How is user password security handled in the database?
> **Answer:** *"Passwords are never stored in plaintext. We utilize **BCrypt hashing** (`BCryptPasswordEncoder` with strength factor 10). BCrypt incorporates an automatically generated salt and an adaptive key derivation function that is computationally expensive, making precomputed rainbow table attacks and brute-force cracking mathematically infeasible."*
