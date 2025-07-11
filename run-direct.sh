#!/bin/bash

echo "🛡️ AWS Security Group Manager - Direct Run (No Docker)"
echo "✨ 메모리 기반 실행으로 디스크 공간 절약!"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 퍼블릭 IP 및 DNS 확인
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)" http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)
PUBLIC_DNS=$(curl -s -H "X-aws-ec2-metadata-token: $(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)" http://169.254.169.254/latest/meta-data/public-hostname 2>/dev/null)

if [ -z "$PUBLIC_IP" ]; then
    PUBLIC_IP="localhost"
    PUBLIC_DNS="localhost"
fi

echo -e "${CYAN}🌐 접속 정보:${NC}"
echo -e "   IP 주소: ${GREEN}$PUBLIC_IP${NC}"
echo -e "   DNS 주소: ${GREEN}$PUBLIC_DNS${NC}"
echo ""

# 현재 디렉토리 확인
cd /home/ec2-user/aws-sg-manager

# 환경 변수 설정
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚙️ 환경 변수 파일 생성 중...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env 파일 생성 완료${NC}"
fi

# 기존 프로세스 종료
echo -e "${YELLOW}🛑 기존 프로세스 정리 중...${NC}"
pkill -f "simple-enhanced-api.js" 2>/dev/null || true
pkill -f "python3 -m http.server" 2>/dev/null || true

# Node.js 의존성 최소 설치 (메모리 기반)
echo -e "${BLUE}📦 필수 의존성만 설치 중...${NC}"
npm install --no-save express cors dotenv aws-sdk 2>/dev/null || {
    echo -e "${RED}❌ npm 설치 실패. 기본 Node.js 모듈 사용${NC}"
}

echo ""
echo -e "${PURPLE}🚀 서비스 시작 중...${NC}"

# 1. Backend API 서버 시작 (백그라운드)
echo -e "${BLUE}🔧 Backend API 서버 시작 (포트 8081)...${NC}"
nohup node simple-enhanced-api.js > api.log 2>&1 &
API_PID=$!
echo -e "${GREEN}✅ Backend API 서버 시작됨 (PID: $API_PID)${NC}"

# 2. Frontend 웹서버 시작 (백그라운드)
echo -e "${BLUE}🌐 Frontend 웹서버 시작 (포트 8082)...${NC}"
nohup python3 -m http.server 8082 > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend 웹서버 시작됨 (PID: $FRONTEND_PID)${NC}"

# 서비스 시작 대기
echo -e "${YELLOW}⏳ 서비스 초기화 중...${NC}"
sleep 5

# 서비스 상태 확인
echo ""
echo -e "${PURPLE}📋 서비스 상태:${NC}"

# API 서버 확인
if curl -s http://localhost:8081/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API (8081) - 정상 작동${NC}"
else
    echo -e "${RED}❌ Backend API (8081) - 연결 실패${NC}"
fi

# Frontend 서버 확인
if curl -s http://localhost:8082 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend Web (8082) - 정상 작동${NC}"
else
    echo -e "${RED}❌ Frontend Web (8082) - 연결 실패${NC}"
fi

echo ""
echo -e "${CYAN}🎯 접속 URL:${NC}"
echo -e "   메인 대시보드: ${GREEN}http://$PUBLIC_IP:8082/${NC}"
echo -e "   Security Group 관리: ${GREEN}http://$PUBLIC_IP:8082/sg-manager.html${NC}"
echo -e "   요청 관리: ${GREEN}http://$PUBLIC_IP:8082/requests-manager.html${NC}"
echo -e "   네트워크 시각화: ${GREEN}http://$PUBLIC_IP:8082/network-visualization-enhanced.html${NC}"
echo -e "   API 엔드포인트: ${GREEN}http://$PUBLIC_IP:8081/api/${NC}"

echo ""
echo -e "${YELLOW}📝 로그 확인:${NC}"
echo -e "   Backend 로그: ${BLUE}tail -f api.log${NC}"
echo -e "   Frontend 로그: ${BLUE}tail -f frontend.log${NC}"

echo ""
echo -e "${YELLOW}🛑 서비스 중지:${NC}"
echo -e "   ${BLUE}kill $API_PID $FRONTEND_PID${NC}"

echo ""
echo -e "${GREEN}🎉 AWS Security Group Manager가 성공적으로 시작되었습니다!${NC}"
echo -e "${CYAN}브라우저에서 위 URL로 접속하세요.${NC}"

# PID 파일 저장
echo "$API_PID" > api.pid
echo "$FRONTEND_PID" > frontend.pid

echo ""
echo -e "${PURPLE}💡 팁: 백그라운드에서 실행 중입니다. 터미널을 닫아도 서비스는 계속 실행됩니다.${NC}"
