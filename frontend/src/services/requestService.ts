import { apiClient } from './api';
import { RuleRequest, RuleRequestFormData, RequestStatistics, PaginatedResponse, RequestStatus } from '../types';

export class RequestService {
  async createRuleRequest(data: RuleRequestFormData): Promise<RuleRequest> {
    return await apiClient.post<RuleRequest>('/api/requests', data);
  }

  async getAllRequests(page: number = 0, size: number = 20): Promise<PaginatedResponse<RuleRequest>> {
    return await apiClient.get<PaginatedResponse<RuleRequest>>(`/api/requests?page=${page}&size=${size}`);
  }

  async getMyRequests(): Promise<RuleRequest[]> {
    return await apiClient.get<RuleRequest[]>('/api/requests/my');
  }

  async getRequestsByStatus(status: RequestStatus, page: number = 0, size: number = 20): Promise<PaginatedResponse<RuleRequest>> {
    return await apiClient.get<PaginatedResponse<RuleRequest>>(`/api/requests/status/${status}?page=${page}&size=${size}`);
  }

  async getPendingRequests(): Promise<RuleRequest[]> {
    return await apiClient.get<RuleRequest[]>('/api/requests/pending');
  }

  async getHighPriorityPendingRequests(): Promise<RuleRequest[]> {
    return await apiClient.get<RuleRequest[]>('/api/requests/pending/high-priority');
  }

  async approveRequest(id: string, reviewComment?: string): Promise<RuleRequest> {
    return await apiClient.put<RuleRequest>(`/api/requests/${id}/approve`, { reviewComment });
  }

  async rejectRequest(id: string, reviewComment: string): Promise<RuleRequest> {
    return await apiClient.put<RuleRequest>(`/api/requests/${id}/reject`, { reviewComment });
  }

  async cancelRequest(id: string): Promise<RuleRequest> {
    return await apiClient.put<RuleRequest>(`/api/requests/${id}/cancel`);
  }

  async getRequestStatistics(): Promise<RequestStatistics> {
    return await apiClient.get<RequestStatistics>('/api/requests/statistics');
  }
}

export const requestService = new RequestService();
