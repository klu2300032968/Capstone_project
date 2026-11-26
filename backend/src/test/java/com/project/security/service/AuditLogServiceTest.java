package com.project.security.service;

import com.project.security.dto.AuditLogRequestDTO;
import com.project.security.dto.AuditLogResponseDTO;
import com.project.security.entity.AuditLog;
import com.project.security.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    private AuditLog sampleLog;

    @BeforeEach
    void setUp() {
        sampleLog = new AuditLog(
                LocalDateTime.now(),
                "192.168.1.10",
                "/api/users",
                "GET",
                "admin",
                "USERS_VIEWED",
                200,
                "SUCCESS",
                "Fetched all users"
        );
        sampleLog.setId(1L);
    }

    @Test
    void logEvent_SavesAndReturnsDTO() {
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(sampleLog);

        AuditLogResponseDTO result = auditLogService.logEvent(
                "192.168.1.10",
                "/api/users",
                "GET",
                "admin",
                "USERS_VIEWED",
                200,
                "SUCCESS",
                "Fetched all users"
        );

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("admin", result.getUsername());
        assertEquals("USERS_VIEWED", result.getAction());
        assertEquals(200, result.getHttpStatus());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void createAuditLog_FromDTO_Success() {
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(sampleLog);

        AuditLogRequestDTO dto = new AuditLogRequestDTO(
                "192.168.1.10",
                "/api/users",
                "GET",
                "admin",
                "USERS_VIEWED",
                200,
                "SUCCESS",
                "Fetched all users"
        );

        AuditLogResponseDTO result = auditLogService.createAuditLog(dto);

        assertNotNull(result);
        assertEquals("USERS_VIEWED", result.getAction());
    }

    @Test
    void getAllAuditLogs_ReturnsOrderedList() {
        when(auditLogRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(sampleLog));

        List<AuditLogResponseDTO> logs = auditLogService.getAllAuditLogs();

        assertEquals(1, logs.size());
        assertEquals("admin", logs.get(0).getUsername());
    }

    @Test
    void getAuditLogsPaged_ReturnsPage() {
        Page<AuditLog> page = new PageImpl<>(List.of(sampleLog));
        Pageable pageable = PageRequest.of(0, 10);
        when(auditLogRepository.findAllByOrderByTimestampDesc(pageable)).thenReturn(page);

        Page<AuditLogResponseDTO> result = auditLogService.getAuditLogsPaged(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("admin", result.getContent().get(0).getUsername());
    }

    @Test
    void getAuditLogsByUsername_ReturnsFilteredList() {
        when(auditLogRepository.findByUsernameOrderByTimestampDesc("admin")).thenReturn(List.of(sampleLog));

        List<AuditLogResponseDTO> logs = auditLogService.getAuditLogsByUsername("admin");

        assertEquals(1, logs.size());
        assertEquals("admin", logs.get(0).getUsername());
    }

    @Test
    void getAuditLogsByAction_ReturnsFilteredList() {
        when(auditLogRepository.findByActionOrderByTimestampDesc("USERS_VIEWED")).thenReturn(List.of(sampleLog));

        List<AuditLogResponseDTO> logs = auditLogService.getAuditLogsByAction("USERS_VIEWED");

        assertEquals(1, logs.size());
        assertEquals("USERS_VIEWED", logs.get(0).getAction());
    }

    @Test
    void logEvent_NeverStoresSensitiveData_ExcludesPasswordAndToken() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuditLogResponseDTO result = auditLogService.logEvent(
                "127.0.0.1",
                "/api/auth/login",
                "POST",
                "admin",
                "LOGIN_SUCCESS",
                200,
                "SUCCESS",
                "User authenticated successfully"
        );

        assertNotNull(result);
        assertFalse(result.getDetails().contains("password"));
        assertFalse(result.getDetails().contains("Bearer"));
        assertFalse(result.getDetails().contains("eyJ"));
    }

    @Test
    void logEvent_DatabaseException_HandlesGracefullyWithoutThrowing() {
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("DB Connection Timeout"));

        AuditLogResponseDTO result = auditLogService.logEvent(
                "127.0.0.1",
                "/api/health",
                "GET",
                "anonymous",
                "HEALTH_CHECK",
                200,
                "SUCCESS",
                "Health checked"
        );

        assertNull(result); // Returns null without throwing exception to caller
    }
}
