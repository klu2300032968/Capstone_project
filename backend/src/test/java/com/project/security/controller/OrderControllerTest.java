package com.project.security.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.security.config.SecurityConfig;
import com.project.security.dto.OrderRequestDTO;
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

@WebMvcTest(OrderController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class, JwtAuthenticationFilter.class})
class OrderControllerTest {

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
    @WithMockUser(username = "alice_dev", roles = "USER")
    void createOrder_UserRole_ReturnsCreated() throws Exception {
        OrderRequestDTO request = new OrderRequestDTO("Enterprise API Gateway Pro", 2, new BigDecimal("499.99"));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.item").value("Enterprise API Gateway Pro"))
                .andExpect(jsonPath("$.quantity").value(2))
                .andExpect(jsonPath("$.totalPrice").value(999.98))
                .andExpect(jsonPath("$.username").value("alice_dev"))
                .andExpect(jsonPath("$.status").value("CREATED"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createOrder_AdminRole_ReturnsCreated() throws Exception {
        OrderRequestDTO request = new OrderRequestDTO("Network Intrusion Detector", 1, new BigDecimal("1299.00"));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.item").value("Network Intrusion Detector"))
                .andExpect(jsonPath("$.totalPrice").value(1299.00));
    }

    @Test
    @WithMockUser(username = "alice_dev", roles = "USER")
    void createOrder_InvalidData_ReturnsBadRequest() throws Exception {
        OrderRequestDTO invalidRequest = new OrderRequestDTO("", -1, new BigDecimal("-5.00"));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    void createOrder_Unauthenticated_ReturnsUnauthorized() throws Exception {
        OrderRequestDTO request = new OrderRequestDTO("Enterprise API Gateway Pro", 1, new BigDecimal("499.99"));

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @WithMockUser(username = "alice_dev", roles = "USER")
    void getAllOrders_UserRole_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").isNotEmpty());
    }
}
