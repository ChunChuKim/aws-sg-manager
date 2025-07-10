package com.aws.sgmanager.dto;

import com.aws.sgmanager.model.SecurityGroup;
import com.aws.sgmanager.model.SecurityGroupRule;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityGroupDTO {
    
    private String id;
    
    private String groupId;
    
    @NotBlank(message = "Group name is required")
    @Size(max = 255, message = "Group name must not exceed 255 characters")
    private String groupName;
    
    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;
    
    private String vpcId;
    
    private String ownerId;
    
    private List<SecurityGroupRuleDTO> inboundRules;
    
    private List<SecurityGroupRuleDTO> outboundRules;
    
    private Map<String, String> tags;
    
    private LocalDateTime expiryDate;
    
    private boolean autoDelete;
    
    private String createdBy;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private LocalDateTime lastSyncedAt;
    
    private SecurityGroup.SyncStatus syncStatus;
    
    // 추가 정보
    private int totalInboundRules;
    
    private int totalOutboundRules;
    
    private int expiredRulesCount;
    
    private boolean hasExpiredRules;
    
    private List<String> referencedByGroups; // 이 그룹을 참조하는 다른 그룹들
    
    private List<String> referencesToGroups; // 이 그룹이 참조하는 다른 그룹들
}
