package com.project.security.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.security.config.SecurityConfig;
import com.project.security.dto.AuditLogRequestDTO;
import com.project.security.dto.AuditLogResponseDTO;
import com.project.security.security.*;
import com.project.security.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuditLogController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class, JwtAuthenticationFilter.class})
class AuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuditLogService auditLogService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    private static final String INTERNAL_KEY = "gateway-internal-secret-token-key-2026";

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllAuditLogs_AdminRole_ReturnsList() throws Exception {
        AuditLogResponseDTO logDTO = new AuditLogResponseDTO(
                1L,
                LocalDateTime.now(),
                "127.0.0.1",
                "/api/users",
                "GET",
                "admin",
                "USERS_VIEWED",
                200,
                "SUCCESS",
                "Fetched all users"
        );

        when(auditLogService.getAllAuditLogs()).thenReturn(List.of(logDTO));

        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[0].action").value("USERS_VIEWED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAuditLogsPaged_AdminRole_ReturnsPage() throws Exception {
        AuditLogResponseDTO logDTO = new AuditLogResponseDTO(
                1L,
                LocalDateTime.now(),
                "127.0.0.1",
                "/api/users",
                "GET",
                "admin",
                "USERS_VIEWED",
                200,
                "SUCCESS",
                "Fetched all users"
        );

        when(auditLogService.getAuditLogsPaged(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(logDTO)));

        mockMvc.perform(get("/api/audit-logs/paged?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].username").value("admin"))
                .andExpect(jsonPath("$.content[0].action").value("USERS_VIEWED"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAllAuditLogs_UserRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    void getAllAuditLogs_Unauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void ingestAuditLog_WithValidInternalKey_ReturnsCreated() throws Exception {
        AuditLogRequestDTO requestDTO = new AuditLogRequestDTO(
                "10.0.0.99",
                "/api/users",
                "GET",
                "anonymous",
                "IP_BLOCKED",
                403,
                "FAILURE",
                "IP blocked by filter"
        );

        AuditLogResponseDTO responseDTO = new AuditLogResponseDTO(
                1L,
                LocalDateTime.now(),
                "10.0.0.99",
                "/api/users",
                "GET",
                "anonymous",
                "IP_BLOCKED",
                403,
                "FAILURE",
                "IP blocked by filter"
        );

        when(auditLogService.createAuditLog(any(AuditLogRequestDTO.class))).thenReturn(responseDTO);

        mockMvc.perform(post("/api/audit-logs/internal")
                        .header("X-Internal-Gateway-Key", INTERNAL_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.action").value("IP_BLOCKED"))
                .andExpect(jsonPath("$.status").value("FAILURE"));
    }

    @Test
    void ingestAuditLog_WithInvalidInternalKey_ReturnsForbidden() throws Exception {
        AuditLogRequestDTO requestDTO = new AuditLogRequestDTO(
                "10.0.0.99",
                "/api/users",
                "GET",
                "anonymous",
                "IP_BLOCKED",
                403,
                "FAILURE",
                "IP blocked by filter"
        );

        mockMvc.perform(post("/api/audit-logs/internal")
                        .header("X-Internal-Gateway-Key", "wrong-secret-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isForbidden());
    }

    @Test
    void ingestAuditLog_WithoutInternalKey_ReturnsForbidden() throws Exception {
        AuditLogRequestDTO requestDTO = new AuditLogRequestDTO(
                "10.0.0.99",
                "/api/users",
                "GET",
                "anonymous",
                "IP_BLOCKED",
                403,
                "FAILURE",
                "IP blocked by filter"
        );

        mockMvc.perform(post("/api/audit-logs/internal")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isForbidden());
    }
}
