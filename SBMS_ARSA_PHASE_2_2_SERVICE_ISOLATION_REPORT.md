# Phase 2.2 – Sri Balaji Backend Service Isolation and Startup Report

**Project Title:** API Gateway Security Controls With Consistent Enforcement Across Routes  
**Integrated Application:** Sri Balaji Medi Systems E-Commerce Platform  
**Audit Timestamp:** 2026-11-25 00:03:00 UTC+05:30  
**Phase Status:** STOP CONDITION TRIGGERED – Safety Stop (Awaiting Migration Approval)  

---

## 1. Executive Summary & Safety Decision

During the pre-flight checks of **Phase 2.2**, the safety verification mechanism identified that:

1. **Database `medical_equipment` is missing from the active MySQL Server (`localhost:3306`).**
2. **Pending Unexecuted Migrations:** The project contains 22 Flyway migrations (`V1` to `V22`) that have not been executed on the live MySQL server.
3. **Automatic Startup Hooks:** Spring Boot's configuration (`spring.flyway.baseline-on-migrate=true`) and startup runners (`DataInitializer`, `ProductCatalogSeeder`, `OwnerAccountMigration`) would automatically attempt to create 20+ tables, seed mock catalog items, and alter user records upon startup.

In strict accordance with the **Phase 2.2 Mandatory Stop Condition**:
> *"If the database is missing, inconsistent, or has pending migrations, STOP and report the issue. Do not create or repair it automatically."*
> *"Do not execute migrations during this phase unless I explicitly approve them."*

The Sri Balaji backend process was **deliberately NOT started**, preventing any unapproved database modifications, connection failures, or unwanted seeding. All existing ARSA systems, port allocations, and databases remain 100% operational and undisturbed.

---

## 2. Database Verification & Flyway Status

### Live MySQL Instance Inspection (`localhost:3306`)
- **Query:** `SHOW DATABASES;`
- **Output:**
  - `api_security_db` (Active – ARSA Gateway DB)
  - `bloodbank_db`
  - `information_schema`
  - `meme_grocery`
  - `mysql`
  - `performance_schema`
  - `sakila`
  - `sys`
  - `world`
- **Finding:** `medical_equipment` **does not exist** on the active MySQL server.
- **Current Successful Migration Version:** `None` (0 migrations recorded; no `flyway_schema_history` table exists on the live host).

### Available Project Flyway Migrations vs. Current State
The project defines 22 Flyway migration scripts in `E:\website\backend\src\main\resources\db\migration\`:

| Version | Migration Script | Description | DDL / DML Scope | Status on Live Host |
| :---: | :--- | :--- | :--- | :---: |
| **V1** | `V1__create_initial_schema.sql` | Initial schema setup | Tables: `users`, `categories`, `products`, `cart_items`, `orders`, `order_items`, `reviews` | **Pending** |
| **V2** | `V2__migrate_initial_data.sql` | Initial data migration | Seed data insertion | **Pending** |
| **V3** | `V3__add_performance_indexes.sql` | Performance indexes | Index creation | **Pending** |
| **V4** | `V4__add_constraints.sql` | Constraints | Foreign keys & checks | **Pending** |
| **V5** | `V5__create_services_schema.sql` | Services schema | Tables: `service_engineers`, `service_requests`, `service_assignments`, `amc_contracts`, `service_visits` | **Pending** |
| **V6** | `V6__create_payments_schema.sql` | Payments schema | Table: `payment_transactions` | **Pending** |
| **V7** | `V7__add_technician_role.sql` | Technician role | Role enum extension | **Pending** |
| **V8** | `V8__seed_exact_products_and_categories.sql` | Seed products & categories | Equipment catalog DML | **Pending** |
| **V9** | `V9__seed_meaningful_categories.sql` | Meaningful categories | Catalog refinement | **Pending** |
| **V10** | `V10__create_audit_logs_table.sql` | Audit logs table | Table: `audit_logs` | **Pending** |
| **V11** | `V11__add_blocked_column_to_users.sql` | Blocked column in users | Column addition | **Pending** |
| **V12** | `V12__add_enabled_column_to_products.sql`| Enabled column in products | Column addition | **Pending** |
| **V13** | `V13__create_stock_adjustment_logs_table.sql` | Stock logs table | Table: `stock_adjustment_logs` | **Pending** |
| **V14** | `V14__create_website_settings_table.sql` | Website settings table | Table: `website_settings` | **Pending** |
| **V15** | `V15__prune_legacy_categories.sql` | Prune legacy categories | DML cleanup | **Pending** |
| **V16** | `V16__restrict_super_admin.sql` | Restrict super admin | Security constraints | **Pending** |
| **V17** | `V17__alter_orders_status_enum.sql` | Alter orders status enum | Enum modification | **Pending** |
| **V18** | `V18__add_details_column_to_audit_logs.sql` | Details in audit logs | Column addition | **Pending** |
| **V19** | `V19__secure_otp_schema.sql` | Secure OTP schema | Table: `otps` (expiration, attempts) | **Pending** |
| **V20** | `V20__expand_product_image_url.sql` | Expand product image URL | Column length expansion | **Pending** |
| **V21** | `V21__seed_complete_catalog_taxonomy.sql` | Seed complete catalog | Comprehensive medical taxonomy (918 KB) | **Pending** |
| **V22** | `V22__add_performance_indexes.sql` | Final performance indexes | B-tree index additions | **Pending** |

---

## 3. Backup Integrity Verification

The backup files created in Phase 2.1 were inspected, analyzed for DDL/DML statements, and verified via SHA-256 cryptographic hashes:

| Backup File Name | Size (Bytes) | Lines | CREATE TABLEs | INSERT Statements | SHA-256 Cryptographic Checksum | Verification Status |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **`api_security_db_backup_20261124_235500.sql`** | 33,640 | 124 | 3 | 3 | `5246A1BD822D83FE7586F0260F63460D6528B733D0DA1234CFC34F15DC9FDCEC` | **VERIFIED (Valid mysqldump)** |
| **`medical_equipment_flyway_complete_backup.sql`** | 985,284 | 1,855 | 21 | 820 | `4FCD1E355574311E9A4BCEDB1E4A0B0C34DF7B1DE1D4425E2D4FB2F46C1E8A7C` | **VERIFIED (Compiled Flyway SQL)** |
| **`local_mysql_data_raw/`** | 206.98 MB | - | - | - | 207 InnoDB binary tablespace files (`.ibd`) | **VERIFIED (Raw datadir copy)** |

> [!NOTE]
> Backup verification was performed strictly through non-destructive file analysis, regex parsing, and cryptographic hashing. No restore operations into active production databases were executed.

---

## 4. Startup Hooks & Risk Inspection

Inspection of the backend source code revealed four active startup hooks:

1. **`DataInitializer.java` (`CommandLineRunner`):**
   - Triggers `initializeAdmin()` if `userRepository.count() == 0`.
   - Triggers `initializeProducts()` if `productRepository.count() <= 8`.
2. **`ProductCatalogSeeder.java` (`ApplicationReadyEvent`):**
   - Automatically seeds 27 equipment categories and products if the product catalog is empty.
3. **`OwnerAccountMigration.java` (`CommandLineRunner`, `@Order(50)`):**
   - Scans all users and mutates roles, enforcing `ROLE_OWNER` exclusively on designated owner accounts and demoting others to `ROLE_USER`.
4. **`FlywayAutoConfiguration`:**
   - With `spring.flyway.baseline-on-migrate=true`, Spring Boot immediately attempts to connect to `medical_equipment` and apply all pending migrations (`V1` to `V22`).

**Consequence of Starting Without Schema:**
If started immediately, the backend would throw a fatal `CannotGetJdbcConnectionException: Communications link failure` or `Unknown database 'medical_equipment'`, preventing successful startup.

---

## 5. Actual Port & Process Verification

System listeners were re-verified across all critical ports:

| Port | Listener State | PID | Process Name | Assigned Role | Health / Status |
| :---: | :---: | :---: | :---: | :--- | :--- |
| **3000** | `IDLE / NOT LISTENING` | - | - | Sri Balaji Frontend | **Available** |
| **5173** | `IDLE / NOT LISTENING` | - | - | External Unrelated Application | **Preserved / Untouched** |
| **5174** | `LISTENING` | 6996 | `node.exe` | ARSA React Frontend | **HTTP 200 OK** |
| **8080** | `LISTENING` | 22464 | `java.exe` | ARSA Spring Boot Backend | **HTTP 200 OK** |
| **8081** | `LISTENING` | 27680 | `java.exe` | ARSA Spring Cloud Gateway | **HTTP 200 OK** |
| **8082** | `IDLE / NOT LISTENING` | - | - | Sri Balaji Backend (Held on Stop Condition) | **Clean / Reserved** |
| **3306** | `LISTENING` | 17064 | `mysqld.exe` | MySQL Server 8.0 | **Active & Healthy** |

---

## 6. Confirmation: Existing Data and Services Preserved

- `api_security_db` was **NOT modified** in any way.
- ARSA Gateway (`8081`), Backend (`8080`), and Frontend (`5174`) are actively running and healthy.
- Port `5173` was not stopped, touched, or reconfigured.
- Sri Balaji source code and configuration files were not modified.
- Zero mock emails, OTPs, or Razorpay payment requests were generated.

---

## 7. Next Actions Requiring User Explicit Approval

To safely start Sri Balaji backend on port `8082`:

1. **Option A (Recommended): Initialize `medical_equipment` schema cleanly via Flyway:**
   - Execute `CREATE DATABASE IF NOT EXISTS medical_equipment;` on MySQL (`localhost:3306`).
   - Allow Sri Balaji Backend to start with `SERVER_PORT=8082` so that Flyway applies `V1` through `V22` cleanly to the empty schema.
2. **Option B: Pre-seed using Compiled Backup SQL:**
   - Load `medical_equipment_flyway_complete_backup.sql` into MySQL directly, then start the backend with `SERVER_PORT=8082`.

Please confirm which database initialization option you approve before we proceed to start the Sri Balaji backend.
