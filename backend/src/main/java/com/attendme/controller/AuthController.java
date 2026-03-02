package com.attendme.controller;

import com.attendme.dto.requestdto.LoginRequest;
import com.attendme.dto.requestdto.RefreshTokenRequest;
import com.attendme.dto.requestdto.RegisterRequest;
import com.attendme.dto.response.ApiResponse;
import com.attendme.dto.response.JwtResponse;
import com.attendme.dto.response.UserResponse;
import com.attendme.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;


    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = userService.registerUser(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Login successful", null));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<JwtResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", null));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Authorization") String token) {

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UserResponse response = UserResponse.fromUser(userService.getCurrentUser());
        return ResponseEntity.ok(ApiResponse.success("Current user retrieved", response));
    }

    @PostMapping("/oauth2/google")
    public ResponseEntity<ApiResponse<JwtResponse>> googleLogin(@RequestParam String idToken) {

        return ResponseEntity.ok(ApiResponse.success("Google login successful", null));
    }
}
