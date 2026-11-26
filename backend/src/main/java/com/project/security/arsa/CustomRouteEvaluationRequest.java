package com.project.security.arsa;

import jakarta.validation.constraints.NotBlank;

public class CustomRouteEvaluationRequest {

    @NotBlank(message = "Route path is required")
    private String routePath;

    @NotBlank(message = "HTTP method is required")
    private String httpMethod;

    private String description;
    private boolean jwtAuth;
    private boolean rbac;
    private boolean requestValidation;
    private boolean rateLimiting;
    private boolean ipFiltering;
    private boolean auditLogging;

    public CustomRouteEvaluationRequest() {
    }

    public CustomRouteEvaluationRequest(String routePath, String httpMethod, String description,
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
}
