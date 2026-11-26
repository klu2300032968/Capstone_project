package com.project.security.repository;

import com.project.security.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByTimestampDesc();

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    List<AuditLog> findByUsernameOrderByTimestampDesc(String username);

    Page<AuditLog> findByUsernameOrderByTimestampDesc(String username, Pageable pageable);

    List<AuditLog> findByActionOrderByTimestampDesc(String action);

    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);
}
