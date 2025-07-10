import { apiClient } from './api';
import { LoginRequest, LoginResponse, User } from '../types';

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/auth/signin', credentials);
    
    // 토큰과 사용자 정보 저장
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify({
      id: response.id,
      username: response.username,
      email: response.email,
      fullName: response.fullName,
      roles: response.roles
    }));
    
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>('/api/auth/me');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUserFromStorage();
    return user?.roles.includes(role) || false;
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  isUser(): boolean {
    return this.hasRole('ROLE_USER');
  }
}

export const authService = new AuthService();
