import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Security, Dashboard, Assignment } from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const HomePage: React.FC = () => {
  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Typography 
        variant="h3" 
        gutterBottom 
        sx={{
          background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          textAlign: 'center',
          mb: 4
        }}
      >
        🛡️ AWS Security Group Manager
      </Typography>
      
      <Typography variant="h6" textAlign="center" color="text.secondary" mb={4}>
        Amazon Q가 1시간 만에 개발한 엔터프라이즈급 애플리케이션
      </Typography>

      <Box display="flex" justifyContent="center" gap={3} flexWrap="wrap">
        <Card sx={{ minWidth: 300, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Dashboard sx={{ mr: 2, fontSize: 40 }} />
              <Typography variant="h5" fontWeight="bold">
                대시보드
              </Typography>
            </Box>
            <Typography variant="body1" mb={2}>
              실시간 Security Group 현황과 통계를 확인하세요
            </Typography>
            <Button variant="contained" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              바로가기
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 300, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Security sx={{ mr: 2, fontSize: 40 }} />
              <Typography variant="h5" fontWeight="bold">
                Security Groups
              </Typography>
            </Box>
            <Typography variant="body1" mb={2}>
              AWS Security Group을 실시간으로 관리하세요
            </Typography>
            <Button variant="contained" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              관리하기
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 300, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Assignment sx={{ mr: 2, fontSize: 40 }} />
              <Typography variant="h5" fontWeight="bold">
                요청 관리
              </Typography>
            </Box>
            <Typography variant="body1" mb={2}>
              규칙 추가 요청과 승인 워크플로우를 관리하세요
            </Typography>
            <Button variant="contained" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              요청하기
            </Button>
          </CardContent>
        </Card>
      </Box>

      <Box mt={6} textAlign="center">
        <Typography variant="h6" gutterBottom>
          ✨ 주요 기능
        </Typography>
        <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap" mt={2}>
          {[
            '🔐 JWT 인증',
            '📊 실시간 대시보드', 
            '🌐 시각화 네트워크',
            '🔔 스마트 알림',
            '⚡ 자동 만료 관리',
            '👥 승인 워크플로우'
          ].map((feature, index) => (
            <Card key={index} sx={{ p: 1, minWidth: 150 }}>
              <Typography variant="body2" fontWeight="bold">
                {feature}
              </Typography>
            </Card>
          ))}
        </Box>
      </Box>

      <Box mt={4} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          💡 이 애플리케이션은 Amazon Q의 강력한 개발 능력을 보여주는 데모입니다
        </Typography>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
