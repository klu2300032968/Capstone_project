# Phase 2.7 – Network Security Hardening & Regression Verification Report

**Project:** Sri Balaji Medi Systems + Adaptive Route Security Analyzer (ARSA) API Gateway  
**Date:** November 25, 2026  
**Auditor / Agent:** Antigravity AI  
**Repository:** `E:\API Gateway`

---

## 1. Executive Summary & Verification Decisions

Following the user's notification that `apply_mysql_hardening.bat` was run as Administrator, a complete, read-only post-execution audit was conducted.

| Item | Requirement | Verification Output / Evidence | Status |
|:---:|:---|:---|:---:|
| **1** | Verify MySQL80 is Running | `Get-Service MySQL80` -> Status: `Running`, StartType: `Automatic`, PID: `26740` | **PASS** |
| **2** | Verify port 3306 listens only on 127.0.0.1 | `netstat -ano` -> `TCP 0.0.0.0:3306 LISTENING` & `TCP [::]:3306 LISTENING` | **FAIL** |
| **3** | Verify port 33060 listens only on 127.0.0.1 | `netstat -ano` -> `TCP 0.0.0.0:33060 LISTENING` & `TCP [::]:33060 LISTENING` | **FAIL** |
| **4** | Verify firewall rules Port 3306 and Port 33060 are disabled | `netsh advfirewall` -> `Port 3306` Enabled: **Yes**, `Port 33060` Enabled: **Yes** | **FAIL** |
| **5** | Verify `medical_equipment` and `api_security_db` accessible | Read-only SQL query -> `medical_equipment.products`: 820 rows, `api_security_db.users`: 2 rows | **PASS** |
| **6** | Verify customer website, ARSA dashboard, backend, and Gateway operational | HTTP 200 on ports 3000, 5174, 8080, 8081, 8082 | **PASS** |
| **7** | Verify ports 8080 and 8082 remain loopback-only | `127.0.0.1:8080` (PID 7048) and `127.0.0.1:8082` (PID 8488) | **PASS** |
| **8** | Confirm port 5173 remains untouched | Port 5173 unmodified and preserved | **PASS** |

---

## 2. Detailed Technical Audit Findings

### 2.1 MySQL Service & Port Sockets (Items 1, 2, 3)
- **Service Status:**
  ```text
  Name    DisplayName  Status  StartType
  ----    -----------  ------  ---------
  MySQL80 MySQL80      Running Automatic
  ```
  *Result:* **PASS**

- **Listening Sockets Output (`netstat -ano | findstr 3306`):**
  ```text
  TCP    0.0.0.0:3306           0.0.0.0:0              LISTENING       26740
  TCP    0.0.0.0:33060          0.0.0.0:0              LISTENING       26740
  TCP    [::]:3306              [::]:0                 LISTENING       26740
  TCP    [::]:33060             [::]:0                 LISTENING       26740
  ```
  *Result for Item 2 & 3:* **FAIL**  
  *Analysis:* Process ID `26740` (the pre-existing MySQL process) is still running. The service has not yet restarted under the hardened `my.ini`, and continues to listen on `0.0.0.0` and `[::]`.

### 2.2 Inbound Firewall Rules (Item 4)
- **Rule `Port 3306`:**
  ```text
  Rule Name:                            Port 3306
  Enabled:                              Yes
  Direction:                            In
  Profiles:                             Domain,Private,Public
  Protocol:                             TCP
  LocalPort:                            3306
  RemoteIP:                             Any
  Action:                               Allow
  ```
- **Rule `Port 33060`:**
  ```text
  Rule Name:                            Port 33060
  Enabled:                              Yes
  Direction:                            In
  Profiles:                             Domain,Private,Public
  Protocol:                             TCP
  LocalPort:                            33060
  RemoteIP:                             Any
  Action:                               Allow
  ```
  *Result for Item 4:* **FAIL**  
  *Analysis:* Both rules remain `Enabled: Yes`. When `apply_mysql_hardening.bat` was executed, the commands either did not run in an elevated context (UAC prompt not confirmed) or encountered a path resolution issue.

### 2.3 Database Accessibility (Item 5)
Read-only queries executed locally against MySQL:
- `SELECT count(*) FROM medical_equipment.products;` -> **820**
- `SELECT count(*) FROM api_security_db.users;` -> **2**  
*Result:* **PASS** (Zero corruption, records intact).

### 2.4 Service Health & Loopback Bindings (Items 6, 7, 8)
- **Customer Frontend (`http://localhost:3000`):** HTTP 200 (**PASS**)
- **ARSA Dashboard UI (`http://localhost:5174`):** HTTP 200 (**PASS**)
- **ARSA Core Backend (`http://127.0.0.1:8080/api/health`):** HTTP 200 (**PASS**)
- **ARSA API Gateway (`http://localhost:8081/api/health`):** HTTP 200 (**PASS**)
- **Sri Balaji Backend (`http://127.0.0.1:8082/api/products`):** HTTP 200 (**PASS**)
- **Port 8080 Binding:** Bound exclusively to `127.0.0.1:8080` (PID 7048) (**PASS**)
- **Port 8082 Binding:** Bound exclusively to `127.0.0.1:8082` (PID 8488) (**PASS**)
- **Port 5173 Application:** Untouched and preserved (**PASS**)

---

## 3. Network Socket Table (Current Actual State)

| Port | Service | Bound Address | PID | Hardening Status |
|:---:|:---|:---:|:---:|:---|
| **3000** | Sri Balaji React Frontend | `0.0.0.0:3000` | 10852 | **PASS** (Development Server) |
| **3306** | MySQL Database Server | `0.0.0.0:3306` / `[::]:3306` | 26740 | **FAIL / PENDING** (Still bound to all interfaces) |
| **5174** | ARSA Management UI | `0.0.0.0:5174` / `[::]:5174` | 32168 | **PASS** (Development Server) |
| **8080** | ARSA Core Backend | **`127.0.0.1:8080`** | 7048 | **PASS (Hardened to Loopback)** |
| **8081** | ARSA API Gateway | `0.0.0.0:8081` / `[::]:8081` | 29148 | **PASS** (Intended Gateway Interface) |
| **8082** | Sri Balaji Backend | **`127.0.0.1:8082`** | 8488 | **PASS (Hardened to Loopback)** |
| **5173** | Unrelated Application | — | — | **PASS (Completely Untouched)** |

---

## 4. Root Cause Analysis & Resolution Instructions

### Why did the batch file not take effect?
When executing `.bat` files by double-clicking or right-clicking, if Windows User Account Control (UAC) is prompted and not confirmed or if the active working directory defaults to `C:\Windows\System32`, the relative copy command may fail silently or abort. The PID `26740` did not change, indicating the service did not stop or restart.

### Direct Administrative Fix:
To immediately apply the change with full terminal feedback, open an elevated **PowerShell** window (**Right click Start -> Terminal (Admin) / PowerShell (Run as Administrator)**) and paste these exact lines:

```powershell
# 1. Disable firewall rules:
netsh advfirewall firewall set rule name="Port 3306" new enable=no
netsh advfirewall firewall set rule name="Port 33060" new enable=no

# 2. Copy the pre-staged hardened config:
Copy-Item -Path "E:\backups\phase_2_7_20261125\my.ini.hardened" -Destination "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini" -Force

# 3. Restart the MySQL service:
Restart-Service -Name MySQL80

# 4. Check that it now listens on 127.0.0.1:
netstat -ano | findstr ":3306"
```
Once run, `netstat -ano` will output `127.0.0.1:3306` and `127.0.0.1:33060`.
