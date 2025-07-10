package com.aws.sgmanager.dto;

import com.aws.sgmanager.model.SecurityGroupRule;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityGroupRuleDTO {
    
    private String ruleId;
    
    @NotBlank(message = "IP protocol is required")
    private String ipProtocol;
    
    @Min(value = -1, message = "Port must be -1 or between 0 and 65535")
    @Max(value = 65535, message = "Port must be -1 or between 0 and 65535")
    private Integer fromPort;
    
    @Min(value = -1, message = "Port must be -1 or between 0 and 65535")
    @Max(value = 65535, message = "Port must be -1 or between 0 and 65535")
    private Integer toPort;
    
    private List<String> cidrBlocks;
    
    private List<String> ipv6CidrBlocks;
    
    private List<SecurityGroupReferenceDTO> securityGroupReferences;
    
    private List<PrefixListIdDTO> prefixListIds;
    
    private String description;
    
    private LocalDateTime expiryDate;
    
    private boolean autoDelete;
    
    private String createdBy;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private SecurityGroupRule.RuleType ruleType;
    
    // 추가 정보
    private boolean isExpired;
    
    private long daysUntilExpiry;
    
    private String portRange; // "80" or "80-443" or "All"
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SecurityGroupReferenceDTO {
        private String groupId;
        private String groupOwnerId;
        private String description;
        private String groupName; // 추가 정보
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PrefixListIdDTO {
        private String prefixListId;
        private String description;
    }
}
