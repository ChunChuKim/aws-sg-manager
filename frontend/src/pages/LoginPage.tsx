import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
  CssBaseline,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { LoginRequest } from '../types';

export const LoginPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  // 이미 로그인된 경우 대시보드로 리다이렉트
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    setError('');

    try {
      await login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          AWS Security Group Manager
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          로그인하여 Security Group을 관리하세요
        </Typography>

        <Card sx={{ width: '100%', mt: 1 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="사용자명"
                autoComplete="username"
                autoFocus
                {...register('username', {
                  required: '사용자명을 입력하세요',
                  minLength: {
                    value: 3,
                    message: '사용자명은 최소 3자 이상이어야 합니다',
                  },
                })}
                error={!!errors.username}
                helperText={errors.username?.message}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="비밀번호"
                type="password"
                id="password"
                autoComplete="current-password"
                {...register('password', {
                  required: '비밀번호를 입력하세요',
                  minLength: {
                    value: 6,
                    message: '비밀번호는 최소 6자 이상이어야 합니다',
                  },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </Button>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>테스트 계정:</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  관리자: admin / password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  사용자: user / password
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
