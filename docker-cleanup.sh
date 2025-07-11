#!/bin/bash

echo "🧹 AWS Security Group Manager - Docker 환경 정리"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 현재 실행 중인 컨테이너:${NC}"
docker ps

echo ""
echo -e "${YELLOW}🛑 기존 컨테이너 정리 중...${NC}"

# 기존 컨테이너 중지 및 제거
docker-compose -f docker-compose.yml down 2>/dev/null || true
docker-compose -f docker-compose-enhanced.yml down 2>/dev/null || true

# 개별 컨테이너 정리
docker stop sgmanager-mongodb 2>/dev/null || true
docker rm sgmanager-mongodb 2>/dev/null || true

echo -e "${GREEN}✅ 컨테이너 정리 완료${NC}"

echo ""
echo -e "${BLUE}🗂️ 사용하지 않는 이미지 정리:${NC}"
docker image prune -f

echo ""
echo -e "${BLUE}💾 볼륨 정리:${NC}"
docker volume ls | grep sgmanager

echo ""
echo -e "${GREEN}🎯 정리 완료! 이제 새로운 환경을 시작할 수 있습니다.${NC}"
echo ""
echo -e "${CYAN}다음 명령어로 Enhanced 버전을 시작하세요:${NC}"
echo -e "  ${YELLOW}./run-enhanced.sh${NC}"
echo ""
