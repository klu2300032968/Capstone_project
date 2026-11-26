# ARSA API GATEWAY SECURITY — FINAL TEST CASE REPORT
**Project:** API Gateway Security Controls With Consistent Enforcement Across Routes  
**Component:** Adaptive Route Security Analyzer (ARSA)  
**Execution Date:** 24 November 2026  
**Test Environment:** Windows 11, JDK 21.0.7, Node.js v24.11.1, MySQL 8.0.44  
**Test Verdict:** **100% PASSED (92/92 Automated Tests + 22/22 End-to-End Tests)**

---

## 1. Automated Test Suites Summary

| Test Suite | Framework | Scope / Coverage | Tests Run | Passed | Failed |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Backend Unit & Integration** | JUnit 5 + MockMvc | Controllers, JWT Utils, Services, ARSA Engine, Security Hardening | 65 | 65 | 0 |
| **Gateway Unit & Integration** | JUnit 5 + Spring Boot Test | Token Bucket Limiter, IP Filter, Client IP Resolver, App Context | 21 | 21 | 0 |
| **Frontend Component Tests** | Vitest + Testing Library | Dashboard, Navigation, UserPortal, Metric Gauges, RBAC Views | 6 | 6 | 0 |
| **TOTAL AUTOMATED TESTS** | | | **92** | **92** | **0** |

---

## 2. Live End-to-End Security Verification Test Matrix

Executed live against the running application stack through the Spring Cloud Gateway perimeter (`http://localhost:8081`) and Vite Proxy (`http://localhost:5174/api`):

| Test ID | Test Description | Request Input / Path | Expected HTTP | Actual HTTP | Verdict | Details |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **TC-01** | Admin Authentication | `POST /api/auth/login` (admin / Admin@12345) | `200 OK` | `200 OK` | **PASS** | Valid JWT issued; role `ROLE_ADMIN` |
| **TC-02** | Standard User Authentication | `POST /api/auth/login` (alice_dev / SecurePassword@123) | `200 OK` | `200 OK` | **PASS** | Valid JWT issued; role `ROLE_USER` |
| **TC-03** | Invalid Password Rejection | `POST /api/auth/login` (admin / WrongPass999!) | `401 Unauthorized` | `401 Unauthorized` | **PASS** | Bad credentials rejected cleanly |
| **TC-04a** | Missing JWT on Protected Route | `GET /api/orders` (No Authorization header) | `401 Unauthorized` | `401 Unauthorized` | **PASS** | Gateway/Spring Security intercept |
| **TC-04b** | Forged / Corrupted JWT Token | `GET /api/orders` (Bearer invalid.bogus.jwt) | `401 Unauthorized` | `401 Unauthorized` | **PASS** | Signature verification failure |
| **TC-05a** | RBAC Enforcement (ARSA Summary) | `GET /api/arsa/summary` (alice_dev token) | `403 Forbidden` | `403 Forbidden` | **PASS** | Regular user denied admin telemetry |
| **TC-05b** | RBAC Enforcement (User Mgmt) | `GET /api/users` (alice_dev token) | `403 Forbidden` | `403 Forbidden` | **PASS** | Regular user denied user listings |
| **TC-05c** | RBAC Enforcement (Audit Logs) | `GET /api/audit-logs` (alice_dev token) | `403 Forbidden` | `403 Forbidden` | **PASS** | Regular user denied audit logs |
| **TC-06a** | Admin Access to ARSA Summary | `GET /api/arsa/summary` (admin token) | `200 OK` | `200 OK` | **PASS** | Returned 11 routes, 72.73% score |
| **TC-06b** | Admin Access to Route Catalog | `GET /api/arsa/routes` (admin token) | `200 OK` | `200 OK` | **PASS** | Exactly 11 route definitions loaded |
| **TC-06c** | Admin Access to Central Audit Logs | `GET /api/audit-logs` (admin token) | `200 OK` | `200 OK` | **PASS** | Retrieved 27 persistent audit records |
| **TC-07a** | Public Catalog (Unauthenticated) | `GET /api/public/products` (No JWT) | `200 OK` | `200 OK` | **PASS** | Public browsing permitted by policy |
| **TC-07b** | Public Product Detail Lookup | `GET /api/public/products/1` (No JWT) | `200 OK` | `200 OK` | **PASS** | Individual product returned |
| **TC-08a** | Request Validation (Negative Price) | `POST /api/payments/process` (amount = -50.00) | `400 Bad Request` | `400 Bad Request` | **PASS** | Bean Validation rejected invalid field |
| **TC-08b** | Request Validation (Empty Payload) | `POST /api/orders` (empty description) | `400 Bad Request` | `400 Bad Request` | **PASS** | `@Valid` annotation enforced |
| **TC-09** | Token-Bucket Rate Limiter Burst | `POST /api/auth/login` (15 fast requests) | `429 Too Many Req` | `429 Too Many Req` | **PASS** | Capacity 10 triggered HTTP 429 |
| **TC-10** | IP Filtering Policy Enforcement | `GET /api/public/products` (`X-Forwarded-For: 192.168.1.1`) | `200 OK` | `200 OK` | **PASS** | Allowed subnet evaluation passed |
| **TC-11** | Audit Log Persistence in MySQL | Query `audit_logs` table after events | `Record Count > 0` | `27 Records` | **PASS** | Verified in MySQL `api_security_db` |
| **TC-12** | ARSA Summary Consistency | Check score & route count | `11 Routes, 72.73%` | `11 Routes, 72.73%` | **PASS** | Strict mathematical consistency |
| **TC-13** | Custom Route Sandbox Evaluator | `POST /api/arsa/evaluate` (6 controls on) | `100% Score, LOW` | `100% Score, LOW` | **PASS** | Real-time recalculation verified |
| **TC-14** | Gateway Public Health Probe | `GET /api/health` | `200 OK` | `200 OK` | **PASS** | Perimeter liveness probe active |
| **TC-15** | 11 Routes Security Controls Audit | Verify each route against 6 controls | `All 11 Math Valid` | `All 11 Math Valid` | **PASS** | Control matrix verified |

---

## 3. All 11 API Routes Security Controls Verification Matrix

| Route # | HTTP Method | Path Pattern | JWT Auth | RBAC | Validation | Rate Limiter | IP Filter | Audit Log | Compliance Score | Risk Rating |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | `POST` | `/api/payments/process` | ENABLED | ENABLED | ENABLED | ENABLED | ENABLED | ENABLED | **100.00%** | `LOW` |
| **2** | `GET` | `/api/payments` | ENABLED | ENABLED | N/A (No Body) | ENABLED | ENABLED | ENABLED | **83.33%** | `MEDIUM` |
| **3** | `POST` | `/api/orders` | ENABLED | ENABLED | ENABLED | ENABLED | ENABLED | ENABLED | **100.00%** | `LOW` |
| **4** | `GET` | `/api/orders` | ENABLED | ENABLED | N/A (No Body) | ENABLED | ENABLED | ENABLED | **83.33%** | `MEDIUM` |
| **5** | `POST` | `/api/users` | ENABLED | ENABLED | ENABLED | ENABLED | ENABLED | ENABLED | **100.00%** | `LOW` |
| **6** | `GET` | `/api/users` | ENABLED | ENABLED | N/A (No Body) | ENABLED | ENABLED | ENABLED | **83.33%** | `MEDIUM` |
| **7** | `GET` | `/api/audit-logs` | ENABLED | ENABLED | N/A (No Body) | ENABLED | ENABLED | ENABLED | **83.33%** | `MEDIUM` |
| **8** | `POST` | `/api/auth/login` | PUBLIC | PUBLIC | ENABLED | ENABLED | ENABLED | ENABLED | **66.67%** | `HIGH` |
| **9** | `GET` | `/api/public/products` | PUBLIC | PUBLIC | N/A (No Body) | ENABLED | ENABLED | DISABLED | **33.33%** | `CRITICAL` |
| **10** | `GET` | `/api/public/products/{id}` | PUBLIC | PUBLIC | N/A (No Body) | ENABLED | ENABLED | DISABLED | **33.33%** | `CRITICAL` |
| **11** | `GET` | `/api/health` | PUBLIC | PUBLIC | N/A (No Body) | ENABLED | ENABLED | DISABLED | **33.33%** | `CRITICAL` |

---

## 4. Test Conclusion & Sign-Off

- **Total Test Cases Executed:** 114 (92 Automated + 22 Live End-to-End)
- **Total Test Cases Passed:** 114 (100%)
- **Total Test Cases Failed:** 0 (0%)
- **System Stability:** Verified completely stable across repeated execution cycles.
