package com.project.security.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.security.config.SecurityConfig;
import com.project.security.dto.PaymentRequestDTO;
import com.project.security.security.CustomAccessDeniedHandler;
import com.project.security.security.CustomUserDetailsService;
import com.project.security.security.JwtAuthenticationEntryPoint;
import com.project.security.security.JwtAuthenticationFilter;
import com.project.security.security.JwtUtils;
import com.project.security.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class, JwtAuthenticationFilter.class})
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private AuditLogService auditLogService;

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void processPayment_AdminRole_ReturnsOk() throws Exception {
        PaymentRequestDTO request = new PaymentRequestDTO(101L, new BigDecimal("499.99"), "CREDIT_CARD");

        mockMvc.perform(post("/api/payments/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(101))
                .andExpect(jsonPath("$.amount").value(499.99))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.transactionId").isNotEmpty());
    }

    @Test
    @WithMockUser(username = "alice_dev", roles = "USER")
    void processPayment_UserRole_ReturnsForbidden() throws Exception {
        PaymentRequestDTO request = new PaymentRequestDTO(101L, new BigDecimal("499.99"), "CREDIT_CARD");

        mockMvc.perform(post("/api/payments/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void processPayment_InvalidData_ReturnsBadRequest() throws Exception {
        PaymentRequestDTO invalidRequest = new PaymentRequestDTO(null, new BigDecimal("-10.00"), "");

        mockMvc.perform(post("/api/payments/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    void processPayment_Unauthenticated_ReturnsUnauthorized() throws Exception {
        PaymentRequestDTO request = new PaymentRequestDTO(101L, new BigDecimal("499.99"), "CREDIT_CARD");

        mockMvc.perform(post("/api/payments/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void getAllPayments_AdminRole_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/payments"))
                .andExpect(status().isOk());
    }
}
