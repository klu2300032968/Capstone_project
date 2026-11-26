package com.project.gateway.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuditLogClient {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogClient.class);

    private final WebClient webClient;

    @Value("${app.security.internal-key:gateway-internal-secret-token-key-2026}")
    private String internalGatewayKey;

    public AuditLogClient(@Value("${BACKEND_SERVICE_URL:http://localhost:8080}") String backendUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(backendUrl)
                .build();
    }

    public void logSecurityEventAsync(String clientIp, String path, String httpMethod,
                                      String username, String action, Integer httpStatus,
                                      String status, String details) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("clientIp", clientIp);
        payload.put("path", path);
        payload.put("httpMethod", httpMethod);
        payload.put("username", username != null ? username : "anonymous");
        payload.put("action", action);
        payload.put("httpStatus", httpStatus);
        payload.put("status", status);
        payload.put("details", details);

        webClient.post()
                .uri("/api/audit-logs/internal")
                .header("X-Internal-Gateway-Key", internalGatewayKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Void.class)
                .doOnError(e -> logger.debug("Could not record gateway audit log: {}", e.getMessage()))
                .subscribe();
    }
}
