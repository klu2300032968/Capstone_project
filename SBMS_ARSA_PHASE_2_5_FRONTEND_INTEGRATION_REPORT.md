# Phase 2.5 – Sri Balaji React Frontend Integration Through ARSA API Gateway
**Execution & Verification Deliverable Report**  
**Date:** November 25, 2026  
**Projects:**  
- Sri Balaji Medi Systems Frontend: `E:\website\frontend` (Port `3000`)
- ARSA API Gateway: `E:\API Gateway\gateway` (Port `8081`)
- Sri Balaji Medi Systems Backend: `E:\website\backend` (Port `8082`, bound strictly to `127.0.0.1`)
- ARSA Core Backend: `E:\API Gateway\backend` (Port `8080`)
- ARSA Frontend (White Theme): `E:\API Gateway\frontend` (Port `5174`)
- MySQL Database: `localhost:3306` (`medical_equipment` & `api_security_db`)

---

## 1. Executive Summary

In Phase 2.5, the Sri Balaji Medi Systems React frontend (running on port `3000`) was integrated to communicate exclusively through the ARSA API Gateway (running on port `8081`) under the namespace `/sbms`. 

Prior to integration, all affected frontend configuration and API service files were backed up with cryptographic SHA-256 integrity hashes. Build validation confirmed clean compilation (`npm run build`). Live visual UI verification using an autonomous browser subagent, combined with a 13-point automated integration test suite, verified that product catalogues, equipment categories, detail pages, metadata, and security boundaries function as intended through the Gateway without directly contacting downstream port `8082`.

---

## 2. Pre-Integration Backups & Integrity Verification

A dedicated pre-integration backup snapshot was recorded before any edits were performed:
- **Backup Directory:** `E:\backups\phase_2_5_pre_integration_backup\`

| File | Pre-Integration SHA-256 Hash | Status |
|---|---|---|
| `frontend/.env` | `1B7A23388BDAA3BCDC8CECD0F7A1F377FF73D73D1636DDB5F3C339D07738EF2D` | Backed Up |
| `frontend/src/services/api.js` | `36C8252F4B2F853170CFCC5848BECC2627FF6AE6F2622FDDC418EE3131F0FAE8` | Backed Up |

---

## 3. Configuration & Routing Architecture

### 3.1 Frontend Environment Configuration
File: `E:\website\frontend\.env`
```env
PORT=3000
REACT_APP_API_URL=http://localhost:8081/sbms
REACT_APP_ENVIRONMENT=production
```

### 3.2 Frontend Axios Service Layer
File: `E:\website\frontend\src\services\api.js`
- **Base URL:** Initialized to `process.env.REACT_APP_API_URL || 'http://localhost:8081/sbms'`
- **Request Interceptor:** Automatically reads JWT token from `localStorage.getItem('authToken')` and attaches standard `Authorization: Bearer <token>` header.
- **Path Resolution:** Relative paths such as `/api/products` are appended directly by Axios to yield `http://localhost:8081/sbms/api/products`.

### 3.3 Gateway Path Forwarding & Header Deduplication
File: `E:\API Gateway\gateway\src\main\resources\application.yml`
- **Namespace Route Match:** `/sbms/api/**`
- **Filter `StripPrefix=1`:** Drops `/sbms`, forwarding `/api/**` directly to `http://localhost:8082/api/**`.
- **CORS Deduplication:** `DedupeResponseHeader=Access-Control-Allow-Origin Access-Control-Allow-Credentials, RETAIN_UNIQUE` was configured in Gateway default-filters to eliminate duplicate `Access-Control-Allow-Origin` headers between the Gateway and the downstream Spring Security filter chain.

| Frontend Call | Sent to Gateway | Gateway StripPrefix=1 | Forwarded to Sri Balaji Backend |
|---|---|---|---|
| `api.get('/api/products')` | `http://localhost:8081/sbms/api/products` | `/sbms` stripped | `http://127.0.0.1:8082/api/products` |
| `api.get('/api/products/categories')` | `http://localhost:8081/sbms/api/products/categories` | `/sbms` stripped | `http://127.0.0.1:8082/api/products/categories` |
| `api.get('/api/products/1')` | `http://localhost:8081/sbms/api/products/1` | `/sbms` stripped | `http://127.0.0.1:8082/api/products/1` |
| `api.get('/api/meta/settings')` | `http://localhost:8081/sbms/api/meta/settings` | `/sbms` stripped | `http://127.0.0.1:8082/api/meta/settings` |
| `api.post('/api/auth/login')` | `http://localhost:8081/sbms/api/auth/login` | `/sbms` stripped | `http://127.0.0.1:8082/api/auth/login` |
| `api.get('/api/cart')` | `http://localhost:8081/sbms/api/cart` | `/sbms` stripped | `http://127.0.0.1:8082/api/cart` |

---

## 4. Frontend Build & Startup Verification

1. **Production Build Validation:**
   - Executed `npm run build` in `E:\website\frontend`.
   - Result: **Compiled successfully**. Optimized production output generated in `E:\website\frontend\build`.
2. **Development Server Startup:**
   - Started with `$env:PORT="3000"`.
   - Result: Active and listening on `http://localhost:3000` (PID 30644).

---

## 5. Automated Integration Test Suite Results

A comprehensive 13-point automated integration test suite was executed against the running services:

| Test ID | Test Name | Target Route | Expected Status | Actual Status | Details | Result |
|:---:|---|---|:---:|:---:|---|:---:|
| 1 | Frontend Homepage Probe | `http://localhost:3000/` | 200 | 200 | HTML bundle loaded (1107 bytes) | **PASS** |
| 2 | Product Catalogue via Gateway | `http://localhost:8081/sbms/api/products` | 200 | 200 | 820 total catalog items available | **PASS** |
| 3 | Category Listing via Gateway | `http://localhost:8081/sbms/api/products/categories` | 200 | 200 | 38 clinical equipment categories | **PASS** |
| 4 | Product Details Lookup | `http://localhost:8081/sbms/api/products/1` | 200 | 200 | ECG Machine details returned | **PASS** |
| 5 | Public Metadata Settings | `http://localhost:8081/sbms/api/meta/settings` | 200 | 200 | Metadata payload received | **PASS** |
| 6 | Public Product Reviews | `http://localhost:8081/sbms/api/reviews/product/1` | 200 | 200 | Review records returned | **PASS** |
| 7 | Unauthenticated Cart Rejection | `http://localhost:8081/sbms/api/cart` | 403 | 403 | Protected by Spring Security | **PASS** |
| 8 | Unauthenticated Owner Dashboard Rejection | `http://localhost:8081/sbms/api/owner/dashboard` | 403 | 403 | Protected by RBAC rules | **PASS** |
| 9 | Gateway CORS Preflight | `OPTIONS /sbms/api/products` | 200 | 200 | `Allow-Origin: http://localhost:3000` | **PASS** |
| 10 | Gateway CORS Deduplication | `GET /sbms/api/products` (Origin: 3000) | 200 | 200 | Single unique `Allow-Origin` header | **PASS** |
| 11 | Gateway Rate Limiting Headers | `GET /sbms/api/products` | 200 | 200 | `X-RateLimit-Remaining: 53` | **PASS** |
| 12 | ARSA White Theme UI Health | `http://localhost:5174/` | 200 | 200 | ARSA Dashboard responsive | **PASS** |
| 13 | ARSA Core Backend Health | `http://localhost:8080/api/health` | 200 | 200 | ARSA Backend healthy | **PASS** |

**Overall Result: 13 / 13 TESTS PASSED (100% Success Rate)**

---

## 6. Live Browser Visual UI Verification

Visual verification was conducted via an autonomous browser subagent (`conversationId: 3743527a-57fd-4c01-8cf8-6aaf482b0eb3`) operating on `http://localhost:3000`:

1. **Console Cleanliness:** Zero JavaScript console errors; no CORS violation warnings.
2. **Product Catalog Page (`/products`):**
   - Renders **524 active medical systems** across 22 pagination pages (24 cards per page).
   - All cards show high-resolution medical device imagery, stock badges (`In Stock (Warehouse)`, `Available on Request`), clinical category tags, brand names, model numbers, pricing in INR, Wishlist toggles, and "Add to Cart" actions.
   - Example verified systems: *ECG Machine (Cardiart 6108T ₹45,000)*, *X-Ray Machine (Definium 646 HD ₹1,80,000)*, *MRI Scanner (MAGNETOM Amira 1.5T ₹45,00,000)*, *CT Scanner (Revolution ACTs ₹35,00,000)*, *Ventilator (Evita V600 ₹1,20,000)*.
3. **Category Filtering Drawer:**
   - 23 clinical categories rendered with accurate item counts (e.g., *Diagnostic Imaging: 39*, *Cardiology: 35*, *ICU & Critical Care: 40*, *Laboratory: 42*).
   - Dynamic filter application tested: selecting "Cardiology" filtered display to 35 cardiology systems. Resetting filters seamlessly restored all 524 systems.
4. **Visual Evidence Artifact:**
   - Latest Host-Observed Screenshot: `C:\Users\M ESWAR MANOJ\.gemini\antigravity\brain\4cb642b2-3e6b-411d-9da8-b95e521eebbb\browser_evidence\3743527a-57fd-4c01-8cf8-6aaf482b0eb3\final_step_24.png`

---

## 7. Current Architecture & Port Status Matrix

| Component | Port | Interface | Owning PID | Health / Status |
|---|:---:|---|:---:|---|
| **Sri Balaji React Frontend** | `3000` | `0.0.0.0:3000` | 30644 | **Active** (Compiled successfully, UI verified) |
| **ARSA React Frontend** | `5174` | `localhost:5174` | 28668 | **Active** (White Theme verified) |
| **ARSA Backend** | `8080` | `0.0.0.0:8080` | 22088 | **Active** (`/api/health` HTTP 200) |
| **ARSA API Gateway** | `8081` | `0.0.0.0:8081` | 2444 | **Active** (Routing ARSA + SBMS with Dedupe CORS) |
| **Sri Balaji Backend** | `8082` | `127.0.0.1:8082` | 30236 | **Active** (Isolated to localhost loopback) |
| **MySQL Service** | `3306` | `0.0.0.0:3306` | 17064 | **Active** (`medical_equipment` & `api_security_db`) |
| **External Service** | `5173` | Untouched | — | **Preserved Unchanged** |

---

## 8. Safety Adherence & Scope Boundary Checklist

- [x] **Zero Port 8082 Direct Calls:** Frontend calls exclusively target `http://localhost:8081/sbms`.
- [x] **Backend Isolation Maintained:** Sri Balaji backend remains bound strictly to `127.0.0.1:8082`.
- [x] **Database Safety:** Zero schema alterations, zero Flyway migrations, zero dropped or truncated tables.
- [x] **Authentication Logic Preserved:** JWT generation, token secrets, and interceptor behaviors preserved intact.
- [x] **No Real Payments or Communications Triggered:** Razorpay keys untouched; no real SMS/email notifications sent.
- [x] **Port 5173 Untouched:** The unrelated service on port 5173 was preserved without modification.
- [x] **UI Theme Preserved:** Original Sri Balaji UI styling, layout, and component structures remained unmodified.

---

## 9. Conclusion & Readiness

Phase 2.5 is **100% complete and verified**. The Sri Balaji React frontend is now routing all traffic through the ARSA API Gateway on port 8081. All security controls, rate limiting policies, and CORS headers are operating harmoniously.
