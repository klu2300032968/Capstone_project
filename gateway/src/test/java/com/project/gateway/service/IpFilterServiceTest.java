package com.project.gateway.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class IpFilterServiceTest {

    private IpFilterService ipFilterService;

    @BeforeEach
    void setUp() {
        ipFilterService = new IpFilterService();
    }

    @Test
    void isAllowed_EmptyConfig_ReturnsTrue() {
        assertTrue(ipFilterService.isAllowed("192.168.1.100", Collections.emptyList(), Collections.emptyList()));
        assertTrue(ipFilterService.isAllowed("10.0.0.1", null, null));
    }

    @Test
    void isAllowed_BlacklistedIp_ReturnsFalse() {
        List<String> blacklist = List.of("192.168.1.50", "10.0.0.99");
        assertFalse(ipFilterService.isAllowed("192.168.1.50", null, blacklist));
        assertTrue(ipFilterService.isAllowed("192.168.1.51", null, blacklist));
    }

    @Test
    void isAllowed_WhitelistedIp_ReturnsTrue() {
        List<String> whitelist = List.of("192.168.1.100", "127.0.0.1");
        assertTrue(ipFilterService.isAllowed("192.168.1.100", whitelist, null));
        assertTrue(ipFilterService.isAllowed("127.0.0.1", whitelist, null));
    }

    @Test
    void isAllowed_NotInWhitelist_ReturnsFalse() {
        List<String> whitelist = List.of("192.168.1.100");
        assertFalse(ipFilterService.isAllowed("192.168.1.101", whitelist, null));
    }

    @Test
    void isAllowed_CidrMatching_Success() {
        List<String> cidrWhitelist = List.of("192.168.1.0/24");
        assertTrue(ipFilterService.isAllowed("192.168.1.1", cidrWhitelist, null));
        assertTrue(ipFilterService.isAllowed("192.168.1.254", cidrWhitelist, null));
        assertFalse(ipFilterService.isAllowed("192.168.2.1", cidrWhitelist, null));
    }

    @Test
    void isAllowed_CidrBlacklist_Success() {
        List<String> cidrBlacklist = List.of("10.0.0.0/8");
        assertFalse(ipFilterService.isAllowed("10.1.2.3", null, cidrBlacklist));
        assertTrue(ipFilterService.isAllowed("11.0.0.1", null, cidrBlacklist));
    }

    @Test
    void isAllowed_InvalidClientIp_ReturnsFalse() {
        assertFalse(ipFilterService.isAllowed("not-an-ip", null, null));
        assertFalse(ipFilterService.isAllowed(null, null, null));
        assertFalse(ipFilterService.isAllowed("", null, null));
    }

    @Test
    void normalizeIp_LocalhostIpv6_ReturnsIpv4Localhost() {
        assertEquals("127.0.0.1", ipFilterService.normalizeIp("::1"));
        assertEquals("127.0.0.1", ipFilterService.normalizeIp("0:0:0:0:0:0:0:1"));
        assertEquals("127.0.0.1", ipFilterService.normalizeIp("localhost"));
    }
}
