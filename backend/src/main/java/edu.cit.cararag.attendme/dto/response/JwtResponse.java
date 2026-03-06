package edu.cit.cararag.attendme.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String email;
    private String role;
    

    public JwtResponse(String accessToken, String refreshToken, Long userId,
                      String username, String email, String role) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = "Bearer";
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.role = role;
    }
    
}