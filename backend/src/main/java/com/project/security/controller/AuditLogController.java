package com.project.security.controller;

import com.project.security.dto.AuditLogRequestDTO;
import com.project.security.dto.AuditLogResponseDTO;
import com.project.security.service.AuditLogService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @Value("${app.security.internal-key:gateway-internal-secret-token-key-2026}")
    private String internalGatewayKey;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLogResponseDTO>> getAllAuditLogs() {
        return ResponseEntity.ok(auditLogService.getAllAuditLogs());
    }

    @GetMapping("/paged")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLogResponseDTO>> getAuditLogsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        return ResponseEntity.ok(auditLogService.getAuditLogsPaged(pageable));
    }

    @GetMapping("/user/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLogResponseDTO>> getAuditLogsByUsername(@PathVariable String username) {
        return ResponseEntity.ok(auditLogService.getAuditLogsByUsername(username));
    }

    @GetMapping("/action/{action}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLogResponseDTO>> getAuditLogsByAction(@PathVariable String action) {
        return ResponseEntity.ok(auditLogService.getAuditLogsByAction(action));
    }

    @PostMapping("/internal")
    public ResponseEntity<AuditLogResponseDTO> ingestAuditLog(
            @RequestHeader(value = "X-Internal-Gateway-Key", required = false) String providedKey,
            @Valid @RequestBody AuditLogRequestDTO request) {
        if (internalGatewayKey != null && !internalGatewayKey.equals(providedKey)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        AuditLogResponseDTO result = auditLogService.createAuditLog(request);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }
}
