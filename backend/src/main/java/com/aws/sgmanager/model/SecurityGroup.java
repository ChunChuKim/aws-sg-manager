package com.aws.sgmanager.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "security_groups")
public class SecurityGroup {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String groupId; // AWS Security Group ID
    
    private String groupName;
    
    private String description;
    
    private String vpcId;
    
    private String ownerId;
    
    private List<SecurityGroupRule> inboundRules;
    
    private List<SecurityGroupRule> outboundRules;
    
    private Map<String, String> tags;
    
    private LocalDateTime expiryDate;
    
    private boolean autoDelete;
    
    private String createdBy;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private LocalDateTime lastSyncedAt;
    
    // AWS와 동기화 상태
    private SyncStatus syncStatus;
    
    public enum SyncStatus {
        SYNCED,      // AWS와 동기화됨
        PENDING,     // 동기화 대기 중
        FAILED,      // 동기화 실패
        DELETED      // AWS에서 삭제됨
    }
}
