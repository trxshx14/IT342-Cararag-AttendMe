package edu.cit.cararag.attendme.service;

import edu.cit.cararag.attendme.dto.requestdto.LoginRequest;
import edu.cit.cararag.attendme.dto.requestdto.RegisterRequest;
import edu.cit.cararag.attendme.dto.response.JwtResponse;
import edu.cit.cararag.attendme.dto.response.UserResponse;

public interface AuthService {
    JwtResponse login(LoginRequest request);
    UserResponse register(RegisterRequest request);
    UserResponse getCurrentUser();
}