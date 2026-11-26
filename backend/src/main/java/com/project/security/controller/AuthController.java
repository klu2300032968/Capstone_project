package com.project.security.controller;

import com.project.security.dto.LoginRequestDTO;
import com.project.security.dto.LoginResponseDTO;
import com.project.security.entity.User;
import com.project.security.exception.ResourceNotFoundException;
import com.project.security.repository.UserRepository;
import com.project.security.security.JwtUtils;
import com.project.security.service.AuditLogService;
import com.project.security.service.UserService;
import com.project.security.util.IpUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtils jwtUtils,
                          UserRepository userRepository,
                          AuditLogService auditLogService,
                          UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<com.project.security.dto.UserResponseDTO> registerUser(
            @Valid @RequestBody com.project.security.dto.UserRequestDTO signUpRequest,
            HttpServletRequest request) {
        String clientIp = IpUtil.getClientIp(request);
        
        // Force role to USER for public self-registration to prevent privilege escalation
        signUpRequest.setRole("ROLE_USER");
        com.project.security.dto.UserResponseDTO createdUser = userService.createUser(signUpRequest);

        auditLogService.logEvent(
                clientIp,
                "/api/auth/signup",
                "POST",
                createdUser.getUsername(),
                "USER_REGISTERED",
                org.springframework.http.HttpStatus.CREATED.value(),
                "SUCCESS",
                "Self-registered user created: " + createdUser.getUsername()
        );

        return new ResponseEntity<>(createdUser, org.springframework.http.HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> authenticateUser(@Valid @RequestBody LoginRequestDTO loginRequest,
                                                             HttpServletRequest request) {
        String clientIp = IpUtil.getClientIp(request);
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + loginRequest.getUsername()));

            String role = user.getRole() != null ? user.getRole().getName() : "ROLE_USER";
            String token = jwtUtils.generateToken(user.getUsername(), role);

            auditLogService.logEvent(
                    clientIp,
                    "/api/auth/login",
                    "POST",
                    user.getUsername(),
                    "LOGIN_SUCCESS",
                    200,
                    "SUCCESS",
                    "User authenticated successfully with role " + role
            );

            LoginResponseDTO response = new LoginResponseDTO(
                    token,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    role
            );

            return ResponseEntity.ok(response);
        } catch (BadCredentialsException | ResourceNotFoundException e) {
            auditLogService.logEvent(
                    clientIp,
                    "/api/auth/login",
                    "POST",
                    loginRequest.getUsername(),
                    "LOGIN_FAILED",
                    401,
                    "FAILURE",
                    "Authentication failed: " + e.getMessage()
            );
            throw e;
        }
    }
}
