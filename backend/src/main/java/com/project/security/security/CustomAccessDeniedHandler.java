package com.project.security.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.security.service.AuditLogService;
import com.project.security.util.IpUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AuditLogService auditLogService;

    public CustomAccessDeniedHandler(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        String clientIp = IpUtil.getClientIp(request);
        String path = request.getRequestURI();
        String method = request.getMethod();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && auth.getName() != null) ? auth.getName() : "anonymous";

        auditLogService.logEvent(
                clientIp,
                path,
                method,
                username,
                "ACCESS_DENIED",
                HttpServletResponse.SC_FORBIDDEN,
                "FAILURE",
                "Access denied: Insufficient privileges for user " + username
        );

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpServletResponse.SC_FORBIDDEN);
        body.put("error", "Forbidden");
        body.put("message", "Access denied: You do not have permission to access this resource");
        body.put("path", path);

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
