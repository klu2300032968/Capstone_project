package com.project.security.dto;

import jakarta.validation.constraints.NotBlank;

public class AuditLogRequestDTO {

    private String clientIp;
    private String path;
    private String httpMethod;
    private String username;

    @NotBlank(message = "Action is required")
    private String action;

    private Integer httpStatus;
    private String status;
    private String details;

    public AuditLogRequestDTO() {
    }

    public AuditLogRequestDTO(String clientIp, String path, String httpMethod, String username,
                              String action, Integer httpStatus, String status, String details) {
        this.clientIp = clientIp;
        this.path = path;
        this.httpMethod = httpMethod;
        this.username = username;
        this.action = action;
        this.httpStatus = httpStatus;
        this.status = status;
        this.details = details;
    }

    public String getClientIp() {
        return clientIp;
    }

    public void setClientIp(String clientIp) {
        this.clientIp = clientIp;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public void setHttpMethod(String httpMethod) {
        this.httpMethod = httpMethod;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Integer getHttpStatus() {
        return httpStatus;
    }

    public void setHttpStatus(Integer httpStatus) {
        this.httpStatus = httpStatus;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
