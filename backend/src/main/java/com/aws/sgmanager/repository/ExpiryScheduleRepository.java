package com.aws.sgmanager.repository;

import com.aws.sgmanager.model.ExpirySchedule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpiryScheduleRepository extends MongoRepository<ExpirySchedule, String> {
    
    List<ExpirySchedule> findBySecurityGroupId(String securityGroupId);
    
    List<ExpirySchedule> findByStatus(ExpirySchedule.ExpiryStatus status);
    
    @Query("{ 'expiryDate' : { $lte : ?0 }, 'status' : 'SCHEDULED' }")
    List<ExpirySchedule> findSchedulesReadyForExecution(LocalDateTime currentTime);
    
    @Query("{ 'expiryDate' : { $gte : ?0, $lte : ?1 }, 'status' : 'SCHEDULED', 'notificationSent1Day' : false }")
    List<ExpirySchedule> findSchedulesForOneDayNotification(LocalDateTime startTime, LocalDateTime endTime);
    
    @Query("{ 'expiryDate' : { $gte : ?0, $lte : ?1 }, 'status' : 'SCHEDULED', 'notificationSentSameDay' : false }")
    List<ExpirySchedule> findSchedulesForSameDayNotification(LocalDateTime startTime, LocalDateTime endTime);
    
    List<ExpirySchedule> findBySecurityGroupIdAndRuleId(String securityGroupId, String ruleId);
    
    void deleteBySecurityGroupId(String securityGroupId);
    
    void deleteBySecurityGroupIdAndRuleId(String securityGroupId, String ruleId);
}
