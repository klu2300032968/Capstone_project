package com.project.gateway.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;

import java.net.InetSocketAddress;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClientIpResolverTest {

    private ClientIpResolver defaultResolver;
    private ClientIpResolver trustedProxyResolver;

    @BeforeEach
    void setUp() {
        // Default resolver: direct connection, no trusted proxies
        defaultResolver = new ClientIpResolver("");
        // Trusted proxy resolver: explicitly trusts 10.0.0.1 and 127.0.0.1
        trustedProxyResolver = new ClientIpResolver(Set.of("10.0.0.1", "127.0.0.1"));
    }

    @Test
    void resolveClientIp_UntrustedPeerWithSpoofedXForwardedFor_IgnoresHeaderReturnsRemoteAddress() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .remoteAddress(new InetSocketAddress("192.168.1.50", 45678))
                .header("X-Forwarded-For", "203.0.113.195, 70.41.3.18")
                .build();

        String ip = defaultResolver.resolveClientIp(request);
        // Spoofed header must be ignored; verified remote socket peer must be returned
        assertEquals("192.168.1.50", ip);
    }

    @Test
    void resolveClientIp_UntrustedPeerWithSpoofedXRealIp_IgnoresHeaderReturnsRemoteAddress() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .remoteAddress(new InetSocketAddress("192.168.1.50", 45678))
                .header("X-Real-IP", "198.51.100.1")
                .build();

        String ip = defaultResolver.resolveClientIp(request);
        assertEquals("192.168.1.50", ip);
    }

    @Test
    void resolveClientIp_TrustedProxyPeerWithXForwardedFor_ReturnsFirstClientIp() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .remoteAddress(new InetSocketAddress("10.0.0.1", 45678))
                .header("X-Forwarded-For", "203.0.113.195, 70.41.3.18")
                .build();

        String ip = trustedProxyResolver.resolveClientIp(request);
        assertEquals("203.0.113.195", ip);
    }

    @Test
    void resolveClientIp_TrustedProxyPeerWithXRealIp_ReturnsRealIp() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .remoteAddress(new InetSocketAddress("10.0.0.1", 45678))
                .header("X-Real-IP", "198.51.100.1")
                .build();

        String ip = trustedProxyResolver.resolveClientIp(request);
        assertEquals("198.51.100.1", ip);
    }

    @Test
    void resolveClientIp_FromRemoteAddress_ReturnsHostAddress() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test")
                .remoteAddress(new InetSocketAddress("10.0.0.5", 8080))
                .build();

        String ip = defaultResolver.resolveClientIp(request);
        assertEquals("10.0.0.5", ip);
    }

    @Test
    void resolveClientIp_Fallback_ReturnsLocalhost() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/test").build();

        String ip = defaultResolver.resolveClientIp(request);
        assertEquals("127.0.0.1", ip);
    }
}
