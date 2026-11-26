# ARSA API GATEWAY SECURITY — PROJECT RUN GUIDE
**Operating System:** Windows 10 / Windows 11 (Windows CMD Only)  
**Project Location:** `E:\API Gateway`  
**Frontend URL:** [http://localhost:5174/](http://localhost:5174/)  
**Gateway URL:** [http://localhost:8081/](http://localhost:8081/)  
**Backend URL:** [http://localhost:8080/](http://localhost:8080/)  
**MySQL Port:** `3306` (Database: `api_security_db`)

---

## 1. Software Prerequisites

Before running the project on your laptop or your teammates' laptops, ensure the following software is installed:

| Software | Required Version | Verified Installation Path / Check Command |
| :--- | :--- | :--- |
| **Java Development Kit (JDK)** | **Java 21 (LTS)** | `C:\Program Files\Java\jdk-21\bin\java.exe`<br>Verify: `java -version` |
| **Node.js & npm** | **Node.js 18+ (LTS)** | Verify: `node -v` and `npm -v` |
| **Apache Maven** | **Maven 3.8+** | Verify: `mvn -version` |
| **MySQL Server** | **MySQL 8.0+** | Running on port `3306` with user `root` |

> [!IMPORTANT]
> **Java Version Requirement:** This project uses Spring Boot 3.3.4, which strictly requires **Java 21**. If your default system `PATH` points to Java 8 or Java 11, the automated startup script (`start_all.bat`) automatically detects and uses Java 21 at `C:\Program Files\Java\jdk-21\bin\java.exe`.

---

## 2. Port Allocation & Multi-Project Safety Notice

| Component | Port | Description |
| :--- | :---: | :--- |
| **React + Vite Frontend** | **`5174`** | ARSA Cybersecurity Intelligence Dashboard |
| **Spring Cloud Gateway** | **`8081`** | Microservices Security Perimeter |
| **Spring Boot Backend** | **`8080`** | Business APIs, JPA, Security, ARSA Engine |
| **MySQL Database** | **`3306`** | Relational Database (`api_security_db`) |
| *(External Project)* | *`5173`* | *Reserved for another project — never terminated or modified* |

---

## 3. Database Initialization (One-Time Setup)

If you are running the project on a new laptop where MySQL does not yet have the database:

1. Open Windows Command Prompt (CMD).
2. Execute the database initialization script:
   ```cmd
   cd /d "E:\API Gateway"
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pManoj@2004 < setup_database.sql
   ```
3. This creates database `api_security_db` and seeds initial security roles (`ROLE_ADMIN`, `ROLE_USER`). User accounts (`admin` and `alice_dev`) are automatically provisioned and password-hashed via BCrypt by Spring Boot upon first startup.

---

## 4. How to Start All Services (One-Click)

The easiest and safest way to run the entire project is using the automated batch script:

1. Open Windows Command Prompt (`cmd.exe`).
2. Run:
   ```cmd
   cd /d "E:\API Gateway"
   start_all.bat
   ```
3. **What `start_all.bat` does automatically:**
   - Detects Java 21 on your machine.
   - Verifies MySQL connectivity on port `3306`.
   - Checks if any service is already running on ports `8080`, `8081`, or `5174` (skipping duplicates).
   - Launches Spring Boot Backend (:8080) in a dedicated titled CMD window.
   - Launches Spring Cloud Gateway (:8081) in a dedicated titled CMD window.
   - Launches React + Vite Frontend (:5174) in a dedicated titled CMD window.
   - Waits for services to initialize and automatically opens `http://localhost:5174/` in your default browser.

---

## 5. How to Stop All Services (One-Click)

To stop all application services cleanly:

1. Open Windows Command Prompt (`cmd.exe`).
2. Run:
   ```cmd
   cd /d "E:\API Gateway"
   stop_all.bat
   ```
3. This safely frees ports `8080`, `8081`, and `5174`. It **never** touches port `5173` or unrelated background services.

---

## 6. Manual Startup Commands (Window-by-Window in CMD)

If you prefer to start each component manually in separate CMD terminals:

### Terminal 1: MySQL Database (Port 3306)
Ensure your MySQL service is active:
```cmd
net start MySQL80
```

### Terminal 2: Spring Boot Backend (Port 8080)
```cmd
cd /d "E:\API Gateway\backend"
"C:\Program Files\Java\jdk-21\bin\java.exe" -jar target\backend-0.0.1-SNAPSHOT.jar
```
*Wait until you see: `Tomcat started on port 8080` and `Started BackendApplication`.*

### Terminal 3: Spring Cloud Gateway (Port 8081)
```cmd
cd /d "E:\API Gateway\gateway"
"C:\Program Files\Java\jdk-21\bin\java.exe" -jar target\gateway-0.0.1-SNAPSHOT.jar
```
*Wait until you see: `Netty started on port 8081` and `Started GatewayApplication`.*

### Terminal 4: React + Vite Frontend (Port 5174)
```cmd
cd /d "E:\API Gateway\frontend"
npm run dev
```
*Wait until you see: `Local: http://localhost:5174/`.*

Now open your web browser to: **[http://localhost:5174/](http://localhost:5174/)**

---

## 7. Pre-Configured Demo Credentials

| Role | Username | Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@12345` | Complete ARSA Dashboard, 11 Route Audits, Route Inspection Modal, Custom Route Sandbox Evaluator, Centralized Audit Logs, Gateway Perimeter Monitor |
| **Standard User** | `alice_dev` | `SecurePassword@123` | Product Catalog, Purchase Order Placement, and Interactive RBAC 403 Forbidden Demonstration |

---

## 8. Troubleshooting & Common Questions

### Issue: "Port 8080 was already in use" or "Port 8081 was already in use"
**Solution:** A previous instance of the backend or gateway may still be running in the background. Run `stop_all.bat` or find and terminate the process in CMD:
```cmd
netstat -ano | findstr ":8080"
taskkill /F /PID <PID_FROM_NETSTAT>
```

### Issue: "UnsupportedClassVersionError: class file version 65.0 not supported by version 52.0"
**Solution:** Your system is attempting to run Java 21 bytecode using Java 8. Explicitly use the Java 21 path:
`"C:\Program Files\Java\jdk-21\bin\java.exe" -jar target\backend-0.0.1-SNAPSHOT.jar`

### Issue: MySQL Connection Refused on Port 3306
**Solution:** Verify that the MySQL service is started:
```cmd
net start MySQL80
```
Verify credentials in `backend/src/main/resources/application.properties` match your MySQL root password (`Manoj@2004`).

### Issue: Frontend displays blank screen or cannot reach `/api/...`
**Solution:** Verify that the Spring Cloud Gateway is active on port `8081`. The Vite dev server proxies all `/api` requests to `http://127.0.0.1:8081`. Test Gateway health in CMD:
```cmd
curl http://localhost:8081/api/health
```
It should return HTTP 200: `{"status":"UP","timestamp":...}`.
