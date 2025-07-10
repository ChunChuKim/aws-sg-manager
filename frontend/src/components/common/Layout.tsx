import React, { useState, ReactNode } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  Chip,
  Paper,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Security,
  Assignment,
  AccountCircle,
  Logout,
  AdminPanelSettings,
  Visibility,
  Notifications,
  Settings,
  Help,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from 'react-query';
import { requestService } from '../../services/requestService';

const drawerWidth = 280;

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const theme = useTheme();

  // 대기 중인 요청 수 조회 (관리자만)
  const { data: pendingRequests = [] } = useQuery(
    'pendingRequests',
    requestService.getPendingRequests,
    { enabled: isAdmin, refetchInterval: 30000 } // 30초마다 새로고침
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const menuItems = [
    {
      text: '대시보드',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: ['ROLE_USER', 'ROLE_ADMIN'],
      color: '#667eea',
    },
    {
      text: 'Security Groups',
      icon: <Security />,
      path: '/security-groups',
      roles: ['ROLE_USER', 'ROLE_ADMIN'],
      color: '#4facfe',
    },
    {
      text: '시각화',
      icon: <Visibility />,
      path: '/visualization',
      roles: ['ROLE_USER', 'ROLE_ADMIN'],
      color: '#43e97b',
    },
    {
      text: '내 요청',
      icon: <Assignment />,
      path: '/my-requests',
      roles: ['ROLE_USER', 'ROLE_ADMIN'],
      color: '#f093fb',
    },
    {
      text: '요청 관리',
      icon: <AdminPanelSettings />,
      path: '/admin/requests',
      roles: ['ROLE_ADMIN'],
      badge: pendingRequests.length,
      color: '#ff6b6b',
    },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.some(role => user?.roles.includes(role as any))
  );

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: '80px !important',
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              width: 40,
              height: 40,
            }}
          >
            🛡️
          </Avatar>
          <Box>
            <Typography variant="h6" noWrap fontWeight="bold">
              AWS SG Manager
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Security Group 관리
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Paper
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
              {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {user?.fullName || user?.username}
              </Typography>
              <Chip
                label={isAdmin ? '관리자' : '사용자'}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '0.75rem',
                  height: 20,
                }}
              />
            </Box>
          </Box>
        </Paper>
      </Box>

      <List sx={{ flexGrow: 1, px: 1 }}>
        {filteredMenuItems.map((item) => (
          <Fade in timeout={500} key={item.text}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&.Mui-selected': {
                    background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                    borderLeft: `4px solid ${item.color}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${item.color}30, ${item.color}15)`,
                    },
                  },
                  '&:hover': {
                    background: `${item.color}10`,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? item.color : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.badge && item.badge > 0 ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path ? item.color : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </Fade>
        ))}
      </List>

      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          💡 Amazon Q로 1시간 만에 개발
        </Typography>
        <Typography variant="caption" color="text.secondary">
          v1.0.0 - 2024
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" fontWeight="bold">
              {filteredMenuItems.find(item => item.path === location.pathname)?.text || 'AWS Security Group Manager'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              실시간 보안 그룹 관리 및 모니터링
            </Typography>
          </Box>
          
          {/* 알림 아이콘 */}
          {isAdmin && (
            <Tooltip title={`${pendingRequests.length}개의 대기 중인 요청`}>
              <IconButton 
                color="inherit" 
                sx={{ mr: 1 }}
                onClick={() => navigate('/admin/requests')}
              >
                <Badge badgeContent={pendingRequests.length} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          {/* 설정 아이콘 */}
          <Tooltip title="설정">
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Settings />
            </IconButton>
          </Tooltip>

          {/* 사용자 메뉴 */}
          <div>
            <Tooltip title="사용자 메뉴">
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  },
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'transparent' }}>
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  minWidth: 200,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="body2" fontWeight="bold">
                  {user?.fullName || user?.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={isAdmin ? '관리자' : '사용자'}
                    size="small"
                    color={isAdmin ? 'primary' : 'default'}
                  />
                </Box>
              </Box>
              
              <MenuItem onClick={handleClose}>
                <AccountCircle sx={{ mr: 1 }} />
                프로필 설정
              </MenuItem>
              
              <MenuItem onClick={handleClose}>
                <Help sx={{ mr: 1 }} />
                도움말
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <Logout sx={{ mr: 1 }} />
                로그아웃
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }} />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
