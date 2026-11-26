package com.project.security.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.security.config.SecurityConfig;
import com.project.security.controller.OrderController;
import com.project.security.controller.PaymentController;
import com.project.security.dto.OrderRequestDTO;
import com.project.security.dto.PaymentRequestDTO;
import com.project.security.exception.GlobalExceptionHandler;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {OrderController.class, PaymentController.class})
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class SecurityHardeningTest {

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
    void corsPreflight_AllowedOrigin_ReturnsCorsHeaders() throws Exception {
        mockMvc.perform(options("/api/orders")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Authorization,Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void corsPreflight_NewFrontendPort5174_ReturnsCorsHeaders() throws Exception {
        mockMvc.perform(options("/api/orders")
                        .header("Origin", "http://localhost:5174")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Authorization,Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void orderValidation_NegativePriceOrQuantity_ReturnsBadRequest() throws Exception {
        OrderRequestDTO invalidOrder = new OrderRequestDTO("Test Item", -5, new BigDecimal("-10.00"));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidOrder)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.message.quantity").exists())
                .andExpect(jsonPath("$.message.price").exists());
    }

    @Test
    @WithMockUser(roles = "USER")
    void orderValidation_BlankItem_ReturnsBadRequest() throws Exception {
        OrderRequestDTO invalidOrder = new OrderRequestDTO("", 1, new BigDecimal("10.00"));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidOrder)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.message.item").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void paymentValidation_NegativeAmount_ReturnsBadRequest() throws Exception {
        PaymentRequestDTO invalidPayment = new PaymentRequestDTO(1L, new BigDecimal("-50.00"), "CREDIT_CARD");

        mockMvc.perform(post("/api/payments/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidPayment)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.message.amount").exists());
    }

    @Test
    @WithMockUser(roles = "USER")
    void paymentProcessing_UserRole_ReturnsForbidden() throws Exception {
        PaymentRequestDTO payment = new PaymentRequestDTO(1L, new BigDecimal("50.00"), "CREDIT_CARD");

        mockMvc.perform(post("/api/payments/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payment)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }
}
