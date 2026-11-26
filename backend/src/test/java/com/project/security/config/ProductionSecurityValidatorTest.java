package com.project.security.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

public class ProductionSecurityValidatorTest {

    private final String valid256BitBase64Secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @Test
    public void testDevProfileAllowsDevelopmentDefaults() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        ProductionSecurityValidator validator = new ProductionSecurityValidator(env);
        setField(validator, "jwtSecret", valid256BitBase64Secret);
        setField(validator, "dbUrl", "jdbc:mysql://localhost:3306/api_security_db");
        setField(validator, "dbUsername", "root");
        setField(validator, "dbPassword", "Manoj@2004");
        setField(validator, "internalKey", "gateway-internal-secret-token-key-2026");
        setField(validator, "corsOrigins", "http://localhost:5174");

        assertDoesNotThrow(validator::validateSecurityConfiguration);
    }

    @Test
    public void testProdProfileRejectsInsecureFallbackPassword() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        ProductionSecurityValidator validator = new ProductionSecurityValidator(env);
        setField(validator, "jwtSecret", "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=");
        setField(validator, "dbUrl", "jdbc:mysql://prod-db.example.com:3306/api_security_db");
        setField(validator, "dbUsername", "admin_prod");
        setField(validator, "dbPassword", "Manoj@2004"); // Insecure default
        setField(validator, "internalKey", "custom-prod-internal-key-998877");
        setField(validator, "corsOrigins", "https://arsa-portal.onrender.com");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateSecurityConfiguration);
        assertTrue(ex.getMessage().contains("Insecure development DB_PASSWORD fallback"));
    }

    @Test
    public void testProdProfileRejectsLocalhostDatabase() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        ProductionSecurityValidator validator = new ProductionSecurityValidator(env);
        setField(validator, "jwtSecret", "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=");
        setField(validator, "dbUrl", "jdbc:mysql://localhost:3306/api_security_db"); // Localhost rejected
        setField(validator, "dbUsername", "admin_prod");
        setField(validator, "dbPassword", "StrongSecurePassword@9988!");
        setField(validator, "internalKey", "custom-prod-internal-key-998877");
        setField(validator, "corsOrigins", "https://arsa-portal.onrender.com");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateSecurityConfiguration);
        assertTrue(ex.getMessage().contains("Production DB_URL must point to an external managed database"));
    }

    @Test
    public void testProdProfileAcceptsFullyHardenedCredentials() throws Exception {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        ProductionSecurityValidator validator = new ProductionSecurityValidator(env);
        setField(validator, "jwtSecret", "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=");
        setField(validator, "dbUrl", "jdbc:mysql://prod-mysql.render.internal:3306/api_security_db");
        setField(validator, "dbUsername", "prod_admin");
        setField(validator, "dbPassword", "SuperSecretProdPassword@2026!");
        setField(validator, "internalKey", "custom-prod-internal-key-9988776655");
        setField(validator, "corsOrigins", "https://arsa-portal.onrender.com");

        assertDoesNotThrow(validator::validateSecurityConfiguration);
    }

    @Test
    public void testJwtSecretValidationRejectsWeakKey() {
        // Less than 32 bytes (256 bits)
        String weakBase64 = "dGVzdA=="; // "test" (4 bytes)
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                ProductionSecurityValidator.validateJwtSecretStrength(weakBase64)
        );
        assertTrue(ex.getMessage().contains("JWT_SECRET is too weak"));
    }

    @Test
    public void testJwtSecretValidationRejectsInvalidBase64() {
        String invalidBase64 = "Not-Base-64-Key!!!";
        assertThrows(IllegalStateException.class, () ->
                ProductionSecurityValidator.validateJwtSecretStrength(invalidBase64)
        );
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
