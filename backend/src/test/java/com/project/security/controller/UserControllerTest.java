package com.project.security.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.security.config.SecurityConfig;
import com.project.security.dto.UserRequestDTO;
import com.project.security.dto.UserResponseDTO;
import com.project.security.security.*;
import com.project.security.service.AuditLogService;
import com.project.security.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class, JwtAuthenticationFilter.class})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private AuditLogService auditLogService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUser_AdminRole_ReturnsCreated() throws Exception {
        UserRequestDTO request = new UserRequestDTO("john_doe", "john@example.com", "secret123", "USER");
        UserResponseDTO response = new UserResponseDTO(1L, "john_doe", "john@example.com", "ROLE_USER", true);

        when(userService.createUser(any(UserRequestDTO.class))).thenReturn(response);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("john_doe"))
                .andExpect(jsonPath("$.email").value("john@example.com"))
                .andExpect(jsonPath("$.role").value("ROLE_USER"))
                .andExpect(jsonPath("$.enabled").value(true));
    }

    @Test
    @WithMockUser(roles = "USER")
    void createUser_UserRole_ReturnsForbidden() throws Exception {
        UserRequestDTO request = new UserRequestDTO("john_doe", "john@example.com", "secret123", "USER");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Access denied: You do not have permission to access this resource"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllUsers_AdminRole_ReturnsList() throws Exception {
        UserResponseDTO user1 = new UserResponseDTO(1L, "admin", "admin@example.com", "ROLE_ADMIN", true);
        UserResponseDTO user2 = new UserResponseDTO(2L, "user", "user@example.com", "ROLE_USER", true);

        when(userService.getAllUsers()).thenReturn(List.of(user1, user2));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[1].username").value("user"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAllUsers_UserRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Access denied: You do not have permission to access this resource"));
    }

    @Test
    void getAllUsers_Unauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserById_AdminRole_ReturnsUser() throws Exception {
        UserResponseDTO user = new UserResponseDTO(1L, "admin", "admin@example.com", "ROLE_ADMIN", true);
        when(userService.getUserById(1L)).thenReturn(user);

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("admin"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getUserById_UserRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }
}
