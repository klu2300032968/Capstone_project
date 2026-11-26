package com.project.security.arsa;

import com.project.security.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ArsaAnalysisService {

    public List<RouteSecurityAnalysis> analyzeAllRoutes() {
        List<RouteSecurityAnalysis> routes = new ArrayList<>();

        // 1. Payment Settlement (High Security)
        routes.add(new RouteSecurityAnalysis(
                "/api/payments/process",
                "POST",
                "Payment transaction execution and settlement",
                true,  // JWT Auth
                true,  // RBAC (ROLE_ADMIN)
                true,  // Request Validation
                true,  // Rate Limiting (Gateway)
                true,  // IP Filtering (Gateway)
                true   // Audit Logging (PAYMENT_PROCESSED)
        ));

        // 2. Payment Ledger Inspection
        routes.add(new RouteSecurityAnalysis(
                "/api/payments",
                "GET",
                "Retrieve payment settlement transaction history",
                true,  // JWT Auth
                true,  // RBAC (ROLE_ADMIN)
                false, // Request Validation (No body)
                true,  // Rate Limiting
                true,  // IP Filtering
                true   // Audit Logging (PAYMENTS_VIEWED)
        ));

        // 3. Order Placement
        routes.add(new RouteSecurityAnalysis(
                "/api/orders",
                "POST",
                "Customer purchase order creation",
                true,  // JWT Auth
                true,  // RBAC (USER / ADMIN)
                true,  // Request Validation
                true,  // Rate Limiting
                true,  // IP Filtering
                true   // Audit Logging (ORDER_CREATED)
        ));

        // 4. Order Listing
        routes.add(new RouteSecurityAnalysis(
                "/api/orders",
                "GET",
                "Retrieve customer order history",
                true,  // JWT Auth
                true,  // RBAC (USER / ADMIN)
                false, // Request Validation
                true,  // Rate Limiting
                true,  // IP Filtering
                true   // Audit Logging (ORDERS_VIEWED)
        ));

        // 5. User Creation (Admin Management)
        routes.add(new RouteSecurityAnalysis(
                "/api/users",
                "POST",
                "Administrative user registration and provisioning",
                true,  // JWT Auth
                true,  // RBAC (ROLE_ADMIN)
                true,  // Request Validation
                true,  // Rate Limiting
                true,  // IP Filtering
                true   // Audit Logging (USER_CREATED)
        ));

        // 6. User Listing (Admin Management)
        routes.add(new RouteSecurityAnalysis(
                "/api/users",
                "GET",
                "Retrieve registered system users",
                true,  // JWT Auth
                true,  // RBAC (ROLE_ADMIN)
                false, // Request Validation
                true,  // Rate Limiting
                true,  // IP Filtering
                true   // Audit Logging (USERS_VIEWED)
        ));

        // 7. Audit Log Viewer (Admin Security)
        routes.add(new RouteSecurityAnalysis(
                "/api/audit-logs",
                "GET",
                "Security event log retrieval and auditing",
                true,  // JWT Auth
                true,  // RBAC (ROLE_ADMIN)
                false, // Request Validation
                true,  // Rate Limiting
                true,  // IP Filtering
                true   // Audit Logging (Self Audited)
        ));

        // 8. User Login (Public Auth Entrypoint)
        routes.add(new RouteSecurityAnalysis(
                "/api/auth/login",
                "POST",
                "User credentials verification and JWT token issuance",
                false, // JWT Auth (Public entrypoint)
                false, // RBAC (Public entrypoint)
                true,  // Request Validation (@Valid LoginRequestDTO)
                true,  // Rate Limiting (Strict brute-force prevention)
                true,  // IP Filtering
                true   // Audit Logging (LOGIN_SUCCESS, LOGIN_FAILED)
        ));

        // 9. Public Product Catalog
        routes.add(new RouteSecurityAnalysis(
                "/api/public/products",
                "GET",
                "Public e-commerce product catalog browsing",
                false, // JWT Auth (Public)
                false, // RBAC (Public)
                false, // Request Validation
                true,  // Rate Limiting
                true,  // IP Filtering
                false  // Audit Logging
        ));

        // 10. Public Product Detail Lookup
        routes.add(new RouteSecurityAnalysis(
                "/api/public/products/{id}",
                "GET",
                "Public single product specification lookup",
                false, // JWT Auth (Public)
                false, // RBAC (Public)
                false, // Request Validation
                true,  // Rate Limiting
                true,  // IP Filtering
                false  // Audit Logging
        ));

        // 11. Health Check
        routes.add(new RouteSecurityAnalysis(
                "/api/health",
                "GET",
                "Service liveness and readiness probe",
                false, // JWT Auth (Public)
                false, // RBAC (Public)
                false, // Request Validation
                true,  // Rate Limiting
                true,  // IP Filtering
                false  // Audit Logging
        ));

        return routes;
    }

    public RouteSecurityAnalysis analyzeRoute(String searchPath) {
        if (searchPath == null || searchPath.trim().isEmpty()) {
            throw new ResourceNotFoundException("Route path must not be empty");
        }

        String normalizedSearch = searchPath.trim().toLowerCase();
        return analyzeAllRoutes().stream()
                .filter(r -> r.getRoutePath().equalsIgnoreCase(normalizedSearch)
                        || r.getRoutePath().toLowerCase().contains(normalizedSearch)
                        || normalizedSearch.contains(r.getRoutePath().toLowerCase()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No route found matching path: " + searchPath));
    }

    public ArsaSummaryResponse getSecuritySummary() {
        List<RouteSecurityAnalysis> routes = analyzeAllRoutes();

        int total = routes.size();
        int fullyCompliant = 0;
        int partiallyCompliant = 0;
        int nonCompliant = 0;
        double totalScore = 0.0;

        Map<String, Integer> riskDistribution = new LinkedHashMap<>();
        for (RiskRating rating : RiskRating.values()) {
            riskDistribution.put(rating.name(), 0);
        }

        Map<String, Integer> missingControlsSummary = new LinkedHashMap<>();
        for (SecurityControl control : SecurityControl.values()) {
            missingControlsSummary.put(control.getDisplayName(), 0);
        }

        for (RouteSecurityAnalysis route : routes) {
            double score = route.getComplianceScore();
            totalScore += score;

            if (score >= 99.9) {
                fullyCompliant++;
            } else if (score >= 50.0) {
                partiallyCompliant++;
            } else {
                nonCompliant++;
            }

            String riskName = route.getRiskRating().name();
            riskDistribution.put(riskName, riskDistribution.getOrDefault(riskName, 0) + 1);

            for (String missing : route.getMissingControls()) {
                missingControlsSummary.put(missing, missingControlsSummary.getOrDefault(missing, 0) + 1);
            }
        }

        double avgScore = total > 0 ? Math.round((totalScore / total) * 100.0) / 100.0 : 0.0;

        return new ArsaSummaryResponse(
                total,
                fullyCompliant,
                partiallyCompliant,
                nonCompliant,
                avgScore,
                riskDistribution,
                missingControlsSummary,
                routes
        );
    }

    public RouteSecurityAnalysis evaluateCustomRoute(CustomRouteEvaluationRequest request) {
        return new RouteSecurityAnalysis(
                request.getRoutePath(),
                request.getHttpMethod(),
                request.getDescription() != null ? request.getDescription() : "Custom evaluated route",
                request.isJwtAuth(),
                request.isRbac(),
                request.isRequestValidation(),
                request.isRateLimiting(),
                request.isIpFiltering(),
                request.isAuditLogging()
        );
    }
}
