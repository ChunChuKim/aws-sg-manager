package com.aws.sgmanager.service;

import com.aws.sgmanager.model.ExpirySchedule;
import com.aws.sgmanager.model.SecurityGroup;
import com.aws.sgmanager.repository.ExpiryScheduleRepository;
import com.aws.sgmanager.repository.SecurityGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ExpiryScheduleService {
    
    private final ExpiryScheduleRepository expiryScheduleRepository;
    private final SecurityGroupRepository securityGroupRepository;
    private final AwsEc2Service awsEc2Service;
    private final NotificationService notificationService;
    
    /**
     * Security Group 만료 스케줄 등록
     */
    public ExpirySchedule scheduleSecurityGroupExpiry(String securityGroupId, LocalDateTime expiryDate, String createdBy) {
        ExpirySchedule schedule = ExpirySchedule.builder()
                .securityGroupId(securityGroupId)
                .ruleId(null) // Security Group 전체 만료
                .expiryDate(expiryDate)
                .action(ExpirySchedule.ExpiryAction.DELETE_GROUP)
                .status(ExpirySchedule.ExpiryStatus.SCHEDULED)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .notificationSent1Day(false)
                .notificationSentSameDay(false)
                .build();
        
        ExpirySchedule saved = expiryScheduleRepository.save(schedule);
        
        log.info("Scheduled Security Group expiry: {} at {}", securityGroupId, expiryDate);
        
        return saved;
    }
    
    /**
     * 규칙 만료 스케줄 등록
     */
    public ExpirySchedule scheduleRuleExpiry(String securityGroupId, String ruleId, LocalDateTime expiryDate, String createdBy) {
        ExpirySchedule schedule = ExpirySchedule.builder()
                .securityGroupId(securityGroupId)
                .ruleId(ruleId)
                .expiryDate(expiryDate)
                .action(ExpirySchedule.ExpiryAction.DELETE_RULE)
                .status(ExpirySchedule.ExpiryStatus.SCHEDULED)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .notificationSent1Day(false)
                .notificationSentSameDay(false)
                .build();
        
        ExpirySchedule saved = expiryScheduleRepository.save(schedule);
        
        log.info("Scheduled rule expiry: {} in Security Group {} at {}", ruleId, securityGroupId, expiryDate);
        
        return saved;
    }
    
    /**
     * Security Group 만료 스케줄 취소
     */
    public void cancelSecurityGroupExpiry(String securityGroupId) {
        List<ExpirySchedule> schedules = expiryScheduleRepository.findBySecurityGroupId(securityGroupId);
        
        for (ExpirySchedule schedule : schedules) {
            if (schedule.getStatus() == ExpirySchedule.ExpiryStatus.SCHEDULED) {
                schedule.setStatus(ExpirySchedule.ExpiryStatus.CANCELLED);
                schedule.setUpdatedAt(LocalDateTime.now());
                expiryScheduleRepository.save(schedule);
            }
        }
        
        log.info("Cancelled expiry schedules for Security Group: {}", securityGroupId);
    }
    
    /**
     * 규칙 만료 스케줄 취소
     */
    public void cancelRuleExpiry(String securityGroupId, String ruleId) {
        List<ExpirySchedule> schedules = expiryScheduleRepository.findBySecurityGroupIdAndRuleId(securityGroupId, ruleId);
        
        for (ExpirySchedule schedule : schedules) {
            if (schedule.getStatus() == ExpirySchedule.ExpiryStatus.SCHEDULED) {
                schedule.setStatus(ExpirySchedule.ExpiryStatus.CANCELLED);
                schedule.setUpdatedAt(LocalDateTime.now());
                expiryScheduleRepository.save(schedule);
            }
        }
        
        log.info("Cancelled expiry schedule for rule: {} in Security Group: {}", ruleId, securityGroupId);
    }
    
    /**
     * 1일 전 알림 전송 (매일 09:00 실행)
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendOneDayExpiryNotifications() {
        log.info("Starting 1-day expiry notification job");
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);
        LocalDateTime tomorrowEnd = tomorrow.withHour(23).withMinute(59).withSecond(59);
        
        List<ExpirySchedule> schedules = expiryScheduleRepository.findSchedulesForOneDayNotification(tomorrow, tomorrowEnd);
        
        for (ExpirySchedule schedule : schedules) {
            try {
                Optional<SecurityGroup> securityGroupOpt = securityGroupRepository.findById(schedule.getSecurityGroupId());
                
                if (securityGroupOpt.isPresent()) {
                    SecurityGroup securityGroup = securityGroupOpt.get();
                    
                    // 알림 전송
                    notificationService.sendExpiryWarningNotification(schedule, securityGroup);
                    
                    // 알림 전송 상태 업데이트
                    schedule.setNotificationSent1Day(true);
                    schedule.setLastNotificationAt(LocalDateTime.now());
                    schedule.setUpdatedAt(LocalDateTime.now());
                    expiryScheduleRepository.save(schedule);
                    
                    log.info("Sent 1-day expiry notification for schedule: {}", schedule.getId());
                } else {
                    log.warn("Security Group not found for schedule: {}", schedule.getId());
                }
                
            } catch (Exception e) {
                log.error("Failed to send 1-day expiry notification for schedule: {}", schedule.getId(), e);
            }
        }
        
        log.info("Completed 1-day expiry notification job. Processed {} schedules", schedules.size());
    }
    
    /**
     * 당일 알림 전송 (매일 09:00 실행)
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendSameDayExpiryNotifications() {
        log.info("Starting same-day expiry notification job");
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayEnd = now.withHour(23).withMinute(59).withSecond(59);
        
        List<ExpirySchedule> schedules = expiryScheduleRepository.findSchedulesForSameDayNotification(now, todayEnd);
        
        for (ExpirySchedule schedule : schedules) {
            try {
                Optional<SecurityGroup> securityGroupOpt = securityGroupRepository.findById(schedule.getSecurityGroupId());
                
                if (securityGroupOpt.isPresent()) {
                    SecurityGroup securityGroup = securityGroupOpt.get();
                    
                    // 알림 전송
                    notificationService.sendExpiryNotification(schedule, securityGroup);
                    
                    // 알림 전송 상태 업데이트
                    schedule.setNotificationSentSameDay(true);
                    schedule.setLastNotificationAt(LocalDateTime.now());
                    schedule.setUpdatedAt(LocalDateTime.now());
                    expiryScheduleRepository.save(schedule);
                    
                    log.info("Sent same-day expiry notification for schedule: {}", schedule.getId());
                } else {
                    log.warn("Security Group not found for schedule: {}", schedule.getId());
                }
                
            } catch (Exception e) {
                log.error("Failed to send same-day expiry notification for schedule: {}", schedule.getId(), e);
            }
        }
        
        log.info("Completed same-day expiry notification job. Processed {} schedules", schedules.size());
    }
    
    /**
     * 만료된 리소스 자동 삭제 (매시간 실행)
     */
    @Scheduled(cron = "0 0 * * * *")
    public void executeExpiredSchedules() {
        log.info("Starting expired schedules execution job");
        
        LocalDateTime now = LocalDateTime.now();
        List<ExpirySchedule> expiredSchedules = expiryScheduleRepository.findSchedulesReadyForExecution(now);
        
        for (ExpirySchedule schedule : expiredSchedules) {
            try {
                executeExpiredSchedule(schedule);
            } catch (Exception e) {
                log.error("Failed to execute expired schedule: {}", schedule.getId(), e);
                
                // 실행 실패 상태로 업데이트
                schedule.setStatus(ExpirySchedule.ExpiryStatus.FAILED);
                schedule.setExecutedAt(LocalDateTime.now());
                schedule.setErrorMessage(e.getMessage());
                schedule.setUpdatedAt(LocalDateTime.now());
                expiryScheduleRepository.save(schedule);
            }
        }
        
        log.info("Completed expired schedules execution job. Processed {} schedules", expiredSchedules.size());
    }
    
    /**
     * 만료된 스케줄 실행
     */
    private void executeExpiredSchedule(ExpirySchedule schedule) {
        Optional<SecurityGroup> securityGroupOpt = securityGroupRepository.findById(schedule.getSecurityGroupId());
        
        if (securityGroupOpt.isEmpty()) {
            log.warn("Security Group not found for schedule: {}", schedule.getId());
            schedule.setStatus(ExpirySchedule.ExpiryStatus.FAILED);
            schedule.setErrorMessage("Security Group not found");
            schedule.setExecutedAt(LocalDateTime.now());
            schedule.setUpdatedAt(LocalDateTime.now());
            expiryScheduleRepository.save(schedule);
            return;
        }
        
        SecurityGroup securityGroup = securityGroupOpt.get();
        boolean success = false;
        String errorMessage = null;
        
        try {
            if (schedule.getAction() == ExpirySchedule.ExpiryAction.DELETE_GROUP) {
                // Security Group 전체 삭제
                awsEc2Service.deleteSecurityGroup(securityGroup.getGroupId());
                securityGroupRepository.deleteById(securityGroup.getId());
                success = true;
                
                log.info("Deleted expired Security Group: {} ({})", securityGroup.getGroupName(), securityGroup.getGroupId());
                
            } else if (schedule.getAction() == ExpirySchedule.ExpiryAction.DELETE_RULE) {
                // 특정 규칙 삭제
                deleteExpiredRule(securityGroup, schedule.getRuleId());
                success = true;
                
                log.info("Deleted expired rule: {} from Security Group: {}", schedule.getRuleId(), securityGroup.getGroupName());
                
            } else if (schedule.getAction() == ExpirySchedule.ExpiryAction.NOTIFY_ONLY) {
                // 알림만 전송 (삭제하지 않음)
                success = true;
                
                log.info("Notification-only schedule executed for: {}", securityGroup.getGroupName());
            }
            
        } catch (Exception e) {
            success = false;
            errorMessage = e.getMessage();
            log.error("Failed to execute expired schedule: {}", schedule.getId(), e);
        }
        
        // 스케줄 상태 업데이트
        schedule.setStatus(success ? ExpirySchedule.ExpiryStatus.EXECUTED : ExpirySchedule.ExpiryStatus.FAILED);
        schedule.setExecutedAt(LocalDateTime.now());
        schedule.setExecutionResult(success ? "SUCCESS" : "FAILED");
        schedule.setErrorMessage(errorMessage);
        schedule.setUpdatedAt(LocalDateTime.now());
        expiryScheduleRepository.save(schedule);
        
        // 삭제 완료/실패 알림 전송
        notificationService.sendDeletionNotification(schedule, securityGroup, success, errorMessage);
    }
    
    /**
     * 만료된 규칙 삭제
     */
    private void deleteExpiredRule(SecurityGroup securityGroup, String ruleId) {
        // 인바운드 규칙에서 찾기
        if (securityGroup.getInboundRules() != null) {
            securityGroup.getInboundRules().removeIf(rule -> {
                if (ruleId.equals(rule.getRuleId())) {
                    try {
                        awsEc2Service.removeInboundRule(securityGroup.getGroupId(), rule);
                        return true;
                    } catch (Exception e) {
                        log.error("Failed to remove inbound rule from AWS", e);
                        throw new RuntimeException("Failed to remove inbound rule", e);
                    }
                }
                return false;
            });
        }
        
        // 아웃바운드 규칙에서 찾기
        if (securityGroup.getOutboundRules() != null) {
            securityGroup.getOutboundRules().removeIf(rule -> {
                if (ruleId.equals(rule.getRuleId())) {
                    try {
                        awsEc2Service.removeOutboundRule(securityGroup.getGroupId(), rule);
                        return true;
                    } catch (Exception e) {
                        log.error("Failed to remove outbound rule from AWS", e);
                        throw new RuntimeException("Failed to remove outbound rule", e);
                    }
                }
                return false;
            });
        }
        
        // DB 업데이트
        securityGroup.setUpdatedAt(LocalDateTime.now());
        securityGroupRepository.save(securityGroup);
    }
    
    /**
     * 활성 스케줄 조회
     */
    public List<ExpirySchedule> getActiveSchedules() {
        return expiryScheduleRepository.findByStatus(ExpirySchedule.ExpiryStatus.SCHEDULED);
    }
    
    /**
     * Security Group별 스케줄 조회
     */
    public List<ExpirySchedule> getSchedulesBySecurityGroup(String securityGroupId) {
        return expiryScheduleRepository.findBySecurityGroupId(securityGroupId);
    }
}
