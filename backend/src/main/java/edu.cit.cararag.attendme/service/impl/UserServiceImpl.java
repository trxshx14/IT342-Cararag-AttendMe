package edu.cit.cararag.attendme.service.impl;

import edu.cit.cararag.attendme.dto.requestdto.RegisterRequest;
import edu.cit.cararag.attendme.dto.requestdto.UserUpdateRequest;
import edu.cit.cararag.attendme.dto.response.UserResponse;
import edu.cit.cararag.attendme.entity.Role;
import edu.cit.cararag.attendme.entity.User;
import edu.cit.cararag.attendme.exception.DuplicateResourceException;
import edu.cit.cararag.attendme.exception.ResourceNotFoundException;
import edu.cit.cararag.attendme.repository.UserRepository;
import edu.cit.cararag.attendme.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public UserResponse registerUser(RegisterRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("User", "username", request.getUsername());
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }
        
        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        
        // Set role (default to TEACHER if not specified or not ADMIN)
        if (request.getRole() != null && request.getRole().equalsIgnoreCase("ADMIN")) {
            user.setRole(Role.ADMIN);
        } else {
            user.setRole(Role.TEACHER);
        }
        
        user.setIsActive(true);
        
        User savedUser = userRepository.save(user);
        return UserResponse.fromUser(savedUser);
    }
    
    @Override
    public UserResponse getUserById(Long id) {
        User user = findUserById(id);
        return UserResponse.fromUser(user);
    }
    
    @Override
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return UserResponse.fromUser(user);
    }
    
    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return UserResponse.fromUser(user);
    }
    
    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<UserResponse> getUsersByRole(String role) {
        try {
            Role userRole = Role.valueOf(role.toUpperCase());
            return userRepository.findByRole(userRole).stream()
                    .map(UserResponse::fromUser)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Role", "name", role);
        }
    }
    
    @Override
    public List<UserResponse> getTeachersWithClasses() {
        return userRepository.findTeachersWithClasses(Role.TEACHER).stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }
    
    @Override
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = findUserById(id);
        
        // Update username if provided and not taken
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            if (!request.getUsername().equals(user.getUsername()) && 
                userRepository.existsByUsername(request.getUsername())) {
                throw new DuplicateResourceException("User", "username", request.getUsername());
            }
            user.setUsername(request.getUsername());
        }
        
        // Update email if provided and not taken
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            if (!request.getEmail().equals(user.getEmail()) && 
                userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("User", "email", request.getEmail());
            }
            user.setEmail(request.getEmail());
        }
        
        // Update full name if provided
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            user.setFullName(request.getFullName());
        }
        
        
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            try {
                user.setRole(Role.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new ResourceNotFoundException("Role", "name", request.getRole());
            }
        }
        
        
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
        
        User updatedUser = userRepository.save(user);
        return UserResponse.fromUser(updatedUser);
    }
    
    @Override
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
    }
    
    @Override
    public UserResponse activateUser(Long id) {
        User user = findUserById(id);
        user.setIsActive(true);
        User updatedUser = userRepository.save(user);
        return UserResponse.fromUser(updatedUser);
    }
    
    @Override
    public UserResponse deactivateUser(Long id) {
        User user = findUserById(id);
        user.setIsActive(false);
        User updatedUser = userRepository.save(user);
        return UserResponse.fromUser(updatedUser);
    }
    
    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
    
    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    
    @Override
    public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }
    
    @Override
    public void updateLastLogin(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }
    
    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }
}