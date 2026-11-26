package com.project.security.arsa;

import java.util.ArrayList;
import java.util.List;

public class RouteSecurityAnalysis {

    private String routePath;
    private String httpMethod;
    private String description;

    private boolean jwtAuth;
    private boolean rbac;
    private boolean requestValidation;
    private boolean rateLimiting;
    private boolean ipFiltering;
    private boolean auditLogging;

    private int activeControlsCount;
    private int totalControlsCount = 6;
    private double complianceScore;
    private RiskRating riskRating;

    private List<String> enabledControls = new ArrayList<>();
    private List<String> missingControls = new ArrayList<>();
    private List<String> recommendations = new ArrayList<>();

    public RouteSecurityAnalysis() {
    }

    public RouteSecurityAnalysis(String routePath, String httpMethod, String description,
                                 boolean jwtAuth, boolean rbac, boolean requestValidation,
                                 boolean rateLimiting, boolean ipFiltering, boolean auditLogging) {
        this.routePath = routePath;
        this.httpMethod = httpMethod;
        this.description = description;
        this.jwtAuth = jwtAuth;
        this.rbac = rbac;
        this.requestValidation = requestValidation;
        this.rateLimiting = rateLimiting;
        this.ipFiltering = ipFiltering;
        this.auditLogging = auditLogging;

        calculateSecurityPosture();
    }

    public void calculateSecurityPosture() {
        enabledControls.clear();
        missingControls.clear();
        recommendations.clear();

        if (jwtAuth) {
            enabledControls.add(SecurityControl.JWT_AUTHENTICATION.getDisplayName());
        } else {
            missingControls.add(SecurityControl.JWT_AUTHENTICATION.getDisplayName());
            recommendations.add("Enable JWT authentication for this route to prevent unauthenticated access.");
        }

        if (rbac) {
            enabledControls.add(SecurityControl.ROLE_BASED_ACCESS_CONTROL.getDisplayName());
        } else {
            missingControls.add(SecurityControl.ROLE_BASED_ACCESS_CONTROL.getDisplayName());
            recommendations.add("Configure role-based authorization rules (RBAC) to enforce least-privilege principles.");
        }

        if (requestValidation) {
            enabledControls.add(SecurityControl.REQUEST_VALIDATION.getDisplayName());
        } else {
            missingControls.add(SecurityControl.REQUEST_VALIDATION.getDisplayName());
            recommendations.add("Add DTO Bean Validation to validate structure, types, and constraints on incoming payloads.");
        }

        if (rateLimiting) {
            enabledControls.add(SecurityControl.RATE_LIMITING.getDisplayName());
        } else {
            missingControls.add(SecurityControl.RATE_LIMITING.getDisplayName());
            recommendations.add("Configure Gateway rate limiting to prevent volumetric abuse, brute-force, and DoS attacks.");
        }

        if (ipFiltering) {
            enabledControls.add(SecurityControl.IP_FILTERING.getDisplayName());
        } else {
            missingControls.add(SecurityControl.IP_FILTERING.getDisplayName());
            recommendations.add("Configure IP filtering (whitelist/blacklist) to restrict access to authorized network perimeters.");
        }

        if (auditLogging) {
            enabledControls.add(SecurityControl.AUDIT_LOGGING.getDisplayName());
        } else {
            missingControls.add(SecurityControl.AUDIT_LOGGING.getDisplayName());
            recommendations.add("Enable centralized audit logging to capture lifecycle events, access attempts, and anomalies.");
        }

        this.activeControlsCount = enabledControls.size();
        this.complianceScore = Math.round(((double) activeControlsCount / totalControlsCount) * 10000.0) / 100.0;

        if (complianceScore >= 90.0) {
            this.riskRating = RiskRating.LOW;
        } else if (complianceScore >= 70.0) {
            this.riskRating = RiskRating.MEDIUM;
        } else if (complianceScore >= 40.0) {
            this.riskRating = RiskRating.HIGH;
        } else {
            this.riskRating = RiskRating.CRITICAL;
        }
    }

    public String getRoutePath() {
        return routePath;
    }

    public void setRoutePath(String routePath) {
        this.routePath = routePath;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public void setHttpMethod(String httpMethod) {
        this.httpMethod = httpMethod;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isJwtAuth() {
        return jwtAuth;
    }

    public void setJwtAuth(boolean jwtAuth) {
        this.jwtAuth = jwtAuth;
    }

    public boolean isRbac() {
        return rbac;
    }

    public void setRbac(boolean rbac) {
        this.rbac = rbac;
    }

    public boolean isRequestValidation() {
        return requestValidation;
    }

    public void setRequestValidation(boolean requestValidation) {
        this.requestValidation = requestValidation;
    }

    public boolean isRateLimiting() {
        return rateLimiting;
    }

    public void setRateLimiting(boolean rateLimiting) {
        this.rateLimiting = rateLimiting;
    }

    public boolean isIpFiltering() {
        return ipFiltering;
    }

    public void setIpFiltering(boolean ipFiltering) {
        this.ipFiltering = ipFiltering;
    }

    public boolean isAuditLogging() {
        return auditLogging;
    }

    public void setAuditLogging(boolean auditLogging) {
        this.auditLogging = auditLogging;
    }

    public int getActiveControlsCount() {
        return activeControlsCount;
    }

    public int getTotalControlsCount() {
        return totalControlsCount;
    }

    public double getComplianceScore() {
        return complianceScore;
    }

    public RiskRating getRiskRating() {
        return riskRating;
    }

    public List<String> getEnabledControls() {
        return enabledControls;
    }

    public List<String> getMissingControls() {
        return missingControls;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }
}
