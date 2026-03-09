package com.apimanager.identity.service;


import com.apimanager.identity.entity.Role;
import com.apimanager.identity.entity.Organization;
import com.apimanager.identity.entity.User;
import com.apimanager.identity.dto.AuthRequest;
import com.apimanager.identity.dto.AuthResponse;
import com.apimanager.identity.repository.OrganizationRepository;
import com.apimanager.identity.repository.RoleRepository;
import com.apimanager.identity.repository.UserRepository;
import com.apimanager.identity.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor

public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(AuthRequest request) {

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        // Find role — default to DEVELOPER if not provided
        String roleName = request.getRoleName() != null ? request.getRoleName() : "DEVELOPER";
        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        // Find organization if orgId provided
        Organization org = null;
        if (request.getOrgId() != null) {
            org = organizationRepository.findById(request.getOrgId())
                    .orElseThrow(() -> new RuntimeException("Organization not found: " + request.getOrgId()));
        }

        // Build and save user with hashed password
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .organization(org)
                .status("active")
                .build();

        user = userRepository.save(user);

        // Generate tokens
        String token        = jwtUtil.generateToken(user.getEmail(), role.getRoleName(), user.getUserId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .role(role.getRoleName())
                .userId(user.getUserId())
                .orgId(org != null ? org.getOrgId() : null)
                .build();
    }

    public AuthResponse login(AuthRequest request) {

        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        // Check password matches hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid password");
        }

        // Check account is active
        if (!"active".equals(user.getStatus())) {
            throw new RuntimeException("Account is not active");
        }

        // Generate tokens
        String token        = jwtUtil.generateToken(user.getEmail(), user.getRole().getRoleName(), user.getUserId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().getRoleName())
                .userId(user.getUserId())
                .orgId(user.getOrganization() != null ? user.getOrganization().getOrgId() : null)
                .build();
    }
}
