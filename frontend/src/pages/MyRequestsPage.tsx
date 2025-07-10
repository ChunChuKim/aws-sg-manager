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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Fab,
  Fade,
  Slide,
  Zoom,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Assignment,
  Schedule,
  CheckCircle,
  Cancel,
  Pending,
  Error,
  Visibility,
  Edit,
  Delete,
  FilterList,
  Refresh,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { requestService } from '../services/requestService';
import { securityGroupService } from '../services/securityGroupService';
import { RuleRequestFormData, RequestStatus, Priority, RequestType, RuleType } from '../types';

export const MyRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RequestStatus | 'ALL'>('ALL');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<RuleRequestFormData>();

  // 내 요청 조회
  const { data: myRequests = [], isLoading, refetch } = useQuery(
    'myRequests',
    requestService.getMyRequests
  );

  // Security Groups 조회 (드롭다운용)
  const { data: securityGroups = [] } = useQuery(
    'securityGroups',
    securityGroupService.getAllSecurityGroups
  );

  // 요청 생성 뮤테이션
  const createRequestMutation = useMutation(
    requestService.createRuleRequest,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('myRequests');
        setCreateRequestOpen(false);
        reset();
      },
    }
  );

  // 요청 취소 뮤테이션
  const cancelRequestMutation = useMutation(
    requestService.cancelRequest,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('myRequests');
      },
    }
  );

  const handleCreateRequest = (data: RuleRequestFormData) => {
    const processedData = {
      ...data,
      cidrBlocks: data.cidrBlocks ? data.cidrBlocks.toString().split(',').map(s => s.trim()) : ['0.0.0.0/0'],
      expiryDate: data.expiryDate || undefined,
    };
    
    createRequestMutation.mutate(processedData);
  };

  const handleCancelRequest = (requestId: string) => {
    if (window.confirm('정말로 이 요청을 취소하시겠습니까?')) {
      cancelRequestMutation.mutate(requestId);
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING': return <Pending color="warning" />;
      case 'APPROVED': return <CheckCircle color="success" />;
      case 'REJECTED': return <Cancel color="error" />;
      case 'APPLIED': return <CheckCircle color="success" />;
      case 'FAILED': return <Error color="error" />;
      case 'CANCELLED': return <Cancel color="disabled" />;
      default: return <Assignment />;
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'APPLIED': return 'success';
      case 'FAILED': return 'error';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  // 필터링된 요청들
  const filteredRequests = filterStatus === 'ALL' 
    ? myRequests 
    : myRequests.filter(req => req.status === filterStatus);

  // 통계 계산
  const stats = {
    total: myRequests.length,
    pending: myRequests.filter(req => req.status === 'PENDING').length,
    approved: myRequests.filter(req => req.status === 'APPROVED').length,
    rejected: myRequests.filter(req => req.status === 'REJECTED').length,
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
                background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
              }}
            >
              내 요청 관리
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Security Group 규칙 추가 요청을 관리하세요
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="새로고침">
              <IconButton onClick={() => refetch()}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateRequestOpen(true)}
              sx={{
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
              }}
            >
              새 요청
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* 통계 카드들 */}
      <Slide direction="up" in timeout={800}>
        <Grid container spacing={3} mb={3}>
          {[
            { title: '전체 요청', value: stats.total, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: Assignment },
            { title: '대기 중', value: stats.pending, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: Pending },
            { title: '승인됨', value: stats.approved, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: CheckCircle },
            { title: '거절됨', value: stats.rejected, color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: Cancel },
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
                        <Typography variant="h4" fontWeight="bold">
                          {stat.value}
                        </Typography>
                        <Typography variant="body1">
                          {stat.title}
                        </Typography>
                      </Box>
                      <stat.icon sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Slide>

      {/* 필터 및 테이블 */}
      <Fade in timeout={1200}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">요청 목록</Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>상태 필터</InputLabel>
                <Select
                  value={filterStatus}
                  label="상태 필터"
                  onChange={(e) => setFilterStatus(e.target.value as RequestStatus | 'ALL')}
                >
                  <MenuItem value="ALL">전체</MenuItem>
                  <MenuItem value="PENDING">대기 중</MenuItem>
                  <MenuItem value="APPROVED">승인됨</MenuItem>
                  <MenuItem value="REJECTED">거절됨</MenuItem>
                  <MenuItem value="APPLIED">적용됨</MenuItem>
                  <MenuItem value="CANCELLED">취소됨</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {isLoading ? (
              <LinearProgress />
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Security Group</TableCell>
                      <TableCell>규칙 타입</TableCell>
                      <TableCell>프로토콜/포트</TableCell>
                      <TableCell>우선순위</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>요청일</TableCell>
                      <TableCell>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {request.securityGroupName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.securityGroupId}
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
                          <Typography variant="body2">
                            {request.ipProtocol.toUpperCase()}
                            {request.fromPort && `:${request.fromPort}`}
                            {request.toPort && request.toPort !== request.fromPort && `-${request.toPort}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.priorityDisplayName}
                            size="small"
                            color={getPriorityColor(request.priority)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(request.status)}
                            <Chip
                              label={request.statusDisplayName}
                              size="small"
                              color={getStatusColor(request.status)}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.daysSinceRequested}일 전
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="상세 보기">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setDetailOpen(true);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {request.status === 'PENDING' && (
                              <Tooltip title="취소">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelRequest(request.id)}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {filteredRequests.length === 0 && !isLoading && (
              <Box textAlign="center" py={4}>
                <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  요청이 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  새로운 Security Group 규칙 요청을 생성해보세요.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Fade>

      {/* 요청 생성 다이얼로그 */}
      <Dialog open={createRequestOpen} onClose={() => setCreateRequestOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            color: 'white',
          }}
        >
          새 규칙 요청 생성
        </DialogTitle>
        <form onSubmit={handleSubmit(handleCreateRequest)}>
          <DialogContent sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Security Group</InputLabel>
                  <Select
                    {...register('securityGroupId', { required: 'Security Group을 선택하세요' })}
                    error={!!errors.securityGroupId}
                  >
                    {securityGroups.map((sg) => (
                      <MenuItem key={sg.id} value={sg.id}>
                        {sg.groupName} ({sg.groupId})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>요청 타입</InputLabel>
                  <Select
                    {...register('requestType', { required: '요청 타입을 선택하세요' })}
                    defaultValue="ADD_RULE"
                  >
                    <MenuItem value="ADD_RULE">규칙 추가</MenuItem>
                    <MenuItem value="MODIFY_RULE">규칙 수정</MenuItem>
                    <MenuItem value="DELETE_RULE">규칙 삭제</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>규칙 타입</InputLabel>
                  <Select
                    {...register('ruleType', { required: '규칙 타입을 선택하세요' })}
                    defaultValue="INBOUND"
                  >
                    <MenuItem value="INBOUND">인바운드</MenuItem>
                    <MenuItem value="OUTBOUND">아웃바운드</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>프로토콜</InputLabel>
                  <Select
                    {...register('ipProtocol', { required: '프로토콜을 선택하세요' })}
                    defaultValue="tcp"
                  >
                    <MenuItem value="tcp">TCP</MenuItem>
                    <MenuItem value="udp">UDP</MenuItem>
                    <MenuItem value="icmp">ICMP</MenuItem>
                    <MenuItem value="-1">All</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="시작 포트"
                  type="number"
                  {...register('fromPort')}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="끝 포트"
                  type="number"
                  {...register('toPort')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="CIDR 블록 (쉼표로 구분)"
                  placeholder="0.0.0.0/0, 10.0.0.0/8"
                  {...register('cidrBlocks')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="설명"
                  multiline
                  rows={2}
                  {...register('description')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>우선순위</InputLabel>
                  <Select
                    {...register('priority', { required: '우선순위를 선택하세요' })}
                    defaultValue="MEDIUM"
                  >
                    <MenuItem value="LOW">낮음</MenuItem>
                    <MenuItem value="MEDIUM">보통</MenuItem>
                    <MenuItem value="HIGH">높음</MenuItem>
                    <MenuItem value="URGENT">긴급</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="만료일"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...register('expiryDate')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="비즈니스 사유"
                  multiline
                  rows={3}
                  required
                  {...register('businessJustification', { required: '비즈니스 사유를 입력하세요' })}
                  error={!!errors.businessJustification}
                  helperText={errors.businessJustification?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="기술적 사유"
                  multiline
                  rows={2}
                  {...register('technicalJustification')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setCreateRequestOpen(false)}>
              취소
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createRequestMutation.isLoading}
              sx={{
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              }}
            >
              {createRequestMutation.isLoading ? '생성 중...' : '요청 생성'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 요청 상세 다이얼로그 */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        {selectedRequest && (
          <>
            <DialogTitle>
              요청 상세 정보
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Security Group
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedRequest.securityGroupName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    상태
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(selectedRequest.status)}
                    <Typography variant="body1">
                      {selectedRequest.statusDisplayName}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    비즈니스 사유
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedRequest.businessJustification}
                  </Typography>
                </Grid>
                {selectedRequest.technicalJustification && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      기술적 사유
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedRequest.technicalJustification}
                    </Typography>
                  </Grid>
                )}
                {selectedRequest.reviewComment && (
                  <Grid item xs={12}>
                    <Alert severity={selectedRequest.status === 'APPROVED' ? 'success' : 'error'}>
                      <Typography variant="subtitle2">
                        검토 의견 ({selectedRequest.reviewerName})
                      </Typography>
                      <Typography variant="body2">
                        {selectedRequest.reviewComment}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>

              {/* 타임라인 */}
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  진행 상황
                </Typography>
                <Timeline>
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color="primary">
                        <Assignment />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(selectedRequest.requestedAt).toLocaleString()}
                      </Typography>
                      <Typography>요청 생성</Typography>
                    </TimelineContent>
                  </TimelineItem>
                  
                  {selectedRequest.reviewedAt && (
                    <TimelineItem>
                      <TimelineSeparator>
                        <TimelineDot color={selectedRequest.status === 'APPROVED' ? 'success' : 'error'}>
                          {selectedRequest.status === 'APPROVED' ? <CheckCircle /> : <Cancel />}
                        </TimelineDot>
                        {selectedRequest.status === 'APPROVED' && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(selectedRequest.reviewedAt).toLocaleString()}
                        </Typography>
                        <Typography>
                          {selectedRequest.status === 'APPROVED' ? '승인됨' : '거절됨'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          검토자: {selectedRequest.reviewerName}
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  )}
                </Timeline>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailOpen(false)}>
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
