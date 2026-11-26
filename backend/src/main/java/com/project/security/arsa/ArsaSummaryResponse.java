package com.project.security.arsa;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ArsaSummaryResponse {

    private int totalRoutes;
    private int fullyCompliantRoutes;
    private int partiallyCompliantRoutes;
    private int nonCompliantRoutes;
    private double averageComplianceScore;

    private Map<String, Integer> riskDistribution = new HashMap<>();
    private Map<String, Integer> missingControlsSummary = new HashMap<>();
    private List<RouteSecurityAnalysis> routes;

    public ArsaSummaryResponse() {
    }

    public ArsaSummaryResponse(int totalRoutes, int fullyCompliantRoutes,
                               int partiallyCompliantRoutes, int nonCompliantRoutes,
                               double averageComplianceScore, Map<String, Integer> riskDistribution,
                               Map<String, Integer> missingControlsSummary,
                               List<RouteSecurityAnalysis> routes) {
        this.totalRoutes = totalRoutes;
        this.fullyCompliantRoutes = fullyCompliantRoutes;
        this.partiallyCompliantRoutes = partiallyCompliantRoutes;
        this.nonCompliantRoutes = nonCompliantRoutes;
        this.averageComplianceScore = averageComplianceScore;
        this.riskDistribution = riskDistribution;
        this.missingControlsSummary = missingControlsSummary;
        this.routes = routes;
    }

    public int getTotalRoutes() {
        return totalRoutes;
    }

    public void setTotalRoutes(int totalRoutes) {
        this.totalRoutes = totalRoutes;
    }

    public int getFullyCompliantRoutes() {
        return fullyCompliantRoutes;
    }

    public void setFullyCompliantRoutes(int fullyCompliantRoutes) {
        this.fullyCompliantRoutes = fullyCompliantRoutes;
    }

    public int getPartiallyCompliantRoutes() {
        return partiallyCompliantRoutes;
    }

    public void setPartiallyCompliantRoutes(int partiallyCompliantRoutes) {
        this.partiallyCompliantRoutes = partiallyCompliantRoutes;
    }

    public int getNonCompliantRoutes() {
        return nonCompliantRoutes;
    }

    public void setNonCompliantRoutes(int nonCompliantRoutes) {
        this.nonCompliantRoutes = nonCompliantRoutes;
    }

    public double getAverageComplianceScore() {
        return averageComplianceScore;
    }

    public void setAverageComplianceScore(double averageComplianceScore) {
        this.averageComplianceScore = averageComplianceScore;
    }

    public Map<String, Integer> getRiskDistribution() {
        return riskDistribution;
    }

    public void setRiskDistribution(Map<String, Integer> riskDistribution) {
        this.riskDistribution = riskDistribution;
    }

    public Map<String, Integer> getMissingControlsSummary() {
        return missingControlsSummary;
    }

    public void setMissingControlsSummary(Map<String, Integer> missingControlsSummary) {
        this.missingControlsSummary = missingControlsSummary;
    }

    public List<RouteSecurityAnalysis> getRoutes() {
        return routes;
    }

    public void setRoutes(List<RouteSecurityAnalysis> routes) {
        this.routes = routes;
    }
}
