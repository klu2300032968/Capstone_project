package com.project.security.service;

import com.project.security.dto.UserRequestDTO;
import com.project.security.dto.UserResponseDTO;
import com.project.security.entity.Role;
import com.project.security.entity.User;
import com.project.security.exception.BadRequestException;
import com.project.security.exception.ResourceNotFoundException;
import com.project.security.repository.RoleRepository;
import com.project.security.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private Role userRole;
    private User testUser;

    @BeforeEach
    void setUp() {
        userRole = new Role(1L, "ROLE_USER");
        testUser = new User("testuser", "test@example.com", "encodedPassword", userRole, true);
        testUser.setId(1L);
    }

    @Test
    void createUser_Success() {
        UserRequestDTO request = new UserRequestDTO("testuser", "test@example.com", "plainPassword", "USER");

        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode("plainPassword")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserResponseDTO result = userService.createUser(request);

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        assertEquals("test@example.com", result.getEmail());
        assertEquals("ROLE_USER", result.getRole());
        assertTrue(result.isEnabled());
        verify(passwordEncoder).encode("plainPassword");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_ThrowsException_WhenUsernameExists() {
        UserRequestDTO request = new UserRequestDTO("testuser", "test@example.com", "plainPassword", "USER");
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> userService.createUser(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserResponseDTO result = userService.getUserById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("testuser", result.getUsername());
    }

    @Test
    void getUserById_NotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById(99L));
    }
}
