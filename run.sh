#!/bin/bash

# AWS Security Group Manager 실행 스크립트

echo "🛡️ AWS Security Group Manager 시작"
echo "✨ 화려하게 업그레이드된 버전!"

# 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 참고하여 생성하세요."
    exit 1
fi

# Docker Compose로 서비스 시작
echo "🐳 Docker 컨테이너 시작 중..."
docker-compose up -d

echo "⏳ 서비스 시작 대기 중..."
sleep 30

# 서비스 상태 확인
echo "📊 서비스 상태 확인:"
docker-compose ps

echo ""
echo "🎉 AWS Security Group Manager가 시작되었습니다!"
echo ""
echo "🌟 새로운 기능들:"
echo "   ✨ 화려한 그라데이션 UI"
echo "   🎨 애니메이션 효과"
echo "   📊 실시간 대시보드"
echo "   🔔 스마트 알림 시스템"
echo "   📈 시각화 네트워크 그래프"
echo "   🚀 완전한 승인 워크플로우"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8080"
echo "🗄️  MongoDB: localhost:27017"
echo ""
echo "🔐 기본 로그인 정보:"
echo "   👨‍💼 관리자: admin / password"
echo "   👤 사용자: user / password"
echo ""
echo "🎯 주요 기능:"
echo "   • Security Group 실시간 관리"
echo "   • 규칙 만료일 자동 관리"
echo "   • 사용자 요청 → 관리자 승인 워크플로우"
echo "   • Slack/Email 알림 시스템"
echo "   • 인터랙티브 시각화 대시보드"
echo "   • 역할 기반 권한 제어"
echo ""
echo "⏹️  종료하려면: docker-compose down"
echo "🔄 재시작하려면: docker-compose restart"
echo ""
echo "💡 Amazon Q가 1시간 만에 개발한 엔터프라이즈급 애플리케이션!"
