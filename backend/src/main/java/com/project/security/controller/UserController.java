package com.project.security.controller;

import com.project.security.dto.UserRequestDTO;
import com.project.security.dto.UserResponseDTO;
import com.project.security.service.AuditLogService;
import com.project.security.service.UserService;
import com.project.security.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuditLogService auditLogService;

    public UserController(UserService userService, AuditLogService auditLogService) {
        this.userService = userService;
        this.auditLogService = auditLogService;
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(@Valid @RequestBody UserRequestDTO request,
                                                      HttpServletRequest httpRequest) {
        UserResponseDTO createdUser = userService.createUser(request);

        String clientIp = IpUtil.getClientIp(httpRequest);
        String username = getAuthenticatedUsername();
        auditLogService.logEvent(
                clientIp,
                "/api/users",
                "POST",
                username,
                "USER_CREATED",
                HttpStatus.CREATED.value(),
                "SUCCESS",
                "User created: " + createdUser.getUsername() + " with role " + createdUser.getRole()
        );

        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers(HttpServletRequest httpRequest) {
        List<UserResponseDTO> users = userService.getAllUsers();

        String clientIp = IpUtil.getClientIp(httpRequest);
        String username = getAuthenticatedUsername();
        auditLogService.logEvent(
                clientIp,
                "/api/users",
                "GET",
                username,
                "USERS_VIEWED",
                HttpStatus.OK.value(),
                "SUCCESS",
                "Fetched all users count: " + users.size()
        );

        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id,
                                                       HttpServletRequest httpRequest) {
        UserResponseDTO user = userService.getUserById(id);

        String clientIp = IpUtil.getClientIp(httpRequest);
        String username = getAuthenticatedUsername();
        auditLogService.logEvent(
                clientIp,
                "/api/users/" + id,
                "GET",
                username,
                "USER_VIEWED",
                HttpStatus.OK.value(),
                "SUCCESS",
                "Fetched user details for id: " + id
        );

        return ResponseEntity.ok(user);
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<UserResponseDTO> getUserByUsername(@PathVariable String username,
                                                             HttpServletRequest httpRequest) {
        UserResponseDTO user = userService.getUserByUsername(username);

        String clientIp = IpUtil.getClientIp(httpRequest);
        String currentAuthUser = getAuthenticatedUsername();
        auditLogService.logEvent(
                clientIp,
                "/api/users/username/" + username,
                "GET",
                currentAuthUser,
                "USER_VIEWED",
                HttpStatus.OK.value(),
                "SUCCESS",
                "Fetched user details for username: " + username
        );

        return ResponseEntity.ok(user);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponseDTO> toggleUserStatus(@PathVariable Long id,
                                                            HttpServletRequest httpRequest) {
        UserResponseDTO user = userService.toggleUserStatus(id);

        String clientIp = IpUtil.getClientIp(httpRequest);
        String currentAuthUser = getAuthenticatedUsername();
        auditLogService.logEvent(
                clientIp,
                "/api/users/" + id + "/status",
                "PATCH",
                currentAuthUser,
                "USER_STATUS_UPDATED",
                HttpStatus.OK.value(),
                "SUCCESS",
                "Toggled enabled status to " + user.isEnabled() + " for user: " + user.getUsername()
        );

        return ResponseEntity.ok(user);
    }

    private String getAuthenticatedUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.getName() != null) ? auth.getName() : "anonymous";
    }
}
