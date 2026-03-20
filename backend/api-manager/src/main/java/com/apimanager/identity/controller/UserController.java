package com.apimanager.identity.controller;


import com.apimanager.identity.dto.UserResponse;
import com.apimanager.identity.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import java.util.List;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor

public class UserController {
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

     @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // DELETE /api/users/{id}/deactivate
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.deactivateUser(id));
    }

    @GetMapping("/org")
    public ResponseEntity<List<UserResponse>> getOrgDevelopers(Authentication authentication) {
        return ResponseEntity.ok(userService.getOrgDevelopers(authentication.getName()));
    }

    @PostMapping("/org/add")
    public ResponseEntity<?> addDeveloperToOrg(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        return ResponseEntity.ok(userService.addDeveloperToOrg(body.get("name"), body.get("email"), body.get("password"), auth.getName()));
    }
    
    
}
