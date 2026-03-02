package com.attendme.service.impl;

import com.attendme.dto.requestdto.LoginRequest;
import com.attendme.dto.requestdto.RegisterRequest;
import com.attendme.dto.requestdto.RefreshTokenRequest;
import com.attendme.dto.response.JwtResponse;
import com.attendme.dto.response.UserResponse;
import com.attendme.entity.User;
import com.attendme.exception.ResourceNotFoundException;
import com.attendme.exception.UnauthorizedException;
import com.attendme.repository.UserRepository;
import com.attendme.security.JwtUtils;
import com.attendme.service.AuthService;
import com.attendme.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImp implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    

    @Override
    public JwtResponse login(LoginRequest request) {
        try {
            
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            
            String jwt = jwtUtils.generateJwtToken(authentication);
            
            
            User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", request.getUsername()));
            
            
            userService.updateLastLogin(user.getUsername());
            
            
            String refreshToken = "";
            
            return new JwtResponse(
                jwt,
                refreshToken,
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
            );
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid username or password");
        }
    }

    @Override
    public UserResponse register(RegisterRequest request) {
        return userService.registerUser(request);
    }

    @Override
    public JwtResponse refreshToken(RefreshTokenRequest request) {
        // To be implemented with RefreshTokenService
        // This will validate the refresh token and generate a new access token
        
        /*
        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken())
            .orElseThrow(() -> new ResourceNotFoundException("Refresh Token not found"));
        
        refreshTokenService.verifyExpiration(refreshToken);
        
        User user = refreshToken.getUser();
        String newAccessToken = jwtUtils.generateTokenFromUsername(user.getUsername());
        
        return new JwtResponse(
            newAccessToken,
            request.getRefreshToken(),
            user.getUserId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole().name()
        );
        */
        
        throw new UnsupportedOperationException("Refresh token functionality not implemented yet");
    }

    @Override
    public void logout(String refreshToken) {
        // To be implemented with RefreshTokenService
        // This will invalidate the refresh token
        
        /*
        refreshTokenService.deleteByToken(refreshToken);
        */
        
        // Also clear security context
        SecurityContextHolder.clearContext();
    }

    @Override
    public JwtResponse googleLogin(String idToken) {
        // To be implemented with Google OAuth
        // This will verify the Google token and create/login user
        
        /*
        // 1. Verify Google token
        GoogleIdToken.Payload payload = verifier.verify(idToken);
        
        // 2. Extract user info
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String googleId = payload.getSubject();
        
        // 3. Find or create user
        User user = userRepository.findByGoogleId(googleId)
            .orElseGet(() -> {
                // Create new user with Google info
                RegisterRequest registerRequest = new RegisterRequest();
                registerRequest.setUsername(email.split("@")[0]);
                registerRequest.setEmail(email);
                registerRequest.setFullName(name);
                registerRequest.setPassword("GOOGLE_AUTH"); // Random password
                registerRequest.setRole("TEACHER");
                
                UserResponse userResponse = userService.registerUser(registerRequest);
                return userRepository.findById(userResponse.getUserId()).get();
            });
        
        // 4. Generate JWT
        String jwt = jwtUtils.generateTokenFromUsername(user.getUsername());
        String refreshToken = refreshTokenService.createRefreshToken(user.getUserId());
        
        return new JwtResponse(
            jwt,
            refreshToken,
            user.getUserId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole().name()
        );
        */
        
        throw new UnsupportedOperationException("Google login not implemented yet");
    }
    
    // Helper method to get current authenticated user
    public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        }
        
        throw new UnauthorizedException("No authenticated user found");
    }
}