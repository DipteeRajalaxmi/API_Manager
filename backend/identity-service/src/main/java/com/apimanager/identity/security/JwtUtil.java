package com.apimanager.identity.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component

public class JwtUtil {
 @Value("${jwt.secret}")
 private String secret;
 @Value("${jwt.expiration}")
 private long expiration;
 @Value("${jwt.refresh-expiration}")
 private long refreshExpiration;


 private Key getSigningKey(){
    return Keys.hmacShaKeyFor(secret.getBytes());
 }
//access token generation
 public String generateToken(String email, String role, long userId){
    return Jwts.builder().setSubject(email).claim("role", role).claim("userId", userId).setIssuedAt(new Date())
    .setExpiration(new Date(System.currentTimeMillis()+expiration))
    .signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();

 }

//refresh token generation

public String generateRefreshToken(String email){
    return Jwts.builder().setSubject(email).setIssuedAt(new Date())
    .setExpiration(new Date(System.currentTimeMillis()+refreshExpiration))
    .signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
}


 // Extract email from token
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    // Extract role from token
    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    // Check if token is valid and not expired
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // Parse and verify token signature
    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
