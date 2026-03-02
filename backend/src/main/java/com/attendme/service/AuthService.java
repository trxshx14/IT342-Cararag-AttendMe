package com.attendme.service;

import com.attendme.dto.requestdto.LoginRequest;
import com.attendme.dto.requestdto.RegisterRequest;
import com.attendme.dto.requestdto.RefreshTokenRequest;
import com.attendme.dto.response.JwtResponse;
import com.attendme.dto.response.UserResponse;

public interface AuthService {
    
    JwtResponse login(LoginRequest request);
    
    UserResponse register(RegisterRequest request);
    
    JwtResponse refreshToken(RefreshTokenRequest request);
    
    void logout(String refreshToken);
    
    JwtResponse googleLogin(String idToken);
}