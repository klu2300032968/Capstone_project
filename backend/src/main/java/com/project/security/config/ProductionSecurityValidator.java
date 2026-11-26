package com.project.security.config;

import io.jsonwebtoken.io.Decoders;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class ProductionSecurityValidator {

    private static final Logger logger = LoggerFactory.getLogger(ProductionSecurityValidator.class);

    private final Environment environment;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${spring.datasource.url:}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${app.security.internal-key:}")
    private String internalKey;

    @Value("${app.cors.allowed-origins:}")
    private String corsOrigins;

    public ProductionSecurityValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateSecurityConfiguration() {
        List<String> activeProfiles = Arrays.asList(environment.getActiveProfiles());
        boolean isDevOrTest = activeProfiles.contains("dev") || activeProfiles.contains("test") || activeProfiles.isEmpty();

        // 1. Validate JWT_SECRET format & cryptographic strength across all environments
        validateJwtSecretStrength(jwtSecret);

        // 2. Production Secret Enforcement: Only triggered when running under prod profile
        if (activeProfiles.contains("prod") || activeProfiles.contains("production")) {
            logger.info("Initializing in PRODUCTION security profile. Enforcing strict credential validation...");

            if (dbUrl == null || dbUrl.trim().isEmpty() || dbUrl.contains("localhost") || dbUrl.contains("127.0.0.1")) {
                throw new IllegalStateException("CRITICAL SECURITY ERROR: Production DB_URL must point to an external managed database, not localhost.");
            }

            if (dbUsername == null || dbUsername.trim().isEmpty()) {
                throw new IllegalStateException("CRITICAL SECURITY ERROR: DB_USERNAME must be specified in production.");
            }

            if (dbPassword == null || dbPassword.trim().isEmpty() || "Manoj@2004".equals(dbPassword)) {
                throw new IllegalStateException("CRITICAL SECURITY ERROR: Insecure development DB_PASSWORD fallback detected in production. You must set a dedicated DB_PASSWORD environment variable.");
            }

            if (internalKey == null || internalKey.trim().isEmpty() || "gateway-internal-secret-token-key-2026".equals(internalKey)) {
                throw new IllegalStateException("CRITICAL SECURITY ERROR: Insecure development INTERNAL_GATEWAY_KEY fallback detected in production. You must set a dedicated INTERNAL_GATEWAY_KEY environment variable.");
            }

            if (jwtSecret == null || jwtSecret.trim().isEmpty() || "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970".equals(jwtSecret)) {
                throw new IllegalStateException("CRITICAL SECURITY ERROR: Insecure development JWT_SECRET fallback detected in production. You must set a dedicated, unique 256-bit JWT_SECRET environment variable.");
            }

            if (corsOrigins == null || corsOrigins.trim().isEmpty() || corsOrigins.contains("*")) {
                throw new IllegalStateException("CRITICAL SECURITY ERROR: Wildcard or empty CORS_ALLOWED_ORIGINS is strictly prohibited in production.");
            }
            logger.info("Production security configuration validated successfully.");
        } else {
            logger.info("Running under DEVELOPMENT/TEST security profile with active profiles: {}", activeProfiles);
        }
    }

    public static void validateJwtSecretStrength(String secret) {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("JWT_SECRET cannot be empty.");
        }
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secret.trim());
            if (keyBytes.length < 32) {
                throw new IllegalStateException("JWT_SECRET is too weak: key must be at least 256 bits (32 bytes). Decoded byte length: " + keyBytes.length);
            }
        } catch (Exception e) {
            if (e instanceof IllegalStateException) {
                throw (IllegalStateException) e;
            }
            throw new IllegalStateException("JWT_SECRET must be a valid Base64-encoded string: " + e.getMessage(), e);
        }
    }
}
