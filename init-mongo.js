// MongoDB 초기화 스크립트

// 데이터베이스 생성
db = db.getSiblingDB('sgmanager');

// 기본 관리자 사용자 생성
db.users.insertOne({
    username: 'admin',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', // password: password
    email: 'admin@sgmanager.com',
    fullName: 'System Administrator',
    roles: ['ROLE_ADMIN'],
    enabled: true,
    accountNonExpired: true,
    accountNonLocked: true,
    credentialsNonExpired: true,
    createdAt: new Date(),
    updatedAt: new Date()
});

// 테스트 사용자 생성
db.users.insertOne({
    username: 'user',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', // password: password
    email: 'user@sgmanager.com',
    fullName: 'Test User',
    roles: ['ROLE_USER'],
    enabled: true,
    accountNonExpired: true,
    accountNonLocked: true,
    credentialsNonExpired: true,
    createdAt: new Date(),
    updatedAt: new Date()
});

// 인덱스 생성
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

db.security_groups.createIndex({ groupId: 1 }, { unique: true });
db.security_groups.createIndex({ vpcId: 1 });
db.security_groups.createIndex({ createdBy: 1 });
db.security_groups.createIndex({ expiryDate: 1 });

db.rule_requests.createIndex({ requesterId: 1 });
db.rule_requests.createIndex({ status: 1 });
db.rule_requests.createIndex({ securityGroupId: 1 });
db.rule_requests.createIndex({ requestedAt: 1 });

db.expiry_schedules.createIndex({ securityGroupId: 1 });
db.expiry_schedules.createIndex({ expiryDate: 1 });
db.expiry_schedules.createIndex({ status: 1 });

print('MongoDB initialization completed successfully!');
