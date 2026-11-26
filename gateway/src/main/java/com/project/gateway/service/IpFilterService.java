package com.project.gateway.service;

import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.util.List;

@Service
public class IpFilterService {

    public boolean isAllowed(String clientIp, List<String> whitelist, List<String> blacklist) {
        String normalizedClientIp = normalizeIp(clientIp);
        if (normalizedClientIp == null) {
            return false;
        }

        // 1. Check blacklist: if matched, reject immediately
        if (blacklist != null && !blacklist.isEmpty()) {
            for (String blockedRule : blacklist) {
                if (matchesRule(normalizedClientIp, blockedRule)) {
                    return false;
                }
            }
        }

        // 2. Check whitelist: if whitelist is defined, client IP must match at least one entry
        if (whitelist != null && !whitelist.isEmpty()) {
            boolean matchesWhitelist = false;
            for (String allowedRule : whitelist) {
                if (matchesRule(normalizedClientIp, allowedRule)) {
                    matchesWhitelist = true;
                    break;
                }
            }
            if (!matchesWhitelist) {
                return false;
            }
        }

        return true;
    }

    public boolean matchesRule(String clientIp, String rule) {
        if (clientIp == null || rule == null || rule.trim().isEmpty()) {
            return false;
        }

        String trimmedRule = rule.trim();
        String normalizedClientIp = normalizeIp(clientIp);
        if (normalizedClientIp == null) {
            return false;
        }

        // CIDR notation check (e.g. 192.168.1.0/24)
        if (trimmedRule.contains("/")) {
            return matchesCidr(normalizedClientIp, trimmedRule);
        }

        // Exact IP match
        String normalizedRuleIp = normalizeIp(trimmedRule);
        return normalizedClientIp.equals(normalizedRuleIp);
    }

    public boolean matchesCidr(String clientIp, String cidr) {
        try {
            String[] parts = cidr.split("/");
            if (parts.length != 2) {
                return false;
            }

            String baseIp = normalizeIp(parts[0]);
            int prefixLength = Integer.parseInt(parts[1]);

            if (baseIp == null || prefixLength < 0 || prefixLength > 32) {
                return false;
            }

            long clientIpLong = ipToLong(clientIp);
            long baseIpLong = ipToLong(baseIp);

            if (clientIpLong == -1 || baseIpLong == -1) {
                return false;
            }

            long mask = prefixLength == 0 ? 0 : (0xFFFFFFFFL << (32 - prefixLength)) & 0xFFFFFFFFL;
            return (clientIpLong & mask) == (baseIpLong & mask);
        } catch (Exception e) {
            return false;
        }
    }

    public String normalizeIp(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return null;
        }

        String trimmed = ip.trim();
        // Normalize localhost IPv6 representations
        if ("0:0:0:0:0:0:0:1".equals(trimmed) || "::1".equals(trimmed) || "localhost".equalsIgnoreCase(trimmed)) {
            return "127.0.0.1";
        }

        try {
            InetAddress address = InetAddress.getByName(trimmed);
            return address.getHostAddress();
        } catch (Exception e) {
            return null;
        }
    }

    private long ipToLong(String ip) {
        try {
            String[] octets = ip.split("\\.");
            if (octets.length != 4) {
                return -1;
            }

            long result = 0;
            for (int i = 0; i < 4; i++) {
                int octet = Integer.parseInt(octets[i]);
                if (octet < 0 || octet > 255) {
                    return -1;
                }
                result = (result << 8) | octet;
            }
            return result & 0xFFFFFFFFL;
        } catch (Exception e) {
            return -1;
        }
    }
}
