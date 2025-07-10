package com.aws.sgmanager.dto;

import com.aws.sgmanager.model.User;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    
    private String id;
    
    private String username;
    
    private String email;
    
    private String fullName;
    
    private Set<User.Role> roles;
    
    private boolean enabled;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime lastLoginAt;
}
