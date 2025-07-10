package com.aws.sgmanager.dto;

import com.aws.sgmanager.model.RuleRequest;
import com.aws.sgmanager.model.SecurityGroupRule;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RuleRequestDTO {
    
    private String id;
    
    @NotBlank(message = "Security Group ID is required")
    private String securityGroupId;
    
    private String securityGroupName; // 추가 정보
    
    private String requesterId;
    
    private String requesterName;
    
    private String requesterEmail;
    
    @NotNull(message = "Request type is required")
    private RuleRequest.RequestType requestType;
    
    @NotNull(message = "Rule type is required")
    private SecurityGroupRule.RuleType ruleType;
    
    @NotBlank(message = "IP protocol is required")
    private String ipProtocol;
    
    private Integer fromPort;
    
    private Integer toPort;
    
    private List<String> cidrBlocks;
    
    private List<String> ipv6CidrBlocks;
    
    private List<SecurityGroupRuleDTO.SecurityGroupReferenceDTO> securityGroupReferences;
    
    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;
    
    private LocalDateTime expiryDate;
    
    private boolean autoDelete;
    
    @NotBlank(message = "Business justification is required")
    @Size(max = 1000, message = "Business justification must not exceed 1000 characters")
    private String businessJustification;
    
    @Size(max = 1000, message = "Technical justification must not exceed 1000 characters")
    private String technicalJustification;
    
    @NotNull(message = "Priority is required")
    private RuleRequest.Priority priority;
    
    private RuleRequest.RequestStatus status;
    
    private String reviewerId;
    
    private String reviewerName;
    
    @Size(max = 1000, message = "Review comment must not exceed 1000 characters")
    private String reviewComment;
    
    private LocalDateTime reviewedAt;
    
    private LocalDateTime requestedAt;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private String appliedRuleId;
    
    // 추가 정보
    private long daysSinceRequested;
    
    private boolean isUrgent;
    
    private String statusDisplayName;
    
    private String priorityDisplayName;
}
