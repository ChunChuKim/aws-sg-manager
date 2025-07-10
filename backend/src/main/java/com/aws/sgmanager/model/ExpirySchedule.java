package com.aws.sgmanager.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "expiry_schedules")
public class ExpirySchedule {
    
    @Id
    private String id;
    
    private String securityGroupId;
    
    private String ruleId; // null이면 전체 Security Group 만료
    
    @Indexed
    private LocalDateTime expiryDate;
    
    private ExpiryAction action;
    
    private ExpiryStatus status;
    
    private String createdBy;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // 알림 관련
    private boolean notificationSent1Day;
    
    private boolean notificationSentSameDay;
    
    private LocalDateTime lastNotificationAt;
    
    // 실행 관련
    private LocalDateTime executedAt;
    
    private String executionResult;
    
    private String errorMessage;
    
    public enum ExpiryAction {
        DELETE_RULE,        // 규칙 삭제
        DELETE_GROUP,       // Security Group 삭제
        NOTIFY_ONLY         // 알림만 전송
    }
    
    public enum ExpiryStatus {
        SCHEDULED,          // 예약됨
        NOTIFICATION_SENT,  // 알림 전송됨
        EXECUTED,           // 실행됨
        FAILED,             // 실행 실패
        CANCELLED           // 취소됨
    }
}
