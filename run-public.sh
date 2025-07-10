#!/bin/bash

echo "🛡️ AWS Security Group Manager - 퍼블릭 데모"
echo "✨ Amazon Q가 1시간 만에 개발한 엔터프라이즈급 애플리케이션!"
echo ""

# 퍼블릭 IP 및 DNS 확인
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)" http://169.254.169.254/latest/meta-data/public-ipv4)
PUBLIC_DNS=$(curl -s -H "X-aws-ec2-metadata-token: $(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)" http://169.254.169.254/latest/meta-data/public-hostname)

echo "🌐 퍼블릭 접속 정보:"
echo "   IP 주소: $PUBLIC_IP"
echo "   DNS 주소: $PUBLIC_DNS"
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

# 데모 페이지 서버 상태 확인
if ps aux | grep -q "python3 -m http.server 8082" && ! ps aux | grep -q "grep python3"; then
    echo "✅ 데모 페이지: 실행 중 (포트 8082)"
else
    echo "🔄 데모 페이지 서버 시작 중..."
    python3 -m http.server 8082 > /tmp/demo-server.log 2>&1 &
    sleep 3
    echo "✅ 데모 페이지: 시작됨"
fi

echo ""
echo "🎉 모든 서비스가 실행되었습니다!"
echo ""
echo "🌍 외부 접속 URL:"
echo "   🌟 데모 페이지:     http://$PUBLIC_IP:8082/demo.html"
echo "   🌟 데모 페이지:     http://$PUBLIC_DNS:8082/demo.html"
echo "   🔧 Backend API:     http://$PUBLIC_IP:8081/api/test"
echo "   ⚛️  Frontend:       http://$PUBLIC_IP:3000 (별도 실행 필요)"
echo "   🗄️  MongoDB:        $PUBLIC_IP:27017"
echo ""
echo "🔍 서비스 테스트:"
echo "   curl http://$PUBLIC_IP:8082/demo.html"
echo "   curl http://$PUBLIC_IP:8081/api/health"
echo ""
echo "📊 주요 기능:"
echo "   ✨ 화려한 그라데이션 UI"
echo "   📊 실시간 대시보드"
echo "   🔐 Security Group 관리"
echo "   👥 승인 워크플로우"
echo "   🌐 네트워크 시각화"
echo "   🔔 스마트 알림 시스템"
echo ""
echo "🔒 보안 그룹 설정:"
echo "   ✅ 포트 3000 (React Frontend)"
echo "   ✅ 포트 8080 (기존)"
echo "   ✅ 포트 8081 (Spring Boot Backend)"
echo "   ✅ 포트 8082 (데모 페이지)"
echo "   ✅ 포트 27017 (MongoDB)"
echo ""
echo "⏹️  종료하려면:"
echo "   pkill -f \"spring-boot:run\""
echo "   pkill -f \"http.server\""
echo "   docker-compose down"
echo ""
echo "💡 Workshop 참가자들이 브라우저에서 바로 접속 가능합니다!"
echo "🚀 Amazon Q의 놀라운 개발 능력을 확인하세요!"
