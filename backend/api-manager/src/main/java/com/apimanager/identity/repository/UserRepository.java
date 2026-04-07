package com.apimanager.identity.repository;
import com.apimanager.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;        
import java.util.Optional; 
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    List<User> findByOrganization_OrgId(Long orgId);

    long countByRole_RoleName(String roleName);
    long countByOrganization_OrgIdAndRole_RoleName(Long orgId, String roleName);

    Optional<User> findByResetTokenHash(String resetTokenHash);

    @Query("SELECT u FROM User u JOIN FETCH u.role LEFT JOIN FETCH u.organization WHERE u.email = :email")
    Optional<User> findByEmailWithDetails(@Param("email") String email);
}
