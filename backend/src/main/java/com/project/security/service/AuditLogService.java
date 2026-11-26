package com.project.security.service;

import com.project.security.dto.AuditLogRequestDTO;
import com.project.security.dto.AuditLogResponseDTO;
import com.project.security.entity.AuditLog;
import com.project.security.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLogResponseDTO logEvent(String clientIp, String path, String httpMethod,
                                        String username, String action, Integer httpStatus,
                                        String status, String details) {
        try {
            AuditLog auditLog = new AuditLog(
                    LocalDateTime.now(),
                    clientIp,
                    path,
                    httpMethod,
                    username,
                    action,
                    httpStatus,
                    status,
                    details
            );
            AuditLog saved = auditLogRepository.save(auditLog);
            logger.info("Audit Log recorded: [{}] action={} user={} ip={} status={}",
                    saved.getTimestamp(), action, username, clientIp, status);
            return mapToDTO(saved);
        } catch (Exception e) {
            // Failure-safe: logging error should not crash the main application workflow
            logger.error("Failed to record audit log: {}", e.getMessage());
            return null;
        }
    }

    @Transactional
    public AuditLogResponseDTO createAuditLog(AuditLogRequestDTO dto) {
        return logEvent(
                dto.getClientIp(),
                dto.getPath(),
                dto.getHttpMethod(),
                dto.getUsername(),
                dto.getAction(),
                dto.getHttpStatus(),
                dto.getStatus(),
                dto.getDetails()
        );
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponseDTO> getAllAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponseDTO> getAuditLogsPaged(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable)
                .map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponseDTO> getAuditLogsByUsername(String username) {
        return auditLogRepository.findByUsernameOrderByTimestampDesc(username)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponseDTO> getAuditLogsByAction(String action) {
        return auditLogRepository.findByActionOrderByTimestampDesc(action)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private AuditLogResponseDTO mapToDTO(AuditLog log) {
        return new AuditLogResponseDTO(
                log.getId(),
                log.getTimestamp(),
                log.getClientIp(),
                log.getPath(),
                log.getHttpMethod(),
                log.getUsername(),
                log.getAction(),
                log.getHttpStatus(),
                log.getStatus(),
                log.getDetails()
        );
    }
}
