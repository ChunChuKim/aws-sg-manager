package com.aws.sgmanager.service;

import com.aws.sgmanager.model.SecurityGroup;
import com.aws.sgmanager.model.SecurityGroupRule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AwsEc2Service {
    
    @Value("${aws.accessKeyId}")
    private String accessKeyId;
    
    @Value("${aws.secretAccessKey}")
    private String secretAccessKey;
    
    @Value("${aws.region}")
    private String region;
    
    private Ec2Client ec2Client;
    
    @PostConstruct
    public void initializeEc2Client() {
        AwsBasicCredentials awsCredentials = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
        
        this.ec2Client = Ec2Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(awsCredentials))
                .build();
    }
    
    /**
     * AWS에서 모든 Security Group 조회
     */
    public List<SecurityGroup> getAllSecurityGroups() {
        try {
            DescribeSecurityGroupsResponse response = ec2Client.describeSecurityGroups();
            
            return response.securityGroups().stream()
                    .map(this::convertToSecurityGroup)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Failed to fetch security groups from AWS", e);
            throw new RuntimeException("Failed to fetch security groups from AWS", e);
        }
    }
    
    /**
     * 특정 Security Group 조회
     */
    public SecurityGroup getSecurityGroup(String groupId) {
        try {
            DescribeSecurityGroupsRequest request = DescribeSecurityGroupsRequest.builder()
                    .groupIds(groupId)
                    .build();
                    
            DescribeSecurityGroupsResponse response = ec2Client.describeSecurityGroups(request);
            
            if (response.securityGroups().isEmpty()) {
                return null;
            }
            
            return convertToSecurityGroup(response.securityGroups().get(0));
            
        } catch (Exception e) {
            log.error("Failed to fetch security group {} from AWS", groupId, e);
            throw new RuntimeException("Failed to fetch security group from AWS", e);
        }
    }
    
    /**
     * Security Group 생성
     */
    public String createSecurityGroup(String groupName, String description, String vpcId) {
        try {
            CreateSecurityGroupRequest request = CreateSecurityGroupRequest.builder()
                    .groupName(groupName)
                    .description(description)
                    .vpcId(vpcId)
                    .build();
                    
            CreateSecurityGroupResponse response = ec2Client.createSecurityGroup(request);
            
            log.info("Created security group: {}", response.groupId());
            return response.groupId();
            
        } catch (Exception e) {
            log.error("Failed to create security group", e);
            throw new RuntimeException("Failed to create security group", e);
        }
    }
    
    /**
     * Security Group 삭제
     */
    public void deleteSecurityGroup(String groupId) {
        try {
            DeleteSecurityGroupRequest request = DeleteSecurityGroupRequest.builder()
                    .groupId(groupId)
                    .build();
                    
            ec2Client.deleteSecurityGroup(request);
            
            log.info("Deleted security group: {}", groupId);
            
        } catch (Exception e) {
            log.error("Failed to delete security group {}", groupId, e);
            throw new RuntimeException("Failed to delete security group", e);
        }
    }
    
    /**
     * 인바운드 규칙 추가
     */
    public void addInboundRule(String groupId, SecurityGroupRule rule) {
        try {
            IpPermission permission = convertToIpPermission(rule);
            
            AuthorizeSecurityGroupIngressRequest request = AuthorizeSecurityGroupIngressRequest.builder()
                    .groupId(groupId)
                    .ipPermissions(permission)
                    .build();
                    
            ec2Client.authorizeSecurityGroupIngress(request);
            
            log.info("Added inbound rule to security group: {}", groupId);
            
        } catch (Exception e) {
            log.error("Failed to add inbound rule to security group {}", groupId, e);
            throw new RuntimeException("Failed to add inbound rule", e);
        }
    }
    
    /**
     * 아웃바운드 규칙 추가
     */
    public void addOutboundRule(String groupId, SecurityGroupRule rule) {
        try {
            IpPermission permission = convertToIpPermission(rule);
            
            AuthorizeSecurityGroupEgressRequest request = AuthorizeSecurityGroupEgressRequest.builder()
                    .groupId(groupId)
                    .ipPermissions(permission)
                    .build();
                    
            ec2Client.authorizeSecurityGroupEgress(request);
            
            log.info("Added outbound rule to security group: {}", groupId);
            
        } catch (Exception e) {
            log.error("Failed to add outbound rule to security group {}", groupId, e);
            throw new RuntimeException("Failed to add outbound rule", e);
        }
    }
    
    /**
     * 인바운드 규칙 삭제
     */
    public void removeInboundRule(String groupId, SecurityGroupRule rule) {
        try {
            IpPermission permission = convertToIpPermission(rule);
            
            RevokeSecurityGroupIngressRequest request = RevokeSecurityGroupIngressRequest.builder()
                    .groupId(groupId)
                    .ipPermissions(permission)
                    .build();
                    
            ec2Client.revokeSecurityGroupIngress(request);
            
            log.info("Removed inbound rule from security group: {}", groupId);
            
        } catch (Exception e) {
            log.error("Failed to remove inbound rule from security group {}", groupId, e);
            throw new RuntimeException("Failed to remove inbound rule", e);
        }
    }
    
    /**
     * 아웃바운드 규칙 삭제
     */
    public void removeOutboundRule(String groupId, SecurityGroupRule rule) {
        try {
            IpPermission permission = convertToIpPermission(rule);
            
            RevokeSecurityGroupEgressRequest request = RevokeSecurityGroupEgressRequest.builder()
                    .groupId(groupId)
                    .ipPermissions(permission)
                    .build();
                    
            ec2Client.revokeSecurityGroupEgress(request);
            
            log.info("Removed outbound rule from security group: {}", groupId);
            
        } catch (Exception e) {
            log.error("Failed to remove outbound rule from security group {}", groupId, e);
            throw new RuntimeException("Failed to remove outbound rule", e);
        }
    }
    
    /**
     * AWS SecurityGroup을 내부 모델로 변환
     */
    private SecurityGroup convertToSecurityGroup(software.amazon.awssdk.services.ec2.model.SecurityGroup awsSecurityGroup) {
        List<SecurityGroupRule> inboundRules = awsSecurityGroup.ipPermissions().stream()
                .map(permission -> convertToSecurityGroupRule(permission, SecurityGroupRule.RuleType.INBOUND))
                .collect(Collectors.toList());
                
        List<SecurityGroupRule> outboundRules = awsSecurityGroup.ipPermissionsEgress().stream()
                .map(permission -> convertToSecurityGroupRule(permission, SecurityGroupRule.RuleType.OUTBOUND))
                .collect(Collectors.toList());
        
        Map<String, String> tags = awsSecurityGroup.tags().stream()
                .collect(Collectors.toMap(Tag::key, Tag::value));
        
        return SecurityGroup.builder()
                .groupId(awsSecurityGroup.groupId())
                .groupName(awsSecurityGroup.groupName())
                .description(awsSecurityGroup.description())
                .vpcId(awsSecurityGroup.vpcId())
                .ownerId(awsSecurityGroup.ownerId())
                .inboundRules(inboundRules)
                .outboundRules(outboundRules)
                .tags(tags)
                .syncStatus(SecurityGroup.SyncStatus.SYNCED)
                .lastSyncedAt(LocalDateTime.now())
                .build();
    }
    
    /**
     * AWS IpPermission을 내부 SecurityGroupRule로 변환
     */
    private SecurityGroupRule convertToSecurityGroupRule(IpPermission permission, SecurityGroupRule.RuleType ruleType) {
        List<String> cidrBlocks = permission.ipRanges().stream()
                .map(IpRange::cidrIp)
                .collect(Collectors.toList());
                
        List<String> ipv6CidrBlocks = permission.ipv6Ranges().stream()
                .map(Ipv6Range::cidrIpv6)
                .collect(Collectors.toList());
                
        List<SecurityGroupRule.SecurityGroupReference> sgReferences = permission.userIdGroupPairs().stream()
                .map(pair -> SecurityGroupRule.SecurityGroupReference.builder()
                        .groupId(pair.groupId())
                        .groupOwnerId(pair.userId())
                        .description(pair.description())
                        .build())
                .collect(Collectors.toList());
        
        return SecurityGroupRule.builder()
                .ipProtocol(permission.ipProtocol())
                .fromPort(permission.fromPort())
                .toPort(permission.toPort())
                .cidrBlocks(cidrBlocks)
                .ipv6CidrBlocks(ipv6CidrBlocks)
                .securityGroupReferences(sgReferences)
                .ruleType(ruleType)
                .createdAt(LocalDateTime.now())
                .build();
    }
    
    /**
     * 내부 SecurityGroupRule을 AWS IpPermission으로 변환
     */
    private IpPermission convertToIpPermission(SecurityGroupRule rule) {
        List<IpRange> ipRanges = rule.getCidrBlocks() != null ? 
                rule.getCidrBlocks().stream()
                        .map(cidr -> IpRange.builder().cidrIp(cidr).build())
                        .collect(Collectors.toList()) : new ArrayList<>();
                        
        List<Ipv6Range> ipv6Ranges = rule.getIpv6CidrBlocks() != null ?
                rule.getIpv6CidrBlocks().stream()
                        .map(cidr -> Ipv6Range.builder().cidrIpv6(cidr).build())
                        .collect(Collectors.toList()) : new ArrayList<>();
                        
        List<UserIdGroupPair> userIdGroupPairs = rule.getSecurityGroupReferences() != null ?
                rule.getSecurityGroupReferences().stream()
                        .map(ref -> UserIdGroupPair.builder()
                                .groupId(ref.getGroupId())
                                .userId(ref.getGroupOwnerId())
                                .description(ref.getDescription())
                                .build())
                        .collect(Collectors.toList()) : new ArrayList<>();
        
        return IpPermission.builder()
                .ipProtocol(rule.getIpProtocol())
                .fromPort(rule.getFromPort())
                .toPort(rule.getToPort())
                .ipRanges(ipRanges)
                .ipv6Ranges(ipv6Ranges)
                .userIdGroupPairs(userIdGroupPairs)
                .build();
    }
}
