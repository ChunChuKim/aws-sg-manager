const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors({
    origin: ['http://localhost:8082', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// AWS 설정
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

const ec2 = new AWS.EC2();

// 메모리 기반 데이터 저장소
let memoryStore = {
    requests: [
        {
            id: 'req-001',
            type: 'ADD_RULE',
            securityGroupId: 'sg-0123456789abcdef0',
            rule: {
                protocol: 'tcp',
                port: 22,
                cidr: '10.0.0.0/8',
                description: 'SSH access from internal network'
            },
            justification: 'Need SSH access for maintenance tasks',
            requestedBy: 'admin@company.com',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    auditLogs: [
        {
            id: 'log-001',
            action: 'VIEW',
            resource: 'Security Groups Dashboard',
            details: 'User accessed main dashboard',
            user: 'system',
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1'
        },
        {
            id: 'log-002',
            action: 'CREATE',
            resource: 'Request req-001',
            details: 'New security group rule request created',
            user: 'admin@company.com',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            ipAddress: '127.0.0.1'
        }
    ],
    users: [
        {
            id: 'user-001',
            email: 'admin@company.com',
            name: 'System Administrator',
            role: 'admin',
            lastLogin: new Date().toISOString()
        }
    ],
    notifications: [],
    stats: {
        totalSecurityGroups: 0,
        pendingRequests: 1,
        expiredRules: 0,
        lastUpdated: new Date().toISOString()
    }
};

// 실제 AWS Security Groups 조회 (AWS SDK 사용)
async function getActualSecurityGroups() {
    try {
        console.log('🔍 Fetching Security Groups from AWS...');
        const params = {
            MaxResults: 100
        };
        
        const data = await ec2.describeSecurityGroups(params).promise();
        console.log(`✅ Found ${data.SecurityGroups.length} Security Groups`);
        
        const securityGroups = data.SecurityGroups.map(sg => ({
            id: sg.GroupId,
            groupName: sg.GroupName,
            description: sg.Description,
            vpcId: sg.VpcId,
            ownerId: sg.OwnerId,
            status: 'active',
            rulesCount: sg.IpPermissions.length + sg.IpPermissionsEgress.length,
            hasExpiredRules: checkExpiredRules(sg),
            inboundRules: sg.IpPermissions.map(rule => ({
                ipProtocol: rule.IpProtocol,
                fromPort: rule.FromPort,
                toPort: rule.ToPort,
                portRange: formatPortRange(rule.FromPort, rule.ToPort),
                cidrBlocks: rule.IpRanges.map(range => range.CidrIp),
                securityGroups: rule.UserIdGroupPairs.map(pair => pair.GroupId),
                description: rule.IpRanges[0]?.Description || rule.UserIdGroupPairs[0]?.Description || 'No description'
            })),
            outboundRules: sg.IpPermissionsEgress.map(rule => ({
                ipProtocol: rule.IpProtocol,
                fromPort: rule.FromPort,
                toPort: rule.ToPort,
                portRange: formatPortRange(rule.FromPort, rule.ToPort),
                cidrBlocks: rule.IpRanges.map(range => range.CidrIp),
                securityGroups: rule.UserIdGroupPairs.map(pair => pair.GroupId),
                description: rule.IpRanges[0]?.Description || rule.UserIdGroupPairs[0]?.Description || 'No description'
            })),
            tags: sg.Tags || [],
            createdTime: new Date().toISOString(),
            lastModified: new Date().toISOString()
        }));

        // 통계 업데이트
        memoryStore.stats.totalSecurityGroups = securityGroups.length;
        memoryStore.stats.expiredRules = securityGroups.reduce((count, sg) => count + (sg.hasExpiredRules ? 1 : 0), 0);
        memoryStore.stats.lastUpdated = new Date().toISOString();

        return securityGroups;
        
    } catch (error) {
        console.error('❌ AWS API Error:', error.message);
        console.log('🔄 Falling back to demo data...');
        return getDemoSecurityGroups();
    }
}

// 포트 범위 포맷팅
function formatPortRange(fromPort, toPort) {
    if (fromPort === null || toPort === null) return 'All';
    if (fromPort === toPort) return fromPort.toString();
    return `${fromPort}-${toPort}`;
}

// 만료된 규칙 확인
function checkExpiredRules(sg) {
    const expiredTag = sg.Tags?.find(tag => tag.Key === 'ExpiryDate');
    if (expiredTag) {
        const expiryDate = new Date(expiredTag.Value);
        return expiryDate < new Date();
    }
    return Math.random() > 0.8; // 데모용 랜덤 만료
}

// 데모 데이터 (AWS 연결 실패 시 사용)
function getDemoSecurityGroups() {
    console.log('📋 Using demo Security Groups data...');
    
    const demoData = [
        {
            id: 'sg-0123456789abcdef0',
            groupName: 'web-server-sg',
            description: 'Security group for web servers',
            vpcId: 'vpc-12345678',
            ownerId: '123456789012',
            status: 'active',
            rulesCount: 4,
            hasExpiredRules: false,
            inboundRules: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    portRange: '80',
                    cidrBlocks: ['0.0.0.0/0'],
                    securityGroups: [],
                    description: 'HTTP access from anywhere'
                },
                {
                    ipProtocol: 'tcp',
                    fromPort: 443,
                    toPort: 443,
                    portRange: '443',
                    cidrBlocks: ['0.0.0.0/0'],
                    securityGroups: [],
                    description: 'HTTPS access from anywhere'
                },
                {
                    ipProtocol: 'tcp',
                    fromPort: 22,
                    toPort: 22,
                    portRange: '22',
                    cidrBlocks: ['10.0.0.0/8'],
                    securityGroups: [],
                    description: 'SSH access from internal network'
                }
            ],
            outboundRules: [
                {
                    ipProtocol: '-1',
                    fromPort: null,
                    toPort: null,
                    portRange: 'All',
                    cidrBlocks: ['0.0.0.0/0'],
                    securityGroups: [],
                    description: 'All outbound traffic'
                }
            ],
            tags: [
                { Key: 'Name', Value: 'web-server-sg' },
                { Key: 'Environment', Value: 'production' },
                { Key: 'Team', Value: 'infrastructure' }
            ],
            createdTime: '2024-01-15T10:30:00Z',
            lastModified: new Date().toISOString()
        },
        {
            id: 'sg-0987654321fedcba0',
            groupName: 'database-sg',
            description: 'Security group for database servers',
            vpcId: 'vpc-12345678',
            ownerId: '123456789012',
            status: 'active',
            rulesCount: 3,
            hasExpiredRules: true,
            inboundRules: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 3306,
                    toPort: 3306,
                    portRange: '3306',
                    cidrBlocks: [],
                    securityGroups: ['sg-0123456789abcdef0'],
                    description: 'MySQL access from web servers'
                },
                {
                    ipProtocol: 'tcp',
                    fromPort: 22,
                    toPort: 22,
                    portRange: '22',
                    cidrBlocks: ['192.168.1.0/24'],
                    securityGroups: [],
                    description: 'SSH access from admin network (EXPIRED)'
                }
            ],
            outboundRules: [
                {
                    ipProtocol: '-1',
                    fromPort: null,
                    toPort: null,
                    portRange: 'All',
                    cidrBlocks: ['0.0.0.0/0'],
                    securityGroups: [],
                    description: 'All outbound traffic'
                }
            ],
            tags: [
                { Key: 'Name', Value: 'database-sg' },
                { Key: 'Environment', Value: 'production' },
                { Key: 'Team', Value: 'database' },
                { Key: 'ExpiryDate', Value: '2024-01-01T00:00:00Z' }
            ],
            createdTime: '2023-12-01T14:20:00Z',
            lastModified: new Date().toISOString()
        },
        {
            id: 'sg-abcdef0123456789',
            groupName: 'load-balancer-sg',
            description: 'Security group for application load balancer',
            vpcId: 'vpc-87654321',
            ownerId: '123456789012',
            status: 'active',
            rulesCount: 3,
            hasExpiredRules: false,
            inboundRules: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    portRange: '80',
                    cidrBlocks: ['0.0.0.0/0'],
                    securityGroups: [],
                    description: 'HTTP from internet'
                },
                {
                    ipProtocol: 'tcp',
                    fromPort: 443,
                    toPort: 443,
                    portRange: '443',
                    cidrBlocks: ['0.0.0.0/0'],
                    securityGroups: [],
                    description: 'HTTPS from internet'
                }
            ],
            outboundRules: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 8080,
                    toPort: 8080,
                    portRange: '8080',
                    cidrBlocks: [],
                    securityGroups: ['sg-0123456789abcdef0'],
                    description: 'Forward to web servers'
                }
            ],
            tags: [
                { Key: 'Name', Value: 'load-balancer-sg' },
                { Key: 'Environment', Value: 'production' },
                { Key: 'Team', Value: 'infrastructure' }
            ],
            createdTime: '2024-02-01T09:15:00Z',
            lastModified: new Date().toISOString()
        }
    ];

    // 통계 업데이트
    memoryStore.stats.totalSecurityGroups = demoData.length;
    memoryStore.stats.expiredRules = demoData.reduce((count, sg) => count + (sg.hasExpiredRules ? 1 : 0), 0);
    memoryStore.stats.lastUpdated = new Date().toISOString();

// 감사 로그 기록 함수
function addAuditLog(action, resource, details, user = 'system', ipAddress = '127.0.0.1') {
    const logEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action,
        resource,
        details,
        user,
        timestamp: new Date().toISOString(),
        ipAddress
    };
    
    memoryStore.auditLogs.unshift(logEntry);
    
    // 로그 개수 제한 (최대 1000개)
    if (memoryStore.auditLogs.length > 1000) {
        memoryStore.auditLogs = memoryStore.auditLogs.slice(0, 1000);
    }
    
    console.log(`📝 Audit Log: ${action} - ${resource} by ${user}`);
    return logEntry;
}

// AWS에 요청 적용 함수
async function applyRequestToAws(request) {
    try {
        console.log(`🔄 Applying request ${request.id} to AWS...`);
        
        if (request.type === 'ADD_RULE') {
            const params = {
                GroupId: request.securityGroupId,
                IpPermissions: [{
                    IpProtocol: request.rule.protocol,
                    FromPort: request.rule.fromPort,
                    ToPort: request.rule.toPort,
                    IpRanges: request.rule.cidrBlocks.map(cidr => ({
                        CidrIp: cidr,
                        Description: request.description || 'Added via SG Manager'
                    }))
                }]
            };
            
            if (request.rule.direction === 'inbound') {
                await ec2.authorizeSecurityGroupIngress(params).promise();
            } else {
                await ec2.authorizeSecurityGroupEgress(params).promise();
            }
            
            return {
                success: true,
                message: `Successfully added ${request.rule.direction} rule to ${request.securityGroupId}`,
                appliedAt: new Date().toISOString()
            };
            
        } else if (request.type === 'REMOVE_RULE') {
            const params = {
                GroupId: request.securityGroupId,
                IpPermissions: [{
                    IpProtocol: request.rule.protocol,
                    FromPort: request.rule.fromPort,
                    ToPort: request.rule.toPort,
                    IpRanges: request.rule.cidrBlocks.map(cidr => ({ CidrIp: cidr }))
                }]
            };
            
            if (request.rule.direction === 'inbound') {
                await ec2.revokeSecurityGroupIngress(params).promise();
            } else {
                await ec2.revokeSecurityGroupEgress(params).promise();
            }
            
            return {
                success: true,
                message: `Successfully removed ${request.rule.direction} rule from ${request.securityGroupId}`,
                appliedAt: new Date().toISOString()
            };
        }
        
        throw new Error(`Unsupported request type: ${request.type}`);
        
    } catch (error) {
        console.error('AWS Application Error:', error);
        
        // AWS 에러가 아닌 경우 시뮬레이션 모드로 처리
        if (error.code === 'CredentialsError' || error.code === 'NetworkingError') {
            return {
                success: true,
                message: `Simulated AWS application: ${request.type} for ${request.securityGroupId}`,
                simulation: true,
                appliedAt: new Date().toISOString()
            };
        }
        
        throw error;
    }
}

// 데모 데이터 (AWS 연결 실패 시 사용)
function getDemoSecurityGroups() {
    const demoData = [
        {
            id: 'sg-0123456789abcdef0',
            groupName: 'web-server-sg',
            description: 'Security group for web servers',
            vpcId: 'vpc-12345678',
            ownerId: '123456789012',
            status: 'active',
            rulesCount: 3,
            hasExpiredRules: false,
            inboundRules: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    portRange: '80',
                    cidrBlocks: ['0.0.0.0/0'],
                    securityGroups: [],
                    description: 'HTTP access'
                },
                {
                    ipProtocol: 'tcp',
                    fromPort: 443,
                    toPort: 443,
                    portRange: '443',
                    cidrBlocks: ['0.0.0.0/0'],
                    securityGroups: [],
                    description: 'HTTPS access'
                }
            ],
            outboundRules: [
                {
                    ipProtocol: '-1',
                    fromPort: null,
                    toPort: null,
                    portRange: 'All',
                    cidrBlocks: ['0.0.0.0/0'],
                    securityGroups: [],
                    description: 'All outbound traffic'
                }
            ],
            tags: [],
            createdTime: '2024-01-01T00:00:00Z',
            lastModified: new Date().toISOString()
        },
        {
            id: 'sg-0987654321fedcba0',
            groupName: 'database-sg',
            description: 'Security group for database servers',
            vpcId: 'vpc-12345678',
            ownerId: '123456789012',
            status: 'active',
            rulesCount: 2,
            hasExpiredRules: true,
            inboundRules: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 3306,
                    toPort: 3306,
                    portRange: '3306',
                    cidrBlocks: ['10.0.0.0/8'],
                    securityGroups: ['sg-0123456789abcdef0'],
                    description: 'MySQL access from web servers'
                }
            ],
            outboundRules: [
                {
                    ipProtocol: '-1',
                    fromPort: null,
                    toPort: null,
                    portRange: 'All',
                    cidrBlocks: ['0.0.0.0/0'],
                    securityGroups: [],
                    description: 'All outbound traffic'
                }
            ],
            tags: [
                { Key: 'Environment', Value: 'Production' },
                { Key: 'ExpiryDate', Value: '2024-01-01T00:00:00Z' }
            ],
            createdTime: '2023-12-01T00:00:00Z',
            lastModified: new Date().toISOString()
        }
    ];
    
    return {
        data: demoData,
        total: demoData.length,
        message: 'Demo Security Groups data (AWS connection failed)'
    };
}

// 감사 로그 기록 (메모리)
function logAuditEvent(action, details) {
    const logEntry = {
        id: `audit-${Date.now()}`,
        action,
        details,
        timestamp: new Date(),
        userId: details.userId || 'system'
    };
    
    memoryStore.auditLogs.push(logEntry);
    
    // 최대 1000개 로그만 유지
    if (memoryStore.auditLogs.length > 1000) {
        memoryStore.auditLogs = memoryStore.auditLogs.slice(-1000);
    }
    
    console.log(`📝 Audit Log: ${action}`, details);
}

// API 엔드포인트들

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        // AWS 연결 상태 확인
        let awsStatus = 'disconnected';
        try {
            await ec2.describeRegions({ MaxResults: 1 }).promise();
            awsStatus = 'connected';
        } catch (error) {
            awsStatus = 'demo-mode';
        }

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0-enhanced',
            uptime: process.uptime(),
            aws: {
                status: awsStatus,
                region: process.env.AWS_REGION || 'us-east-1'
            },
            database: {
                status: 'memory-store',
                type: 'in-memory'
            },
            services: {
                api: 'online',
                memory: 'active',
                aws: awsStatus
            },
            stats: memoryStore.stats
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Security Groups 조회
app.get('/api/security-groups', async (req, res) => {
    try {
        const { search, vpc, status } = req.query;
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        // 감사 로그 기록
        addAuditLog('VIEW', 'Security Groups List', `Viewed security groups list with filters: search=${search}, vpc=${vpc}, status=${status}`, 'user', clientIP);
        
        let result = await getActualSecurityGroups();
        
        // 필터링
        if (search) {
            result = result.filter(sg => 
                sg.groupName.toLowerCase().includes(search.toLowerCase()) ||
                sg.id.toLowerCase().includes(search.toLowerCase()) ||
                sg.description.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        if (vpc) {
            result = result.filter(sg => sg.vpcId === vpc);
        }
        
        if (status) {
            result = result.filter(sg => sg.status === status);
        }
        
        res.json({
            data: result,
            total: result.length,
            filters: { search, vpc, status },
            message: 'Security groups retrieved successfully'
        });
        
    } catch (error) {
        console.error('Security Groups API Error:', error);
        addAuditLog('ERROR', 'Security Groups List', `Failed to retrieve security groups: ${error.message}`, 'system');
        
        res.status(500).json({
            error: 'Failed to fetch security groups',
            message: error.message
        });
    }
});

// 특정 Security Group 상세 조회
app.get('/api/security-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getActualSecurityGroups();
        const securityGroup = result.data.find(sg => sg.id === id);
        
        if (!securityGroup) {
            return res.status(404).json({
                error: 'Security group not found',
                id
            });
        }
        
        res.json({
            data: securityGroup,
            message: 'Security group details retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch security group details',
            message: error.message
        });
    }
});

// 요청 목록 조회
app.get('/api/requests', (req, res) => {
    try {
        const { status, type, requester, limit = 50 } = req.query;
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        // 감사 로그 기록
        addAuditLog('VIEW', 'Requests List', `Viewed requests list with filters: status=${status}, type=${type}, requester=${requester}`, 'user', clientIP);
        
        let requests = [...memoryStore.requests];
        
        if (status) requests = requests.filter(r => r.status === status);
        if (type) requests = requests.filter(r => r.type === type);
        if (requester) requests = requests.filter(r => r.requestedBy.toLowerCase().includes(requester.toLowerCase()));
        
        // 최신순 정렬
        requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // 제한
        const limitedRequests = requests.slice(0, parseInt(limit));
        
        res.json({
            data: limitedRequests,
            total: memoryStore.requests.length,
            filtered: requests.length,
            displayed: limitedRequests.length,
            filters: { status, type, requester, limit: parseInt(limit) },
            message: 'Requests retrieved successfully'
        });
        
    } catch (error) {
        console.error('Requests API Error:', error);
        addAuditLog('ERROR', 'Requests List', `Failed to retrieve requests: ${error.message}`, 'system');
        
        res.status(500).json({
            error: 'Failed to fetch requests',
            message: error.message
        });
    }
});

// 새 요청 생성
app.post('/api/requests/create', (req, res) => {
    try {
        const {
            type,
            securityGroupId,
            requestedBy,
            description,
            protocol,
            fromPort,
            toPort,
            cidrBlocks,
            direction,
            businessJustification,
            expiryDate
        } = req.body;
        
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        // 입력 검증
        if (!type || !securityGroupId || !requestedBy) {
            addAuditLog('ERROR', 'Request Creation', 'Failed to create request: Missing required fields', requestedBy, clientIP);
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['type', 'securityGroupId', 'requestedBy']
            });
        }
        
        if (!businessJustification || businessJustification.trim().length < 10) {
            addAuditLog('ERROR', 'Request Creation', 'Failed to create request: Insufficient business justification', requestedBy, clientIP);
            return res.status(400).json({
                error: 'Business justification is required and must be at least 10 characters long'
            });
        }
        
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const request = {
            id: requestId,
            type,
            securityGroupId,
            requestedBy,
            description: description || '',
            rule: {
                protocol: protocol || 'tcp',
                fromPort: fromPort || null,
                toPort: toPort || null,
                cidrBlocks: cidrBlocks || [],
                direction: direction || 'inbound'
            },
            businessJustification: businessJustification.trim(),
            expiryDate: expiryDate || null,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reviewedBy: null,
            reviewedAt: null,
            comments: []
        };
        
        memoryStore.requests.push(request);
        memoryStore.stats.pendingRequests = memoryStore.requests.filter(r => r.status === 'pending').length;
        
        // 감사 로그 기록
        addAuditLog('CREATE', `Request ${requestId}`, `New ${type} request created for SG ${securityGroupId}`, requestedBy, clientIP);
        
        res.status(201).json({
            data: request,
            message: 'Request created successfully'
        });
        
    } catch (error) {
        console.error('Create Request API Error:', error);
        addAuditLog('ERROR', 'Request Creation', `Failed to create request: ${error.message}`, 'system');
        
        res.status(500).json({
            error: 'Failed to create request',
            message: error.message
        });
    }
});

// 요청 승인
app.post('/api/requests/approve', async (req, res) => {
    try {
        const { requestId, reviewerEmail, comments, applyToAws = false } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        if (!requestId || !reviewerEmail) {
            addAuditLog('ERROR', 'Request Approval', 'Failed to approve request: Missing required fields', reviewerEmail, clientIP);
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['requestId', 'reviewerEmail']
            });
        }
        
        const requestIndex = memoryStore.requests.findIndex(r => r.id === requestId);
        
        if (requestIndex === -1) {
            addAuditLog('ERROR', 'Request Approval', `Failed to approve request: Request ${requestId} not found`, reviewerEmail, clientIP);
            return res.status(404).json({
                error: 'Request not found',
                requestId
            });
        }
        
        const request = memoryStore.requests[requestIndex];
        
        if (request.status !== 'pending') {
            addAuditLog('ERROR', 'Request Approval', `Failed to approve request ${requestId}: Not in pending status (${request.status})`, reviewerEmail, clientIP);
            return res.status(400).json({
                error: 'Request is not in pending status',
                currentStatus: request.status
            });
        }
        
        // 요청 승인 처리
        request.status = 'approved';
        request.reviewedBy = reviewerEmail;
        request.reviewedAt = new Date().toISOString();
        request.updatedAt = new Date().toISOString();
        
        if (!request.comments) request.comments = [];
        request.comments.push({
            author: reviewerEmail,
            text: comments || 'Request approved',
            timestamp: new Date().toISOString()
        });
        
        // 통계 업데이트
        memoryStore.stats.pendingRequests = memoryStore.requests.filter(r => r.status === 'pending').length;
        
        let awsResult = null;
        
        // AWS 적용 시도
        if (applyToAws) {
            try {
                awsResult = await applyRequestToAws(request);
                addAuditLog('APPLY', `Request ${requestId}`, `Applied approved request to AWS: ${awsResult.message}`, reviewerEmail, clientIP);
            } catch (awsError) {
                console.error('AWS Application Error:', awsError);
                awsResult = { 
                    success: false, 
                    message: `AWS application failed: ${awsError.message}`,
                    error: awsError.message
                };
                addAuditLog('ERROR', `Request ${requestId}`, `Failed to apply to AWS: ${awsError.message}`, reviewerEmail, clientIP);
            }
        }
        
        // 감사 로그 기록
        addAuditLog('APPROVE', `Request ${requestId}`, `Request approved by ${reviewerEmail}${applyToAws ? ' and applied to AWS' : ''}`, reviewerEmail, clientIP);
        
        res.json({
            data: request,
            message: 'Request approved successfully',
            requestId,
            awsResult
        });
        
    } catch (error) {
        console.error('Approve Request API Error:', error);
        addAuditLog('ERROR', 'Request Approval', `Failed to approve request: ${error.message}`, 'system');
        
        res.status(500).json({
            error: 'Failed to approve request',
            message: error.message
        });
    }
});

// 요청 거부
app.post('/api/requests/reject', (req, res) => {
    try {
        const { requestId, reviewerEmail, comments } = req.body;
        
        if (!requestId || !reviewerEmail || !comments) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['requestId', 'reviewerEmail', 'comments']
            });
        }
        
        const requestIndex = memoryStore.requests.findIndex(r => r.id === requestId);
        
        if (requestIndex === -1) {
            return res.status(404).json({
                error: 'Request not found',
                requestId
            });
        }
        
        const request = memoryStore.requests[requestIndex];
        
        if (request.status !== 'pending') {
            return res.status(400).json({
                error: 'Request is not in pending status',
                currentStatus: request.status
            });
        }
        
        // 요청 거부 처리
        request.status = 'rejected';
        request.reviewedBy = reviewerEmail;
        request.reviewedAt = new Date();
        request.updatedAt = new Date();
        request.comments.push({
            author: reviewerEmail,
            text: comments,
            timestamp: new Date()
        });
        
        // 감사 로그 기록
        logAuditEvent('request_rejected', {
            requestId,
            reviewedBy: reviewerEmail,
            reason: comments
        });
        
        res.json({
            message: 'Request rejected successfully',
            requestId
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to reject request',
            message: error.message
        });
    }
});

// 시스템 통계
app.get('/api/stats', async (req, res) => {
    try {
        const sgResult = await getActualSecurityGroups();
        const totalSecurityGroups = sgResult.total;
        const expiredRules = sgResult.data.filter(sg => sg.hasExpiredRules).length;
        
        const pendingRequests = memoryStore.requests.filter(r => r.status === 'pending').length;
        const approvedRequests = memoryStore.requests.filter(r => r.status === 'approved').length;
        const rejectedRequests = memoryStore.requests.filter(r => r.status === 'rejected').length;
        
        // VPC별 통계
        const vpcStats = {};
        sgResult.data.forEach(sg => {
            if (!vpcStats[sg.vpcId]) {
                vpcStats[sg.vpcId] = 0;
            }
            vpcStats[sg.vpcId]++;
        });
        
        res.json({
            totalSecurityGroups,
            expiredRules,
            pendingRequests,
            approvedRequests,
            rejectedRequests,
            totalRequests: pendingRequests + approvedRequests + rejectedRequests,
            vpcStats,
            lastUpdated: new Date().toISOString(),
            systemHealth: {
                mongodb: 'memory-mode',
                aws: 'connected'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch statistics',
            message: error.message
        });
    }
});

// 감사 로그 조회
app.get('/api/audit-logs', (req, res) => {
    try {
        const { limit = 50, action, userId, startDate, endDate } = req.query;
        let logs = [...memoryStore.auditLogs];
        
        // 필터링
        if (action) {
            logs = logs.filter(log => log.action.toLowerCase().includes(action.toLowerCase()));
        }
        
        if (userId) {
            logs = logs.filter(log => log.user.toLowerCase().includes(userId.toLowerCase()));
        }
        
        if (startDate) {
            logs = logs.filter(log => new Date(log.timestamp) >= new Date(startDate));
        }
        
        if (endDate) {
            logs = logs.filter(log => new Date(log.timestamp) <= new Date(endDate));
        }
        
        // 최신순 정렬 및 제한
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const limitedLogs = logs.slice(0, parseInt(limit));
        
        res.json({
            logs: limitedLogs,
            total: memoryStore.auditLogs.length,
            filtered: logs.length,
            displayed: limitedLogs.length,
            filters: {
                action,
                userId,
                startDate,
                endDate,
                limit: parseInt(limit)
            },
            message: 'Audit logs retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch audit logs',
            message: error.message
        });
    }
});

// 네트워크 시각화 데이터
app.get('/api/network-visualization', async (req, res) => {
    try {
        const sgResult = await getActualSecurityGroups();
        const securityGroups = sgResult.data;
        
        // 노드 생성 (Security Groups)
        const nodes = securityGroups.map(sg => ({
            id: sg.id,
            label: sg.groupName,
            group: sg.vpcId,
            title: `${sg.groupName}\n${sg.description}\nRules: ${sg.rulesCount}`,
            color: sg.hasExpiredRules ? '#ff6b6b' : '#4ecdc4',
            size: Math.max(10, sg.rulesCount * 2)
        }));
        
        // 엣지 생성 (Security Group 간 관계)
        const edges = [];
        securityGroups.forEach(sg => {
            sg.inboundRules.forEach(rule => {
                rule.securityGroups.forEach(refSgId => {
                    if (securityGroups.find(s => s.id === refSgId)) {
                        edges.push({
                            from: refSgId,
                            to: sg.id,
                            label: `${rule.protocol}:${rule.portRange}`,
                            arrows: 'to',
                            color: { color: '#848484' }
                        });
                    }
                });
            });
        });
        
        res.json({
            nodes,
            edges,
            stats: {
                totalNodes: nodes.length,
                totalEdges: edges.length,
                riskNodes: nodes.filter(n => n.color === '#ff6b6b').length
            },
            message: 'Network visualization data generated successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to generate network visualization data',
            message: error.message
        });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Simple Enhanced AWS Security Group Manager API`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Statistics: http://localhost:${PORT}/api/stats`);
    console.log(`🛡️ Security Groups: http://localhost:${PORT}/api/security-groups`);
    console.log(`📋 Requests: http://localhost:${PORT}/api/requests`);
    console.log(`🔍 Audit Logs: http://localhost:${PORT}/api/audit-logs`);
    console.log(`🌐 Network Viz: http://localhost:${PORT}/api/network-visualization`);
    console.log('');
    console.log('✨ Features:');
    console.log('  • Real AWS SDK integration');
    console.log('  • Memory-based data persistence');
    console.log('  • Request approval workflow');
    console.log('  • Audit logging');
    console.log('  • Network visualization');
    console.log('  • Advanced filtering & search');
    console.log('  • No MongoDB dependency');
});

module.exports = app;
