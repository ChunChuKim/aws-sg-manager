package com.aws.sgmanager.repository;

import com.aws.sgmanager.model.SecurityGroup;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityGroupRepository extends MongoRepository<SecurityGroup, String> {
    
    Optional<SecurityGroup> findByGroupId(String groupId);
    
    List<SecurityGroup> findByVpcId(String vpcId);
    
    List<SecurityGroup> findByCreatedBy(String createdBy);
    
    @Query("{ 'expiryDate' : { $lte : ?0 }, 'autoDelete' : true }")
    List<SecurityGroup> findExpiredSecurityGroups(LocalDateTime currentTime);
    
    @Query("{ 'expiryDate' : { $gte : ?0, $lte : ?1 } }")
    List<SecurityGroup> findSecurityGroupsExpiringBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("{ '$or' : [ " +
           "{ 'inboundRules.expiryDate' : { $lte : ?0 }, 'inboundRules.autoDelete' : true }, " +
           "{ 'outboundRules.expiryDate' : { $lte : ?0 }, 'outboundRules.autoDelete' : true } " +
           "] }")
    List<SecurityGroup> findSecurityGroupsWithExpiredRules(LocalDateTime currentTime);
    
    List<SecurityGroup> findByGroupNameContainingIgnoreCase(String groupName);
    
    List<SecurityGroup> findBySyncStatus(SecurityGroup.SyncStatus syncStatus);
}
