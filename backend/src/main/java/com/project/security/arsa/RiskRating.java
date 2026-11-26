package com.project.security.arsa;

public enum RiskRating {
    LOW("Low Risk", "Strong security posture with comprehensive controls enforced"),
    MEDIUM("Medium Risk", "Acceptable security posture, but minor control gaps exist"),
    HIGH("High Risk", "Significant security risk due to missing critical controls"),
    CRITICAL("Critical Risk", "Severe vulnerability exposure due to absent protection controls");

    private final String label;
    private final String description;

    RiskRating(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }
}
