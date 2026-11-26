# Forensic Verification Report: Sri Balaji Medi Systems Database Backup

**Document ID:** `SBMS_DATABASE_BACKUP_FORENSIC_REPORT.md`  
**Target File Analyzed:** `E:\backups\phase_2_1_20261124_235500\databases\medical_equipment_flyway_complete_backup.sql`  
**Secondary Artifact Analyzed:** `E:\website\local_mysql_data\medical_equipment\` (InnoDB tablespace binaries)  
**Investigation Mode:** Strictly Read-Only (Zero databases created, zero files modified, zero services started)  
**Date of Audit:** 2026-11-25 00:08:00 UTC+05:30  

---

## 1. Backup Provenance & Generation Origin

### A. File Identification
- **Path:** `E:\backups\phase_2_1_20261124_235500\databases\medical_equipment_flyway_complete_backup.sql`
- **File Size:** 985,284 bytes (~962.2 KB)
- **Line Count:** 1,855 lines
- **SHA-256 Checksum:** `4FCD1E355574311E9A4BCEDB1E4A0B0C34DF7B1DE1D4425E2D4FB2F46C1E8A7C`

### B. Exact Origin & Generation Method
- **Method of Generation:** This backup file was **assembled during Phase 2.1 by programmatically concatenating the project's 22 sequential Flyway migration scripts** from `E:\website\backend\src\main\resources\db\migration\` (specifically `V1__create_initial_schema.sql` through `V22__add_performance_indexes.sql`).
- **Nature of the File:** It is **NOT** a raw dump produced by `mysqldump` from a running database instance. Rather, it is a **complete, pre-compiled DDL/DML deployment artifact** representing the cumulative schema and catalog taxonomy.
- **Physical Datadir Backup Discovered:** In addition to this SQL compilation, the backup directory contains a separate raw physical copy at `E:\backups\phase_2_1_20261124_235500\databases\local_mysql_data_raw\` (206.98 MB, 207 files), which was copied from `E:\website\local_mysql_data\`. Forensic byte inspection of that directory's `flyway_schema_history.ibd` revealed that a previous local instance had successfully applied all 22 migrations in sequence.

---

## 2. Complete Database Schema Inventory

The backup contains **21 distinct `CREATE TABLE` statements** representing the complete architectural data model:

| Table Name | First Line | Purpose & Entity Relationship | Primary Key | Key Constraints |
| :--- | :---: | :--- | :--- | :--- |
| **`categories`** | Line 17 | Product classification taxonomy (Equipment vs Spare Parts) | `id` (BIGINT) | `UNIQUE(name)`, `INDEX(product_type)` |
| **`users`** | Line 29 | System users, hospital admins, service technicians | `id` (BIGINT) | `UNIQUE(email)`, `UNIQUE(phone)` |
| **`products`** | Line 43 | Medical equipment catalog, spare parts, stock levels | `id` (BIGINT) | `FK(category_id)`, `INDEX(name, price)` |
| **`orders`** | Line 66 | Customer purchase orders and procurement requests | `id` (BIGINT) | `FK(user_id)`, `INDEX(status, order_number)` |
| **`order_items`** | Line 88 | Individual line items within a purchase order | `id` (BIGINT) | `FK(order_id)`, `FK(product_id)` |
| **`cart_items`** | Line 102 | User shopping cart items | `id` (BIGINT) | `FK(user_id)`, `FK(product_id)` |
| **`wishlist_items`** | Line 117 | Saved items for hospital procurement | `id` (BIGINT) | `FK(user_id)`, `FK(product_id)` |
| **`reviews`** | Line 130 | Customer product feedback and star ratings | `id` (BIGINT) | `FK(product_id)`, `FK(user_id)` |
| **`otps`** | Line 146 | Passwordless authentication OTP codes & attempt tracking | `id` (BIGINT) | `INDEX(identifier, expires_at)` |
| **`service_engineers`** | Line 372 | Biomedical technician staff and certifications | `id` (BIGINT) | `UNIQUE(email)`, `UNIQUE(phone)` |
| **`service_requests`** | Line 397 | Hospital equipment repair and maintenance tickets | `id` (BIGINT) | `FK(user_id)`, `INDEX(status, priority)` |
| **`service_assignments`** | Line 428 | Dispatching engineers to hospital service requests | `id` (BIGINT) | `FK(service_request_id)`, `FK(engineer_id)` |
| **`service_visits`** | Line 440 | On-site hospital repair visits and technician reports | `id` (BIGINT) | `FK(service_assignment_id)` |
| **`service_part_usages`** | Line 456 | Spare parts replaced during hospital service visits | `id` (BIGINT) | `FK(service_visit_id)`, `FK(product_id)` |
| **`amc_contracts`** | Line 468 | Annual Maintenance Contracts for biomedical hardware | `id` (BIGINT) | `FK(user_id)`, `INDEX(contract_number)` |
| **`service_invoices`** | Line 485 | Invoices generated for servicing and spare parts | `id` (BIGINT) | `FK(service_request_id)`, `UNIQUE(invoice_number)` |
| **`service_audit_logs`** | Line 499 | Dedicated audit trail for service actions and repairs | `id` (BIGINT) | `INDEX(created_at, action)` |
| **`payment_transactions`** | Line 519 | Razorpay payments, signatures, and order tracking | `id` (BIGINT) | `FK(order_id)`, `UNIQUE(razorpay_order_id)` |
| **`audit_logs`** | Line 839 | General administrative platform audit logs | `id` (BIGINT) | `INDEX(timestamp, action)` |
| **`stock_adjustment_logs`** | Line 879 | Stock reconciliation history and inventory changes | `id` (BIGINT) | `FK(product_id)`, `FK(user_id)` |
| **`website_settings`** | Line 891 | Store metadata, business hours, emergency contacts | `id` (BIGINT) | `UNIQUE(setting_key)` |

### Structural Metrics
- **Total Tables:** 21
- **Primary Keys:** 21
- **Foreign Keys:** 24 relational constraints
- **Indexes:** 48 B-tree and unique indexes
- **Triggers:** 0 (all business logic is executed in Spring Boot JPA interceptors)

---

## 3. Flyway Compatibility & Alignment (V1 through V22)

### A. Missing `flyway_schema_history` Table
- The SQL backup file **does NOT contain `flyway_schema_history`**.
- This is by design: Flyway migration SQL scripts only contain business schema changes. The Flyway engine itself constructs and updates `flyway_schema_history` dynamically during its execution.

### B. Migration Version Mapping
The backup incorporates all 22 Flyway versions in strict numerical order:
- **`V1`–`V4`:** Core eCommerce baseline schema, constraints, and indexes.
- **`V5`–`V7`:** Biomedical service engine, AMC contracts, Razorpay payments schema, and `TECHNICIAN` role enum.
- **`V8`–`V9`:** Catalog seeding and taxonomy structure.
- **`V10`–`V14`:** Audit logging, user blocking, product availability, stock audit logs, and website settings.
- **`V15`–`V20`:** Category pruning, super admin restrictions, order status enum expansion, OTP rate limiting, and 500-char product image URLs.
- **`V21`:** Comprehensive hospital equipment catalog taxonomy (918 KB of DML).
- **`V22`:** High-performance multi-column composite indexes.

---

## 4. Data Classification: Analysis of the 820 INSERT Statements

A forensic breakdown of all 820 `INSERT` statements in the file confirms:

| Table Target | Record Count | Data Classification | Sensitivity Assessment |
| :--- | :---: | :--- | :--- |
| **`products`** | **778** | Hospital equipment, monitors, diagnostics, spare parts | **Public Catalog Seed Data (Zero sensitive data)** |
| **`categories`** | **41** | Medical device classifications and taxonomy | **Public Metadata (Zero sensitive data)** |
| **`website_settings`** | **1** | Platform title, default operational parameters | **Default Metadata (Zero sensitive data)** |
| **`users`** | **0** | None | **No customer records present** |
| **`orders`** | **0** | None | **No customer order records present** |
| **`payment_transactions`** | **0** | None | **No financial or cardholder records present** |
| **`service_requests`** | **0** | None | **No hospital service tickets present** |

> [!IMPORTANT]
> **Data Privacy Finding:** The SQL backup contains **zero private customer records, zero order histories, and zero payment credentials**. It is purely a comprehensive catalog and taxonomy seed dataset. The single owner admin account (`sribalajimedisystemsofficial@gmail.com`) is provisioned programmatically at runtime by Spring Boot's `DataInitializer.java` when `userRepository.count() == 0`.

---

## 5. Restoration Risks & Technical Obstacles

Forensic inspection identified two critical risks that would occur if `medical_equipment_flyway_complete_backup.sql` were manually imported into MySQL before starting Spring Boot:

### Risk 1: Flyway Duplicate Migration / Collision Crash
- If the SQL file is executed manually, all 21 tables will exist in MySQL, but **no `flyway_schema_history` will be present**.
- When Spring Boot starts with `spring.flyway.baseline-on-migrate=true`:
  1. Flyway detects existing tables and creates a baseline record at version `1`.
  2. Flyway then attempts to apply pending migrations `V2` through `V22`.
  3. **Crash point:** `V5__create_services_schema.sql` contains `CREATE TABLE service_engineers` without `IF NOT EXISTS`. MySQL will throw:
     ```
     ERROR 1050 (42S01): Table 'service_engineers' already exists
     ```
  4. Migration fails, and Spring Boot application startup terminates immediately with `FlywayException`.

### Risk 2: Escaped Backticks Syntax Anomaly
- In line 5 of `medical_equipment_flyway_complete_backup.sql`, the database declaration was escaped during script compilation as:
  ```sql
  CREATE DATABASE IF NOT EXISTS \medical_equipment\;
  USE \medical_equipment\;
  ```
- Because of the literal backslashes `\`, attempting to run this file directly through the standard `mysql` CLI would produce a syntax error:
  ```
  ERROR 1064 (42000): You have an error in your SQL syntax near '\medical_equipment\'
  ```

---

## 6. Comparative Assessment: Option A vs. Option B

### Option B: Manual SQL File Import
- **Process:** Fix the syntax line, import `medical_equipment_flyway_complete_backup.sql` directly into MySQL, then start backend.
- **Feasibility:** **POOR / HIGH RISK.**
- **Consequences:** Spring Boot's Flyway will conflict with the manually created tables and crash on `V5` unless Flyway is completely disabled or manually baselined to version `22` with pre-computed checksums in `flyway_schema_history`.

---

### Option A: Clean Flyway Schema Creation (Recommended)
- **Process:**
  1. Execute a clean, empty schema creation:
     ```sql
     CREATE DATABASE IF NOT EXISTS `medical_equipment`;
     ```
  2. Start Sri Balaji Backend on port `8082`:
     ```cmd
     SERVER_PORT=8082 java -jar backend-0.0.1-SNAPSHOT.jar
     ```
- **Feasibility:** **EXCELLENT / ZERO RISK.**
- **How it works:**
  1. Spring Boot connects to the empty `medical_equipment` database.
  2. Flyway automatically creates `flyway_schema_history`.
  3. Flyway runs `V1` through `V22` natively, recording exact checksums, execution times, and success statuses for every migration.
  4. `DataInitializer` detects an empty user table and provisions the initial owner account (`sribalajimedisystemsofficial@gmail.com`).
  5. `ProductCatalogSeeder` verifies that all 778 catalog products and 41 categories are present.
  6. The backend boots cleanly on port `8082` with zero schema drift and full future Flyway compatibility.

---

## 7. Recommended Safe Restoration Approach

Based on forensic verification:

1. **Approve Option A.**
2. Execute solely:
   ```sql
   CREATE DATABASE IF NOT EXISTS `medical_equipment` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Start Sri Balaji Backend with `SERVER_PORT=8082`.
4. Allow Flyway's native migration engine to apply `V1` through `V22` automatically.
5. Verify startup logs, confirm port `8082` is listening, and perform read-only GET requests on `http://localhost:8082/api/products`.

---
*Report completed. No databases, files, or services have been altered.*
