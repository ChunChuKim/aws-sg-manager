package com.aws.sgmanager.controller;

import com.aws.sgmanager.dto.UserDTO;
import com.aws.sgmanager.model.User;
import com.aws.sgmanager.repository.UserRepository;
import com.aws.sgmanager.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {
    
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        User userDetails = (User) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());
        
        // 마지막 로그인 시간 업데이트
        userDetails.setLastLoginAt(LocalDateTime.now());
        userRepository.save(userDetails);
        
        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getFullName(),
                roles));
    }
    
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }
        
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }
        
        // Create new user's account
        Set<User.Role> roles = new HashSet<>();
        
        if (signUpRequest.getRole() == null || signUpRequest.getRole().isEmpty()) {
            roles.add(User.Role.ROLE_USER);
        } else {
            signUpRequest.getRole().forEach(role -> {
                switch (role) {
                    case "admin":
                        roles.add(User.Role.ROLE_ADMIN);
                        break;
                    default:
                        roles.add(User.Role.ROLE_USER);
                }
            });
        }
        
        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .fullName(signUpRequest.getFullName())
                .password(encoder.encode(signUpRequest.getPassword()))
                .roles(roles)
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        userRepository.save(user);
        
        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.unauthorized().build();
        }
        
        User user = (User) authentication.getPrincipal();
        
        UserDTO userDTO = UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(user.getRoles())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
        
        return ResponseEntity.ok(userDTO);
    }
    
    // Request/Response DTOs
    @lombok.Data
    public static class LoginRequest {
        @jakarta.validation.constraints.NotBlank
        private String username;
        
        @jakarta.validation.constraints.NotBlank
        private String password;
    }
    
    @lombok.Data
    public static class SignupRequest {
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Size(min = 3, max = 20)
        private String username;
        
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Size(max = 50)
        @jakarta.validation.constraints.Email
        private String email;
        
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Size(max = 100)
        private String fullName;
        
        private Set<String> role;
        
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Size(min = 6, max = 40)
        private String password;
    }
    
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class JwtResponse {
        private String token;
        private String type = "Bearer";
        private String id;
        private String username;
        private String email;
        private String fullName;
        private List<String> roles;
        
        public JwtResponse(String accessToken, String id, String username, String email, String fullName, List<String> roles) {
            this.token = accessToken;
            this.id = id;
            this.username = username;
            this.email = email;
            this.fullName = fullName;
            this.roles = roles;
        }
    }
    
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class MessageResponse {
        private String message;
    }
}
