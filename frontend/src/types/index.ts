// 사용자 관련 타입
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: Role[];
  enabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export enum Role {
  ROLE_USER = 'ROLE_USER',
  ROLE_ADMIN = 'ROLE_ADMIN'
}

// 인증 관련 타입
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

// Security Group 관련 타입
export interface SecurityGroup {
  id: string;
  groupId: string;
  groupName: string;
  description: string;
  vpcId: string;
  ownerId: string;
  inboundRules: SecurityGroupRule[];
  outboundRules: SecurityGroupRule[];
  tags: Record<string, string>;
  expiryDate?: string;
  autoDelete: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
  syncStatus: SyncStatus;
  totalInboundRules: number;
  totalOutboundRules: number;
  expiredRulesCount: number;
  hasExpiredRules: boolean;
  referencedByGroups: string[];
  referencesToGroups: string[];
}

export interface SecurityGroupRule {
  ruleId: string;
  ipProtocol: string;
  fromPort?: number;
  toPort?: number;
  cidrBlocks: string[];
  ipv6CidrBlocks: string[];
  securityGroupReferences: SecurityGroupReference[];
  prefixListIds: PrefixListId[];
  description: string;
  expiryDate?: string;
  autoDelete: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  ruleType: RuleType;
  isExpired: boolean;
  daysUntilExpiry: number;
  portRange: string;
}

export interface SecurityGroupReference {
  groupId: string;
  groupOwnerId: string;
  description: string;
  groupName?: string;
}

export interface PrefixListId {
  prefixListId: string;
  description: string;
}

export enum SyncStatus {
  SYNCED = 'SYNCED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  DELETED = 'DELETED'
}

export enum RuleType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

// 요청 관련 타입
export interface RuleRequest {
  id: string;
  securityGroupId: string;
  securityGroupName: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requestType: RequestType;
  ruleType: RuleType;
  ipProtocol: string;
  fromPort?: number;
  toPort?: number;
  cidrBlocks: string[];
  ipv6CidrBlocks: string[];
  securityGroupReferences: SecurityGroupReference[];
  description: string;
  expiryDate?: string;
  autoDelete: boolean;
  businessJustification: string;
  technicalJustification: string;
  priority: Priority;
  status: RequestStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewComment?: string;
  reviewedAt?: string;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  appliedRuleId?: string;
  daysSinceRequested: number;
  isUrgent: boolean;
  statusDisplayName: string;
  priorityDisplayName: string;
}

export enum RequestType {
  ADD_RULE = 'ADD_RULE',
  MODIFY_RULE = 'MODIFY_RULE',
  DELETE_RULE = 'DELETE_RULE'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  APPLIED = 'APPLIED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// 시각화 관련 타입
export interface VisualizationData {
  nodes: VisualizationNode[];
  edges: VisualizationEdge[];
}

export interface VisualizationNode {
  id: string;
  label: string;
  group: string;
  title: string;
  color: string;
}

export interface VisualizationEdge {
  from: string;
  to: string;
  label: string;
  arrows: string;
}

// 통계 관련 타입
export interface RequestStatistics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// 폼 관련 타입
export interface SecurityGroupFormData {
  groupName: string;
  description: string;
  vpcId: string;
  expiryDate?: string;
  autoDelete: boolean;
}

export interface RuleFormData {
  ipProtocol: string;
  fromPort?: number;
  toPort?: number;
  cidrBlocks: string[];
  description: string;
  expiryDate?: string;
  autoDelete: boolean;
}

export interface RuleRequestFormData {
  securityGroupId: string;
  requestType: RequestType;
  ruleType: RuleType;
  ipProtocol: string;
  fromPort?: number;
  toPort?: number;
  cidrBlocks: string[];
  description: string;
  expiryDate?: string;
  autoDelete: boolean;
  businessJustification: string;
  technicalJustification: string;
  priority: Priority;
}

// 에러 타입
export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
  path: string;
}
