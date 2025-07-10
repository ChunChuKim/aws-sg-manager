package com.aws.sgmanager.service;

import com.aws.sgmanager.dto.SecurityGroupDTO;
import com.aws.sgmanager.model.SecurityGroup;
import com.aws.sgmanager.repository.SecurityGroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityGroupServiceTest {
    
    @Mock
    private SecurityGroupRepository securityGroupRepository;
    
    @Mock
    private AwsEc2Service awsEc2Service;
    
    @Mock
    private ExpiryScheduleService expiryScheduleService;
    
    @Mock
    private NotificationService notificationService;
    
    @InjectMocks
    private SecurityGroupService securityGroupService;
    
    private SecurityGroup testSecurityGroup;
    
    @BeforeEach
    void setUp() {
        testSecurityGroup = SecurityGroup.builder()
                .id("test-id")
                .groupId("sg-12345")
                .groupName("test-sg")
                .description("Test Security Group")
                .vpcId("vpc-12345")
                .ownerId("123456789012")
                .createdBy("test-user")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .syncStatus(SecurityGroup.SyncStatus.SYNCED)
                .build();
    }
    
    @Test
    void testGetSecurityGroup() {
        // Given
        when(securityGroupRepository.findById("test-id")).thenReturn(Optional.of(testSecurityGroup));
        
        // When
        Optional<SecurityGroupDTO> result = securityGroupService.getSecurityGroup("test-id");
        
        // Then
        assertTrue(result.isPresent());
        assertEquals("test-sg", result.get().getGroupName());
        assertEquals("sg-12345", result.get().getGroupId());
    }
    
    @Test
    void testGetSecurityGroupNotFound() {
        // Given
        when(securityGroupRepository.findById("non-existent")).thenReturn(Optional.empty());
        
        // When
        Optional<SecurityGroupDTO> result = securityGroupService.getSecurityGroup("non-existent");
        
        // Then
        assertFalse(result.isPresent());
    }
    
    @Test
    void testGetExpiredSecurityGroups() {
        // Given
        SecurityGroup expiredSG = SecurityGroup.builder()
                .id("expired-id")
                .groupId("sg-expired")
                .groupName("expired-sg")
                .expiryDate(LocalDateTime.now().minusDays(1))
                .autoDelete(true)
                .build();
        
        when(securityGroupRepository.findExpiredSecurityGroups(any(LocalDateTime.class)))
                .thenReturn(Arrays.asList(expiredSG));
        
        // When
        List<SecurityGroupDTO> result = securityGroupService.getExpiredSecurityGroups();
        
        // Then
        assertEquals(1, result.size());
        assertEquals("expired-sg", result.get(0).getGroupName());
    }
    
    @Test
    void testDeleteSecurityGroup() {
        // Given
        when(securityGroupRepository.findById("test-id")).thenReturn(Optional.of(testSecurityGroup));
        doNothing().when(awsEc2Service).deleteSecurityGroup("sg-12345");
        doNothing().when(expiryScheduleService).cancelSecurityGroupExpiry("test-id");
        doNothing().when(securityGroupRepository).deleteById("test-id");
        
        // When & Then
        assertDoesNotThrow(() -> securityGroupService.deleteSecurityGroup("test-id"));
        
        verify(awsEc2Service).deleteSecurityGroup("sg-12345");
        verify(expiryScheduleService).cancelSecurityGroupExpiry("test-id");
        verify(securityGroupRepository).deleteById("test-id");
    }
    
    @Test
    void testDeleteSecurityGroupNotFound() {
        // Given
        when(securityGroupRepository.findById("non-existent")).thenReturn(Optional.empty());
        
        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, 
                () -> securityGroupService.deleteSecurityGroup("non-existent"));
        
        assertEquals("Security Group not found", exception.getMessage());
    }
}
