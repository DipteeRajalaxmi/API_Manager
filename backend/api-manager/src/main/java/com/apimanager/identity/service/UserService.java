package com.apimanager.identity.service;


import com.apimanager.identity.dto.UserResponse;
import com.apimanager.identity.entity.User;
import com.apimanager.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

public class UserService {
    
 private final UserRepository userRepository;

    // Get all users — admin use
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Get single user by ID
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return mapToResponse(user);
    }

    // Get user by email — used internally
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return mapToResponse(user);
    }

    // Deactivate user account
    public UserResponse deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setStatus("inactive");
        userRepository.save(user);
        return mapToResponse(user);
    }

    // Convert User entity to UserResponse DTO
    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().getRoleName() : null)
                .status(user.getStatus())
                .orgId(user.getOrganization() != null ? user.getOrganization().getOrgId() : null)
                .orgName(user.getOrganization() != null ? user.getOrganization().getOrgName() : null)
                .orgDomain(user.getOrganization() != null ? user.getOrganization().getDomain() : null)
                .inviteCode(user.getOrganization() != null ? user.getOrganization().getInviteCode() : null)
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }


    public List<UserResponse> getOrgDevelopers(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOrganization() == null)
            throw new RuntimeException("You don't belong to any organization");

        return userRepository.findByOrganization_OrgId(user.getOrganization().getOrgId())
                .stream()
                .filter(u -> u.getRole() != null && "DEVELOPER".equals(u.getRole().getRoleName()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
}
