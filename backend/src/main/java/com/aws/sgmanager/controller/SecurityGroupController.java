package com.aws.sgmanager.controller;

import com.aws.sgmanager.dto.SecurityGroupDTO;
import com.aws.sgmanager.dto.SecurityGroupRuleDTO;
import com.aws.sgmanager.service.SecurityGroupService;
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
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/security-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SecurityGroupController {
    
    private final SecurityGroupService securityGroupService;
    
    /**
     * 모든 Security Group 조회
     */
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<SecurityGroupDTO>> getAllSecurityGroups() {
        try {
            List<SecurityGroupDTO> securityGroups = securityGroupService.getAllSecurityGroups();
            return ResponseEntity.ok(securityGroups);
        } catch (Exception e) {
            log.error("Failed to get all security groups", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 Security Group 조회
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<SecurityGroupDTO> getSecurityGroup(@PathVariable String id) {
        try {
            Optional<SecurityGroupDTO> securityGroup = securityGroupService.getSecurityGroup(id);
            
            if (securityGroup.isPresent()) {
                return ResponseEntity.ok(securityGroup.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Failed to get security group: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * AWS Group ID로 Security Group 조회
     */
    @GetMapping("/aws/{groupId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<SecurityGroupDTO> getSecurityGroupByGroupId(@PathVariable String groupId) {
        try {
            Optional<SecurityGroupDTO> securityGroup = securityGroupService.getSecurityGroupByGroupId(groupId);
            
            if (securityGroup.isPresent()) {
                return ResponseEntity.ok(securityGroup.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Failed to get security group by group ID: {}", groupId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Security Group 생성 (관리자만)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SecurityGroupDTO> createSecurityGroup(
            @Valid @RequestBody SecurityGroupDTO securityGroupDTO,
            Authentication authentication) {
        try {
            String createdBy = authentication.getName();
            SecurityGroupDTO created = securityGroupService.createSecurityGroup(securityGroupDTO, createdBy);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Failed to create security group", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Security Group 수정 (관리자만)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SecurityGroupDTO> updateSecurityGroup(
            @PathVariable String id,
            @Valid @RequestBody SecurityGroupDTO securityGroupDTO,
            Authentication authentication) {
        try {
            String updatedBy = authentication.getName();
            SecurityGroupDTO updated = securityGroupService.updateSecurityGroup(id, securityGroupDTO, updatedBy);
            
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Failed to update security group: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Security Group 삭제 (관리자만)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSecurityGroup(@PathVariable String id) {
        try {
            securityGroupService.deleteSecurityGroup(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Failed to delete security group: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 인바운드 규칙 추가 (관리자만)
     */
    @PostMapping("/{id}/inbound-rules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SecurityGroupDTO> addInboundRule(
            @PathVariable String id,
            @Valid @RequestBody SecurityGroupRuleDTO ruleDTO,
            Authentication authentication) {
        try {
            String createdBy = authentication.getName();
            SecurityGroupDTO updated = securityGroupService.addInboundRule(id, ruleDTO, createdBy);
            
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Failed to add inbound rule to security group: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 아웃바운드 규칙 추가 (관리자만)
     */
    @PostMapping("/{id}/outbound-rules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SecurityGroupDTO> addOutboundRule(
            @PathVariable String id,
            @Valid @RequestBody SecurityGroupRuleDTO ruleDTO,
            Authentication authentication) {
        try {
            String createdBy = authentication.getName();
            SecurityGroupDTO updated = securityGroupService.addOutboundRule(id, ruleDTO, createdBy);
            
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            log.error("Failed to add outbound rule to security group: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 만료된 Security Group 조회
     */
    @GetMapping("/expired")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SecurityGroupDTO>> getExpiredSecurityGroups() {
        try {
            List<SecurityGroupDTO> expired = securityGroupService.getExpiredSecurityGroups();
            return ResponseEntity.ok(expired);
        } catch (Exception e) {
            log.error("Failed to get expired security groups", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 만료 예정 Security Group 조회
     */
    @GetMapping("/expiring")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SecurityGroupDTO>> getExpiringSecurityGroups(
            @RequestParam(defaultValue = "7") int days) {
        try {
            List<SecurityGroupDTO> expiring = securityGroupService.getExpiringSecurityGroups(days);
            return ResponseEntity.ok(expiring);
        } catch (Exception e) {
            log.error("Failed to get expiring security groups", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Security Group 시각화 데이터 조회
     */
    @GetMapping("/visualization")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<SecurityGroupVisualizationData> getVisualizationData() {
        try {
            List<SecurityGroupDTO> securityGroups = securityGroupService.getAllSecurityGroups();
            SecurityGroupVisualizationData data = buildVisualizationData(securityGroups);
            
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("Failed to get visualization data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 시각화 데이터 구성
     */
    private SecurityGroupVisualizationData buildVisualizationData(List<SecurityGroupDTO> securityGroups) {
        SecurityGroupVisualizationData data = new SecurityGroupVisualizationData();
        
        // 노드 생성 (Security Groups)
        for (SecurityGroupDTO sg : securityGroups) {
            SecurityGroupVisualizationData.Node node = new SecurityGroupVisualizationData.Node();
            node.setId(sg.getGroupId());
            node.setLabel(sg.getGroupName());
            node.setGroup(sg.getVpcId());
            node.setTitle(String.format("%s (%s)\\nInbound: %d, Outbound: %d", 
                    sg.getGroupName(), sg.getGroupId(), 
                    sg.getTotalInboundRules(), sg.getTotalOutboundRules()));
            
            // 만료 상태에 따른 색상 설정
            if (sg.isHasExpiredRules()) {
                node.setColor("#ff4444"); // 빨간색 (만료된 규칙 있음)
            } else if (sg.getExpiryDate() != null) {
                node.setColor("#ffaa00"); // 주황색 (만료일 설정됨)
            } else {
                node.setColor("#44aa44"); // 초록색 (정상)
            }
            
            data.getNodes().add(node);
        }
        
        // 엣지 생성 (Security Group 간 참조 관계)
        for (SecurityGroupDTO sg : securityGroups) {
            // 인바운드 규칙에서 다른 Security Group 참조 찾기
            if (sg.getInboundRules() != null) {
                for (SecurityGroupRuleDTO rule : sg.getInboundRules()) {
                    if (rule.getSecurityGroupReferences() != null) {
                        for (SecurityGroupRuleDTO.SecurityGroupReferenceDTO ref : rule.getSecurityGroupReferences()) {
                            SecurityGroupVisualizationData.Edge edge = new SecurityGroupVisualizationData.Edge();
                            edge.setFrom(ref.getGroupId());
                            edge.setTo(sg.getGroupId());
                            edge.setLabel(String.format("%s:%s-%s", 
                                    rule.getIpProtocol(), rule.getFromPort(), rule.getToPort()));
                            edge.setArrows("to");
                            
                            data.getEdges().add(edge);
                        }
                    }
                }
            }
        }
        
        return data;
    }
    
    /**
     * 시각화 데이터 클래스
     */
    @lombok.Data
    public static class SecurityGroupVisualizationData {
        private java.util.List<Node> nodes = new java.util.ArrayList<>();
        private java.util.List<Edge> edges = new java.util.ArrayList<>();
        
        @lombok.Data
        public static class Node {
            private String id;
            private String label;
            private String group;
            private String title;
            private String color;
        }
        
        @lombok.Data
        public static class Edge {
            private String from;
            private String to;
            private String label;
            private String arrows;
        }
    }
}
