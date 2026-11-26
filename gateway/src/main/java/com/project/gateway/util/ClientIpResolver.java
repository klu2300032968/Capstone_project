package com.project.gateway.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.net.InetSocketAddress;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Component
public class ClientIpResolver {

    private static final Logger logger = LoggerFactory.getLogger(ClientIpResolver.class);

    private final Set<String> trustedProxies;

    public ClientIpResolver() {
        this("");
    }

    public ClientIpResolver(@Value("${app.gateway.trusted-proxies:}") String trustedProxiesConfig) {
        this.trustedProxies = new HashSet<>();
        if (trustedProxiesConfig != null && !trustedProxiesConfig.trim().isEmpty()) {
            Arrays.stream(trustedProxiesConfig.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(this.trustedProxies::add);
        }
    }

    public ClientIpResolver(Set<String> trustedProxies) {
        this.trustedProxies = trustedProxies != null ? trustedProxies : new HashSet<>();
    }

    public String resolveClientIp(ServerHttpRequest request) {
        InetSocketAddress remoteAddress = request.getRemoteAddress();
        String directIp = (remoteAddress != null && remoteAddress.getAddress() != null)
                ? remoteAddress.getAddress().getHostAddress()
                : "127.0.0.1";

        // Normalize IPv6 loopback
        String normalizedDirectIp = "0:0:0:0:0:0:0:1".equals(directIp) ? "127.0.0.1" : directIp;

        // If direct IP is not in the explicitly configured trusted proxy list, do NOT trust forwarding headers
        if (trustedProxies.isEmpty() || (!trustedProxies.contains(directIp) && !trustedProxies.contains(normalizedDirectIp))) {
            return normalizedDirectIp;
        }

        // Direct connection peer is verified as a trusted proxy; inspect forwarding headers
        String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            String clientIp = xForwardedFor.split(",")[0].trim();
            if (!clientIp.isEmpty()) {
                return clientIp;
            }
        }

        String xRealIp = request.getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.trim().isEmpty()) {
            return xRealIp.trim();
        }

        return normalizedDirectIp;
    }

    public boolean isTrustedProxy(String ip) {
        return trustedProxies.contains(ip) || ("0:0:0:0:0:0:0:1".equals(ip) && trustedProxies.contains("127.0.0.1"));
    }
}
