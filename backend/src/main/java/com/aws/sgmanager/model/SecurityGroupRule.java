package com.aws.sgmanager.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityGroupRule {
    
    private String ruleId;
    
    private String ipProtocol; // tcp, udp, icmp, -1 (all)
    
    private Integer fromPort;
    
    private Integer toPort;
    
    private List<String> cidrBlocks;
    
    private List<String> ipv6CidrBlocks;
    
    private List<SecurityGroupReference> securityGroupReferences;
    
    private List<PrefixListId> prefixListIds;
    
    private String description;
    
    private LocalDateTime expiryDate;
    
    private boolean autoDelete;
    
    private String createdBy;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // 규칙 타입 (INBOUND, OUTBOUND)
    private RuleType ruleType;
    
    public enum RuleType {
        INBOUND, OUTBOUND
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SecurityGroupReference {
        private String groupId;
        private String groupOwnerId;
        private String description;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PrefixListId {
        private String prefixListId;
        private String description;
    }
}
