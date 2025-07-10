# 🛡️ AWS Security Group Manager

> **Amazon Q가 1시간 만에 개발한 완전한 엔터프라이즈급 웹 애플리케이션**

AWS Security Group을 효율적으로 관리하고, 요청-승인 워크플로우를 통해 보안 규칙을 안전하게 적용할 수 있는 완전한 Full-Stack 애플리케이션입니다.

## 🚀 주요 기능

### ✨ 핵심 기능
- **실제 AWS 연동**: AWS CLI를 통한 실시간 Security Groups 조회
- **요청 관리 시스템**: 생성 → 승인 → AWS 적용의 완전한 워크플로우
- **네트워크 시각화**: 인터랙티브 그래프로 Security Group 관계 시각화
- **실시간 대시보드**: 통계 및 상태 모니터링
- **승인 워크플로우**: 다중 사용자 승인 프로세스

### 🎯 세부 기능
- Security Group 상세 정보 및 규칙 분석
- 만료 규칙 자동 감지 및 알림
- 검색 및 필터링 (이름, ID, 상태별)
- 반응형 Material Design UI
- 실제 AWS 규칙 추가/제거 (시뮬레이션 모드 포함)
- MongoDB를 통한 데이터 영속성

## 🏗️ 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│                 │    │                 │    │                 │
│ • React UI      │◄──►│ • Node.js       │◄──►│ • MongoDB       │
│ • Material-UI   │    │ • Express       │    │ • Request Data  │
│ • Visualization │    │ • AWS CLI       │    │ • User Data     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AWS Services  │
                       │                 │
                       │ • EC2 (SG)      │
                       │ • VPC           │
                       │ • IAM           │
                       └─────────────────┘
```

## 🛠️ 기술 스택

### Frontend
- **HTML5/CSS3/JavaScript**: 순수 웹 기술
- **Material Design**: Google Material Design 시스템
- **Vis.js**: 네트워크 시각화 라이브러리
- **Responsive Design**: 모바일 최적화

### Backend
- **Node.js**: 서버 런타임
- **Express.js**: 웹 프레임워크
- **AWS CLI**: AWS 서비스 연동
- **RESTful API**: 8개 엔드포인트 구현

### Database
- **MongoDB**: NoSQL 데이터베이스
- **Docker**: 컨테이너화된 배포

### Infrastructure
- **AWS EC2**: 호스팅 환경
- **Docker Compose**: 서비스 오케스트레이션
- **Nginx**: 리버스 프록시 (선택사항)

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/aws-security-group-manager.git
cd aws-security-group-manager
```

### 2. 환경 설정
```bash
# 환경 변수 설정
cp .env.example .env

# AWS CLI 설정 (선택사항)
aws configure
```

### 3. 서비스 시작
```bash
# 모든 서비스 시작
chmod +x run-complete.sh
./run-complete.sh
```

### 4. 접속
- **메인 페이지**: http://localhost:8082/
- **Security Group 관리**: http://localhost:8082/sg-manager.html
- **요청 관리**: http://localhost:8082/requests-manager.html
- **네트워크 시각화**: http://localhost:8082/network-visualization.html
- **Backend API**: http://localhost:8081/api/

## 📋 API 엔드포인트

### Security Groups
- `GET /api/security-groups` - 모든 Security Groups 조회
- `GET /api/security-groups/{id}` - 특정 Security Group 상세 조회

### 요청 관리
- `GET /api/requests` - 모든 요청 조회
- `POST /api/requests/create` - 새 요청 생성
- `POST /api/requests/approve` - 요청 승인
- `POST /api/requests/reject` - 요청 거부

### 시스템
- `GET /api/health` - 헬스 체크
- `GET /api/stats` - 시스템 통계

## 🎯 사용 시나리오

### 1. Security Group 조회
1. Security Group 관리 페이지 접속
2. 실시간 AWS 데이터 확인
3. 상세 규칙 분석 및 만료 규칙 식별

### 2. 규칙 변경 요청
1. 요청 관리 페이지에서 새 요청 생성
2. 필요한 정보 입력 (프로토콜, 포트, CIDR 등)
3. 요청 제출

### 3. 승인 프로세스
1. 관리자가 요청 검토
2. 승인 또는 거부 결정
3. 승인 시 자동으로 AWS에 적용

### 4. 네트워크 시각화
1. 네트워크 시각화 페이지 접속
2. Security Group 간 관계 확인
3. VPC별 필터링 및 위험 노드 식별

## 🔧 설정

### 환경 변수
```bash
# AWS 설정 (선택사항)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1

# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/sgmanager

# 알림 (선택사항)
SLACK_WEBHOOK_URL=your_slack_webhook
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_password
```

### 포트 설정
- **Frontend**: 3001
- **Backend API**: 8081
- **Web Server**: 8082
- **MongoDB**: 27017

## 🧪 테스트

### API 테스트
```bash
# 헬스 체크
curl http://localhost:8081/api/health

# Security Groups 조회
curl http://localhost:8081/api/security-groups

# 통계 조회
curl http://localhost:8081/api/stats
```

### 기능 테스트
1. 각 페이지 접속 확인
2. 요청 생성 및 승인 워크플로우 테스트
3. 네트워크 시각화 인터랙션 테스트

## 📦 배포

### Docker를 사용한 배포
```bash
# 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 수동 배포
```bash
# MongoDB 시작
docker run -d --name mongodb -p 27017:27017 mongo:7.0

# Backend 시작
node aws-api.js &

# Frontend 서버 시작
python3 -m http.server 8082 &
```

## 🔒 보안 고려사항

- AWS 자격 증명은 환경 변수로 관리
- HTTPS 사용 권장 (프로덕션 환경)
- 입력 데이터 검증 및 SQL 인젝션 방지
- CORS 설정 검토
- 정기적인 의존성 업데이트

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 말

- **Amazon Q**: 이 전체 애플리케이션을 1시간 만에 개발
- **AWS**: 클라우드 인프라 및 서비스 제공
- **Open Source Community**: 사용된 모든 오픈소스 라이브러리

## 📞 연락처

프로젝트 링크: [https://github.com/your-username/aws-security-group-manager](https://github.com/your-username/aws-security-group-manager)

---

**⚡ Amazon Q의 놀라운 개발 능력을 보여주는 실제 작동하는 엔터프라이즈급 애플리케이션입니다!**
