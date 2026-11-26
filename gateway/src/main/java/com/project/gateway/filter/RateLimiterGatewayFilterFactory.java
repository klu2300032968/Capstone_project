package com.project.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.gateway.service.AuditLogClient;
import com.project.gateway.service.RateLimitResult;
import com.project.gateway.service.TokenBucketRateLimiter;
import com.project.gateway.util.ClientIpResolver;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class RateLimiterGatewayFilterFactory extends AbstractGatewayFilterFactory<RateLimiterGatewayFilterFactory.Config> {

    private final TokenBucketRateLimiter rateLimiter;
    private final ClientIpResolver clientIpResolver;
    private final AuditLogClient auditLogClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RateLimiterGatewayFilterFactory(TokenBucketRateLimiter rateLimiter,
                                          ClientIpResolver clientIpResolver,
                                          AuditLogClient auditLogClient) {
        super(Config.class);
        this.rateLimiter = rateLimiter;
        this.clientIpResolver = clientIpResolver;
        this.auditLogClient = auditLogClient;
    }

    @Override
    public List<String> shortcutFieldOrder() {
        return Arrays.asList("capacity", "refillTokens", "refillDurationSeconds");
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
                return chain.filter(exchange);
            }

            String clientIp = clientIpResolver.resolveClientIp(exchange.getRequest());
            String routeId = getRouteId(exchange);
            String key = routeId + ":" + clientIp;

            int capacity = config.getCapacity() > 0 ? config.getCapacity() : 10;
            int refillTokens = config.getRefillTokens() > 0 ? config.getRefillTokens() : capacity;
            int refillDuration = config.getRefillDurationSeconds() > 0 ? config.getRefillDurationSeconds() : 60;

            RateLimitResult result = rateLimiter.tryConsume(key, capacity, refillTokens, refillDuration);

            if (result.isAllowed()) {
                exchange.getResponse().getHeaders().set("X-RateLimit-Limit", String.valueOf(capacity));
                exchange.getResponse().getHeaders().set("X-RateLimit-Remaining", String.valueOf(result.getRemainingTokens()));
                return chain.filter(exchange);
            } else {
                String path = exchange.getRequest().getURI().getPath();
                String method = exchange.getRequest().getMethod().name();
                auditLogClient.logSecurityEventAsync(
                        clientIp,
                        path,
                        method,
                        "anonymous",
                        "RATE_LIMIT_EXCEEDED",
                        HttpStatus.TOO_MANY_REQUESTS.value(),
                        "FAILURE",
                        "Rate limit exceeded on route " + routeId + " (capacity " + capacity + ")"
                );
                return renderRateLimitExceededResponse(exchange, capacity, result.getRetryAfterSeconds());
            }
        };
    }

    private String getRouteId(ServerWebExchange exchange) {
        org.springframework.cloud.gateway.route.Route route =
                exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        return route != null ? route.getId() : exchange.getRequest().getURI().getPath();
    }

    private Mono<Void> renderRateLimitExceededResponse(ServerWebExchange exchange, int capacity, long retryAfterSeconds) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().set("X-RateLimit-Limit", String.valueOf(capacity));
        response.getHeaders().set("X-RateLimit-Remaining", "0");
        response.getHeaders().set("Retry-After", String.valueOf(retryAfterSeconds));

        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("timestamp", LocalDateTime.now().toString());
        errorBody.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        errorBody.put("error", "Too Many Requests");
        errorBody.put("message", "Rate limit exceeded. Please try again later.");
        errorBody.put("path", exchange.getRequest().getURI().getPath());

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(errorBody);
        } catch (Exception e) {
            bytes = "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again later.\"}".getBytes();
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    public static class Config {
        private int capacity = 10;
        private int refillTokens = 10;
        private int refillDurationSeconds = 60;

        public Config() {
        }

        public Config(int capacity, int refillTokens, int refillDurationSeconds) {
            this.capacity = capacity;
            this.refillTokens = refillTokens;
            this.refillDurationSeconds = refillDurationSeconds;
        }

        public int getCapacity() {
            return capacity;
        }

        public void setCapacity(int capacity) {
            this.capacity = capacity;
        }

        public int getRefillTokens() {
            return refillTokens;
        }

        public void setRefillTokens(int refillTokens) {
            this.refillTokens = refillTokens;
        }

        public int getRefillDurationSeconds() {
            return refillDurationSeconds;
        }

        public void setRefillDurationSeconds(int refillDurationSeconds) {
            this.refillDurationSeconds = refillDurationSeconds;
        }
    }
}
