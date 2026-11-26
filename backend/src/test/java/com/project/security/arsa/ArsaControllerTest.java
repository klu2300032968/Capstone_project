package com.project.security.arsa;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.security.config.SecurityConfig;
import com.project.security.security.*;
import com.project.security.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ArsaController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class, JwtAuthenticationFilter.class})
class ArsaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ArsaAnalysisService arsaAnalysisService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private AuditLogService auditLogService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllRoutes_AdminRole_ReturnsOk() throws Exception {
        RouteSecurityAnalysis analysis = new RouteSecurityAnalysis(
                "/api/payments/process", "POST", "Payment execution",
                true, true, true, true, true, true
        );

        when(arsaAnalysisService.analyzeAllRoutes()).thenReturn(List.of(analysis));

        mockMvc.perform(get("/api/arsa/routes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].routePath").value("/api/payments/process"))
                .andExpect(jsonPath("$[0].complianceScore").value(100.0));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAllRoutes_UserRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/arsa/routes"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    void getAllRoutes_Unauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/arsa/routes"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getSecuritySummary_AdminRole_ReturnsSummary() throws Exception {
        ArsaSummaryResponse summary = new ArsaSummaryResponse();
        summary.setTotalRoutes(11);
        summary.setAverageComplianceScore(72.5);

        when(arsaAnalysisService.getSecuritySummary()).thenReturn(summary);

        mockMvc.perform(get("/api/arsa/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRoutes").value(11))
                .andExpect(jsonPath("$.averageComplianceScore").value(72.5));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void evaluateCustomRoute_AdminRole_ReturnsAnalysis() throws Exception {
        CustomRouteEvaluationRequest request = new CustomRouteEvaluationRequest(
                "/api/test", "POST", "Test Route",
                true, true, true, true, false, false
        );

        RouteSecurityAnalysis analysis = new RouteSecurityAnalysis(
                "/api/test", "POST", "Test Route",
                true, true, true, true, false, false
        );

        when(arsaAnalysisService.evaluateCustomRoute(any(CustomRouteEvaluationRequest.class))).thenReturn(analysis);

        mockMvc.perform(post("/api/arsa/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complianceScore").value(66.67))
                .andExpect(jsonPath("$.riskRating").value("HIGH"));
    }
}
