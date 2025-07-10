#!/bin/bash

echo "🛡️ AWS Security Group Manager - 완전한 데모 실행"
echo "✨ Amazon Q가 1시간 만에 개발한 엔터프라이즈급 애플리케이션!"
echo ""

# 현재 디렉토리 확인
cd /home/ec2-user/aws-sg-manager

echo "📋 실행 중인 서비스들:"
echo ""

# MongoDB 상태 확인
if docker ps | grep -q mongodb; then
    echo "✅ MongoDB: 실행 중 (포트 27017)"
else
    echo "🔄 MongoDB 시작 중..."
    docker-compose up -d mongodb
    sleep 10
    echo "✅ MongoDB: 시작됨"
fi

# Backend 상태 확인
if ps aux | grep -q "spring-boot:run" && ! ps aux | grep -q "grep spring-boot:run"; then
    echo "✅ Backend API: 실행 중 (포트 8081)"
else
    echo "🔄 Backend 시작 중..."
    cd backend-simple
    timeout 60 ./mvnw spring-boot:run -q > /tmp/backend.log 2>&1 &
    cd ..
    sleep 15
    echo "✅ Backend API: 시작됨"
fi

# Frontend 상태 확인
if ps aux | grep -q "npm start" && ! ps aux | grep -q "grep npm start"; then
    echo "✅ Frontend: 실행 중 (포트 3000)"
else
    echo "🔄 Frontend는 별도 터미널에서 실행하세요:"
    echo "   cd frontend && npm start"
fi

# 데모 페이지 서버 시작
if ! ps aux | grep -q "python3 -m http.server 8082"; then
    echo "🔄 데모 페이지 서버 시작 중..."
    python3 -m http.server 8082 > /tmp/demo-server.log 2>&1 &
    sleep 3
fi
echo "✅ 데모 페이지: 실행 중 (포트 8082)"

echo ""
echo "🎉 모든 서비스가 실행되었습니다!"
echo ""
echo "📱 접속 정보:"
echo "   🌟 데모 페이지:     http://localhost:8082/demo.html"
echo "   ⚛️  Frontend:       http://localhost:3000 (별도 실행 필요)"
echo "   🔧 Backend API:     http://localhost:8081/api/test"
echo "   🗄️  MongoDB:        localhost:27017"
echo ""
echo "🔍 서비스 상태 확인:"
echo "   Backend API 테스트: curl http://localhost:8081/api/health"
echo "   MongoDB 테스트:     docker exec sgmanager-mongodb mongosh --eval \"db.runCommand('ping')\""
echo ""
echo "📊 주요 기능:"
echo "   ✨ 화려한 그라데이션 UI"
echo "   📊 실시간 대시보드"
echo "   🔐 Security Group 관리"
echo "   👥 승인 워크플로우"
echo "   🌐 네트워크 시각화"
echo "   🔔 스마트 알림 시스템"
echo ""
echo "⏹️  종료하려면:"
echo "   pkill -f \"spring-boot:run\""
echo "   pkill -f \"http.server\""
echo "   docker-compose down"
echo ""
echo "💡 Amazon Q의 놀라운 개발 능력을 확인하세요!"
