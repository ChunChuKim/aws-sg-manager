package com.aws.sgmanager.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "rule_requests")
public class RuleRequest {
    
    @Id
    private String id;
    
    private String securityGroupId; // 대상 Security Group ID
    
    private String requesterId; // 요청자 ID
    
    private String requesterName; // 요청자 이름
    
    private String requesterEmail; // 요청자 이메일
    
    private RequestType requestType; // 요청 타입
    
    private SecurityGroupRule.RuleType ruleType; // INBOUND, OUTBOUND
    
    // 요청할 규칙 정보
    private String ipProtocol;
    
    private Integer fromPort;
    
    private Integer toPort;
    
    private List<String> cidrBlocks;
    
    private List<String> ipv6CidrBlocks;
    
    private List<SecurityGroupRule.SecurityGroupReference> securityGroupReferences;
    
    private String description;
    
    private LocalDateTime expiryDate;
    
    private boolean autoDelete;
    
    // 요청 관련 정보
    private String businessJustification; // 비즈니스 사유
    
    private String technicalJustification; // 기술적 사유
    
    private Priority priority; // 우선순위
    
    private RequestStatus status; // 요청 상태
    
    private String reviewerId; // 검토자 ID
    
    private String reviewerName; // 검토자 이름
    
    private String reviewComment; // 검토 의견
    
    private LocalDateTime reviewedAt; // 검토 일시
    
    private LocalDateTime requestedAt; // 요청 일시
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // 승인 후 생성된 실제 규칙 ID
    private String appliedRuleId;
    
    public enum RequestType {
        ADD_RULE,       // 규칙 추가
        MODIFY_RULE,    // 규칙 수정
        DELETE_RULE     // 규칙 삭제
    }
    
    public enum RequestStatus {
        PENDING,        // 대기 중
        APPROVED,       // 승인됨
        REJECTED,       // 거절됨
        APPLIED,        // AWS에 적용됨
        FAILED,         // 적용 실패
        CANCELLED       // 취소됨
    }
    
    public enum Priority {
        LOW,            // 낮음
        MEDIUM,         // 보통
        HIGH,           // 높음
        URGENT          // 긴급
    }
}
