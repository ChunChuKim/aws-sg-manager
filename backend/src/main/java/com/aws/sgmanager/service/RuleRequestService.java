package com.aws.sgmanager.service;

import com.aws.sgmanager.dto.RuleRequestDTO;
import com.aws.sgmanager.dto.SecurityGroupRuleDTO;
import com.aws.sgmanager.model.RuleRequest;
import com.aws.sgmanager.model.SecurityGroup;
import com.aws.sgmanager.model.User;
import com.aws.sgmanager.repository.RuleRequestRepository;
import com.aws.sgmanager.repository.SecurityGroupRepository;
import com.aws.sgmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RuleRequestService {
    
    private final RuleRequestRepository ruleRequestRepository;
    private final SecurityGroupRepository securityGroupRepository;
    private final UserRepository userRepository;
    private final SecurityGroupService securityGroupService;
    private final NotificationService notificationService;
    
    /**
     * 규칙 추가 요청 생성
     */
    public RuleRequestDTO createRuleRequest(RuleRequestDTO requestDTO, String requesterId) {
        try {
            // 요청자 정보 조회
            User requester = userRepository.findById(requesterId)
                    .orElseThrow(() -> new RuntimeException("Requester not found"));
            
            // Security Group 존재 확인
            SecurityGroup securityGroup = securityGroupRepository.findById(requestDTO.getSecurityGroupId())
                    .orElseThrow(() -> new RuntimeException("Security Group not found"));
            
            RuleRequest ruleRequest = RuleRequest.builder()
                    .securityGroupId(requestDTO.getSecurityGroupId())
                    .requesterId(requesterId)
                    .requesterName(requester.getFullName())
                    .requesterEmail(requester.getEmail())
                    .requestType(requestDTO.getRequestType())
                    .ruleType(requestDTO.getRuleType())
                    .ipProtocol(requestDTO.getIpProtocol())
                    .fromPort(requestDTO.getFromPort())
                    .toPort(requestDTO.getToPort())
                    .cidrBlocks(requestDTO.getCidrBlocks())
                    .ipv6CidrBlocks(requestDTO.getIpv6CidrBlocks())
                    .description(requestDTO.getDescription())
                    .expiryDate(requestDTO.getExpiryDate())
                    .autoDelete(requestDTO.isAutoDelete())
                    .businessJustification(requestDTO.getBusinessJustification())
                    .technicalJustification(requestDTO.getTechnicalJustification())
                    .priority(requestDTO.getPriority())
                    .status(RuleRequest.RequestStatus.PENDING)
                    .requestedAt(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            
            RuleRequest saved = ruleRequestRepository.save(ruleRequest);
            
            // 관리자에게 알림 전송
            notificationService.sendNewRequestNotification(saved, securityGroup);
            
            log.info("Created rule request: {} by user: {}", saved.getId(), requesterId);
            
            return convertToDTO(saved);
            
        } catch (Exception e) {
            log.error("Failed to create rule request", e);
            throw new RuntimeException("Failed to create rule request", e);
        }
    }
    
    /**
     * 모든 요청 조회 (페이징)
     */
    public Page<RuleRequestDTO> getAllRequests(Pageable pageable) {
        Page<RuleRequest> requests = ruleRequestRepository.findAll(pageable);
        return requests.map(this::convertToDTO);
    }
    
    /**
     * 상태별 요청 조회
     */
    public Page<RuleRequestDTO> getRequestsByStatus(RuleRequest.RequestStatus status, Pageable pageable) {
        Page<RuleRequest> requests = ruleRequestRepository.findByStatus(status, pageable);
        return requests.map(this::convertToDTO);
    }
    
    /**
     * 사용자별 요청 조회
     */
    public List<RuleRequestDTO> getRequestsByUser(String userId) {
        List<RuleRequest> requests = ruleRequestRepository.findByRequesterId(userId);
        return requests.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 대기 중인 요청 조회
     */
    public List<RuleRequestDTO> getPendingRequests() {
        List<RuleRequest> requests = ruleRequestRepository.findByStatus(RuleRequest.RequestStatus.PENDING);
        return requests.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 높은 우선순위 대기 요청 조회
     */
    public List<RuleRequestDTO> getHighPriorityPendingRequests() {
        List<RuleRequest> requests = ruleRequestRepository.findHighPriorityPendingRequests();
        return requests.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 요청 승인
     */
    public RuleRequestDTO approveRequest(String requestId, String reviewerId, String reviewComment) {
        RuleRequest request = ruleRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (request.getStatus() != RuleRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Request is not in pending status");
        }
        
        try {
            // 검토자 정보 조회
            User reviewer = userRepository.findById(reviewerId)
                    .orElseThrow(() -> new RuntimeException("Reviewer not found"));
            
            // 요청 상태 업데이트
            request.setStatus(RuleRequest.RequestStatus.APPROVED);
            request.setReviewerId(reviewerId);
            request.setReviewerName(reviewer.getFullName());
            request.setReviewComment(reviewComment);
            request.setReviewedAt(LocalDateTime.now());
            request.setUpdatedAt(LocalDateTime.now());
            
            RuleRequest updated = ruleRequestRepository.save(request);
            
            // AWS에 실제 규칙 적용
            applyApprovedRequest(updated);
            
            // 요청자에게 승인 알림 전송
            notificationService.sendRequestApprovedNotification(updated);
            
            log.info("Approved rule request: {} by reviewer: {}", requestId, reviewerId);
            
            return convertToDTO(updated);
            
        } catch (Exception e) {
            log.error("Failed to approve request: {}", requestId, e);
            
            // 실패 시 상태를 FAILED로 변경
            request.setStatus(RuleRequest.RequestStatus.FAILED);
            request.setReviewComment("Failed to apply rule: " + e.getMessage());
            request.setUpdatedAt(LocalDateTime.now());
            ruleRequestRepository.save(request);
            
            throw new RuntimeException("Failed to approve request", e);
        }
    }
    
    /**
     * 요청 거절
     */
    public RuleRequestDTO rejectRequest(String requestId, String reviewerId, String reviewComment) {
        RuleRequest request = ruleRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (request.getStatus() != RuleRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Request is not in pending status");
        }
        
        try {
            // 검토자 정보 조회
            User reviewer = userRepository.findById(reviewerId)
                    .orElseThrow(() -> new RuntimeException("Reviewer not found"));
            
            // 요청 상태 업데이트
            request.setStatus(RuleRequest.RequestStatus.REJECTED);
            request.setReviewerId(reviewerId);
            request.setReviewerName(reviewer.getFullName());
            request.setReviewComment(reviewComment);
            request.setReviewedAt(LocalDateTime.now());
            request.setUpdatedAt(LocalDateTime.now());
            
            RuleRequest updated = ruleRequestRepository.save(request);
            
            // 요청자에게 거절 알림 전송
            notificationService.sendRequestRejectedNotification(updated);
            
            log.info("Rejected rule request: {} by reviewer: {}", requestId, reviewerId);
            
            return convertToDTO(updated);
            
        } catch (Exception e) {
            log.error("Failed to reject request: {}", requestId, e);
            throw new RuntimeException("Failed to reject request", e);
        }
    }
    
    /**
     * 요청 취소 (요청자만 가능)
     */
    public RuleRequestDTO cancelRequest(String requestId, String userId) {
        RuleRequest request = ruleRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (!request.getRequesterId().equals(userId)) {
            throw new RuntimeException("Only the requester can cancel the request");
        }
        
        if (request.getStatus() != RuleRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }
        
        request.setStatus(RuleRequest.RequestStatus.CANCELLED);
        request.setUpdatedAt(LocalDateTime.now());
        
        RuleRequest updated = ruleRequestRepository.save(request);
        
        log.info("Cancelled rule request: {} by user: {}", requestId, userId);
        
        return convertToDTO(updated);
    }
    
    /**
     * 요청 통계 조회
     */
    public RequestStatistics getRequestStatistics() {
        long totalRequests = ruleRequestRepository.count();
        long pendingRequests = ruleRequestRepository.countByStatus(RuleRequest.RequestStatus.PENDING);
        long approvedRequests = ruleRequestRepository.countByStatus(RuleRequest.RequestStatus.APPROVED);
        long rejectedRequests = ruleRequestRepository.countByStatus(RuleRequest.RequestStatus.REJECTED);
        
        return RequestStatistics.builder()
                .totalRequests(totalRequests)
                .pendingRequests(pendingRequests)
                .approvedRequests(approvedRequests)
                .rejectedRequests(rejectedRequests)
                .build();
    }
    
    /**
     * 승인된 요청을 실제 AWS에 적용
     */
    private void applyApprovedRequest(RuleRequest request) {
        try {
            SecurityGroupRuleDTO ruleDTO = SecurityGroupRuleDTO.builder()
                    .ipProtocol(request.getIpProtocol())
                    .fromPort(request.getFromPort())
                    .toPort(request.getToPort())
                    .cidrBlocks(request.getCidrBlocks())
                    .ipv6CidrBlocks(request.getIpv6CidrBlocks())
                    .description(request.getDescription())
                    .expiryDate(request.getExpiryDate())
                    .autoDelete(request.isAutoDelete())
                    .build();
            
            if (request.getRuleType() == com.aws.sgmanager.model.SecurityGroupRule.RuleType.INBOUND) {
                securityGroupService.addInboundRule(request.getSecurityGroupId(), ruleDTO, request.getReviewerId());
            } else {
                securityGroupService.addOutboundRule(request.getSecurityGroupId(), ruleDTO, request.getReviewerId());
            }
            
            // 상태를 APPLIED로 변경
            request.setStatus(RuleRequest.RequestStatus.APPLIED);
            request.setUpdatedAt(LocalDateTime.now());
            ruleRequestRepository.save(request);
            
        } catch (Exception e) {
            log.error("Failed to apply approved request: {}", request.getId(), e);
            throw e;
        }
    }
    
    /**
     * RuleRequest를 DTO로 변환
     */
    private RuleRequestDTO convertToDTO(RuleRequest request) {
        // Security Group 이름 조회
        String securityGroupName = securityGroupRepository.findById(request.getSecurityGroupId())
                .map(SecurityGroup::getGroupName)
                .orElse("Unknown");
        
        LocalDateTime now = LocalDateTime.now();
        long daysSinceRequested = ChronoUnit.DAYS.between(request.getRequestedAt(), now);
        boolean isUrgent = request.getPriority() == RuleRequest.Priority.URGENT || 
                          request.getPriority() == RuleRequest.Priority.HIGH;
        
        return RuleRequestDTO.builder()
                .id(request.getId())
                .securityGroupId(request.getSecurityGroupId())
                .securityGroupName(securityGroupName)
                .requesterId(request.getRequesterId())
                .requesterName(request.getRequesterName())
                .requesterEmail(request.getRequesterEmail())
                .requestType(request.getRequestType())
                .ruleType(request.getRuleType())
                .ipProtocol(request.getIpProtocol())
                .fromPort(request.getFromPort())
                .toPort(request.getToPort())
                .cidrBlocks(request.getCidrBlocks())
                .ipv6CidrBlocks(request.getIpv6CidrBlocks())
                .description(request.getDescription())
                .expiryDate(request.getExpiryDate())
                .autoDelete(request.isAutoDelete())
                .businessJustification(request.getBusinessJustification())
                .technicalJustification(request.getTechnicalJustification())
                .priority(request.getPriority())
                .status(request.getStatus())
                .reviewerId(request.getReviewerId())
                .reviewerName(request.getReviewerName())
                .reviewComment(request.getReviewComment())
                .reviewedAt(request.getReviewedAt())
                .requestedAt(request.getRequestedAt())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .appliedRuleId(request.getAppliedRuleId())
                .daysSinceRequested(daysSinceRequested)
                .isUrgent(isUrgent)
                .statusDisplayName(getStatusDisplayName(request.getStatus()))
                .priorityDisplayName(getPriorityDisplayName(request.getPriority()))
                .build();
    }
    
    private String getStatusDisplayName(RuleRequest.RequestStatus status) {
        return switch (status) {
            case PENDING -> "대기 중";
            case APPROVED -> "승인됨";
            case REJECTED -> "거절됨";
            case APPLIED -> "적용됨";
            case FAILED -> "실패";
            case CANCELLED -> "취소됨";
        };
    }
    
    private String getPriorityDisplayName(RuleRequest.Priority priority) {
        return switch (priority) {
            case LOW -> "낮음";
            case MEDIUM -> "보통";
            case HIGH -> "높음";
            case URGENT -> "긴급";
        };
    }
    
    @lombok.Data
    @lombok.Builder
    public static class RequestStatistics {
        private long totalRequests;
        private long pendingRequests;
        private long approvedRequests;
        private long rejectedRequests;
    }
}
