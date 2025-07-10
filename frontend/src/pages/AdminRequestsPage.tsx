import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Fade,
  Slide,
  Zoom,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  Assignment,
  Person,
  Schedule,
  Priority,
  Visibility,
  AdminPanelSettings,
  Speed,
  TrendingUp,
  Warning,
  ExpandMore,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { requestService } from '../services/requestService';
import { RequestStatus, Priority as PriorityType } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AdminRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  // 모든 요청 조회
  const { data: allRequestsData, isLoading: allLoading } = useQuery(
    ['allRequests', 0, 50],
    () => requestService.getAllRequests(0, 50)
  );

  // 대기 중인 요청 조회
  const { data: pendingRequests = [], isLoading: pendingLoading, refetch: refetchPending } = useQuery(
    'pendingRequests',
    requestService.getPendingRequests
  );

  // 높은 우선순위 요청 조회
  const { data: highPriorityRequests = [] } = useQuery(
    'highPriorityRequests',
    requestService.getHighPriorityPendingRequests
  );

  // 요청 통계 조회
  const { data: requestStats } = useQuery(
    'requestStats',
    requestService.getRequestStatistics
  );

  // 승인 뮤테이션
  const approveMutation = useMutation(
    ({ id, comment }: { id: string; comment?: string }) => 
      requestService.approveRequest(id, comment),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingRequests');
        queryClient.invalidateQueries('requestStats');
        queryClient.invalidateQueries('allRequests');
        setReviewDialogOpen(false);
        setReviewComment('');
      },
    }
  );

  // 거절 뮤테이션
  const rejectMutation = useMutation(
    ({ id, comment }: { id: string; comment: string }) => 
      requestService.rejectRequest(id, comment),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingRequests');
        queryClient.invalidateQueries('requestStats');
        queryClient.invalidateQueries('allRequests');
        setReviewDialogOpen(false);
        setReviewComment('');
      },
    }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleReview = (request: any, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedRequest) return;

    if (reviewAction === 'approve') {
      approveMutation.mutate({ id: selectedRequest.id, comment: reviewComment });
    } else {
      if (!reviewComment.trim()) {
        alert('거절 사유를 입력해주세요.');
        return;
      }
      rejectMutation.mutate({ id: selectedRequest.id, comment: reviewComment });
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING': return <Pending color="warning" />;
      case 'APPROVED': return <CheckCircle color="success" />;
      case 'REJECTED': return <Cancel color="error" />;
      case 'APPLIED': return <CheckCircle color="success" />;
      default: return <Assignment />;
    }
  };

  const getPriorityColor = (priority: PriorityType) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: PriorityType) => {
    switch (priority) {
      case 'URGENT': return '🔥';
      case 'HIGH': return '⚡';
      case 'MEDIUM': return '📋';
      case 'LOW': return '📝';
      default: return '📋';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Fade in timeout={600}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
              }}
            >
              관리자 요청 관리
            </Typography>
            <Typography variant="body1" color="text.secondary">
              사용자 요청을 검토하고 승인/거절하세요
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="새로고침">
              <IconButton onClick={() => refetchPending()}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Badge badgeContent={pendingRequests.length} color="error">
              <AdminPanelSettings sx={{ fontSize: 40, color: 'primary.main' }} />
            </Badge>
          </Box>
        </Box>
      </Fade>

      {/* 통계 카드들 */}
      {requestStats && (
        <Slide direction="up" in timeout={800}>
          <Grid container spacing={3} mb={3}>
            {[
              { 
                title: '전체 요청', 
                value: requestStats.totalRequests, 
                color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                icon: Assignment,
                change: '+12%'
              },
              { 
                title: '대기 중', 
                value: requestStats.pendingRequests, 
                color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                icon: Pending,
                change: pendingRequests.length > 0 ? '검토 필요' : '없음'
              },
              { 
                title: '승인됨', 
                value: requestStats.approvedRequests, 
                color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
                icon: CheckCircle,
                change: `${Math.round((requestStats.approvedRequests / requestStats.totalRequests) * 100)}%`
              },
              { 
                title: '거절됨', 
                value: requestStats.rejectedRequests, 
                color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
                icon: Cancel,
                change: `${Math.round((requestStats.rejectedRequests / requestStats.totalRequests) * 100)}%`
              },
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={stat.title}>
                <Zoom in timeout={1000 + index * 200}>
                  <Card
                    sx={{
                      background: stat.color,
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {stat.value}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {stat.title}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            {stat.change}
                          </Typography>
                        </Box>
                        <stat.icon sx={{ fontSize: 50, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Slide>
      )}

      {/* 높은 우선순위 요청 알림 */}
      {highPriorityRequests.length > 0 && (
        <Slide direction="down" in timeout={1200}>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              🚨 긴급/높은 우선순위 요청 ({highPriorityRequests.length}개)
            </Typography>
            <Typography variant="body2">
              즉시 검토가 필요한 요청들이 있습니다.
            </Typography>
          </Alert>
        </Slide>
      )}

      {/* 탭 네비게이션 */}
      <Fade in timeout={1400}>
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Badge badgeContent={pendingRequests.length} color="error">
                      <Pending />
                    </Badge>
                    대기 중 ({pendingRequests.length})
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Priority />
                    높은 우선순위 ({highPriorityRequests.length})
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Assignment />
                    전체 요청
                  </Box>
                } 
              />
            </Tabs>
          </Box>

          {/* 대기 중인 요청 */}
          <TabPanel value={tabValue} index={0}>
            {pendingLoading ? (
              <LinearProgress />
            ) : pendingRequests.length === 0 ? (
              <Box textAlign="center" py={4}>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  검토할 요청이 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  모든 요청이 처리되었습니다.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {pendingRequests.map((request) => (
                  <Grid item xs={12} key={request.id}>
                    <Zoom in timeout={500}>
                      <Card
                        sx={{
                          border: request.priority === 'URGENT' ? '2px solid #f44336' : 
                                 request.priority === 'HIGH' ? '2px solid #ff9800' : '1px solid #e0e0e0',
                          '&:hover': {
                            boxShadow: 4,
                          },
                        }}
                      >
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <Person />
                                </Avatar>
                                <Box>
                                  <Typography variant="h6">
                                    {request.requesterName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {request.requesterEmail}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {request.daysSinceRequested}일 전 요청
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Security Group
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                  {request.securityGroupName}
                                </Typography>
                                <Box display="flex" gap={1} mt={1}>
                                  <Chip
                                    label={`${getPriorityIcon(request.priority)} ${request.priorityDisplayName}`}
                                    color={getPriorityColor(request.priority)}
                                    size="small"
                                  />
                                  <Chip
                                    label={request.ruleType}
                                    size="small"
                                    color={request.ruleType === 'INBOUND' ? 'primary' : 'secondary'}
                                  />
                                </Box>
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={2}>
                              <Box display="flex" gap={1} justifyContent="flex-end">
                                <Tooltip title="상세 보기">
                                  <IconButton
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      // 상세 보기 로직
                                    }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handleReview(request, 'approve')}
                                  sx={{ mr: 1 }}
                                >
                                  승인
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleReview(request, 'reject')}
                                >
                                  거절
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                          
                          <Accordion sx={{ mt: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="body2">요청 상세 정보</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    프로토콜/포트
                                  </Typography>
                                  <Typography variant="body1">
                                    {request.ipProtocol.toUpperCase()}
                                    {request.fromPort && `:${request.fromPort}`}
                                    {request.toPort && request.toPort !== request.fromPort && `-${request.toPort}`}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    CIDR 블록
                                  </Typography>
                                  <Typography variant="body1">
                                    {request.cidrBlocks?.join(', ') || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    비즈니스 사유
                                  </Typography>
                                  <Typography variant="body1">
                                    {request.businessJustification}
                                  </Typography>
                                </Grid>
                                {request.technicalJustification && (
                                  <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                      기술적 사유
                                    </Typography>
                                    <Typography variant="body1">
                                      {request.technicalJustification}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                        </CardContent>
                      </Card>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* 높은 우선순위 요청 */}
          <TabPanel value={tabValue} index={1}>
            <List>
              {highPriorityRequests.map((request) => (
                <React.Fragment key={request.id}>
                  <ListItem
                    sx={{
                      border: '2px solid',
                      borderColor: request.priority === 'URGENT' ? 'error.main' : 'warning.main',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: request.priority === 'URGENT' ? 'error.main' : 'warning.main' }}>
                        {request.priority === 'URGENT' ? '🔥' : '⚡'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="h6">
                            {request.requesterName}
                          </Typography>
                          <Chip
                            label={request.priorityDisplayName}
                            color={getPriorityColor(request.priority)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {request.securityGroupName} - {request.businessJustification}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.daysSinceRequested}일 전 요청
                          </Typography>
                        </Box>
                      }
                    />
                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleReview(request, 'approve')}
                      >
                        승인
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleReview(request, 'reject')}
                      >
                        거절
                      </Button>
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </TabPanel>

          {/* 전체 요청 */}
          <TabPanel value={tabValue} index={2}>
            {allLoading ? (
              <LinearProgress />
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>요청자</TableCell>
                      <TableCell>Security Group</TableCell>
                      <TableCell>규칙 타입</TableCell>
                      <TableCell>우선순위</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>요청일</TableCell>
                      <TableCell>검토자</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allRequestsData?.content.map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {request.requesterName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.requesterEmail}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.securityGroupName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.ruleType}
                            size="small"
                            color={request.ruleType === 'INBOUND' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${getPriorityIcon(request.priority)} ${request.priorityDisplayName}`}
                            color={getPriorityColor(request.priority)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(request.status)}
                            <Typography variant="body2">
                              {request.statusDisplayName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {request.reviewerName || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </Card>
      </Fade>

      {/* 검토 다이얼로그 */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            background: reviewAction === 'approve' 
              ? 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)'
              : 'linear-gradient(45deg, #F44336 30%, #E91E63 90%)',
            color: 'white',
          }}
        >
          요청 {reviewAction === 'approve' ? '승인' : '거절'}
        </DialogTitle>
        {selectedRequest && (
          <DialogContent sx={{ mt: 2 }}>
            <Alert severity={reviewAction === 'approve' ? 'success' : 'error'} sx={{ mb: 2 }}>
              <Typography variant="h6">
                {selectedRequest.requesterName}님의 요청을 {reviewAction === 'approve' ? '승인' : '거절'}하시겠습니까?
              </Typography>
            </Alert>
            
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Security Group
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedRequest.securityGroupName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  우선순위
                </Typography>
                <Chip
                  label={`${getPriorityIcon(selectedRequest.priority)} ${selectedRequest.priorityDisplayName}`}
                  color={getPriorityColor(selectedRequest.priority)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  비즈니스 사유
                </Typography>
                <Typography variant="body1">
                  {selectedRequest.businessJustification}
                </Typography>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label={reviewAction === 'approve' ? '승인 의견 (선택사항)' : '거절 사유 (필수)'}
              multiline
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              required={reviewAction === 'reject'}
              placeholder={
                reviewAction === 'approve' 
                  ? '승인 의견을 입력하세요...'
                  : '거절 사유를 상세히 입력하세요...'
              }
            />
          </DialogContent>
        )}
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setReviewDialogOpen(false)}>
            취소
          </Button>
          <Button
            variant="contained"
            color={reviewAction === 'approve' ? 'success' : 'error'}
            onClick={handleSubmitReview}
            disabled={approveMutation.isLoading || rejectMutation.isLoading}
          >
            {approveMutation.isLoading || rejectMutation.isLoading 
              ? '처리 중...' 
              : reviewAction === 'approve' ? '승인' : '거절'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
