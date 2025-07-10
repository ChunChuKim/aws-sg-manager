import { apiClient } from './api';
import { SecurityGroup, SecurityGroupRule, VisualizationData, SecurityGroupFormData, RuleFormData } from '../types';

export class SecurityGroupService {
  async getAllSecurityGroups(): Promise<SecurityGroup[]> {
    return await apiClient.get<SecurityGroup[]>('/api/security-groups');
  }

  async getSecurityGroup(id: string): Promise<SecurityGroup> {
    return await apiClient.get<SecurityGroup>(`/api/security-groups/${id}`);
  }

  async getSecurityGroupByGroupId(groupId: string): Promise<SecurityGroup> {
    return await apiClient.get<SecurityGroup>(`/api/security-groups/aws/${groupId}`);
  }

  async createSecurityGroup(data: SecurityGroupFormData): Promise<SecurityGroup> {
    return await apiClient.post<SecurityGroup>('/api/security-groups', data);
  }

  async updateSecurityGroup(id: string, data: Partial<SecurityGroupFormData>): Promise<SecurityGroup> {
    return await apiClient.put<SecurityGroup>(`/api/security-groups/${id}`, data);
  }

  async deleteSecurityGroup(id: string): Promise<void> {
    await apiClient.delete(`/api/security-groups/${id}`);
  }

  async addInboundRule(id: string, rule: RuleFormData): Promise<SecurityGroup> {
    return await apiClient.post<SecurityGroup>(`/api/security-groups/${id}/inbound-rules`, rule);
  }

  async addOutboundRule(id: string, rule: RuleFormData): Promise<SecurityGroup> {
    return await apiClient.post<SecurityGroup>(`/api/security-groups/${id}/outbound-rules`, rule);
  }

  async getExpiredSecurityGroups(): Promise<SecurityGroup[]> {
    return await apiClient.get<SecurityGroup[]>('/api/security-groups/expired');
  }

  async getExpiringSecurityGroups(days: number = 7): Promise<SecurityGroup[]> {
    return await apiClient.get<SecurityGroup[]>(`/api/security-groups/expiring?days=${days}`);
  }

  async getVisualizationData(): Promise<VisualizationData> {
    return await apiClient.get<VisualizationData>('/api/security-groups/visualization');
  }
}

export const securityGroupService = new SecurityGroupService();
