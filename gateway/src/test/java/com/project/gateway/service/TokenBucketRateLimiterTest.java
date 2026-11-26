package com.project.gateway.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TokenBucketRateLimiterTest {

    private TokenBucketRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new TokenBucketRateLimiter();
    }

    @Test
    void tryConsume_WithinLimit_Allowed() {
        String key = "test-route:192.168.1.1";
        int capacity = 3;

        RateLimitResult res1 = rateLimiter.tryConsume(key, capacity, capacity, 60);
        assertTrue(res1.isAllowed());
        assertEquals(2, res1.getRemainingTokens());

        RateLimitResult res2 = rateLimiter.tryConsume(key, capacity, capacity, 60);
        assertTrue(res2.isAllowed());
        assertEquals(1, res2.getRemainingTokens());

        RateLimitResult res3 = rateLimiter.tryConsume(key, capacity, capacity, 60);
        assertTrue(res3.isAllowed());
        assertEquals(0, res3.getRemainingTokens());
    }

    @Test
    void tryConsume_ExceedingLimit_Denied() {
        String key = "test-route:192.168.1.2";
        int capacity = 2;

        rateLimiter.tryConsume(key, capacity, capacity, 60);
        rateLimiter.tryConsume(key, capacity, capacity, 60);

        // 3rd attempt should exceed capacity
        RateLimitResult res3 = rateLimiter.tryConsume(key, capacity, capacity, 60);
        assertFalse(res3.isAllowed());
        assertEquals(0, res3.getRemainingTokens());
        assertTrue(res3.getRetryAfterSeconds() > 0);
    }

    @Test
    void tryConsume_DifferentKeys_IndependentBuckets() {
        String key1 = "route1:192.168.1.1";
        String key2 = "route2:192.168.1.1";
        int capacity = 1;

        RateLimitResult res1 = rateLimiter.tryConsume(key1, capacity, capacity, 60);
        assertTrue(res1.isAllowed());

        // Key1 exhausted
        RateLimitResult res1Exhausted = rateLimiter.tryConsume(key1, capacity, capacity, 60);
        assertFalse(res1Exhausted.isAllowed());

        // Key2 still has tokens
        RateLimitResult res2 = rateLimiter.tryConsume(key2, capacity, capacity, 60);
        assertTrue(res2.isAllowed());
    }
}
