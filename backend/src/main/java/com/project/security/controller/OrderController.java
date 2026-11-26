package com.project.security.controller;

import com.project.security.dto.OrderRequestDTO;
import com.project.security.dto.OrderResponseDTO;
import com.project.security.service.AuditLogService;
import com.project.security.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final AuditLogService auditLogService;
    private final AtomicLong orderIdGenerator = new AtomicLong(100);
    private final List<OrderResponseDTO> inMemoryOrders = new ArrayList<>();

    public OrderController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
        inMemoryOrders.add(new OrderResponseDTO(
                1L,
                "ORD-SAMPLE-001",
                "admin",
                "Enterprise API Gateway Pro",
                1,
                new BigDecimal("499.99"),
                "CONFIRMED",
                LocalDateTime.now().minusDays(1)
        ));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<OrderResponseDTO> createOrder(@Valid @RequestBody OrderRequestDTO request,
                                                        HttpServletRequest httpRequest) {
        String username = getAuthenticatedUsername();
        String clientIp = IpUtil.getClientIp(httpRequest);

        BigDecimal total = request.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        OrderResponseDTO order = new OrderResponseDTO(
                orderIdGenerator.incrementAndGet(),
                orderNumber,
                username,
                request.getItem(),
                request.getQuantity(),
                total,
                "CREATED",
                LocalDateTime.now()
        );

        inMemoryOrders.add(order);

        auditLogService.logEvent(
                clientIp,
                "/api/orders",
                "POST",
                username,
                "ORDER_CREATED",
                HttpStatus.CREATED.value(),
                "SUCCESS",
                "Order created: " + orderNumber + " for item: " + request.getItem()
        );

        return new ResponseEntity<>(order, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<OrderResponseDTO>> getAllOrders(HttpServletRequest httpRequest) {
        String username = getAuthenticatedUsername();
        String clientIp = IpUtil.getClientIp(httpRequest);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        List<OrderResponseDTO> accessibleOrders = isAdmin
                ? inMemoryOrders
                : inMemoryOrders.stream()
                        .filter(o -> o.getUsername() != null && o.getUsername().equalsIgnoreCase(username))
                        .toList();

        auditLogService.logEvent(
                clientIp,
                "/api/orders",
                "GET",
                username,
                "ORDERS_VIEWED",
                HttpStatus.OK.value(),
                "SUCCESS",
                "Retrieved orders count: " + accessibleOrders.size() + (isAdmin ? " (all orders)" : " (user-isolated)")
        );

        return ResponseEntity.ok(accessibleOrders);
    }

    private String getAuthenticatedUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.getName() != null) ? auth.getName() : "anonymous";
    }
}
