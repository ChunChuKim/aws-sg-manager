package com.aws.sgmanager.controller;

import com.aws.sgmanager.dto.RuleRequestDTO;
import com.aws.sgmanager.model.RuleRequest;
import com.aws.sgmanager.service.RuleRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RuleRequestController {
    
    private final RuleRequestService ruleRequestService;
    
    /**
     * 규칙 추가 요청 생성
     */
    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<RuleRequestDTO> createRuleRequest(
            @Valid @RequestBody RuleRequestDTO requestDTO,
            Authentication authentication) {
        try {
            String requesterId = getUserId(authentication);
            RuleRequestDTO created = ruleRequestService.createRuleRequest(requestDTO, requesterId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Failed to create rule request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 모든 요청 조회 (관리자만)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<RuleRequestDTO>> getAllRequests(Pageable pageable) {
        try {
            Page<RuleRequestDTO> requests = ruleRequestService.getAllRequests(pageable);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            log.error("Failed to get all requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 내 요청 조회
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<RuleRequestDTO>> getMyRequests(Authentication authentication) {
        try {
            String userId = getUserId(authentication);
            List<RuleRequestDTO> requests = ruleRequestService.getRequestsByUser(userId);
            
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            log.error("Failed to get user requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 상태별 요청 조회 (관리자만)
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<RuleRequestDTO>> getRequestsByStatus(
            @PathVariable RuleRequest.RequestStatus status,
            Pageable pageable) {
        try {
            Page<RuleRequestDTO> requests = ruleRequestService.getRequestsByStatus(status, pageable);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            log.error("Failed to get requests by status: {}", status, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 대기 중인 요청 조회 (관리자만)
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RuleRequestDTO>> getPendingRequests() {
        try {
            List<RuleRequestDTO> requests = ruleRequestService.getPendingRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            log.error("Failed to get pending requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 높은 우선순위 대기 요청 조회 (관리자만)
     */
    @GetMapping("/pending/high-priority")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RuleRequestDTO>> getHighPriorityPendingRequests() {
        try {
            List<RuleRequestDTO> requests = ruleRequestService.getHighPriorityPendingRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            log.error("Failed to get high priority pending requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 요청 승인 (관리자만)
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RuleRequestDTO> approveRequest(
            @PathVariable String id,
            @RequestBody ApprovalRequest approvalRequest,
            Authentication authentication) {
        try {
            String reviewerId = getUserId(authentication);
            RuleRequestDTO approved = ruleRequestService.approveRequest(
                    id, reviewerId, approvalRequest.getReviewComment());
            
            return ResponseEntity.ok(approved);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("not in pending status")) {
                return ResponseEntity.badRequest().build();
            }
            log.error("Failed to approve request: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 요청 거절 (관리자만)
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RuleRequestDTO> rejectRequest(
            @PathVariable String id,
            @RequestBody ApprovalRequest approvalRequest,
            Authentication authentication) {
        try {
            String reviewerId = getUserId(authentication);
            RuleRequestDTO rejected = ruleRequestService.rejectRequest(
                    id, reviewerId, approvalRequest.getReviewComment());
            
            return ResponseEntity.ok(rejected);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("not in pending status")) {
                return ResponseEntity.badRequest().build();
            }
            log.error("Failed to reject request: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 요청 취소 (요청자만)
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<RuleRequestDTO> cancelRequest(
            @PathVariable String id,
            Authentication authentication) {
        try {
            String userId = getUserId(authentication);
            RuleRequestDTO cancelled = ruleRequestService.cancelRequest(id, userId);
            
            return ResponseEntity.ok(cancelled);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("Only the requester") || 
                       e.getMessage().contains("Only pending requests")) {
                return ResponseEntity.badRequest().build();
            }
            log.error("Failed to cancel request: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 요청 통계 조회 (관리자만)
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RuleRequestService.RequestStatistics> getRequestStatistics() {
        try {
            RuleRequestService.RequestStatistics statistics = ruleRequestService.getRequestStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Failed to get request statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Authentication에서 사용자 ID 추출
     */
    private String getUserId(Authentication authentication) {
        // 실제 구현에서는 UserDetails에서 사용자 ID를 추출
        // 여기서는 간단히 username을 사용
        return authentication.getName();
    }
    
    /**
     * 승인/거절 요청 DTO
     */
    @lombok.Data
    public static class ApprovalRequest {
        private String reviewComment;
    }
}
