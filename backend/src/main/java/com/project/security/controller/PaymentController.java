package com.project.security.controller;

import com.project.security.dto.PaymentRequestDTO;
import com.project.security.dto.PaymentResponseDTO;
import com.project.security.service.AuditLogService;
import com.project.security.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final AuditLogService auditLogService;
    private final List<PaymentResponseDTO> inMemoryPayments = new ArrayList<>();

    public PaymentController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @PostMapping("/process")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentResponseDTO> processPayment(@Valid @RequestBody PaymentRequestDTO request,
                                                             HttpServletRequest httpRequest) {
        String username = getAuthenticatedUsername();
        String clientIp = IpUtil.getClientIp(httpRequest);

        String txnId = "TXN-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        PaymentResponseDTO response = new PaymentResponseDTO(
                txnId,
                request.getOrderId(),
                request.getAmount(),
                request.getPaymentMethod(),
                "COMPLETED",
                LocalDateTime.now()
        );

        inMemoryPayments.add(response);

        auditLogService.logEvent(
                clientIp,
                "/api/payments/process",
                "POST",
                username,
                "PAYMENT_PROCESSED",
                200,
                "SUCCESS",
                "Processed payment " + txnId + " for order " + request.getOrderId() + " amount $" + request.getAmount()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PaymentResponseDTO>> getAllPayments(HttpServletRequest httpRequest) {
        String username = getAuthenticatedUsername();
        String clientIp = IpUtil.getClientIp(httpRequest);

        auditLogService.logEvent(
                clientIp,
                "/api/payments",
                "GET",
                username,
                "PAYMENTS_VIEWED",
                200,
                "SUCCESS",
                "Retrieved payments count: " + inMemoryPayments.size()
        );

        return ResponseEntity.ok(inMemoryPayments);
    }

    private String getAuthenticatedUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.getName() != null) ? auth.getName() : "anonymous";
    }
}
