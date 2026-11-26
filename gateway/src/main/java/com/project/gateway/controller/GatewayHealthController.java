package com.project.gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Native, non-blocking health check controller for ARSA API Gateway.
 * Directly verifies gateway process liveness without requiring downstream services.
 */
@RestController
public class GatewayHealthController {

    private final Instant startTime = Instant.now();

    @GetMapping({"/health", "/api/gateway/health"})
    public Mono<ResponseEntity<Map<String, Object>>> health() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("status", "UP");
        payload.put("service", "arsa-api-gateway");
        payload.put("startedAt", startTime.toString());
        payload.put("timestamp", Instant.now().toString());
        return Mono.just(ResponseEntity.ok(payload));
    }
}
