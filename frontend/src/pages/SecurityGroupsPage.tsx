import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Security,
  Warning,
  Schedule,
  Visibility,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { securityGroupService } from '../services/securityGroupService';
import { useAuth } from '../hooks/useAuth';
import { SecurityGroup } from '../types';

export const SecurityGroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSG, setSelectedSG] = useState<SecurityGroup | null>(null);

  const { data: securityGroups = [], isLoading, error, refetch } = useQuery(
    'securityGroups',
    securityGroupService.getAllSecurityGroups
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, sg: SecurityGroup) => {
    setAnchorEl(event.currentTarget);
    setSelectedSG(sg);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSG(null);
  };

  const handleView = () => {
    if (selectedSG) {
      navigate(`/security-groups/${selectedSG.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedSG && window.confirm('정말로 이 Security Group을 삭제하시겠습니까?')) {
      try {
        await securityGroupService.deleteSecurityGroup(selectedSG.id);
        refetch();
      } catch (error) {
        console.error('Failed to delete security group:', error);
      }
    }
    handleMenuClose();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Security Groups를 불러오는데 실패했습니다.
      </Alert>
    );
  }

  const expiredSGs = securityGroups.filter(sg => sg.hasExpiredRules);
  const expiringSGs = securityGroups.filter(sg => 
    sg.expiryDate && new Date(sg.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Security Groups ({securityGroups.length})
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/security-groups/new')}
          >
            새 Security Group
          </Button>
        )}
      </Box>

      {/* 알림 */}
      {expiredSGs.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {expiredSGs.length}개의 Security Group에 만료된 규칙이 있습니다.
        </Alert>
      )}

      {expiringSGs.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {expiringSGs.length}개의 Security Group이 7일 이내에 만료됩니다.
        </Alert>
      )}

      {/* Security Groups 그리드 */}
      <Grid container spacing={3}>
        {securityGroups.map((sg) => (
          <Grid item xs={12} sm={6} md={4} key={sg.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
              onClick={() => navigate(`/security-groups/${sg.id}`)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Security color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div" noWrap>
                      {sg.groupName}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(e, sg);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {sg.description || '설명 없음'}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ID: {sg.groupId}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  VPC: {sg.vpcId}
                </Typography>

                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  <Chip
                    label={`인바운드 ${sg.totalInboundRules}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`아웃바운드 ${sg.totalOutboundRules}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap">
                  {sg.hasExpiredRules && (
                    <Chip
                      icon={<Warning />}
                      label="만료된 규칙"
                      size="small"
                      color="error"
                    />
                  )}
                  {sg.expiryDate && (
                    <Chip
                      icon={<Schedule />}
                      label="만료일 설정"
                      size="small"
                      color="warning"
                    />
                  )}
                  <Chip
                    label={sg.syncStatus}
                    size="small"
                    color={sg.syncStatus === 'SYNCED' ? 'success' : 'default'}
                  />
                </Box>

                {sg.expiryDate && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    만료일: {new Date(sg.expiryDate).toLocaleDateString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {securityGroups.length === 0 && (
        <Box textAlign="center" py={4}>
          <Security sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Security Groups가 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AWS에서 Security Groups를 동기화하거나 새로 생성하세요.
          </Typography>
        </Box>
      )}

      {/* 컨텍스트 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <Visibility sx={{ mr: 1 }} />
          상세 보기
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            삭제
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};
