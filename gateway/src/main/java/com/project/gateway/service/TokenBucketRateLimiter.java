package com.project.gateway.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class TokenBucketRateLimiter {

    private static class Bucket {
        private double availableTokens;
        private long lastRefillTimestamp;

        public Bucket(double capacity) {
            this.availableTokens = capacity;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }
    }

    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitResult tryConsume(String key, int capacity, int refillTokens, int refillDurationSeconds) {
        long now = System.currentTimeMillis();

        Bucket bucket = buckets.computeIfAbsent(key, k -> new Bucket(capacity));

        synchronized (bucket) {
            // Calculate refill
            long timePassedMillis = now - bucket.lastRefillTimestamp;
            if (timePassedMillis > 0) {
                double tokensToAdd = (timePassedMillis / 1000.0) * (refillTokens / (double) refillDurationSeconds);
                bucket.availableTokens = Math.min(capacity, bucket.availableTokens + tokensToAdd);
                bucket.lastRefillTimestamp = now;
            }

            if (bucket.availableTokens >= 1.0) {
                bucket.availableTokens -= 1.0;
                long remaining = (long) Math.floor(bucket.availableTokens);
                return new RateLimitResult(true, remaining, 0);
            } else {
                double tokensNeeded = 1.0 - bucket.availableTokens;
                double refillRatePerSecond = refillTokens / (double) refillDurationSeconds;
                long retryAfterSeconds = Math.max(1, (long) Math.ceil(tokensNeeded / refillRatePerSecond));
                return new RateLimitResult(false, 0, retryAfterSeconds);
            }
        }
    }

    public void reset() {
        buckets.clear();
    }
}
