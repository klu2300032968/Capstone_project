package com.project.security.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "client_ip", length = 64)
    private String clientIp;

    @Column(length = 255)
    private String path;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(length = 100)
    private String username;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(length = 20)
    private String status;

    @Column(length = 500)
    private String details;

    public AuditLog() {
    }

    public AuditLog(LocalDateTime timestamp, String clientIp, String path, String httpMethod,
                    String username, String action, Integer httpStatus, String status, String details) {
        this.timestamp = timestamp;
        this.clientIp = clientIp;
        this.path = path;
        this.httpMethod = httpMethod;
        this.username = username;
        this.action = action;
        this.httpStatus = httpStatus;
        this.status = status;
        this.details = details;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
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
