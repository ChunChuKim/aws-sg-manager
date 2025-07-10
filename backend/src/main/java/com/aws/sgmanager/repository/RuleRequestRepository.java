package com.aws.sgmanager.repository;

import com.aws.sgmanager.model.RuleRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RuleRequestRepository extends MongoRepository<RuleRequest, String> {
    
    List<RuleRequest> findByRequesterId(String requesterId);
    
    List<RuleRequest> findByStatus(RuleRequest.RequestStatus status);
    
    Page<RuleRequest> findByStatus(RuleRequest.RequestStatus status, Pageable pageable);
    
    List<RuleRequest> findBySecurityGroupId(String securityGroupId);
    
    List<RuleRequest> findByReviewerId(String reviewerId);
    
    @Query("{ 'status' : ?0, 'priority' : ?1 }")
    List<RuleRequest> findByStatusAndPriority(RuleRequest.RequestStatus status, RuleRequest.Priority priority);
    
    @Query("{ 'requestedAt' : { $gte : ?0, $lte : ?1 } }")
    List<RuleRequest> findRequestsBetweenDates(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("{ 'status' : { $in : ?0 } }")
    List<RuleRequest> findByStatusIn(List<RuleRequest.RequestStatus> statuses);
    
    long countByStatus(RuleRequest.RequestStatus status);
    
    long countByRequesterId(String requesterId);
    
    @Query("{ 'status' : 'PENDING', 'priority' : { $in : ['HIGH', 'URGENT'] } }")
    List<RuleRequest> findHighPriorityPendingRequests();
}
