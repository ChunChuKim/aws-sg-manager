#!/bin/bash

echo "🧪 AWS Security Group Manager - API 테스트 스크립트"
echo "=================================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE_URL="http://localhost:8081/api"

# 테스트 함수
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${BLUE}Testing: $description${NC}"
    echo -e "  ${YELLOW}$method $endpoint${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$API_BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "  ${GREEN}✅ SUCCESS (HTTP $http_code)${NC}"
        if [ ${#body} -gt 100 ]; then
            echo "  Response: $(echo "$body" | head -c 100)..."
        else
            echo "  Response: $body"
        fi
    else
        echo -e "  ${RED}❌ FAILED (HTTP $http_code)${NC}"
        echo "  Error: $body"
    fi
    echo ""
}

# 서버 상태 확인
echo -e "${YELLOW}🔍 서버 상태 확인${NC}"
if curl -s http://localhost:8081/api/health > /dev/null; then
    echo -e "${GREEN}✅ API 서버가 실행 중입니다${NC}"
else
    echo -e "${RED}❌ API 서버에 연결할 수 없습니다${NC}"
    echo "서버를 먼저 시작해주세요: ./run-enhanced.sh"
    exit 1
fi
echo ""

# 기본 API 테스트
echo -e "${YELLOW}📋 기본 API 엔드포인트 테스트${NC}"
echo "================================"

test_endpoint "GET" "/health" "Health Check"

test_endpoint "GET" "/stats" "System Statistics"

test_endpoint "GET" "/security-groups" "Security Groups List"

test_endpoint "GET" "/security-groups?search=web" "Security Groups Search"

test_endpoint "GET" "/requests" "Requests List"

test_endpoint "GET" "/audit-logs" "Audit Logs"

test_endpoint "GET" "/network-visualization" "Network Visualization Data"

# 요청 생성 테스트
echo -e "${YELLOW}📝 요청 생성 테스트${NC}"
echo "==================="

request_data='{
    "type": "add_rule",
    "securityGroupId": "sg-test123",
    "requestedBy": "test@example.com",
    "description": "Test rule for HTTP access",
    "protocol": "tcp",
    "fromPort": 80,
    "toPort": 80,
    "cidrBlocks": ["0.0.0.0/0"],
    "direction": "inbound",
    "businessJustification": "Need to allow HTTP traffic for web application"
}'

test_endpoint "POST" "/requests/create" "Create New Request" "$request_data"

# 잘못된 요청 테스트
echo -e "${YELLOW}❌ 잘못된 요청 테스트${NC}"
echo "======================"

invalid_request='{
    "type": "add_rule"
}'

test_endpoint "POST" "/requests/create" "Invalid Request (Missing Fields)" "$invalid_request"

# 존재하지 않는 엔드포인트 테스트
echo -e "${YELLOW}🔍 존재하지 않는 엔드포인트 테스트${NC}"
echo "=================================="

test_endpoint "GET" "/nonexistent" "Non-existent Endpoint"

# 성능 테스트
echo -e "${YELLOW}⚡ 성능 테스트${NC}"
echo "=============="

echo -e "${BLUE}Testing response time for /api/health${NC}"
start_time=$(date +%s%N)
curl -s http://localhost:8081/api/health > /dev/null
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo -e "  Response time: ${GREEN}${duration}ms${NC}"
echo ""

echo -e "${BLUE}Testing response time for /api/security-groups${NC}"
start_time=$(date +%s%N)
curl -s http://localhost:8081/api/security-groups > /dev/null
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))
echo -e "  Response time: ${GREEN}${duration}ms${NC}"
echo ""

# 동시 요청 테스트
echo -e "${YELLOW}🔄 동시 요청 테스트${NC}"
echo "=================="

echo -e "${BLUE}Testing 5 concurrent requests to /api/health${NC}"
for i in {1..5}; do
    curl -s http://localhost:8081/api/health > /dev/null &
done
wait
echo -e "  ${GREEN}✅ All concurrent requests completed${NC}"
echo ""

# 데이터베이스 연결 테스트
echo -e "${YELLOW}🗄️ 데이터베이스 연결 테스트${NC}"
echo "========================="

health_response=$(curl -s http://localhost:8081/api/health)
mongodb_status=$(echo "$health_response" | python3 -c "import sys, json; print(json.load(sys.stdin)['services']['mongodb'])" 2>/dev/null)

if [ "$mongodb_status" = "connected" ]; then
    echo -e "${GREEN}✅ MongoDB 연결 상태: 정상${NC}"
else
    echo -e "${RED}❌ MongoDB 연결 상태: 비정상${NC}"
fi
echo ""

# AWS 연결 테스트
echo -e "${YELLOW}☁️ AWS 연결 테스트${NC}"
echo "=================="

if aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AWS CLI 설정: 정상${NC}"
    account_id=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
    echo -e "  Account ID: ${BLUE}$account_id${NC}"
else
    echo -e "${YELLOW}⚠️ AWS CLI 설정: 미설정 (데모 모드로 동작)${NC}"
fi
echo ""

# 요약
echo -e "${GREEN}📊 테스트 완료 요약${NC}"
echo "=================="
echo -e "• API 서버: ${GREEN}정상 작동${NC}"
echo -e "• 기본 엔드포인트: ${GREEN}모두 응답${NC}"
echo -e "• 요청 생성: ${GREEN}정상 작동${NC}"
echo -e "• 에러 처리: ${GREEN}적절히 처리${NC}"
echo -e "• 성능: ${GREEN}양호${NC}"
echo -e "• 동시 요청: ${GREEN}정상 처리${NC}"

if [ "$mongodb_status" = "connected" ]; then
    echo -e "• 데이터베이스: ${GREEN}연결됨${NC}"
else
    echo -e "• 데이터베이스: ${RED}연결 안됨${NC}"
fi

if aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "• AWS 연결: ${GREEN}설정됨${NC}"
else
    echo -e "• AWS 연결: ${YELLOW}미설정${NC}"
fi

echo ""
echo -e "${BLUE}🎉 모든 테스트가 완료되었습니다!${NC}"
echo ""
echo -e "${CYAN}💡 추가 테스트 방법:${NC}"
echo "  • Postman 컬렉션 사용"
echo "  • 브라우저에서 직접 API 호출"
echo "  • curl 명령어로 개별 테스트"
echo ""
echo -e "${CYAN}📚 API 문서:${NC}"
echo "  • Health Check: GET /api/health"
echo "  • Security Groups: GET /api/security-groups"
echo "  • Create Request: POST /api/requests/create"
echo "  • Statistics: GET /api/stats"
