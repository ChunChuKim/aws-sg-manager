import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  LinearProgress,
  Fade,
  Grow,
  Slide,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Schedule,
  Assignment,
  TrendingUp,
  Refresh,
  Timeline,
  Speed,
  Shield,
  CloudSync,
  Notifications,
  AutoGraph,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { securityGroupService } from '../services/securityGroupService';
import { requestService } from '../services/requestService';
import { useAuth } from '../hooks/useAuth';
import { keyframes } from '@mui/system';

// 애니메이션 정의
const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(25, 118, 210, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.8);
  }
  100% {
    box-shadow: 0 0 5px rgba(25, 118, 210, 0.5);
  }
`;

const slideInUp = keyframes`
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

export const EnhancedDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Security Groups 데이터 조회
  const { data: securityGroups = [], isLoading: sgLoading, refetch: refetchSGs } = useQuery(
    'securityGroups',
    securityGroupService.getAllSecurityGroups
  );

  // 만료 예정 Security Groups 조회
  const { data: expiringSGs = [] } = useQuery(
    'expiringSGs',
    () => securityGroupService.getExpiringSecurityGroups(7)
  );

  // 요청 통계 조회 (관리자만)
  const { data: requestStats } = useQuery(
    'requestStats',
    requestService.getRequestStatistics,
    { enabled: isAdmin }
  );

  // 내 요청 조회
  const { data: myRequests = [] } = useQuery(
    'myRequests',
    requestService.getMyRequests
  );

  // 통계 계산
  const totalSGs = securityGroups.length;
  const expiredSGs = securityGroups.filter(sg => sg.hasExpiredRules).length;
  const syncedSGs = securityGroups.filter(sg => sg.syncStatus === 'SYNCED').length;
  const totalRules = securityGroups.reduce(
    (sum, sg) => sum + sg.totalInboundRules + sg.totalOutboundRules,
    0
  );

  const pendingRequests = myRequests.filter(req => req.status === 'PENDING').length;
  const approvedRequests = myRequests.filter(req => req.status === 'APPROVED').length;

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchSGs();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // 통계 카드 데이터
  const statsCards = [
    {
      title: 'Security Groups',
      value: totalSGs,
      icon: Security,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: '+12%',
      changeColor: 'success.main',
    },
    {
      title: '만료된 규칙',
      value: expiredSGs,
      icon: Warning,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      change: expiredSGs > 0 ? '주의 필요' : '안전',
      changeColor: expiredSGs > 0 ? 'error.main' : 'success.main',
    },
    {
      title: '동기화됨',
      value: syncedSGs,
      icon: CloudSync,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      change: `${Math.round((syncedSGs / totalSGs) * 100)}%`,
      changeColor: 'info.main',
    },
    {
      title: '총 규칙 수',
      value: totalRules,
      icon: Shield,
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      change: '+8%',
      changeColor: 'success.main',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 섹션 */}
      <Fade in timeout={800}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography 
              variant="h3" 
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
                animation: `${slideInUp} 0.8s ease-out`,
              }}
            >
              안녕하세요, {user?.fullName || user?.username}님! 👋
            </Typography>
            <Typography variant="h6" color="text.secondary">
              AWS Security Group 대시보드에 오신 것을 환영합니다
            </Typography>
          </Box>
          <Tooltip title="데이터 새로고침">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                color: 'white',
                '&:hover': {
                  animation: `${pulse} 0.5s ease-in-out`,
                },
              }}
            >
              <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Fade>

      {/* 통계 카드들 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Grow in timeout={1000 + index * 200}>
              <Card
                sx={{
                  background: card.color,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    animation: `${glow} 2s ease-in-out infinite`,
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.1)',
                    transform: 'translateX(-100%)',
                    transition: 'transform 0.6s',
                  },
                  '&:hover::before': {
                    transform: 'translateX(100%)',
                  },
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="inherit" gutterBottom variant="h6">
                        {card.title}
                      </Typography>
                      <Typography variant="h3" component="div" fontWeight="bold">
                        {card.value}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                        {card.change}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        width: 60,
                        height: 60,
                      }}
                    >
                      <card.icon sx={{ fontSize: 30 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* 만료 예정 알림 */}
      {expiringSGs.length > 0 && (
        <Slide direction="down" in timeout={1200}>
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              '& .MuiAlert-icon': {
                animation: `${pulse} 2s ease-in-out infinite`,
              },
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => navigate('/security-groups')}
                sx={{ fontWeight: 'bold' }}
              >
                확인하기
              </Button>
            }
          >
            <Typography variant="h6" gutterBottom>
              ⚠️ 만료 예정 Security Groups ({expiringSGs.length}개)
            </Typography>
            <Typography variant="body2">
              7일 이내에 만료될 예정인 Security Groups가 있습니다. 즉시 확인하세요!
            </Typography>
          </Alert>
        </Slide>
      )}

      <Grid container spacing={3}>
        {/* 내 요청 현황 */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={1400}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Assignment sx={{ mr: 2, fontSize: 30 }} />
                  <Typography variant="h5" fontWeight="bold">
                    내 요청 현황
                  </Typography>
                </Box>
                
                <Box display="flex" gap={2} mb={3}>
                  <Chip
                    label={`대기 중 ${pendingRequests}`}
                    sx={{
                      bgcolor: 'rgba(255,193,7,0.9)',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                  <Chip
                    label={`승인됨 ${approvedRequests}`}
                    sx={{
                      bgcolor: 'rgba(76,175,80,0.9)',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>

                <List dense>
                  {myRequests.slice(0, 3).map((request, index) => (
                    <Fade in timeout={1600 + index * 200} key={request.id}>
                      <ListItem
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.1)',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemIcon>
                          <Timeline sx={{ color: 'white' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={request.securityGroupName}
                          secondary={
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              {request.statusDisplayName} - {request.priorityDisplayName}
                            </Typography>
                          }
                        />
                        <Chip
                          label={request.status}
                          size="small"
                          sx={{
                            bgcolor: request.status === 'PENDING' ? 'rgba(255,193,7,0.8)' :
                                     request.status === 'APPROVED' ? 'rgba(76,175,80,0.8)' :
                                     'rgba(244,67,54,0.8)',
                            color: 'white',
                          }}
                        />
                      </ListItem>
                    </Fade>
                  ))}
                </List>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/my-requests')}
                  sx={{
                    mt: 2,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                >
                  모든 요청 보기
                </Button>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* 관리자 통계 (관리자만) */}
        {isAdmin && requestStats && (
          <Grid item xs={12} md={6}>
            <Fade in timeout={1600}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Speed sx={{ mr: 2, fontSize: 30 }} />
                    <Typography variant="h5" fontWeight="bold">
                      관리자 대시보드
                    </Typography>
                  </Box>

                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={6}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h4" fontWeight="bold">
                          {requestStats.pendingRequests}
                        </Typography>
                        <Typography variant="body2">대기 중</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h4" fontWeight="bold">
                          {requestStats.totalRequests}
                        </Typography>
                        <Typography variant="body2">전체 요청</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <LinearProgress
                    variant="determinate"
                    value={(requestStats.approvedRequests / requestStats.totalRequests) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'rgba(255,255,255,0.8)',
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    승인률: {Math.round((requestStats.approvedRequests / requestStats.totalRequests) * 100)}%
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate('/admin/requests')}
                    disabled={requestStats.pendingRequests === 0}
                    sx={{
                      mt: 2,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                      },
                    }}
                  >
                    {requestStats.pendingRequests > 0 ? '요청 검토하기' : '검토할 요청 없음'}
                  </Button>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        )}

        {/* 최근 Security Groups */}
        <Grid item xs={12}>
          <Fade in timeout={1800}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justify="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <AutoGraph sx={{ mr: 2, fontSize: 30 }} />
                    <Typography variant="h5" fontWeight="bold">
                      최근 Security Groups
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/visualization')}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.5)',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    시각화 보기
                  </Button>
                </Box>

                <List>
                  {securityGroups.slice(0, 5).map((sg, index) => (
                    <Fade in timeout={2000 + index * 100} key={sg.id}>
                      <ListItem
                        button
                        onClick={() => navigate(`/security-groups/${sg.id}`)}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.1)',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.2)',
                          },
                        }}
                      >
                        <ListItemIcon>
                          <Security sx={{ color: 'white' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={sg.groupName}
                          secondary={
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              {sg.description} - {sg.totalInboundRules + sg.totalOutboundRules}개 규칙
                            </Typography>
                          }
                        />
                        <Box display="flex" gap={1}>
                          {sg.hasExpiredRules && (
                            <Chip 
                              label="만료됨" 
                              size="small"
                              sx={{ bgcolor: 'rgba(244,67,54,0.8)', color: 'white' }}
                            />
                          )}
                          {sg.expiryDate && (
                            <Chip 
                              label="만료일 설정" 
                              size="small"
                              sx={{ bgcolor: 'rgba(255,193,7,0.8)', color: 'white' }}
                            />
                          )}
                          <Chip
                            label={sg.syncStatus}
                            size="small"
                            sx={{
                              bgcolor: sg.syncStatus === 'SYNCED' ? 'rgba(76,175,80,0.8)' : 'rgba(158,158,158,0.8)',
                              color: 'white',
                            }}
                          />
                        </Box>
                      </ListItem>
                    </Fade>
                  ))}
                </List>

                <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/security-groups')}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                >
                  모든 Security Groups 보기
                </Button>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};
