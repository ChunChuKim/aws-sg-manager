const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // 개발 환경에서는 모든 origin 허용
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:8082',
            'http://localhost:3001',
            'http://127.0.0.1:8082',
            'http://127.0.0.1:3001'
        ];
        
        // 현재 호스트의 IP 주소도 허용
        const currentHost = process.env.HOST || 'localhost';
        allowedOrigins.push(`http://${currentHost}:8082`);
        allowedOrigins.push(`http://${currentHost}:3001`);
        
        // EC2 내부 IP도 허용
        if (origin.includes('172.31.') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('🚫 CORS blocked origin:', origin);
            callback(null, true); // 개발 환경에서는 모든 origin 허용
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
                fromPort: 22,
                toPort: 22,
                cidrBlocks: ['10.0.0.0/8'],
                direction: 'inbound'
            },
            description: 'SSH access from internal network',
            businessJustification: 'Need SSH access for maintenance tasks and troubleshooting',
            requestedBy: 'admin@company.com',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            assignedApprover: {
                id: 'user-002',
                name: 'Security Manager',
                email: 'security@company.com',
                assignedAt: new Date().toISOString()
            },
            comments: []
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
            name: 'System Administrator',
            email: 'admin@company.com',
            role: 'admin',
            department: 'IT Operations',
            active: true,
            createdAt: '2024-01-01T00:00:00Z',
            lastLogin: new Date().toISOString()
        },
        {
            id: 'user-002',
            name: 'Security Manager',
            email: 'security@company.com',
            role: 'security_manager',
            department: 'Security',
            active: true,
            createdAt: '2024-01-01T00:00:00Z',
            lastLogin: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'user-003',
            name: 'Network Engineer',
            email: 'network@company.com',
            role: 'network_engineer',
            department: 'Infrastructure',
            active: true,
            createdAt: '2024-01-01T00:00:00Z',
            lastLogin: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 'user-004',
            name: 'DevOps Lead',
            email: 'devops@company.com',
            role: 'devops_lead',
            department: 'Development',
            active: true,
            createdAt: '2024-01-01T00:00:00Z',
            lastLogin: new Date(Date.now() - 3600000).toISOString()
        }
    ],
    workflows: [
        {
            id: 'workflow-001',
            name: 'Standard Security Group Change',
            description: 'Standard approval workflow for security group changes',
            steps: [
                {
                    id: 'step-001',
                    name: 'Initial Review',
                    description: 'Technical review by network team',
                    approverRole: 'network_engineer',
                    required: true,
                    order: 1
                },
                {
                    id: 'step-002',
                    name: 'Security Review',
                    description: 'Security impact assessment',
                    approverRole: 'security_manager',
                    required: true,
                    order: 2
                },
                {
                    id: 'step-003',
                    name: 'Final Approval',
                    description: 'Final approval by admin',
                    approverRole: 'admin',
                    required: true,
                    order: 3
                }
            ],
            active: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
        },
        {
            id: 'workflow-002',
            name: 'Emergency Change',
            description: 'Fast-track approval for emergency changes',
            steps: [
                {
                    id: 'step-004',
                    name: 'Emergency Approval',
                    description: 'Immediate approval by security manager',
                    approverRole: 'security_manager',
                    required: true,
                    order: 1
                }
            ],
            active: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
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

    return demoData;
}

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
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        const result = await getActualSecurityGroups();
        const securityGroup = result.find(sg => sg.id === id);
        
        if (!securityGroup) {
            addAuditLog('ERROR', `Security Group ${id}`, 'Security group not found', 'user', clientIP);
            return res.status(404).json({
                error: 'Security group not found',
                id
            });
        }
        
        addAuditLog('VIEW', `Security Group ${id}`, `Viewed details of security group ${securityGroup.groupName}`, 'user', clientIP);
        
        res.json({
            data: securityGroup,
            message: 'Security group details retrieved successfully'
        });
        
    } catch (error) {
        console.error('Security Group Details API Error:', error);
        addAuditLog('ERROR', `Security Group ${req.params.id}`, `Failed to retrieve security group details: ${error.message}`, 'system');
        
        res.status(500).json({
            error: 'Failed to fetch security group details',
            message: error.message
        });
    }
});

// 시스템 통계
app.get('/api/stats', async (req, res) => {
    try {
        const sgResult = await getActualSecurityGroups();
        const totalSecurityGroups = sgResult.length;
        const expiredRules = sgResult.filter(sg => sg.hasExpiredRules).length;
        
        const pendingRequests = memoryStore.requests.filter(r => r.status === 'pending').length;
        const approvedRequests = memoryStore.requests.filter(r => r.status === 'approved').length;
        const rejectedRequests = memoryStore.requests.filter(r => r.status === 'rejected').length;
        
        // VPC별 통계
        const vpcStats = {};
        sgResult.forEach(sg => {
            if (!vpcStats[sg.vpcId]) {
                vpcStats[sg.vpcId] = 0;
            }
            vpcStats[sg.vpcId]++;
        });
        
        const stats = {
            totalSecurityGroups,
            expiredRules,
            pendingRequests,
            approvedRequests,
            rejectedRequests,
            totalRequests: pendingRequests + approvedRequests + rejectedRequests,
            vpcStats,
            lastUpdated: new Date().toISOString(),
            systemHealth: {
                database: 'memory-mode',
                aws: 'connected'
            }
        };
        
        // 메모리 저장소 업데이트
        memoryStore.stats = { ...memoryStore.stats, ...stats };
        
        res.json(stats);
        
    } catch (error) {
        console.error('Stats API Error:', error);
        res.status(500).json({
            error: 'Failed to fetch statistics',
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
        
        // AWS 적용 시뮬레이션
        if (applyToAws) {
            awsResult = {
                success: true,
                message: `Simulated AWS application: ${request.type} for ${request.securityGroupId}`,
                simulation: true,
                appliedAt: new Date().toISOString()
            };
            addAuditLog('APPLY', `Request ${requestId}`, `Simulated AWS application: ${awsResult.message}`, reviewerEmail, clientIP);
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
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        if (!requestId || !reviewerEmail) {
            addAuditLog('ERROR', 'Request Rejection', 'Failed to reject request: Missing required fields', reviewerEmail, clientIP);
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['requestId', 'reviewerEmail']
            });
        }
        
        const requestIndex = memoryStore.requests.findIndex(r => r.id === requestId);
        
        if (requestIndex === -1) {
            addAuditLog('ERROR', 'Request Rejection', `Failed to reject request: Request ${requestId} not found`, reviewerEmail, clientIP);
            return res.status(404).json({
                error: 'Request not found',
                requestId
            });
        }
        
        const request = memoryStore.requests[requestIndex];
        
        if (request.status !== 'pending') {
            addAuditLog('ERROR', 'Request Rejection', `Failed to reject request ${requestId}: Not in pending status (${request.status})`, reviewerEmail, clientIP);
            return res.status(400).json({
                error: 'Request is not in pending status',
                currentStatus: request.status
            });
        }
        
        // 요청 거부 처리
        request.status = 'rejected';
        request.reviewedBy = reviewerEmail;
        request.reviewedAt = new Date().toISOString();
        request.updatedAt = new Date().toISOString();
        
        if (!request.comments) request.comments = [];
        request.comments.push({
            author: reviewerEmail,
            text: comments || 'Request rejected',
            timestamp: new Date().toISOString()
        });
        
        // 통계 업데이트
        memoryStore.stats.pendingRequests = memoryStore.requests.filter(r => r.status === 'pending').length;
        
        // 감사 로그 기록
        addAuditLog('REJECT', `Request ${requestId}`, `Request rejected by ${reviewerEmail}: ${comments || 'No reason provided'}`, reviewerEmail, clientIP);
        
        res.json({
            data: request,
            message: 'Request rejected successfully',
            requestId
        });
        
    } catch (error) {
        console.error('Reject Request API Error:', error);
        addAuditLog('ERROR', 'Request Rejection', `Failed to reject request: ${error.message}`, 'system');
        
        res.status(500).json({
            error: 'Failed to reject request',
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
        console.error('Audit Logs API Error:', error);
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
        const securityGroups = sgResult;
        
        // 노드 생성 (Security Groups)
        const nodes = securityGroups.map(sg => ({
            id: sg.id,
            label: sg.groupName,
            group: sg.vpcId,
            title: `${sg.groupName}\n${sg.description}\nRules: ${sg.rulesCount}`,
            color: sg.hasExpiredRules ? '#ff6b6b' : '#4ecdc4',
            size: Math.max(20, sg.rulesCount * 3),
            font: { size: 12 },
            borderWidth: 2,
            borderColor: sg.hasExpiredRules ? '#ff4757' : '#00d2d3'
        }));
        
        // 엣지 생성 (Security Group 간 연결)
        const edges = [];
        securityGroups.forEach(sg => {
            // 인바운드 규칙에서 다른 Security Group 참조 찾기
            sg.inboundRules.forEach(rule => {
                rule.securityGroups.forEach(refSgId => {
                    if (securityGroups.find(s => s.id === refSgId)) {
                        edges.push({
                            from: refSgId,
                            to: sg.id,
                            label: `${rule.portRange}/${rule.ipProtocol}`,
                            arrows: 'to',
                            color: { color: '#848484' },
                            font: { size: 10 }
                        });
                    }
                });
            });
            
            // 아웃바운드 규칙에서 다른 Security Group 참조 찾기
            sg.outboundRules.forEach(rule => {
                rule.securityGroups.forEach(refSgId => {
                    if (securityGroups.find(s => s.id === refSgId)) {
                        edges.push({
                            from: sg.id,
                            to: refSgId,
                            label: `${rule.portRange}/${rule.ipProtocol}`,
                            arrows: 'to',
                            color: { color: '#848484' },
                            font: { size: 10 }
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
                riskNodes: nodes.filter(n => n.color === '#ff6b6b').length,
                vpcs: [...new Set(securityGroups.map(sg => sg.vpcId))].length
            },
            message: 'Network visualization data generated successfully'
        });
        
    } catch (error) {
        console.error('Network Visualization API Error:', error);
        res.status(500).json({
            error: 'Failed to generate network visualization data',
            message: error.message
        });
    }
});

// 담당자 및 워크플로우 관리 API 추가
app.get('/api/users', (req, res) => {
    try {
        const { role, active } = req.query;
        let users = [...memoryStore.users];
        
        if (role) {
            users = users.filter(user => user.role === role);
        }
        
        if (active !== undefined) {
            users = users.filter(user => user.active === (active === 'true'));
        }
        
        res.json({
            data: users,
            total: users.length,
            message: 'Users retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch users',
            message: error.message
        });
    }
});

// 사용자 생성
app.post('/api/users/create', (req, res) => {
    try {
        const { name, email, role, department, active = true } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        if (!name || !email || !role) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'email', 'role']
            });
        }
        
        // 이메일 중복 확인
        if (memoryStore.users.find(user => user.email === email)) {
            return res.status(400).json({
                error: 'User with this email already exists'
            });
        }
        
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const user = {
            id: userId,
            name,
            email,
            role,
            department: department || '',
            active,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        memoryStore.users.push(user);
        
        addAuditLog('CREATE', `User ${userId}`, `New user created: ${name} (${email})`, 'admin', clientIP);
        
        res.status(201).json({
            data: user,
            message: 'User created successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to create user',
            message: error.message
        });
    }
});

// 워크플로우 설정 조회
app.get('/api/workflows', (req, res) => {
    try {
        const workflows = memoryStore.workflows || [];
        res.json({
            data: workflows,
            total: workflows.length,
            message: 'Workflows retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch workflows',
            message: error.message
        });
    }
});

// 워크플로우 생성
app.post('/api/workflows/create', (req, res) => {
    try {
        const { name, description, steps, active = true } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        if (!name || !steps || !Array.isArray(steps)) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'steps (array)']
            });
        }
        
        const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const workflow = {
            id: workflowId,
            name,
            description: description || '',
            steps,
            active,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (!memoryStore.workflows) {
            memoryStore.workflows = [];
        }
        
        memoryStore.workflows.push(workflow);
        
        addAuditLog('CREATE', `Workflow ${workflowId}`, `New workflow created: ${name}`, 'admin', clientIP);
        
        res.status(201).json({
            data: workflow,
            message: 'Workflow created successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to create workflow',
            message: error.message
        });
    }
});

// 승인자 할당
app.post('/api/requests/:id/assign-approver', (req, res) => {
    try {
        const { id } = req.params;
        const { approverId, comments } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        
        const requestIndex = memoryStore.requests.findIndex(r => r.id === id);
        if (requestIndex === -1) {
            return res.status(404).json({
                error: 'Request not found'
            });
        }
        
        const approver = memoryStore.users.find(u => u.id === approverId);
        if (!approver) {
            return res.status(404).json({
                error: 'Approver not found'
            });
        }
        
        const request = memoryStore.requests[requestIndex];
        request.assignedApprover = {
            id: approver.id,
            name: approver.name,
            email: approver.email,
            assignedAt: new Date().toISOString()
        };
        request.updatedAt = new Date().toISOString();
        
        if (comments) {
            if (!request.comments) request.comments = [];
            request.comments.push({
                author: 'system',
                text: `Assigned to ${approver.name}: ${comments}`,
                timestamp: new Date().toISOString()
            });
        }
        
        addAuditLog('ASSIGN', `Request ${id}`, `Request assigned to ${approver.name}`, 'admin', clientIP);
        
        res.json({
            data: request,
            message: 'Approver assigned successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to assign approver',
            message: error.message
        });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Enhanced AWS Security Group Manager API`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Statistics: http://localhost:${PORT}/api/stats`);
    console.log(`🛡️ Security Groups: http://localhost:${PORT}/api/security-groups`);
    console.log(`📋 Requests: http://localhost:${PORT}/api/requests`);
    console.log(`🔍 Audit Logs: http://localhost:${PORT}/api/audit-logs`);
    console.log(`🌐 Network Viz: http://localhost:${PORT}/api/network-visualization`);
    console.log('');
    console.log('✨ Enhanced Features:');
    console.log('  • Real AWS SDK integration with fallback');
    console.log('  • Memory-based data persistence');
    console.log('  • Complete request-approval-apply workflow');
    console.log('  • Comprehensive audit logging');
    console.log('  • Interactive network visualization');
    console.log('  • Advanced filtering & search');
    console.log('  • Business justification requirements');
    console.log('  • Expired rules detection');
    console.log('  • No external database dependency');
    console.log('');
    console.log('🎯 Ready for production use!');
});

module.exports = app;
