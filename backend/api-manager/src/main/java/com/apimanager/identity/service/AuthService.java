package com.apimanager.identity.service;


import com.apimanager.identity.entity.Role;
import com.apimanager.identity.entity.Organization;
import com.apimanager.identity.entity.User;
import com.apimanager.identity.dto.AuthRequest;
import com.apimanager.identity.dto.AuthResponse;
import com.apimanager.identity.repository.OrganizationRepository;
import com.apimanager.identity.repository.RoleRepository;
import com.apimanager.identity.repository.UserRepository;
import com.apimanager.common.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor

public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(AuthRequest request) {

        if (userRepository.existsByEmail(request.getEmail()))
            throw new RuntimeException("Email already registered: " + request.getEmail());

        String roleName = request.getRoleName() != null ? request.getRoleName() : "DEVELOPER";
        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        Organization org = null;

        if ("API_PROVIDER".equals(roleName)) {
            // provider must supply org name
            if (request.getOrganizationName() == null || request.getOrganizationName().isBlank())
                throw new RuntimeException("Organization name is required for API providers");

            // generate unique invite code: first 3 letters of org + random 4 chars
            String prefix = request.getOrganizationName()
                    .replaceAll("[^a-zA-Z]", "")
                    .toUpperCase()
                    .substring(0, Math.min(3, request.getOrganizationName().replaceAll("[^a-zA-Z]", "").length()));
            String inviteCode = prefix + "-" + randomCode();

            org = Organization.builder()
                    .orgName(request.getOrganizationName())
                    .domain(request.getOrganizationDomain())
                    .inviteCode(inviteCode)
                    .status("active")
                    .build();
            org = organizationRepository.save(org);

        } else if ("DEVELOPER".equals(roleName)) {
            // developer with invite code → join that org
            if (request.getInviteCode() != null && !request.getInviteCode().isBlank()) {
                org = organizationRepository.findByInviteCode(request.getInviteCode())
                        .orElseThrow(() -> new RuntimeException("Invalid invite code"));
            }
            // else org stays null → independent developer, sees public APIs only
        }

        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .organization(org)
                .status("active")
                .build();

        user = userRepository.save(user);

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
                .orgName(org != null ? org.getOrgName() : null)
                .inviteCode(org != null ? org.getInviteCode() : null)
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

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

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
             // .orgName(user.getOrganization() != null ? user.getOrganization().getOrgName() : null)
             // .inviteCode(user.getOrganization() != null ? user.getOrganization().getInviteCode() : null)
                .build();
    }


    private String randomCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < 4; i++)
            sb.append(chars.charAt(random.nextInt(chars.length())));
        return sb.toString();
    }
}
