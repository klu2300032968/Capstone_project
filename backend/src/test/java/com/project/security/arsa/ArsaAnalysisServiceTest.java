package com.project.security.arsa;

import com.project.security.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ArsaAnalysisServiceTest {

    private ArsaAnalysisService arsaAnalysisService;

    @BeforeEach
    void setUp() {
        arsaAnalysisService = new ArsaAnalysisService();
    }

    @Test
    void analyzeAllRoutes_ReturnsAllConfiguredRoutes() {
        List<RouteSecurityAnalysis> routes = arsaAnalysisService.analyzeAllRoutes();

        assertNotNull(routes);
        assertEquals(11, routes.size());
        assertTrue(routes.stream().anyMatch(r -> r.getRoutePath().equals("/api/payments/process")));
        assertTrue(routes.stream().anyMatch(r -> r.getRoutePath().equals("/api/orders")));
        assertTrue(routes.stream().anyMatch(r -> r.getRoutePath().equals("/api/public/products")));
    }

    @Test
    void evaluateCustomRoute_AllControlsEnabled_Returns100PercentAndLowRisk() {
        CustomRouteEvaluationRequest request = new CustomRouteEvaluationRequest(
                "/api/secure-vault", "POST", "Ultra secure route",
                true, true, true, true, true, true
        );

        RouteSecurityAnalysis result = arsaAnalysisService.evaluateCustomRoute(request);

        assertEquals(100.0, result.getComplianceScore());
        assertEquals(RiskRating.LOW, result.getRiskRating());
        assertEquals(6, result.getActiveControlsCount());
        assertEquals(0, result.getMissingControls().size());
        assertEquals(0, result.getRecommendations().size());
    }

    @Test
    void evaluateCustomRoute_PartiallyProtected_ReturnsAccurateScoreAndRisk() {
        // 4 of 6 controls enabled = 66.67% -> HIGH risk
        CustomRouteEvaluationRequest request = new CustomRouteEvaluationRequest(
                "/api/partial-route", "GET", "Partially secured route",
                true, false, false, true, true, true
        );

        RouteSecurityAnalysis result = arsaAnalysisService.evaluateCustomRoute(request);

        assertEquals(66.67, result.getComplianceScore());
        assertEquals(RiskRating.HIGH, result.getRiskRating());
        assertEquals(4, result.getActiveControlsCount());
        assertEquals(2, result.getMissingControls().size());
        assertEquals(2, result.getRecommendations().size());
    }

    @Test
    void evaluateCustomRoute_Unprotected_ReturnsZeroPercentAndCriticalRisk() {
        // 0 of 6 controls enabled = 0.0% -> CRITICAL risk
        CustomRouteEvaluationRequest request = new CustomRouteEvaluationRequest(
                "/api/open-backdoor", "GET", "Completely open route",
                false, false, false, false, false, false
        );

        RouteSecurityAnalysis result = arsaAnalysisService.evaluateCustomRoute(request);

        assertEquals(0.0, result.getComplianceScore());
        assertEquals(RiskRating.CRITICAL, result.getRiskRating());
        assertEquals(0, result.getActiveControlsCount());
        assertEquals(6, result.getMissingControls().size());
        assertEquals(6, result.getRecommendations().size());
    }

    @Test
    void evaluateCustomRoute_GeneratesSpecificRecommendationsForMissingControls() {
        CustomRouteEvaluationRequest request = new CustomRouteEvaluationRequest(
                "/api/test", "POST", "Test",
                false, false, false, true, false, false
        );

        RouteSecurityAnalysis result = arsaAnalysisService.evaluateCustomRoute(request);

        assertTrue(result.getMissingControls().contains("JWT Authentication"));
        assertTrue(result.getMissingControls().contains("Role-Based Access Control"));
        assertTrue(result.getMissingControls().contains("Request Validation"));
        assertTrue(result.getMissingControls().contains("IP Filtering"));
        assertTrue(result.getMissingControls().contains("Centralized Audit Logging"));
        assertEquals(5, result.getRecommendations().size());
    }

    @Test
    void analyzeRoute_ExistingRoute_ReturnsAnalysis() {
        RouteSecurityAnalysis result = arsaAnalysisService.analyzeRoute("/api/orders");

        assertNotNull(result);
        assertTrue(result.getRoutePath().contains("/api/orders"));
    }

    @Test
    void analyzeRoute_NonExistentRoute_ThrowsException() {
        assertThrows(ResourceNotFoundException.class, () -> arsaAnalysisService.analyzeRoute("/api/non-existent-xyz"));
    }

    @Test
    void getSecuritySummary_CalculatesAccurateAggregations() {
        ArsaSummaryResponse summary = arsaAnalysisService.getSecuritySummary();

        assertNotNull(summary);
        assertEquals(11, summary.getTotalRoutes());
        assertTrue(summary.getFullyCompliantRoutes() > 0);
        assertTrue(summary.getAverageComplianceScore() > 0.0);
        assertNotNull(summary.getRiskDistribution());
        assertNotNull(summary.getMissingControlsSummary());
        assertEquals(11, summary.getRoutes().size());
    }

    @Test
    void deterministicScoring_SameInputsYieldIdenticalOutputs() {
        CustomRouteEvaluationRequest req1 = new CustomRouteEvaluationRequest(
                "/api/det", "POST", "Det", true, true, false, true, false, true
        );
        CustomRouteEvaluationRequest req2 = new CustomRouteEvaluationRequest(
                "/api/det", "POST", "Det", true, true, false, true, false, true
        );

        RouteSecurityAnalysis r1 = arsaAnalysisService.evaluateCustomRoute(req1);
        RouteSecurityAnalysis r2 = arsaAnalysisService.evaluateCustomRoute(req2);

        assertEquals(r1.getComplianceScore(), r2.getComplianceScore());
        assertEquals(r1.getRiskRating(), r2.getRiskRating());
        assertEquals(r1.getActiveControlsCount(), r2.getActiveControlsCount());
    }
}
