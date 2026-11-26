package com.project.security.config;

import com.project.security.entity.Role;
import com.project.security.entity.User;
import com.project.security.repository.RoleRepository;
import com.project.security.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Value("${app.seed.demo-data:false}")
    private boolean seedDemoData;

    @Value("${ADMIN_USERNAME:}")
    private String adminUsername;

    @Value("${ADMIN_EMAIL:}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    @Bean
    public CommandLineRunner initDatabase(RoleRepository roleRepository,
                                          UserRepository userRepository,
                                          PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed roles if not present
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseGet(() -> roleRepository.save(new Role("ROLE_ADMIN")));

            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseGet(() -> roleRepository.save(new Role("ROLE_USER")));

            // 1. Production Secure Administrator Account Creation
            if (adminPassword != null && !adminPassword.trim().isEmpty()) {
                String effectiveAdminUsername = (adminUsername != null && !adminUsername.trim().isEmpty()) ? adminUsername.trim() : "admin";
                String effectiveAdminEmail = (adminEmail != null && !adminEmail.trim().isEmpty()) ? adminEmail.trim() : "admin@security.local";

                if (!userRepository.existsByUsername(effectiveAdminUsername)) {
                    User admin = new User();
                    admin.setUsername(effectiveAdminUsername);
                    admin.setEmail(effectiveAdminEmail);
                    admin.setPassword(passwordEncoder.encode(adminPassword.trim()));
                    admin.setRole(adminRole);
                    admin.setEnabled(true);
                    userRepository.save(admin);
                    logger.info("Provisioned secure administrator account from environment configuration: {}", effectiveAdminUsername);
                }
            }

            // 2. Demonstration Accounts (Only initialized if seedDemoData is enabled)
            if (seedDemoData) {
                logger.info("Demo data seeding is ENABLED. Provisioning demonstration accounts...");
                if (!userRepository.existsByUsername("admin")) {
                    User admin = new User();
                    admin.setUsername("admin");
                    admin.setEmail("admin@security.local");
                    admin.setPassword(passwordEncoder.encode("Admin@12345"));
                    admin.setRole(adminRole);
                    admin.setEnabled(true);
                    userRepository.save(admin);
                }

                if (!userRepository.existsByUsername("alice_dev")) {
                    User alice = new User();
                    alice.setUsername("alice_dev");
                    alice.setEmail("alice@security.local");
                    alice.setPassword(passwordEncoder.encode("SecurePassword@123"));
                    alice.setRole(userRole);
                    alice.setEnabled(true);
                    userRepository.save(alice);
                }
            } else {
                logger.info("Demo data seeding is DISABLED. Public demonstration accounts will not be created automatically.");
            }
        };
    }
}
