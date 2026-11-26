-- ====================================================================
-- Project: API Gateway Security Controls With Consistent Enforcement Across Routes
-- Feature: Adaptive Route Security Analyzer (ARSA)
-- Database Initialization Script (MySQL 8.0+)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `api_security_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `api_security_db`;

-- Table: roles
CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: users
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `role_id` BIGINT NOT NULL,
    CONSTRAINT `fk_users_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `timestamp` DATETIME(6) NOT NULL,
    `client_ip` VARCHAR(45) NOT NULL,
    `path` VARCHAR(255) NOT NULL,
    `http_method` VARCHAR(10) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `http_status` INT NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `details` VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Initial Security Roles
INSERT IGNORE INTO `roles` (`id`, `name`) VALUES 
(1, 'ROLE_ADMIN'),
(2, 'ROLE_USER');

-- Note: The Spring Boot Backend automatically initializes or updates tables
-- via Hibernate DDL and seeds initial accounts (admin & alice_dev) using BCrypt
-- upon first application startup.
