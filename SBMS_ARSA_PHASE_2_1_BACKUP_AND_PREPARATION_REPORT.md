# Phase 2.1 – Safe Backup and Integration Preparation Report

**Project Title:** API Gateway Security Controls With Consistent Enforcement Across Routes  
**Integrated Application:** Sri Balaji Medi Systems E-Commerce Platform  
**Backup Timestamp:** 2026-11-24 23:55:00 UTC+05:30  
**Status:** Successfully Completed & Verified  

---

## 1. Executive Summary

Phase 2.1 has been completed with **zero modifications** to running services, project source code, database tables, or ports.

All required backups of both projects (`E:\API Gateway` and `E:\website`) and all database schemas have been generated, timestamped, and stored in an isolated, non-overlapping backup directory with sufficient disk space (`E:\backups\phase_2_1_20261124_235500`).

---

## 2. Backup Directory Paths & Inventory

### Dedicated Backup Root
`E:\backups\phase_2_1_20261124_235500\`

| Backup Target | Source Path | Backup Path | File Count | Size | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API Gateway Project** | `E:\API Gateway` | `E:\backups\phase_2_1_20261124_235500\api_gateway\` | 129 files, 59 dirs | ~738.6 KB | **VERIFIED (100% copied, 0 errors)** |
| **Sri Balaji Medi Systems** | `E:\website` | `E:\backups\phase_2_1_20261124_235500\website\` | 1,521 files, 308 dirs | ~12.87 MB | **VERIFIED (100% copied, 0 errors)** |
| **ARSA Gateway Database** | `api_security_db` (MySQL :3306) | `E:\backups\phase_2_1_20261124_235500\databases\api_security_db_backup_20261124_235500.sql` | 1 SQL file | 33,640 bytes | **VERIFIED (Non-empty, mysqldump completed)** |
| **Medical Equipment Flyway SQL** | Flyway Migrations (V1–V22) | `E:\backups\phase_2_1_20261124_235500\databases\medical_equipment_flyway_complete_backup.sql` | 1 SQL file | 985,284 bytes | **VERIFIED (Non-empty, 22 scripts compiled)** |
| **Medical Equipment Raw InnoDB Data** | `E:\website\local_mysql_data` | `E:\backups\phase_2_1_20261124_235500\databases\local_mysql_data_raw\` | 207 files, 7 dirs | 206.98 MB | **VERIFIED (Raw tablespaces preserved)** |

### Preserved Components in Project Backups
- **Source Code:** Complete Java, React JSX/JS, CSS, HTML, and script sources.
- **Configurations:** `application.properties`, `application.yml`, `vite.config.js`, `tailwind.config.js`, `docker-compose.yml`.
- **Environment Settings:** `.env`, `.env.example` in both frontend and backend directories.
- **Dependency Files:** `pom.xml`, `package.json`, `package-lock.json`.
- **Database Migrations:** Complete Flyway migration scripts `V1` through `V22`.
- **Existing Documentation:** All guide documents (`ARSA_EXAMINER_QUICK_START.md`, `README.md`, etc.).

### Safe Exclusions
- `node_modules/` (regenerable via `npm install`).
- `target/` and `build/` (regenerable via `mvn clean package` and `npm run build`).
- Previous backup directories (`safety_backup_*`, `backup_before_*`).

---

## 3. Database Backup Verification

### A. `api_security_db` Backup
- **Method:** Native `mysqldump` from the active MySQL Server 8.0 on `localhost:3306`.
- **File:** `E:\backups\phase_2_1_20261124_235500\databases\api_security_db_backup_20261124_235500.sql`
- **Integrity Check:**
  - Size: 33,640 bytes (Non-empty).
  - Contains complete table definitions and seed records for `users`, `roles`, and `audit_logs`.
  - Routines, triggers, and events included.
  - Zero modifications made to original database tables.

### B. `medical_equipment` Backup
- **Method:**
  1. Compiled SQL Backup: All 22 Flyway migration scripts (`V1__create_initial_schema.sql` through `V22__add_performance_indexes.sql`) sequentially assembled into `medical_equipment_flyway_complete_backup.sql`.
  2. Raw Binary Backup: All 207 raw InnoDB tablespace files (`.ibd`), log files, and data dictionaries preserved in `databases\local_mysql_data_raw\`.
- **Integrity Check:**
  - `medical_equipment_flyway_complete_backup.sql`: 985,284 bytes (Non-empty, valid SQL schema and complete equipment catalog taxonomy).
  - `local_mysql_data_raw`: 206.98 MB (All binary tablespaces preserved).
  - Note: The live MySQL server on `localhost:3306` currently hosts `api_security_db`; `medical_equipment` was not yet created on the live instance, so no active tables or records were disturbed.

---

## 4. Current Port Status & Verification

A full socket check was conducted on all target ports:

| Port | Protocol | Listener State | PID | Process Name | Assigned Application / Role | Conflict Status |
| :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **3000** | TCP | `IDLE / NOT LISTENING` | - | - | Sri Balaji Frontend | **Available** |
| **5173** | TCP | `IDLE / NOT LISTENING` | - | - | External Unrelated App | **Preserved / Untouched** |
| **5174** | TCP | `LISTENING` | 6996 | `node.exe` | ARSA React Frontend | **Active (HTTP 200)** |
| **8080** | TCP | `LISTENING` | 22464 | `java.exe` | ARSA Spring Boot Backend | **Active (HTTP 200)** |
| **8081** | TCP | `LISTENING` | 27680 | `java.exe` | ARSA Spring Cloud Gateway | **Active (HTTP 200)** |
| **8082** | TCP | `IDLE / NOT LISTENING` | - | - | Sri Balaji Backend (Planned) | **Available (Clean)** |
| **3306** | TCP | `LISTENING` | 17064 | `mysqld.exe` | MySQL Server 8.0 | **Active (Healthy)** |

### Active Health Check Verification
- `http://localhost:5174/` -> **HTTP 200 OK**
- `http://localhost:8080/api/health` -> **HTTP 200 OK**
- `http://localhost:8081/api/health` -> **HTTP 200 OK**

---

## 5. Remaining Risks & Mitigations

1. **Backend Port Collision Risk:**
   - *Risk:* Sri Balaji Backend defaults to port `8080`, which is actively serving the ARSA Backend.
   - *Mitigation:* In Phase 2.2, Sri Balaji Backend will be launched with `SERVER_PORT=8082`.
2. **CORS Rejection Risk:**
   - *Risk:* Sri Balaji Backend currently permits origins `http://localhost:3000` and Render URLs. When requests route through the Gateway (`http://localhost:8081`), the browser or gateway might reject unlisted origins.
   - *Mitigation:* Configure CORS on both Gateway and Sri Balaji Backend during integration.
3. **JWT Discrepancy Risk:**
   - *Risk:* ARSA Gateway uses Base64 HS256 with role claims in the token; Sri Balaji uses raw string bytes HS256 without role claims in the token.
   - *Mitigation:* Ensure route filters delegate authentication appropriately without premature signature mismatch failures.

---

## 6. Recommended Next Actions (Awaiting User Approval)

Proceed to **Phase 2.2 – Port Configuration and Service Isolation**:
1. Configure Sri Balaji Backend to run strictly on port `8082` (via `.env` or application parameter).
2. Create the `medical_equipment` database on MySQL port `3306` using the compiled schema backup or Flyway migration.
3. Test Sri Balaji Backend startup on port `8082` without Gateway routing first to verify clean startup.
4. Verify all 4 concurrent services (`5174`, `8080`, `8081`, `8082`, and `3306`) run in complete harmony.

---
*Report generated strictly following Phase 2.1 constraints. No downstream changes have been applied.*
