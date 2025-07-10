import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { LoginPage } from './LoginPage';
import { AuthProvider } from '../hooks/useAuth';

// Mock the auth service
jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn(),
    isAuthenticated: jest.fn(() => false),
    getCurrentUserFromStorage: jest.fn(() => null),
    hasRole: jest.fn(() => false),
    isAdmin: jest.fn(() => false),
    isUser: jest.fn(() => false),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText('AWS Security Group Manager')).toBeInTheDocument();
    expect(screen.getByLabelText('사용자명')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderWithProviders(<LoginPage />);
    
    const loginButton = screen.getByRole('button', { name: '로그인' });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('사용자명을 입력하세요')).toBeInTheDocument();
      expect(screen.getByText('비밀번호를 입력하세요')).toBeInTheDocument();
    });
  });

  test('shows validation error for short username', async () => {
    renderWithProviders(<LoginPage />);
    
    const usernameInput = screen.getByLabelText('사용자명');
    const loginButton = screen.getByRole('button', { name: '로그인' });
    
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('사용자명은 최소 3자 이상이어야 합니다')).toBeInTheDocument();
    });
  });

  test('shows validation error for short password', async () => {
    renderWithProviders(<LoginPage />);
    
    const passwordInput = screen.getByLabelText('비밀번호');
    const loginButton = screen.getByRole('button', { name: '로그인' });
    
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('비밀번호는 최소 6자 이상이어야 합니다')).toBeInTheDocument();
    });
  });

  test('displays test account information', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText('테스트 계정:')).toBeInTheDocument();
    expect(screen.getByText('관리자: admin / password')).toBeInTheDocument();
    expect(screen.getByText('사용자: user / password')).toBeInTheDocument();
  });
});
