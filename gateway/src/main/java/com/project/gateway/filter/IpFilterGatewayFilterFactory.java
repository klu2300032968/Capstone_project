package com.project.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gateway.service.AuditLogClient;
import com.project.gateway.service.IpFilterService;
import com.project.gateway.util.ClientIpResolver;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class IpFilterGatewayFilterFactory extends AbstractGatewayFilterFactory<IpFilterGatewayFilterFactory.Config> {

    private final IpFilterService ipFilterService;
    private final ClientIpResolver clientIpResolver;
    private final AuditLogClient auditLogClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public IpFilterGatewayFilterFactory(IpFilterService ipFilterService,
                                        ClientIpResolver clientIpResolver,
                                        AuditLogClient auditLogClient) {
        super(Config.class);
        this.ipFilterService = ipFilterService;
        this.clientIpResolver = clientIpResolver;
        this.auditLogClient = auditLogClient;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            if (!config.isEnabled() || HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
                return chain.filter(exchange);
            }

            String clientIp = clientIpResolver.resolveClientIp(exchange.getRequest());
            boolean allowed = ipFilterService.isAllowed(clientIp, config.getWhitelist(), config.getBlacklist());

            if (allowed) {
                return chain.filter(exchange);
            } else {
                String path = exchange.getRequest().getURI().getPath();
                String method = exchange.getRequest().getMethod().name();
                auditLogClient.logSecurityEventAsync(
                        clientIp,
                        path,
                        method,
                        "anonymous",
                        "IP_BLOCKED",
                        HttpStatus.FORBIDDEN.value(),
                        "FAILURE",
                        "Client IP " + clientIp + " was blocked by IP filter policy"
                );
                return renderIpBlockedResponse(exchange, clientIp);
            }
        };
    }

    private Mono<Void> renderIpBlockedResponse(ServerWebExchange exchange, String clientIp) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.FORBIDDEN);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("timestamp", LocalDateTime.now().toString());
        errorBody.put("status", HttpStatus.FORBIDDEN.value());
        errorBody.put("error", "Forbidden");
        errorBody.put("message", "Access denied: Client IP is not allowed");
        errorBody.put("path", exchange.getRequest().getURI().getPath());

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(errorBody);
        } catch (Exception e) {
            bytes = "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Access denied: Client IP is not allowed\"}".getBytes();
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    public static class Config {
        private boolean enabled = true;
        private List<String> whitelist = new ArrayList<>();
        private List<String> blacklist = new ArrayList<>();

        public Config() {
        }

        public Config(boolean enabled, List<String> whitelist, List<String> blacklist) {
            this.enabled = enabled;
            this.whitelist = whitelist != null ? whitelist : new ArrayList<>();
            this.blacklist = blacklist != null ? blacklist : new ArrayList<>();
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public List<String> getWhitelist() {
            return whitelist;
        }

        public void setWhitelist(List<String> whitelist) {
            this.whitelist = whitelist != null ? whitelist : new ArrayList<>();
        }

        public List<String> getBlacklist() {
            return blacklist;
        }

        public void setBlacklist(List<String> blacklist) {
            this.blacklist = blacklist != null ? blacklist : new ArrayList<>();
        }
    }
}
