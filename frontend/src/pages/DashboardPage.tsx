import React from 'react';
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
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Schedule,
  Assignment,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { securityGroupService } from '../services/securityGroupService';
import { requestService } from '../services/requestService';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Security Groups 데이터 조회
  const { data: securityGroups = [], isLoading: sgLoading } = useQuery(
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        대시보드
      </Typography>

      {/* 통계 카드들 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Security color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Security Groups
                  </Typography>
                  <Typography variant="h5">
                    {totalSGs}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    만료된 규칙
                  </Typography>
                  <Typography variant="h5">
                    {expiredSGs}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    동기화됨
                  </Typography>
                  <Typography variant="h5">
                    {syncedSGs}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    총 규칙 수
                  </Typography>
                  <Typography variant="h5">
                    {totalRules}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 만료 예정 알림 */}
        {expiringSGs.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                만료 예정 Security Groups ({expiringSGs.length}개)
              </Typography>
              <Typography variant="body2">
                7일 이내에 만료될 예정인 Security Groups가 있습니다.
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/security-groups')}
                sx={{ mt: 1 }}
              >
                확인하기
              </Button>
            </Alert>
          </Grid>
        )}

        {/* 내 요청 현황 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                내 요청 현황
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={`대기 중 ${pendingRequests}`}
                  color="warning"
                  size="small"
                />
                <Chip
                  label={`승인됨 ${approvedRequests}`}
                  color="success"
                  size="small"
                />
              </Box>
              <List dense>
                {myRequests.slice(0, 5).map((request) => (
                  <ListItem key={request.id}>
                    <ListItemIcon>
                      <Assignment fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={request.securityGroupName}
                      secondary={`${request.statusDisplayName} - ${request.priorityDisplayName}`}
                    />
                    <Chip
                      label={request.status}
                      size="small"
                      color={
                        request.status === 'PENDING' ? 'warning' :
                        request.status === 'APPROVED' ? 'success' :
                        request.status === 'REJECTED' ? 'error' : 'default'
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 1 }} />
              <Button
                fullWidth
                onClick={() => navigate('/my-requests')}
              >
                모든 요청 보기
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 관리자 통계 (관리자만) */}
        {isAdmin && requestStats && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  요청 관리 현황
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <Chip
                    label={`대기 중 ${requestStats.pendingRequests}`}
                    color="warning"
                    size="small"
                  />
                  <Chip
                    label={`승인됨 ${requestStats.approvedRequests}`}
                    color="success"
                    size="small"
                  />
                  <Chip
                    label={`거절됨 ${requestStats.rejectedRequests}`}
                    color="error"
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  총 {requestStats.totalRequests}개의 요청이 있습니다.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/admin/requests')}
                  disabled={requestStats.pendingRequests === 0}
                >
                  요청 검토하기
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 최근 Security Groups */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                최근 Security Groups
              </Typography>
              <List>
                {securityGroups.slice(0, 5).map((sg) => (
                  <ListItem
                    key={sg.id}
                    button
                    onClick={() => navigate(`/security-groups/${sg.id}`)}
                  >
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText
                      primary={sg.groupName}
                      secondary={`${sg.description} - ${sg.totalInboundRules + sg.totalOutboundRules}개 규칙`}
                    />
                    <Box display="flex" gap={1}>
                      {sg.hasExpiredRules && (
                        <Chip label="만료됨" color="error" size="small" />
                      )}
                      {sg.expiryDate && (
                        <Chip label="만료일 설정" color="warning" size="small" />
                      )}
                      <Chip
                        label={sg.syncStatus}
                        color={sg.syncStatus === 'SYNCED' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 1 }} />
              <Button
                fullWidth
                onClick={() => navigate('/security-groups')}
              >
                모든 Security Groups 보기
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
