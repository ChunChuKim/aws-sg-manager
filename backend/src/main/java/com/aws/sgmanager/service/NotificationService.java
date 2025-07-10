package com.aws.sgmanager.service;

import com.aws.sgmanager.model.RuleRequest;
import com.aws.sgmanager.model.SecurityGroup;
import com.aws.sgmanager.model.ExpirySchedule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final JavaMailSender mailSender;
    private final WebClient.Builder webClientBuilder;
    
    @Value("${notification.slack.webhook:}")
    private String slackWebhookUrl;
    
    @Value("${notification.email.from}")
    private String fromEmail;
    
    @Value("${notification.email.admin}")
    private String adminEmail;
    
    @Value("${app.base-url}")
    private String baseUrl;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    
    /**
     * 새 요청 알림 (관리자에게)
     */
    public void sendNewRequestNotification(RuleRequest request, SecurityGroup securityGroup) {
        try {
            String subject = String.format("[AWS SG Manager] 새로운 규칙 요청: %s", securityGroup.getGroupName());
            
            String message = String.format("""
                새로운 Security Group 규칙 요청이 접수되었습니다.
                
                요청자: %s (%s)
                Security Group: %s
                규칙 타입: %s
                프로토콜: %s
                포트: %s-%s
                CIDR: %s
                우선순위: %s
                
                비즈니스 사유: %s
                
                요청 검토: %s/admin/requests/%s
                """,
                request.getRequesterName(),
                request.getRequesterEmail(),
                securityGroup.getGroupName(),
                request.getRuleType(),
                request.getIpProtocol(),
                request.getFromPort(),
                request.getToPort(),
                String.join(", ", request.getCidrBlocks() != null ? request.getCidrBlocks() : java.util.List.of()),
                request.getPriority(),
                request.getBusinessJustification(),
                baseUrl,
                request.getId()
            );
            
            // 이메일 전송
            sendEmail(adminEmail, subject, message);
            
            // Slack 알림 전송
            if (!slackWebhookUrl.isEmpty()) {
                sendSlackNotification(subject, message, "warning");
            }
            
            log.info("Sent new request notification for request: {}", request.getId());
            
        } catch (Exception e) {
            log.error("Failed to send new request notification", e);
        }
    }
    
    /**
     * 요청 승인 알림 (요청자에게)
     */
    public void sendRequestApprovedNotification(RuleRequest request) {
        try {
            String subject = String.format("[AWS SG Manager] 요청 승인됨: %s", request.getId());
            
            String message = String.format("""
                Security Group 규칙 요청이 승인되었습니다.
                
                요청 ID: %s
                검토자: %s
                승인 일시: %s
                
                검토 의견: %s
                
                규칙이 AWS에 적용되었습니다.
                """,
                request.getId(),
                request.getReviewerName(),
                request.getReviewedAt().format(DATE_FORMATTER),
                request.getReviewComment() != null ? request.getReviewComment() : "없음"
            );
            
            // 요청자에게 이메일 전송
            sendEmail(request.getRequesterEmail(), subject, message);
            
            log.info("Sent approval notification for request: {}", request.getId());
            
        } catch (Exception e) {
            log.error("Failed to send approval notification", e);
        }
    }
    
    /**
     * 요청 거절 알림 (요청자에게)
     */
    public void sendRequestRejectedNotification(RuleRequest request) {
        try {
            String subject = String.format("[AWS SG Manager] 요청 거절됨: %s", request.getId());
            
            String message = String.format("""
                Security Group 규칙 요청이 거절되었습니다.
                
                요청 ID: %s
                검토자: %s
                거절 일시: %s
                
                거절 사유: %s
                
                추가 문의사항이 있으시면 관리자에게 연락하세요.
                """,
                request.getId(),
                request.getReviewerName(),
                request.getReviewedAt().format(DATE_FORMATTER),
                request.getReviewComment() != null ? request.getReviewComment() : "없음"
            );
            
            // 요청자에게 이메일 전송
            sendEmail(request.getRequesterEmail(), subject, message);
            
            log.info("Sent rejection notification for request: {}", request.getId());
            
        } catch (Exception e) {
            log.error("Failed to send rejection notification", e);
        }
    }
    
    /**
     * 만료 예정 알림 (1일 전)
     */
    public void sendExpiryWarningNotification(ExpirySchedule schedule, SecurityGroup securityGroup) {
        try {
            String subject = String.format("[AWS SG Manager] 만료 예정 알림: %s", securityGroup.getGroupName());
            
            String resourceType = schedule.getRuleId() != null ? "규칙" : "Security Group";
            String message = String.format("""
                %s이(가) 내일 만료됩니다.
                
                Security Group: %s (%s)
                만료 일시: %s
                자동 삭제: %s
                
                필요한 경우 만료일을 연장하거나 규칙을 수정하세요.
                관리 페이지: %s/security-groups/%s
                """,
                resourceType,
                securityGroup.getGroupName(),
                securityGroup.getGroupId(),
                schedule.getExpiryDate().format(DATE_FORMATTER),
                schedule.getAction() == ExpirySchedule.ExpiryAction.DELETE_RULE || 
                schedule.getAction() == ExpirySchedule.ExpiryAction.DELETE_GROUP ? "예" : "아니오",
                baseUrl,
                securityGroup.getId()
            );
            
            // 관리자에게 이메일 전송
            sendEmail(adminEmail, subject, message);
            
            // 생성자에게도 전송 (있는 경우)
            if (securityGroup.getCreatedBy() != null) {
                // 생성자 이메일 조회 로직 필요
            }
            
            // Slack 알림 전송
            if (!slackWebhookUrl.isEmpty()) {
                sendSlackNotification(subject, message, "warning");
            }
            
            log.info("Sent expiry warning notification for schedule: {}", schedule.getId());
            
        } catch (Exception e) {
            log.error("Failed to send expiry warning notification", e);
        }
    }
    
    /**
     * 만료 당일 알림
     */
    public void sendExpiryNotification(ExpirySchedule schedule, SecurityGroup securityGroup) {
        try {
            String subject = String.format("[AWS SG Manager] 만료 당일 알림: %s", securityGroup.getGroupName());
            
            String resourceType = schedule.getRuleId() != null ? "규칙" : "Security Group";
            String message = String.format("""
                %s이(가) 오늘 만료됩니다.
                
                Security Group: %s (%s)
                만료 일시: %s
                자동 삭제: %s
                
                %s
                """,
                resourceType,
                securityGroup.getGroupName(),
                securityGroup.getGroupId(),
                schedule.getExpiryDate().format(DATE_FORMATTER),
                schedule.getAction() == ExpirySchedule.ExpiryAction.DELETE_RULE || 
                schedule.getAction() == ExpirySchedule.ExpiryAction.DELETE_GROUP ? "예" : "아니오",
                schedule.getAction() == ExpirySchedule.ExpiryAction.NOTIFY_ONLY ? 
                    "알림만 전송되며 자동 삭제되지 않습니다." : 
                    "자동으로 삭제될 예정입니다."
            );
            
            // 관리자에게 이메일 전송
            sendEmail(adminEmail, subject, message);
            
            // Slack 알림 전송
            if (!slackWebhookUrl.isEmpty()) {
                sendSlackNotification(subject, message, "danger");
            }
            
            log.info("Sent expiry notification for schedule: {}", schedule.getId());
            
        } catch (Exception e) {
            log.error("Failed to send expiry notification", e);
        }
    }
    
    /**
     * 자동 삭제 완료 알림
     */
    public void sendDeletionNotification(ExpirySchedule schedule, SecurityGroup securityGroup, boolean success, String errorMessage) {
        try {
            String subject = String.format("[AWS SG Manager] %s: %s", 
                    success ? "자동 삭제 완료" : "자동 삭제 실패", 
                    securityGroup.getGroupName());
            
            String resourceType = schedule.getRuleId() != null ? "규칙" : "Security Group";
            String message;
            
            if (success) {
                message = String.format("""
                    %s이(가) 성공적으로 삭제되었습니다.
                    
                    Security Group: %s (%s)
                    삭제 일시: %s
                    """,
                    resourceType,
                    securityGroup.getGroupName(),
                    securityGroup.getGroupId(),
                    java.time.LocalDateTime.now().format(DATE_FORMATTER)
                );
            } else {
                message = String.format("""
                    %s 삭제에 실패했습니다.
                    
                    Security Group: %s (%s)
                    실패 일시: %s
                    오류 메시지: %s
                    
                    수동으로 확인이 필요합니다.
                    """,
                    resourceType,
                    securityGroup.getGroupName(),
                    securityGroup.getGroupId(),
                    java.time.LocalDateTime.now().format(DATE_FORMATTER),
                    errorMessage
                );
            }
            
            // 관리자에게 이메일 전송
            sendEmail(adminEmail, subject, message);
            
            // Slack 알림 전송
            if (!slackWebhookUrl.isEmpty()) {
                sendSlackNotification(subject, message, success ? "good" : "danger");
            }
            
            log.info("Sent deletion notification for schedule: {}", schedule.getId());
            
        } catch (Exception e) {
            log.error("Failed to send deletion notification", e);
        }
    }
    
    /**
     * 이메일 전송
     */
    private void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            
            mailSender.send(message);
            
            log.debug("Sent email to: {}", to);
            
        } catch (Exception e) {
            log.error("Failed to send email to: {}", to, e);
        }
    }
    
    /**
     * Slack 알림 전송
     */
    private void sendSlackNotification(String title, String message, String color) {
        try {
            if (slackWebhookUrl.isEmpty()) {
                return;
            }
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("text", title);
            
            Map<String, Object> attachment = new HashMap<>();
            attachment.put("color", color);
            attachment.put("text", message);
            attachment.put("mrkdwn_in", java.util.List.of("text"));
            
            payload.put("attachments", java.util.List.of(attachment));
            
            WebClient webClient = webClientBuilder.build();
            
            webClient.post()
                    .uri(slackWebhookUrl)
                    .header("Content-Type", "application/json")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .subscribe(
                            response -> log.debug("Slack notification sent successfully"),
                            error -> log.error("Failed to send Slack notification", error)
                    );
            
        } catch (Exception e) {
            log.error("Failed to send Slack notification", e);
        }
    }
}
