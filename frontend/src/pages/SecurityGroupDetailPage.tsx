import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Badge,
  Fade,
  Slide,
  Zoom,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Add,
  Security,
  Warning,
  Schedule,
  CloudSync,
  Visibility,
  ExpandMore,
  Input,
  Output,
  Info,
  Timeline,
  Speed,
  Shield,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { securityGroupService } from '../services/securityGroupService';
import { useAuth } from '../hooks/useAuth';
import { SecurityGroup, SecurityGroupRule, RuleFormData } from '../types';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const SecurityGroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const [tabValue, setTabValue] = useState(0);
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [ruleType, setRuleType] = useState<'inbound' | 'outbound'>('inbound');
  const [editMode, setEditMode] = useState(false);

  const { data: securityGroup, isLoading, error, refetch } = useQuery(
    ['securityGroup', id],
    () => securityGroupService.getSecurityGroup(id!),
    { enabled: !!id }
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RuleFormData>();

  // 규칙 추가 뮤테이션
  const addRuleMutation = useMutation(
    (data: { ruleData: RuleFormData; type: 'inbound' | 'outbound' }) => {
      if (data.type === 'inbound') {
        return securityGroupService.addInboundRule(id!, data.ruleData);
      } else {
        return securityGroupService.addOutboundRule(id!, data.ruleData);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['securityGroup', id]);
        setAddRuleOpen(false);
        reset();
      },
    }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddRule = (data: RuleFormData) => {
    const processedData = {
      ...data,
      cidrBlocks: data.cidrBlocks || ['0.0.0.0/0'],
      expiryDate: data.expiryDate || undefined,
    };
    
    addRuleMutation.mutate({ ruleData: processedData, type: ruleType });
  };

  const getRiskColor = (rule: SecurityGroupRule) => {
    if (rule.isExpired) return 'error';
    if (rule.expiryDate && rule.daysUntilExpiry <= 7) return 'warning';
    return 'success';
  };

  const getRiskLabel = (rule: SecurityGroupRule) => {
    if (rule.isExpired) return '만료됨';
    if (rule.expiryDate && rule.daysUntilExpiry <= 7) return `${rule.daysUntilExpiry}일 후 만료`;
    return '정상';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !securityGroup) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Security Group을 불러오는데 실패했습니다.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Fade in timeout={600}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/security-groups')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box flexGrow={1}>
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
              }}
            >
              {securityGroup.groupName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {securityGroup.description || '설명 없음'}
            </Typography>
          </Box>
          {isAdmin && (
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setEditMode(true)}
              >
                편집
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
              >
                삭제
              </Button>
            </Box>
          )}
        </Box>
      </Fade>

      {/* 기본 정보 카드 */}
      <Slide direction="up" in timeout={800}>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  기본 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Group ID
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {securityGroup.groupId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      VPC ID
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {securityGroup.vpcId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Owner ID
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {securityGroup.ownerId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      생성자
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {securityGroup.createdBy || 'Unknown'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  상태 정보
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">동기화 상태</Typography>
                    <Chip
                      label={securityGroup.syncStatus}
                      size="small"
                      sx={{
                        bgcolor: securityGroup.syncStatus === 'SYNCED' ? 'rgba(76,175,80,0.8)' : 'rgba(244,67,54,0.8)',
                        color: 'white',
                      }}
                    />
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">인바운드 규칙</Typography>
                    <Badge badgeContent={securityGroup.totalInboundRules} color="secondary">
                      <Input />
                    </Badge>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">아웃바운드 규칙</Typography>
                    <Badge badgeContent={securityGroup.totalOutboundRules} color="secondary">
                      <Output />
                    </Badge>
                  </Box>
                  {securityGroup.hasExpiredRules && (
                    <Alert severity="warning" sx={{ bgcolor: 'rgba(255,193,7,0.2)' }}>
                      만료된 규칙이 있습니다!
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Slide>

      {/* 규칙 탭 */}
      <Zoom in timeout={1000}>
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Input />
                    인바운드 규칙 ({securityGroup.totalInboundRules})
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Output />
                    아웃바운드 규칙 ({securityGroup.totalOutboundRules})
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Timeline />
                    히스토리
                  </Box>
                } 
              />
            </Tabs>
          </Box>

          {/* 인바운드 규칙 */}
          <TabPanel value={tabValue} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">인바운드 규칙</Typography>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setRuleType('inbound');
                    setAddRuleOpen(true);
                  }}
                  sx={{
                    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  }}
                >
                  규칙 추가
                </Button>
              )}
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>프로토콜</TableCell>
                    <TableCell>포트 범위</TableCell>
                    <TableCell>소스</TableCell>
                    <TableCell>설명</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>만료일</TableCell>
                    {isAdmin && <TableCell>작업</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {securityGroup.inboundRules.map((rule, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Chip label={rule.ipProtocol.toUpperCase()} size="small" />
                      </TableCell>
                      <TableCell>{rule.portRange}</TableCell>
                      <TableCell>
                        {rule.cidrBlocks.map((cidr, i) => (
                          <Chip key={i} label={cidr} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                        ))}
                      </TableCell>
                      <TableCell>{rule.description || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRiskLabel(rule)}
                          color={getRiskColor(rule)}
                          size="small"
                          icon={rule.isExpired ? <Warning /> : <Shield />}
                        />
                      </TableCell>
                      <TableCell>
                        {rule.expiryDate ? (
                          <Typography variant="body2">
                            {new Date(rule.expiryDate).toLocaleDateString()}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <IconButton size="small" color="error">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* 아웃바운드 규칙 */}
          <TabPanel value={tabValue} index={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">아웃바운드 규칙</Typography>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setRuleType('outbound');
                    setAddRuleOpen(true);
                  }}
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  }}
                >
                  규칙 추가
                </Button>
              )}
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>프로토콜</TableCell>
                    <TableCell>포트 범위</TableCell>
                    <TableCell>대상</TableCell>
                    <TableCell>설명</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>만료일</TableCell>
                    {isAdmin && <TableCell>작업</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {securityGroup.outboundRules.map((rule, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Chip label={rule.ipProtocol.toUpperCase()} size="small" />
                      </TableCell>
                      <TableCell>{rule.portRange}</TableCell>
                      <TableCell>
                        {rule.cidrBlocks.map((cidr, i) => (
                          <Chip key={i} label={cidr} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                        ))}
                      </TableCell>
                      <TableCell>{rule.description || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRiskLabel(rule)}
                          color={getRiskColor(rule)}
                          size="small"
                          icon={rule.isExpired ? <Warning /> : <Shield />}
                        />
                      </TableCell>
                      <TableCell>
                        {rule.expiryDate ? (
                          <Typography variant="body2">
                            {new Date(rule.expiryDate).toLocaleDateString()}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <IconButton size="small" color="error">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* 히스토리 */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              변경 히스토리
            </Typography>
            <Box>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>생성 정보</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    생성일: {new Date(securityGroup.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    생성자: {securityGroup.createdBy || 'Unknown'}
                  </Typography>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>최근 업데이트</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    수정일: {new Date(securityGroup.updatedAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    동기화: {new Date(securityGroup.lastSyncedAt).toLocaleString()}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          </TabPanel>
        </Card>
      </Zoom>

      {/* 규칙 추가 다이얼로그 */}
      <Dialog open={addRuleOpen} onClose={() => setAddRuleOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {ruleType === 'inbound' ? '인바운드' : '아웃바운드'} 규칙 추가
        </DialogTitle>
        <form onSubmit={handleSubmit(handleAddRule)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
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
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="시작 포트"
                  type="number"
                  {...register('fromPort')}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
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
                <TextField
                  fullWidth
                  label="만료일"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  {...register('expiryDate')}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddRuleOpen(false)}>취소</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={addRuleMutation.isLoading}
            >
              {addRuleMutation.isLoading ? '추가 중...' : '추가'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
