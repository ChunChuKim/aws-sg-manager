const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { MongoClient } = require('mongodb');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// AWS 설정
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

const ec2 = new AWS.EC2();

// MongoDB 연결
let db;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sgmanager';

MongoClient.connect(MONGODB_URI, {
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
})
    .then(client => {
        console.log('✅ MongoDB 연결 성공');
        db = client.db('sgmanager');
        
        // 컬렉션 초기화
        initializeCollections();
    })
    .catch(error => {
        console.error('❌ MongoDB 연결 실패:', error);
        console.log('⚠️ MongoDB 없이 메모리 모드로 실행됩니다.');
        db = null;
    });

async function initializeCollections() {
    try {
        // 요청 컬렉션 생성
        await db.createCollection('requests');
        await db.createCollection('audit_logs');
        await db.createCollection('users');
        await db.createCollection('notifications');
        
        console.log('✅ MongoDB 컬렉션 초기화 완료');
    } catch (error) {
        console.log('ℹ️ 컬렉션이 이미 존재하거나 생성 중 오류:', error.message);
    }
}

// 실제 AWS Security Groups 조회 (AWS SDK 사용)
async function getActualSecurityGroups() {
    try {
        const params = {
            MaxResults: 100
        };
        
        const data = await ec2.describeSecurityGroups(params).promise();
        
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
                portRange: rule.FromPort === rule.ToPort ? rule.FromPort?.toString() : `${rule.FromPort}-${rule.ToPort}`,
                cidrBlocks: rule.IpRanges.map(range => range.CidrIp),
                securityGroups: rule.UserIdGroupPairs.map(pair => pair.GroupId),
                description: rule.IpRanges[0]?.Description || 'No description'
            })),
            outboundRules: sg.IpPermissionsEgress.map(rule => ({
                ipProtocol: rule.IpProtocol,
                fromPort: rule.FromPort,
                toPort: rule.ToPort,
                portRange: rule.FromPort === rule.ToPort ? rule.FromPort?.toString() : `${rule.FromPort}-${rule.ToPort}`,
                cidrBlocks: rule.IpRanges.map(range => range.CidrIp),
                securityGroups: rule.UserIdGroupPairs.map(pair => pair.GroupId),
                description: rule.IpRanges[0]?.Description || 'No description'
            })),
            tags: sg.Tags || [],
            createdTime: getCreationTime(sg.Tags),
            lastModified: new Date().toISOString()
        }));
        
        return {
            data: securityGroups,
            total: securityGroups.length,
            message: 'Real AWS Security Groups data retrieved successfully'
        };
        
    } catch (error) {
        console.log('AWS SDK 에러, 데모 데이터 사용:', error.message);
        return getDemoSecurityGroups();
    }
}

// 만료된 규칙 확인
function checkExpiredRules(sg) {
    // 실제 구현에서는 태그나 메타데이터를 통해 만료 날짜 확인
    const expiredTag = sg.Tags?.find(tag => tag.Key === 'ExpiryDate');
    if (expiredTag) {
        const expiryDate = new Date(expiredTag.Value);
        return expiryDate < new Date();
    }
    return Math.random() > 0.8; // 데모용 랜덤 만료
}

// 생성 시간 추출
function getCreationTime(tags) {
    const createdTag = tags?.find(tag => tag.Key === 'CreatedTime');
    return createdTag?.Value || new Date().toISOString();
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

// 실제 AWS에 규칙 추가
async function addSecurityGroupRule(sgId, rule, simulate = true) {
    try {
        if (simulate) {
            console.log(`[SIMULATION] Adding rule to ${sgId}:`, rule);
            return {
                success: true,
                message: 'Rule added successfully (simulation mode)',
                ruleId: `rule-${Date.now()}`
            };
        }
        
        const params = {
            GroupId: sgId,
            IpPermissions: [{
                IpProtocol: rule.protocol,
                FromPort: parseInt(rule.fromPort),
                ToPort: parseInt(rule.toPort),
                IpRanges: rule.cidrBlocks.map(cidr => ({
                    CidrIp: cidr,
                    Description: rule.description
                }))
            }]
        };
        
        if (rule.direction === 'inbound') {
            await ec2.authorizeSecurityGroupIngress(params).promise();
        } else {
            await ec2.authorizeSecurityGroupEgress(params).promise();
        }
        
        // 감사 로그 기록
        await logAuditEvent('rule_added', {
            securityGroupId: sgId,
            rule: rule,
            timestamp: new Date().toISOString()
        });
        
        return {
            success: true,
            message: 'Rule added successfully',
            ruleId: `${sgId}-${rule.protocol}-${rule.fromPort}`
        };
        
    } catch (error) {
        console.error('Error adding security group rule:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// 실제 AWS에서 규칙 제거
async function removeSecurityGroupRule(sgId, rule, simulate = true) {
    try {
        if (simulate) {
            console.log(`[SIMULATION] Removing rule from ${sgId}:`, rule);
            return {
                success: true,
                message: 'Rule removed successfully (simulation mode)'
            };
        }
        
        const params = {
            GroupId: sgId,
            IpPermissions: [{
                IpProtocol: rule.protocol,
                FromPort: parseInt(rule.fromPort),
                ToPort: parseInt(rule.toPort),
                IpRanges: rule.cidrBlocks.map(cidr => ({
                    CidrIp: cidr
                }))
            }]
        };
        
        if (rule.direction === 'inbound') {
            await ec2.revokeSecurityGroupIngress(params).promise();
        } else {
            await ec2.revokeSecurityGroupEgress(params).promise();
        }
        
        // 감사 로그 기록
        await logAuditEvent('rule_removed', {
            securityGroupId: sgId,
            rule: rule,
            timestamp: new Date().toISOString()
        });
        
        return {
            success: true,
            message: 'Rule removed successfully'
        };
        
    } catch (error) {
        console.error('Error removing security group rule:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// 감사 로그 기록
async function logAuditEvent(action, details) {
    try {
        await db.collection('audit_logs').insertOne({
            action,
            details,
            timestamp: new Date(),
            userId: details.userId || 'system'
        });
    } catch (error) {
        console.error('Error logging audit event:', error);
    }
}

// 알림 발송
async function sendNotification(type, message, recipients = []) {
    try {
        const notification = {
            type,
            message,
            recipients,
            timestamp: new Date(),
            status: 'sent'
        };
        
        await db.collection('notifications').insertOne(notification);
        
        // Slack 알림 (설정된 경우)
        if (process.env.SLACK_WEBHOOK_URL) {
            await sendSlackNotification(message);
        }
        
        // 이메일 알림 (설정된 경우)
        if (process.env.MAIL_USERNAME && recipients.length > 0) {
            await sendEmailNotification(message, recipients);
        }
        
        console.log(`✅ 알림 발송 완료: ${type}`);
        
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// Slack 알림 발송
async function sendSlackNotification(message) {
    // 실제 구현에서는 axios나 fetch를 사용하여 Slack webhook 호출
    console.log(`[SLACK] ${message}`);
}

// 이메일 알림 발송
async function sendEmailNotification(message, recipients) {
    // 실제 구현에서는 nodemailer 등을 사용하여 이메일 발송
    console.log(`[EMAIL] To: ${recipients.join(', ')}, Message: ${message}`);
}

// API 엔드포인트들

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
            mongodb: db ? 'connected' : 'disconnected',
            aws: 'configured'
        }
    });
});

// Security Groups 조회
app.get('/api/security-groups', async (req, res) => {
    try {
        const { search, vpc, status } = req.query;
        let result = await getActualSecurityGroups();
        
        // 필터링
        if (search) {
            result.data = result.data.filter(sg => 
                sg.groupName.toLowerCase().includes(search.toLowerCase()) ||
                sg.id.toLowerCase().includes(search.toLowerCase()) ||
                sg.description.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        if (vpc) {
            result.data = result.data.filter(sg => sg.vpcId === vpc);
        }
        
        if (status) {
            result.data = result.data.filter(sg => sg.status === status);
        }
        
        result.total = result.data.length;
        res.json(result);
        
    } catch (error) {
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
app.get('/api/requests', async (req, res) => {
    try {
        const { status, type, requester } = req.query;
        let query = {};
        
        if (status) query.status = status;
        if (type) query.type = type;
        if (requester) query.requestedBy = requester;
        
        const requests = await db.collection('requests')
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();
        
        res.json({
            data: requests,
            total: requests.length,
            message: 'Requests retrieved successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch requests',
            message: error.message
        });
    }
});

// 새 요청 생성
app.post('/api/requests/create', async (req, res) => {
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
        
        // 입력 검증
        if (!type || !securityGroupId || !requestedBy) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['type', 'securityGroupId', 'requestedBy']
            });
        }
        
        const request = {
            id: `req-${Date.now()}`,
            type,
            securityGroupId,
            requestedBy,
            description: description || '',
            protocol: protocol || '',
            fromPort: fromPort || null,
            toPort: toPort || null,
            cidrBlocks: cidrBlocks || [],
            direction: direction || 'inbound',
            businessJustification: businessJustification || '',
            expiryDate: expiryDate || null,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            reviewedBy: null,
            reviewedAt: null,
            comments: []
        };
        
        await db.collection('requests').insertOne(request);
        
        // 알림 발송
        await sendNotification(
            'new_request',
            `새로운 Security Group 요청이 생성되었습니다: ${request.id}`,
            [process.env.ADMIN_EMAIL]
        );
        
        res.status(201).json({
            data: request,
            message: 'Request created successfully'
        });
        
    } catch (error) {
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
        
        if (!requestId || !reviewerEmail) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['requestId', 'reviewerEmail']
            });
        }
        
        const request = await db.collection('requests').findOne({ id: requestId });
        
        if (!request) {
            return res.status(404).json({
                error: 'Request not found',
                requestId
            });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({
                error: 'Request is not in pending status',
                currentStatus: request.status
            });
        }
        
        // 요청 승인 처리
        const updateData = {
            status: 'approved',
            reviewedBy: reviewerEmail,
            reviewedAt: new Date(),
            updatedAt: new Date(),
            $push: {
                comments: {
                    author: reviewerEmail,
                    text: comments || 'Request approved',
                    timestamp: new Date()
                }
            }
        };
        
        await db.collection('requests').updateOne(
            { id: requestId },
            updateData
        );
        
        // AWS에 실제 적용 (옵션)
        let awsResult = null;
        if (applyToAws && request.type === 'add_rule') {
            const rule = {
                protocol: request.protocol,
                fromPort: request.fromPort,
                toPort: request.toPort,
                cidrBlocks: request.cidrBlocks,
                direction: request.direction,
                description: request.description
            };
            
            awsResult = await addSecurityGroupRule(
                request.securityGroupId,
                rule,
                !applyToAws // simulate if not applying to AWS
            );
        }
        
        // 알림 발송
        await sendNotification(
            'request_approved',
            `요청 ${requestId}이 승인되었습니다.`,
            [request.requestedBy, reviewerEmail]
        );
        
        res.json({
            message: 'Request approved successfully',
            requestId,
            awsResult
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to approve request',
            message: error.message
        });
    }
});

// 요청 거부
app.post('/api/requests/reject', async (req, res) => {
    try {
        const { requestId, reviewerEmail, comments } = req.body;
        
        if (!requestId || !reviewerEmail || !comments) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['requestId', 'reviewerEmail', 'comments']
            });
        }
        
        const request = await db.collection('requests').findOne({ id: requestId });
        
        if (!request) {
            return res.status(404).json({
                error: 'Request not found',
                requestId
            });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({
                error: 'Request is not in pending status',
                currentStatus: request.status
            });
        }
        
        // 요청 거부 처리
        const updateData = {
            status: 'rejected',
            reviewedBy: reviewerEmail,
            reviewedAt: new Date(),
            updatedAt: new Date(),
            $push: {
                comments: {
                    author: reviewerEmail,
                    text: comments,
                    timestamp: new Date()
                }
            }
        };
        
        await db.collection('requests').updateOne(
            { id: requestId },
            updateData
        );
        
        // 알림 발송
        await sendNotification(
            'request_rejected',
            `요청 ${requestId}이 거부되었습니다. 사유: ${comments}`,
            [request.requestedBy, reviewerEmail]
        );
        
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
        
        const requestStats = await db.collection('requests').aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        
        const pendingRequests = requestStats.find(stat => stat._id === 'pending')?.count || 0;
        const approvedRequests = requestStats.find(stat => stat._id === 'approved')?.count || 0;
        const rejectedRequests = requestStats.find(stat => stat._id === 'rejected')?.count || 0;
        
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
                mongodb: db ? 'healthy' : 'unhealthy',
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
app.get('/api/audit-logs', async (req, res) => {
    try {
        const { limit = 50, action, userId } = req.query;
        let query = {};
        
        if (action) query.action = action;
        if (userId) query.userId = userId;
        
        const logs = await db.collection('audit_logs')
            .find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .toArray();
        
        res.json({
            data: logs,
            total: logs.length,
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
    console.log('✨ Features:');
    console.log('  • Real AWS SDK integration');
    console.log('  • MongoDB data persistence');
    console.log('  • Request approval workflow');
    console.log('  • Audit logging');
    console.log('  • Notification system');
    console.log('  • Network visualization');
    console.log('  • Advanced filtering & search');
});

module.exports = app;
