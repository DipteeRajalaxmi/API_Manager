package com.apimanager.identity.repository;

import com.apimanager.identity.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Optional<Organization> findByInviteCode(String inviteCode);
    Optional<Organization> findByOrgName(String orgName);
    boolean existsByOrgName(String orgName);
}

