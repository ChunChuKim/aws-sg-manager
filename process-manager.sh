#!/bin/bash

echo "🔧 AWS Security Group Manager - 프로세스 관리"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 함수 정의
check_process() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        echo -e "${GREEN}✅ $name (포트 $port) - PID: $pid${NC}"
        return 0
    else
        echo -e "${RED}❌ $name (포트 $port) - 실행 안됨${NC}"
        return 1
    fi
}

stop_process() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}🛑 $name 중지 중... (PID: $pid)${NC}"
        kill -TERM $pid 2>/dev/null
        sleep 2
        if kill -0 $pid 2>/dev/null; then
            kill -KILL $pid 2>/dev/null
        fi
        echo -e "${GREEN}✅ $name 중지 완료${NC}"
    else
        echo -e "${BLUE}ℹ️ $name 이미 중지됨${NC}"
    fi
}

# 메인 메뉴
case "$1" in
    "status")
        echo -e "${BLUE}📊 현재 프로세스 상태:${NC}"
        echo ""
        check_process 8081 "Node.js API Server"
        check_process 8082 "Frontend Web Server"
        check_process 3001 "Development Server"
        check_process 27017 "MongoDB"
        echo ""
        echo -e "${CYAN}🐳 Docker 컨테이너:${NC}"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    "stop")
        echo -e "${YELLOW}🛑 모든 프로세스 중지 중...${NC}"
        stop_process 8081 "Node.js API Server"
        stop_process 8082 "Frontend Web Server"
        stop_process 3001 "Development Server"
        echo -e "${GREEN}✅ 프로세스 중지 완료${NC}"
        ;;
    "start")
        echo -e "${GREEN}🚀 Enhanced 버전 시작...${NC}"
        ./run-enhanced.sh
        ;;
    "restart")
        echo -e "${YELLOW}🔄 서비스 재시작 중...${NC}"
        $0 stop
        sleep 3
        $0 start
        ;;
    *)
        echo -e "${CYAN}사용법:${NC}"
        echo "  $0 status   - 현재 상태 확인"
        echo "  $0 start    - 서비스 시작"
        echo "  $0 stop     - 서비스 중지"
        echo "  $0 restart  - 서비스 재시작"
        echo ""
        echo -e "${BLUE}현재 상태:${NC}"
        $0 status
        ;;
esac
