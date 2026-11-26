package com.project.security.controller;

import com.project.security.config.SecurityConfig;
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
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class, JwtAuthenticationFilter.class})
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private AuditLogService auditLogService;

    @Test
    void getAllProducts_PublicAccess_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/public/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].name").value("Enterprise API Gateway Pro"));
    }

    @Test
    void getProductById_ValidId_ReturnsProduct() throws Exception {
        mockMvc.perform(get("/api/public/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Enterprise API Gateway Pro"));
    }

    @Test
    void getProductById_InvalidId_ReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/public/products/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }
}
