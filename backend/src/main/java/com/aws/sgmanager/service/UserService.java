package com.aws.sgmanager.service;

import com.aws.sgmanager.dto.UserDTO;
import com.aws.sgmanager.model.User;
import com.aws.sgmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * 모든 사용자 조회
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 사용자 ID로 조회
     */
    public Optional<UserDTO> getUserById(String id) {
        return userRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    /**
     * 사용자명으로 조회
     */
    public Optional<UserDTO> getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(this::convertToDTO);
    }
    
    /**
     * 사용자 생성
     */
    public UserDTO createUser(String username, String email, String fullName, 
                             String password, Set<User.Role> roles) {
        
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = User.builder()
                .username(username)
                .email(email)
                .fullName(fullName)
                .password(passwordEncoder.encode(password))
                .roles(roles)
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        User saved = userRepository.save(user);
        
        log.info("Created user: {}", saved.getUsername());
        
        return convertToDTO(saved);
    }
    
    /**
     * 사용자 정보 업데이트
     */
    public UserDTO updateUser(String id, String email, String fullName) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setEmail(email);
        user.setFullName(fullName);
        user.setUpdatedAt(LocalDateTime.now());
        
        User updated = userRepository.save(user);
        
        log.info("Updated user: {}", updated.getUsername());
        
        return convertToDTO(updated);
    }
    
    /**
     * 사용자 활성화/비활성화
     */
    public UserDTO toggleUserStatus(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setEnabled(!user.isEnabled());
        user.setUpdatedAt(LocalDateTime.now());
        
        User updated = userRepository.save(user);
        
        log.info("Toggled user status: {} -> {}", updated.getUsername(), updated.isEnabled());
        
        return convertToDTO(updated);
    }
    
    /**
     * 비밀번호 변경
     */
    public void changePassword(String id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        log.info("Changed password for user: {}", user.getUsername());
    }
    
    /**
     * 사용자 삭제
     */
    public void deleteUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        userRepository.deleteById(id);
        
        log.info("Deleted user: {}", user.getUsername());
    }
    
    /**
     * User를 DTO로 변환
     */
    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(user.getRoles())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
