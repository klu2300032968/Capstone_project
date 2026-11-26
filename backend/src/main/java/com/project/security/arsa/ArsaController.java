package com.project.security.arsa;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/arsa")
public class ArsaController {

    private final ArsaAnalysisService arsaAnalysisService;

    public ArsaController(ArsaAnalysisService arsaAnalysisService) {
        this.arsaAnalysisService = arsaAnalysisService;
    }

    @GetMapping("/routes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RouteSecurityAnalysis>> getAllRouteAnalyses() {
        return ResponseEntity.ok(arsaAnalysisService.analyzeAllRoutes());
    }

    @GetMapping("/route")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RouteSecurityAnalysis> getRouteAnalysisByQuery(@RequestParam String path) {
        return ResponseEntity.ok(arsaAnalysisService.analyzeRoute(path));
    }

    @GetMapping("/routes/**")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RouteSecurityAnalysis> getRouteAnalysisByPath(HttpServletRequest request) {
        String fullUri = request.getRequestURI();
        // Extract everything after /api/arsa/routes/
        String prefix = "/api/arsa/routes/";
        String routePath = fullUri;
        if (fullUri.contains(prefix)) {
            routePath = fullUri.substring(fullUri.indexOf(prefix) + prefix.length() - 1);
        }
        String decodedPath = URLDecoder.decode(routePath, StandardCharsets.UTF_8);
        return ResponseEntity.ok(arsaAnalysisService.analyzeRoute(decodedPath));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ArsaSummaryResponse> getSecuritySummary() {
        return ResponseEntity.ok(arsaAnalysisService.getSecuritySummary());
    }

    @PostMapping("/evaluate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RouteSecurityAnalysis> evaluateCustomRoute(
            @Valid @RequestBody CustomRouteEvaluationRequest request) {
        return ResponseEntity.ok(arsaAnalysisService.evaluateCustomRoute(request));
    }
}
