package com.project.gateway.filter;

import com.project.gateway.service.AuditLogClient;
import com.project.gateway.service.TokenBucketRateLimiter;
import com.project.gateway.util.ClientIpResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RateLimiterGatewayFilterFactoryTest {

    private TokenBucketRateLimiter rateLimiter;
    private ClientIpResolver clientIpResolver;
    private AuditLogClient auditLogClient;
    private RateLimiterGatewayFilterFactory factory;

    @BeforeEach
    void setUp() {
        rateLimiter = new TokenBucketRateLimiter();
        clientIpResolver = new ClientIpResolver();
        auditLogClient = mock(AuditLogClient.class);
        factory = new RateLimiterGatewayFilterFactory(rateLimiter, clientIpResolver, auditLogClient);
    }

    @Test
    void filter_Allowed_ProceedsAndSetsHeaders() {
        RateLimiterGatewayFilterFactory.Config config = new RateLimiterGatewayFilterFactory.Config(5, 5, 60);
        GatewayFilter filter = factory.apply(config);

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/health").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        filter.filter(exchange, chain).block();

        verify(chain, times(1)).filter(exchange);
        assertEquals("5", exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit"));
        assertEquals("4", exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"));
        verify(auditLogClient, never()).logSecurityEventAsync(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void filter_Exceeded_Returns429TooManyRequests() {
        RateLimiterGatewayFilterFactory.Config config = new RateLimiterGatewayFilterFactory.Config(1, 1, 60);
        GatewayFilter filter = factory.apply(config);

        MockServerHttpRequest request1 = MockServerHttpRequest.get("/api/health").build();
        MockServerWebExchange exchange1 = MockServerWebExchange.from(request1);

        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        // 1st request succeeds
        filter.filter(exchange1, chain).block();
        verify(chain, times(1)).filter(exchange1);

        // 2nd request exceeded
        MockServerHttpRequest request2 = MockServerHttpRequest.get("/api/health").build();
        MockServerWebExchange exchange2 = MockServerWebExchange.from(request2);

        filter.filter(exchange2, chain).block();
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exchange2.getResponse().getStatusCode());
        assertEquals("0", exchange2.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"));
        verify(auditLogClient, times(1)).logSecurityEventAsync(
                any(), eq("/api/health"), eq("GET"), any(), eq("RATE_LIMIT_EXCEEDED"), eq(429), eq("FAILURE"), any()
        );
    }
}
