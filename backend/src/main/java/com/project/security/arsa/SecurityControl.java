package com.project.security.arsa;

public enum SecurityControl {
    JWT_AUTHENTICATION("JWT Authentication", "Validates bearer JSON Web Tokens on incoming requests"),
    ROLE_BASED_ACCESS_CONTROL("Role-Based Access Control", "Enforces role and authority constraints on route endpoints"),
    REQUEST_VALIDATION("Request Validation", "Enforces schema constraints and input validation on request bodies"),
    RATE_LIMITING("Rate Limiting", "Protects routes against volumetric flood, brute-force, and DoS attacks"),
    IP_FILTERING("IP Filtering", "Applies IP whitelisting and blacklisting security policies"),
    AUDIT_LOGGING("Centralized Audit Logging", "Persists security and route lifecycle events into audit storage");

    private final String displayName;
    private final String description;

    SecurityControl(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}
