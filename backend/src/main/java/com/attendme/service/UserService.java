package com.attendme.service;

import com.attendme.dto.requestdto.RegisterRequest;
import com.attendme.dto.requestdto.UserUpdateRequest;
import com.attendme.dto.response.UserResponse;
import com.attendme.entity.User;

import java.util.List;

public interface UserService {
    
    
    UserResponse registerUser(RegisterRequest request);
    
    
    UserResponse getUserById(Long id);
    
    UserResponse getUserByUsername(String username);
    
    UserResponse getUserByEmail(String email);
    
    
    List<UserResponse> getAllUsers();
    
    
    List<UserResponse> getUsersByRole(String role);
    
    
    List<UserResponse> getTeachersWithClasses();
    
    
    UserResponse updateUser(Long id, UserUpdateRequest request);
    
    
    void deleteUser(Long id);
    
    
    UserResponse activateUser(Long id);
    
    UserResponse deactivateUser(Long id);
    
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    
    User getCurrentUser();
    
    
    void updateLastLogin(String username);
}