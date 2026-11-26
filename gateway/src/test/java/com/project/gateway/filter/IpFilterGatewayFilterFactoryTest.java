package com.project.gateway.filter;

import com.project.gateway.service.AuditLogClient;
import com.project.gateway.service.IpFilterService;
import com.project.gateway.util.ClientIpResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class IpFilterGatewayFilterFactoryTest {

    private IpFilterService ipFilterService;
    private ClientIpResolver clientIpResolver;
    private AuditLogClient auditLogClient;
    private IpFilterGatewayFilterFactory factory;

    @BeforeEach
    void setUp() {
        ipFilterService = new IpFilterService();
        clientIpResolver = new ClientIpResolver();
        auditLogClient = mock(AuditLogClient.class);
        factory = new IpFilterGatewayFilterFactory(ipFilterService, clientIpResolver, auditLogClient);
    }

    @Test
    void filter_AllowedIp_ContinuesChain() {
        IpFilterGatewayFilterFactory.Config config = new IpFilterGatewayFilterFactory.Config(
                true,
                List.of("192.168.1.0/24"),
                null
        );

        GatewayFilter filter = factory.apply(config);

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users")
                .remoteAddress(new InetSocketAddress("192.168.1.50", 8080))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        filter.filter(exchange, chain).block();

        verify(chain, times(1)).filter(exchange);
        verify(auditLogClient, never()).logSecurityEventAsync(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void filter_BlockedBlacklistedIp_Returns403Forbidden() {
        IpFilterGatewayFilterFactory.Config config = new IpFilterGatewayFilterFactory.Config(
                true,
                null,
                List.of("10.0.0.99")
        );

        GatewayFilter filter = factory.apply(config);

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users")
                .remoteAddress(new InetSocketAddress("10.0.0.99", 8080))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = mock(GatewayFilterChain.class);

        filter.filter(exchange, chain).block();

        verify(chain, never()).filter(exchange);
        assertEquals(HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode());
        verify(auditLogClient, times(1)).logSecurityEventAsync(
                eq("10.0.0.99"), eq("/api/users"), eq("GET"), any(), eq("IP_BLOCKED"), eq(403), eq("FAILURE"), any()
        );
    }

    @Test
    void filter_Disabled_AllowsBlockedIp() {
        IpFilterGatewayFilterFactory.Config config = new IpFilterGatewayFilterFactory.Config(
                false,
                null,
                List.of("10.0.0.99")
        );

        GatewayFilter filter = factory.apply(config);

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users")
                .remoteAddress(new InetSocketAddress("10.0.0.99", 8080))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        filter.filter(exchange, chain).block();

        verify(chain, times(1)).filter(exchange);
    }
}
