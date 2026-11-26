# ARSA API Gateway — Render Docker Deployment Guide

## 1. Overview & Architecture

The **Adaptive Route Security Analyzer (ARSA) API Gateway** is a high-performance, non-blocking Spring Cloud Gateway (built on Spring Boot 3.3.4 & Project Reactor / Netty). It acts as the centralized perimeter defense and reverse-proxy for microservice routes, providing:

- Native Docker deployment containerized on Java 21 (`eclipse-temurin:21-jre-alpine`).
- Token-bucket rate limiting (HTTP 429 enforcement).
- IP filtering with zero disruption to Render health probes.
- Strict CORS enforcement allowing only `https://sri-balaji-medi-frontend.onrender.com` in production.
- Full JWT authorization header preservation and forwarding.
- Namespace routing for **Sri Balaji Medi Systems** under `/sbms/**` with single-prefix stripping (`StripPrefix=1`).
- Independent dual health checks:
  - Gateway-native liveness: `GET /health` (probes the gateway process directly in <1ms without requiring downstream SBMS to be awake).
  - Downstream dependency readiness: `GET /sbms/health` (queries downstream SBMS `/health`).

```
[ Customer Browser / Mobile ]
            │
            ▼ HTTPS
┌────────────────────────────────────────────────────────┐
│  ARSA API Gateway (Render Docker Web Service)          │
│  e.g. https://arsa-api-gateway.onrender.com            │
│  - Container: eclipse-temurin:21-jre-alpine            │
│  - Port: $PORT (dynamically assigned by Render)        │
│  - Host: 0.0.0.0                                       │
│  - Health Check: /health                               │
│  - CORS: https://sri-balaji-medi-frontend.onrender.com │
└────────────────────────────────────────────────────────┘
            │
            │ Forwarding /sbms/api/** -> /api/**
            ▼ HTTPS
┌────────────────────────────────────────────────────────┐
│  Sri Balaji Medi Systems Backend (Render Web Service) │
│  https://sri-balaji-medi-systems.onrender.com          │
│  - Connected to Aiven MySQL                            │
│  - Spring Security JWT & RBAC Enforcement              │
└────────────────────────────────────────────────────────┘
```

---

## 2. Render Docker Web Service Specification

When creating the Web Service on Render:

| Setting | Value / Specification | Notes |
|---|---|---|
| **Service Type** | **Web Service** | Public HTTP reverse-proxy |
| **Language / Environment** | **Docker** | Render builds using the multi-stage Dockerfile |
| **Name** | `arsa-api-gateway` *(or preferred name)* | Generates `https://<name>.onrender.com` |
| **Region** | **Singapore** *(or same as SBMS)* | Minimizes proxy forwarding latency |
| **Branch** | `main` | Production branch |
| **Root Directory** | `gateway` *(if deploying from full ARSA repo)* | Directory containing the `Dockerfile` |
| **Dockerfile Path** | `./Dockerfile` *(relative to root directory)* | Multi-stage Maven 3.9 + Temurin 21 build |
| **Health Check Path** | `/health` | Native gateway probe; returns HTTP 200 `{"status":"UP","service":"arsa-api-gateway"}` |

---

## 3. Environment Variables Specification

Configure the following environment variables in the Render Service Settings:

### Core Routing & Network Configuration

| Variable | Required? | Default / Recommended Value | Description |
|---|:---:|---|---|
| `SBMS_BACKEND_URL` | Optional | `https://sri-balaji-medi-systems.onrender.com` | Downstream production SBMS backend |
| `CORS_ALLOWED_ORIGINS` | Optional | `https://sri-balaji-medi-frontend.onrender.com` | Production allowed origin (strict) |
| `SERVER_ADDRESS` | Optional | `0.0.0.0` | Binds to all network interfaces |
| `IP_FILTER_ENABLED` | Optional | `true` | Enables/disables IP whitelist/blacklist |

*(Note: Render automatically injects `PORT`. Spring Cloud Gateway binds to `0.0.0.0:$PORT` automatically).*

### Rate Limiting Policies (Defaults Active)

| Variable | Default Value | Description |
|---|:---:|---|
| `RATE_LIMIT_SBMS_PUBLIC_CAPACITY` | `60` | Public catalog & metadata burst capacity (60 req/min) |
| `RATE_LIMIT_SBMS_PUBLIC_REFILL` | `60` | Public catalog tokens per 60 seconds |
| `RATE_LIMIT_SBMS_AUTH_CAPACITY` | `5` | Authentication burst capacity (5 req/2 min anti-brute-force) |
| `RATE_LIMIT_SBMS_AUTH_DURATION` | `120` | Authentication refill window (120 seconds) |
| `RATE_LIMIT_SBMS_PAYMENTS_CAPACITY` | `10` | Payment & UTR submission burst capacity (10 req/min) |
| `RATE_LIMIT_SBMS_PAYMENTS_DURATION` | `60` | Payment refill window (60 seconds) |
| `RATE_LIMIT_SBMS_PROTECTED_CAPACITY` | `30` | Protected cart/orders/owner burst capacity (30 req/min) |

---

## 4. Frontend Web Service Update (After Gateway Deployment)

Once the ARSA Gateway service is live on Render:

1. Navigate to the **Sri Balaji Frontend** service on Render (`sri-balaji-medi-frontend`).
2. Go to **Environment Variables**.
3. Set:
   ```env
   REACT_APP_API_URL=https://<your-gateway-service>.onrender.com/sbms
   ```
4. Trigger a rebuild/redeploy of the frontend so the React bundle targets the Gateway.

---

## 5. Security & Isolation Controls

1. **Zero Database Secrets Required**: The Gateway does not connect to MySQL. It requires zero database passwords.
2. **Hardened Container**: The Dockerfile uses `eclipse-temurin:21-jre-alpine` running as non-root user `appuser` (group `appgroup`).
3. **Strict CORS**: By default, only `https://sri-balaji-medi-frontend.onrender.com` is permitted. Wildcard `*.onrender.com` is disallowed.
4. **Independent Health Check**: `/health` runs locally in Netty without relying on downstream services. Render will not flap or mark the gateway down if the backend is waking up from sleep.
5. **Localhost Isolation**: Local development continues running seamlessly on port `8081` connecting to `http://localhost:8082` via `start_all.bat`.
