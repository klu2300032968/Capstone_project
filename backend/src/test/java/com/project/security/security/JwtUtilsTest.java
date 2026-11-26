package com.project.security.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        // 256-bit base64 encoded test secret
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L); // 1 hour
    }

    @Test
    void generateToken_And_ExtractClaims_Success() {
        String token = jwtUtils.generateToken("admin", "ROLE_ADMIN");

        assertNotNull(token);
        assertTrue(jwtUtils.validateToken(token));
        assertEquals("admin", jwtUtils.extractUsername(token));
        assertEquals("ROLE_ADMIN", jwtUtils.extractRole(token));
    }

    @Test
    void validateToken_InvalidToken_ReturnsFalse() {
        assertFalse(jwtUtils.validateToken("invalid.jwt.token"));
    }

    @Test
    void validateToken_ExpiredToken_ReturnsFalse() {
        // Set 1 millisecond expiration to test expiry
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 1L);
        String token = jwtUtils.generateToken("user", "ROLE_USER");

        try {
            Thread.sleep(10);
        } catch (InterruptedException ignored) {
        }

        assertFalse(jwtUtils.validateToken(token));
    }
}
