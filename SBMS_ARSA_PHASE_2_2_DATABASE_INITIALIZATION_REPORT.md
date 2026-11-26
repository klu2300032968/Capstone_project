# Phase 2.2: Fresh Database Initialization & Standalone Backend Startup Report

**Project Title:** API Gateway Security Controls With Consistent Enforcement Across Routes  
**Integrated Service:** Sri Balaji Medi Systems E-Commerce Platform  
**Execution Timestamp:** 2026-11-25 00:20:00 UTC+05:30  
**Phase Status:** Successfully Completed & Verified  

---

## 1. Executive Summary

Under explicit user authorization for **Phase 2.2 Option A**, the fresh database `medical_equipment` was created on the existing MySQL server (`localhost:3306`) with `utf8mb4` character set and `utf8mb4_unicode_ci` collation.

The Sri Balaji Medi Systems Spring Boot backend was compiled and successfully launched on dedicated, non-conflicting port **8082** (`SERVER_PORT=8082`). 

Upon startup:
1. Flyway automatically discovered the empty schema and executed **all 22 migrations (`V1` to `V22`) sequentially and natively**.
2. Spring Boot initialized all 21 JPA entity repositories.
3. The product catalog was populated with **820 medical equipment items and 54 categories**.
4. The designated initial super owner account (`sribalajimedisystemsofficial@gmail.com`) was safely initialized with `ROLE_OWNER`.
5. All read-only public endpoints (`/`, `/api/products`, `/api/products/categories`, `/api/meta/settings`, `/api/meta/db-verification`) returned **HTTP 200 OK**.
6. All existing ARSA systems (Frontend `5174`, Backend `8080`, Gateway `8081`, MySQL `3306`) and the unrelated port `5173` remained **100% healthy and unmodified**.

---

## 2. Mandatory Preconditions Verification

| Precondition Requirement | Verification Method | Finding / Status |
| :--- | :--- | :--- |
| **Database Absence Check** | `SHOW DATABASES;` | Confirmed: `medical_equipment` did not exist on `localhost:3306` prior to creation. |
| **Migration Sequence Integrity** | Directory listing & numbering check | Confirmed: Exactly 22 files from `V1__create_initial_schema.sql` to `V22__add_performance_indexes.sql`. |
| **Destructive SQL Check** | Regex scan for `DROP DATABASE`, `TRUNCATE`, `DROP TABLE` | **Zero destructive statements** found across all 22 migration scripts. |
| **Owner Authentication Logic** | Source inspection of `OtpService.java` & `DataInitializer.java` | Confirmed: Two-Factor Authentication (2FA) enforced. Step 1 evaluates against secure `ADMIN_PASSWORD` env var; Step 2 dispatches OTP to verified email. No plaintext passwords stored in the database. |
| **Data Overwrite Risk** | Relational inspection | Confirmed: Completely fresh schema; zero existing business or customer records overwritten. |

---

## 3. Database Initialization & Flyway Migration Status

The schema was initialized with:
```sql
CREATE DATABASE IF NOT EXISTS medical_equipment
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### Complete Flyway Migration Execution Log (All 22 Versions Succeeded)

| Rank | Version | Script Name | Description | Execution Time | Checksum | Status |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | 1 | `V1__create_initial_schema.sql` | create initial schema | 334 ms | -1589076050 | **SUCCESS (1)** |
| 2 | 2 | `V2__migrate_initial_data.sql` | migrate initial data | 27 ms | 976508 | **SUCCESS (1)** |
| 3 | 3 | `V3__add_performance_indexes.sql` | add performance indexes | 247 ms | -1844910308 | **SUCCESS (1)** |
| 4 | 4 | `V4__add_constraints.sql` | add constraints | 538 ms | -1787978288 | **SUCCESS (1)** |
| 5 | 5 | `V5__create_services_schema.sql` | create services schema | 396 ms | 273355826 | **SUCCESS (1)** |
| 6 | 6 | `V6__create_payments_schema.sql` | create payments schema | 75 ms | -966901480 | **SUCCESS (1)** |
| 7 | 7 | `V7__add_technician_role.sql` | add technician role | 43 ms | 1966811693 | **SUCCESS (1)** |
| 8 | 8 | `V8__seed_exact_products_and_categories.sql` | seed exact products and categories | 81 ms | 834844719 | **SUCCESS (1)** |
| 9 | 9 | `V9__seed_meaningful_categories.sql` | seed meaningful categories | 56 ms | 39893013 | **SUCCESS (1)** |
| 10 | 10 | `V10__create_audit_logs_table.sql` | create audit logs table | 27 ms | 43470667 | **SUCCESS (1)** |
| 11 | 11 | `V11__add_blocked_column_to_users.sql` | add blocked column to users | 227 ms | -249989838 | **SUCCESS (1)** |
| 12 | 12 | `V12__add_enabled_column_to_products.sql`| add enabled column to products | 749 ms | 603944367 | **SUCCESS (1)** |
| 13 | 13 | `V13__create_stock_adjustment_logs_table.sql`| create stock adjustment logs table | 18 ms | -790903354 | **SUCCESS (1)** |
| 14 | 14 | `V14__create_website_settings_table.sql`| create website settings table | 18 ms | -1287558314 | **SUCCESS (1)** |
| 15 | 15 | `V15__prune_legacy_categories.sql` | prune legacy categories | 6 ms | -1547734999 | **SUCCESS (1)** |
| 16 | 16 | `V16__restrict_super_admin.sql` | restrict super admin | 4 ms | -1098187424 | **SUCCESS (1)** |
| 17 | 17 | `V17__alter_orders_status_enum.sql` | alter orders status enum | 83 ms | 734834630 | **SUCCESS (1)** |
| 18 | 18 | `V18__add_details_column_to_audit_logs.sql`| add details column to audit logs | 37 ms | 905106223 | **SUCCESS (1)** |
| 19 | 19 | `V19__secure_otp_schema.sql` | secure otp schema | 60 ms | 949757576 | **SUCCESS (1)** |
| 20 | 20 | `V20__expand_product_image_url.sql` | expand product image url | 98 ms | -1767971896 | **SUCCESS (1)** |
| 21 | 21 | `V21__seed_complete_catalog_taxonomy.sql`| seed complete catalog taxonomy | 795 ms | -813599429 | **SUCCESS (1)** |
| 22 | 22 | `V22__add_performance_indexes.sql` | add performance indexes | 347 ms | 1184601542 | **SUCCESS (1)** |

---

## 4. Database Table Inventory & Seed Verification

Querying `information_schema.tables` and entity counts confirms all 22 tables are initialized:

| Table Name | Initial Record Count | Classification / Purpose |
| :--- | :---: | :--- |
| **`flyway_schema_history`** | **22** | Flyway migration version state |
| **`categories`** | **54** | Medical equipment and spare parts categories |
| **`products`** | **820** | Hospital medical devices, diagnostic systems, spare parts |
| **`users`** | **1** | Initial super owner account |
| **`website_settings`** | **12** | Store contact numbers, operational hours, platform metadata |
| **`amc_contracts`** | **0** | Ready for hospital contracts |
| **`audit_logs`** | **0** | Ready for activity logging |
| **`cart_items`** | **0** | Ready for shopping carts |
| **`order_items`** | **0** | Ready for order items |
| **`orders`** | **0** | Ready for customer orders |
| **`otps`** | **0** | Ready for authentication OTPs |
| **`payment_transactions`** | **0** | Ready for Razorpay payments |
| **`reviews`** | **0** | Ready for customer ratings |
| **`service_assignments`** | **0** | Ready for technician dispatches |
| **`service_audit_logs`** | **0** | Ready for biomedical repairs audit trail |
| **`service_engineers`** | **0** | Ready for field technicians |
| **`service_invoices`** | **0** | Ready for repair invoicing |
| **`service_part_usages`** | **0** | Ready for spare parts allocation |
| **`service_requests`** | **0** | Ready for hospital service tickets |
| **`service_visits`** | **0** | Ready for technician on-site visits |
| **`stock_adjustment_logs`**| **0** | Ready for inventory adjustments |
| **`wishlist_items`** | **0** | Ready for saved customer items |

### Owner Account Initialization (Credentials Redacted)
- **ID:** 1
- **Full Name:** `Admin User`
- **Email:** `sribalajimedisystemsofficial@gmail.com`
- **Phone:** `9948073090`
- **Assigned Role:** `ROLE_OWNER`
- **Super Owner Flag:** `true (1)`
- **Account Blocked:** `false (0)`
- **Security:** Authenticates via 2FA (Step 1: Admin Password environment check; Step 2: OTP verification). Zero plain-text credentials stored.

---

## 5. Standalone Read-Only API Testing (:8082)

All read-only tests returned successful responses with zero mutations:

```
=== SRI BALAJI BACKEND (:8082) READ-ONLY TESTS ===
1. GET /                             -> HTTP 200 OK | {"application":"Sri Balaji Medi Systems","status":"UP"}
2. GET /api/products                 -> HTTP 200 OK | 820 products returned
3. GET /api/products/categories      -> HTTP 200 OK | 38 category taxonomy names returned
4. GET /api/meta/settings            -> HTTP 200 OK | 12 store configuration settings returned
5. GET /api/meta/db-verification     -> HTTP 200 OK | {"products":820,"categories":54,"users":1,"orders":0,"service_requests":0,"payment_transactions":0,"audit_logs":0}
```

---

## 6. Concurrent Port Allocation & Ecosystem Health Check

A complete socket probe confirms that all services run concurrently with zero port conflicts:

| Port | Listener State | PID | Process Name | Assigned Application / Role | Health Status |
| :---: | :---: | :---: | :---: | :--- | :--- |
| **3000** | `IDLE / NOT LISTENING` | - | - | Sri Balaji Frontend | **Available** |
| **5173** | `IDLE / NOT LISTENING` | - | - | External Unrelated Application | **Preserved / Untouched** |
| **5174** | `LISTENING` | 6996 | `node.exe` | ARSA React Frontend | **HTTP 200 OK** |
| **8080** | `LISTENING` | 22464 | `java.exe` | ARSA Spring Boot Backend | **HTTP 200 OK** |
| **8081** | `LISTENING` | 27680 | `java.exe` | ARSA Spring Cloud Gateway | **HTTP 200 OK** |
| **8082** | `LISTENING` | 16668 | `java.exe` | Sri Balaji Medi Systems Backend | **HTTP 200 OK** |
| **3306** | `LISTENING` | 17064 | `mysqld.exe` | MySQL Server 8.0 (`api_security_db` & `medical_equipment`) | **Active & Healthy** |

### ARSA Core Health Verification
- `http://localhost:5174/` -> **HTTP 200 OK**
- `http://localhost:8080/api/health` -> **HTTP 200 OK** (`{"message":"API Gateway Security System backend is running","status":"UP"}`)
- `http://localhost:8081/api/health` -> **HTTP 200 OK** (`{"message":"API Gateway Security System backend is running","status":"UP"}`)

---

## 7. Next Actions (Phase 2.3 Ready for Approval)

With Sri Balaji Backend independently verified on port `8082` and database migrations cleanly established, the system is primed for **Phase 2.3 – API Gateway Routing and Centralized Security Enforcement**:
1. Add Sri Balaji routes (`/sbms/api/**` or `/api/products/**`, `/api/cart/**`, etc.) to ARSA Gateway (`8081`) pointing downstream to `http://localhost:8082`.
2. Configure Rate Limiting, IP Filtering, and Centralized Audit Logging filters for e-commerce endpoints.
3. Update Sri Balaji Backend CORS to permit `http://localhost:8081` and `http://localhost:5174`.
4. Configure Sri Balaji Frontend (`3000`) to route all API calls through the ARSA Gateway on port `8081`.

---
*Report generated strictly following Phase 2.2 Option A guidelines. No Gateway routes or frontend modifications have been applied yet.*
