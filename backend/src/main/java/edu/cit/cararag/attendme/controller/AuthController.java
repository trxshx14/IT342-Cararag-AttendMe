package edu.cit.cararag.attendme.controller;

import edu.cit.cararag.attendme.dto.requestdto.GoogleAuthRequest;
import edu.cit.cararag.attendme.dto.requestdto.LoginRequest;
import edu.cit.cararag.attendme.dto.requestdto.RegisterRequest;
import edu.cit.cararag.attendme.dto.response.ApiResponse;
import edu.cit.cararag.attendme.dto.response.JwtResponse;
import edu.cit.cararag.attendme.dto.response.UserResponse;
import edu.cit.cararag.attendme.service.AuthService;
import edu.cit.cararag.attendme.service.GoogleAuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private GoogleAuthService googleAuthService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@Valid @RequestBody LoginRequest request) {
        System.out.println("✅ AuthController.login() called!");
        try {
            JwtResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        System.out.println("✅ AuthController.register() called!");
        try {
            UserResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("User registered successfully", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400)
                    .body(ApiResponse.error("Registration failed: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        System.out.println("✅ AuthController.me() called!");
        try {
            UserResponse response = authService.getCurrentUser();
            return ResponseEntity.ok(ApiResponse.success("Current user retrieved", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to get current user: " + e.getMessage()));
        }
    }

    /**
     * Google Authentication endpoint.
     * Accepts either:
     *   - accessToken (from useGoogleLogin implicit flow) — preferred
     *   - idToken     (from GoogleLogin credential flow)
     */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<JwtResponse>> googleAuth(@RequestBody GoogleAuthRequest request) {
        System.out.println("✅ AuthController.googleAuth() called!");
        try {
            JwtResponse response;

            if (StringUtils.hasText(request.getAccessToken())) {
                // Frontend sent access_token (useGoogleLogin flow)
                System.out.println("🔵 Using access_token flow");
                response = googleAuthService.loginWithAccessToken(request.getAccessToken());
            } else if (StringUtils.hasText(request.getIdToken())) {
                // Frontend sent id_token (credential flow)
                System.out.println("🔵 Using id_token flow");
                response = googleAuthService.loginWithIdToken(request.getIdToken());
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Either accessToken or idToken is required"));
            }

            return ResponseEntity.ok(ApiResponse.success("Google login successful", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Google authentication failed: " + e.getMessage()));
        }
    }

    @GetMapping("/test")
    public String test() {
        return "AuthController is working!";
    }
}