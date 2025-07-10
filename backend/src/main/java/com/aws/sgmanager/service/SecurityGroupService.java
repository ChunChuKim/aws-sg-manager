package com.aws.sgmanager.service;

import com.aws.sgmanager.dto.SecurityGroupDTO;
import com.aws.sgmanager.dto.SecurityGroupRuleDTO;
import com.aws.sgmanager.model.SecurityGroup;
import com.aws.sgmanager.model.SecurityGroupRule;
import com.aws.sgmanager.repository.SecurityGroupRepository;
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
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SecurityGroupService {
    
    private final SecurityGroupRepository securityGroupRepository;
    private final AwsEc2Service awsEc2Service;
    private final ExpiryScheduleService expiryScheduleService;
    private final NotificationService notificationService;
    
    /**
     * 모든 Security Group 조회 (AWS와 동기화)
     */
    public List<SecurityGroupDTO> getAllSecurityGroups() {
        try {
            // AWS에서 최신 데이터 가져오기
            List<SecurityGroup> awsSecurityGroups = awsEc2Service.getAllSecurityGroups();
            
            // DB와 동기화
            syncWithDatabase(awsSecurityGroups);
            
            // DB에서 조회하여 반환
            List<SecurityGroup> securityGroups = securityGroupRepository.findAll();
            
            return securityGroups.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Failed to get all security groups", e);
            throw new RuntimeException("Failed to get security groups", e);
        }
    }
    
    /**
     * 특정 Security Group 조회
     */
    public Optional<SecurityGroupDTO> getSecurityGroup(String id) {
        return securityGroupRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    /**
     * AWS Group ID로 Security Group 조회
     */
    public Optional<SecurityGroupDTO> getSecurityGroupByGroupId(String groupId) {
        return securityGroupRepository.findByGroupId(groupId)
                .map(this::convertToDTO);
    }
    
    /**
     * Security Group 생성
     */
    public SecurityGroupDTO createSecurityGroup(SecurityGroupDTO dto, String createdBy) {
        try {
            // AWS에 Security Group 생성
            String awsGroupId = awsEc2Service.createSecurityGroup(
                    dto.getGroupName(), 
                    dto.getDescription(), 
                    dto.getVpcId()
            );
            
            // DB에 저장
            SecurityGroup securityGroup = SecurityGroup.builder()
                    .groupId(awsGroupId)
                    .groupName(dto.getGroupName())
                    .description(dto.getDescription())
                    .vpcId(dto.getVpcId())
                    .expiryDate(dto.getExpiryDate())
                    .autoDelete(dto.isAutoDelete())
                    .createdBy(createdBy)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .syncStatus(SecurityGroup.SyncStatus.SYNCED)
                    .lastSyncedAt(LocalDateTime.now())
                    .build();
            
            SecurityGroup saved = securityGroupRepository.save(securityGroup);
            
            // 만료일이 설정된 경우 스케줄 등록
            if (dto.getExpiryDate() != null && dto.isAutoDelete()) {
                expiryScheduleService.scheduleSecurityGroupExpiry(saved.getId(), dto.getExpiryDate(), createdBy);
            }
            
            log.info("Created security group: {} (AWS ID: {})", saved.getId(), awsGroupId);
            
            return convertToDTO(saved);
            
        } catch (Exception e) {
            log.error("Failed to create security group", e);
            throw new RuntimeException("Failed to create security group", e);
        }
    }
    
    /**
     * Security Group 수정
     */
    public SecurityGroupDTO updateSecurityGroup(String id, SecurityGroupDTO dto, String updatedBy) {
        SecurityGroup existing = securityGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Security Group not found"));
        
        try {
            // 만료일 변경 처리
            if (!java.util.Objects.equals(existing.getExpiryDate(), dto.getExpiryDate()) ||
                existing.isAutoDelete() != dto.isAutoDelete()) {
                
                // 기존 스케줄 삭제
                expiryScheduleService.cancelSecurityGroupExpiry(id);
                
                // 새 스케줄 등록
                if (dto.getExpiryDate() != null && dto.isAutoDelete()) {
                    expiryScheduleService.scheduleSecurityGroupExpiry(id, dto.getExpiryDate(), updatedBy);
                }
            }
            
            // 업데이트
            existing.setDescription(dto.getDescription());
            existing.setExpiryDate(dto.getExpiryDate());
            existing.setAutoDelete(dto.isAutoDelete());
            existing.setUpdatedAt(LocalDateTime.now());
            
            SecurityGroup updated = securityGroupRepository.save(existing);
            
            log.info("Updated security group: {}", id);
            
            return convertToDTO(updated);
            
        } catch (Exception e) {
            log.error("Failed to update security group: {}", id, e);
            throw new RuntimeException("Failed to update security group", e);
        }
    }
    
    /**
     * Security Group 삭제
     */
    public void deleteSecurityGroup(String id) {
        SecurityGroup securityGroup = securityGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Security Group not found"));
        
        try {
            // AWS에서 삭제
            awsEc2Service.deleteSecurityGroup(securityGroup.getGroupId());
            
            // 스케줄 삭제
            expiryScheduleService.cancelSecurityGroupExpiry(id);
            
            // DB에서 삭제
            securityGroupRepository.deleteById(id);
            
            log.info("Deleted security group: {} (AWS ID: {})", id, securityGroup.getGroupId());
            
        } catch (Exception e) {
            log.error("Failed to delete security group: {}", id, e);
            throw new RuntimeException("Failed to delete security group", e);
        }
    }
    
    /**
     * 인바운드 규칙 추가
     */
    public SecurityGroupDTO addInboundRule(String id, SecurityGroupRuleDTO ruleDTO, String createdBy) {
        SecurityGroup securityGroup = securityGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Security Group not found"));
        
        try {
            SecurityGroupRule rule = convertToRule(ruleDTO, SecurityGroupRule.RuleType.INBOUND, createdBy);
            rule.setRuleId(UUID.randomUUID().toString());
            
            // AWS에 규칙 추가
            awsEc2Service.addInboundRule(securityGroup.getGroupId(), rule);
            
            // DB 업데이트
            if (securityGroup.getInboundRules() == null) {
                securityGroup.setInboundRules(List.of(rule));
            } else {
                securityGroup.getInboundRules().add(rule);
            }
            securityGroup.setUpdatedAt(LocalDateTime.now());
            
            SecurityGroup updated = securityGroupRepository.save(securityGroup);
            
            // 만료일이 설정된 경우 스케줄 등록
            if (rule.getExpiryDate() != null && rule.isAutoDelete()) {
                expiryScheduleService.scheduleRuleExpiry(id, rule.getRuleId(), rule.getExpiryDate(), createdBy);
            }
            
            log.info("Added inbound rule to security group: {}", id);
            
            return convertToDTO(updated);
            
        } catch (Exception e) {
            log.error("Failed to add inbound rule to security group: {}", id, e);
            throw new RuntimeException("Failed to add inbound rule", e);
        }
    }
    
    /**
     * 아웃바운드 규칙 추가
     */
    public SecurityGroupDTO addOutboundRule(String id, SecurityGroupRuleDTO ruleDTO, String createdBy) {
        SecurityGroup securityGroup = securityGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Security Group not found"));
        
        try {
            SecurityGroupRule rule = convertToRule(ruleDTO, SecurityGroupRule.RuleType.OUTBOUND, createdBy);
            rule.setRuleId(UUID.randomUUID().toString());
            
            // AWS에 규칙 추가
            awsEc2Service.addOutboundRule(securityGroup.getGroupId(), rule);
            
            // DB 업데이트
            if (securityGroup.getOutboundRules() == null) {
                securityGroup.setOutboundRules(List.of(rule));
            } else {
                securityGroup.getOutboundRules().add(rule);
            }
            securityGroup.setUpdatedAt(LocalDateTime.now());
            
            SecurityGroup updated = securityGroupRepository.save(securityGroup);
            
            // 만료일이 설정된 경우 스케줄 등록
            if (rule.getExpiryDate() != null && rule.isAutoDelete()) {
                expiryScheduleService.scheduleRuleExpiry(id, rule.getRuleId(), rule.getExpiryDate(), createdBy);
            }
            
            log.info("Added outbound rule to security group: {}", id);
            
            return convertToDTO(updated);
            
        } catch (Exception e) {
            log.error("Failed to add outbound rule to security group: {}", id, e);
            throw new RuntimeException("Failed to add outbound rule", e);
        }
    }
    
    /**
     * 만료된 Security Group 조회
     */
    public List<SecurityGroupDTO> getExpiredSecurityGroups() {
        List<SecurityGroup> expired = securityGroupRepository.findExpiredSecurityGroups(LocalDateTime.now());
        return expired.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * 만료 예정 Security Group 조회
     */
    public List<SecurityGroupDTO> getExpiringSecurityGroups(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(days);
        
        List<SecurityGroup> expiring = securityGroupRepository.findSecurityGroupsExpiringBetween(now, future);
        return expiring.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * AWS와 DB 동기화
     */
    private void syncWithDatabase(List<SecurityGroup> awsSecurityGroups) {
        for (SecurityGroup awsSecurityGroup : awsSecurityGroups) {
            Optional<SecurityGroup> existing = securityGroupRepository.findByGroupId(awsSecurityGroup.getGroupId());
            
            if (existing.isPresent()) {
                // 기존 데이터 업데이트
                SecurityGroup existingGroup = existing.get();
                existingGroup.setGroupName(awsSecurityGroup.getGroupName());
                existingGroup.setDescription(awsSecurityGroup.getDescription());
                existingGroup.setInboundRules(awsSecurityGroup.getInboundRules());
                existingGroup.setOutboundRules(awsSecurityGroup.getOutboundRules());
                existingGroup.setTags(awsSecurityGroup.getTags());
                existingGroup.setSyncStatus(SecurityGroup.SyncStatus.SYNCED);
                existingGroup.setLastSyncedAt(LocalDateTime.now());
                
                securityGroupRepository.save(existingGroup);
            } else {
                // 새 데이터 저장
                awsSecurityGroup.setCreatedAt(LocalDateTime.now());
                awsSecurityGroup.setUpdatedAt(LocalDateTime.now());
                securityGroupRepository.save(awsSecurityGroup);
            }
        }
    }
    
    /**
     * SecurityGroup을 DTO로 변환
     */
    private SecurityGroupDTO convertToDTO(SecurityGroup securityGroup) {
        List<SecurityGroupRuleDTO> inboundRules = securityGroup.getInboundRules() != null ?
                securityGroup.getInboundRules().stream()
                        .map(this::convertRuleToDTO)
                        .collect(Collectors.toList()) : List.of();
                        
        List<SecurityGroupRuleDTO> outboundRules = securityGroup.getOutboundRules() != null ?
                securityGroup.getOutboundRules().stream()
                        .map(this::convertRuleToDTO)
                        .collect(Collectors.toList()) : List.of();
        
        // 만료된 규칙 개수 계산
        LocalDateTime now = LocalDateTime.now();
        int expiredRulesCount = (int) (inboundRules.stream().filter(rule -> 
                rule.getExpiryDate() != null && rule.getExpiryDate().isBefore(now)).count() +
                outboundRules.stream().filter(rule -> 
                rule.getExpiryDate() != null && rule.getExpiryDate().isBefore(now)).count());
        
        return SecurityGroupDTO.builder()
                .id(securityGroup.getId())
                .groupId(securityGroup.getGroupId())
                .groupName(securityGroup.getGroupName())
                .description(securityGroup.getDescription())
                .vpcId(securityGroup.getVpcId())
                .ownerId(securityGroup.getOwnerId())
                .inboundRules(inboundRules)
                .outboundRules(outboundRules)
                .tags(securityGroup.getTags())
                .expiryDate(securityGroup.getExpiryDate())
                .autoDelete(securityGroup.isAutoDelete())
                .createdBy(securityGroup.getCreatedBy())
                .createdAt(securityGroup.getCreatedAt())
                .updatedAt(securityGroup.getUpdatedAt())
                .lastSyncedAt(securityGroup.getLastSyncedAt())
                .syncStatus(securityGroup.getSyncStatus())
                .totalInboundRules(inboundRules.size())
                .totalOutboundRules(outboundRules.size())
                .expiredRulesCount(expiredRulesCount)
                .hasExpiredRules(expiredRulesCount > 0)
                .build();
    }
    
    /**
     * SecurityGroupRule을 DTO로 변환
     */
    private SecurityGroupRuleDTO convertRuleToDTO(SecurityGroupRule rule) {
        LocalDateTime now = LocalDateTime.now();
        boolean isExpired = rule.getExpiryDate() != null && rule.getExpiryDate().isBefore(now);
        long daysUntilExpiry = rule.getExpiryDate() != null ? 
                ChronoUnit.DAYS.between(now, rule.getExpiryDate()) : 0;
        
        String portRange = "All";
        if (rule.getFromPort() != null && rule.getToPort() != null) {
            if (rule.getFromPort().equals(rule.getToPort())) {
                portRange = rule.getFromPort().toString();
            } else {
                portRange = rule.getFromPort() + "-" + rule.getToPort();
            }
        }
        
        return SecurityGroupRuleDTO.builder()
                .ruleId(rule.getRuleId())
                .ipProtocol(rule.getIpProtocol())
                .fromPort(rule.getFromPort())
                .toPort(rule.getToPort())
                .cidrBlocks(rule.getCidrBlocks())
                .ipv6CidrBlocks(rule.getIpv6CidrBlocks())
                .description(rule.getDescription())
                .expiryDate(rule.getExpiryDate())
                .autoDelete(rule.isAutoDelete())
                .createdBy(rule.getCreatedBy())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .ruleType(rule.getRuleType())
                .isExpired(isExpired)
                .daysUntilExpiry(daysUntilExpiry)
                .portRange(portRange)
                .build();
    }
    
    /**
     * DTO를 SecurityGroupRule로 변환
     */
    private SecurityGroupRule convertToRule(SecurityGroupRuleDTO dto, SecurityGroupRule.RuleType ruleType, String createdBy) {
        return SecurityGroupRule.builder()
                .ipProtocol(dto.getIpProtocol())
                .fromPort(dto.getFromPort())
                .toPort(dto.getToPort())
                .cidrBlocks(dto.getCidrBlocks())
                .ipv6CidrBlocks(dto.getIpv6CidrBlocks())
                .description(dto.getDescription())
                .expiryDate(dto.getExpiryDate())
                .autoDelete(dto.isAutoDelete())
                .ruleType(ruleType)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
