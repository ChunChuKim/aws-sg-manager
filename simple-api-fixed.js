const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors({
    origin: true, // 모든 origin 허용
    credentials: true
}));
app.use(express.json());

// AWS 설정
AWS.config.update({
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
            resource: 'Security Groups',
            details: 'Viewed security groups list',
            user: 'admin@company.com',
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1'
        }
    ],
    stats: {
        totalSecurityGroups: 0,
        totalRequests: 1,
        pendingRequests: 1,
        approvedRequests: 0,
        rejectedRequests: 0,
        lastUpdated: new Date().toISOString()
    }
};

// 감사 로그 추가 함수
function addAuditLog(action, resource, details, user = 'system', ipAddress = '127.0.0.1') {
    const logEntry = {
        id: `log-${Date.now()}`,
        action,
        resource,
        details,
        user,
        timestamp: new Date().toISOString(),
        ipAddress
    };
    memoryStore.auditLogs.push(logEntry);
    
    // 최대 1000개 로그만 유지
    if (memoryStore.auditLogs.length > 1000) {
        memoryStore.auditLogs = memoryStore.auditLogs.slice(-1000);
    }
}

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: [
            'AWS SDK Integration',
            'Memory-based Storage',
            'Request Workflow',
            'Audit Logging'
        ]
    });
});

// Statistics
app.get('/api/stats', async (req, res) => {
    try {
        // AWS Security Groups 수 조회
        const sgData = await ec2.describeSecurityGroups().promise();
        memoryStore.stats.totalSecurityGroups = sgData.SecurityGroups.length;
        memoryStore.stats.lastUpdated = new Date().toISOString();
        
        addAuditLog('VIEW', 'Statistics', 'Viewed system statistics', 'user', req.ip);
        
        res.json({
            data: memoryStore.stats,
            message: 'Statistics retrieved successfully'
        });
    } catch (error) {
        console.error('Stats API Error:', error);
        res.status(500).json({
            error: 'Failed to retrieve statistics',
            message: error.message
        });
    }
});

// Security Groups 조회
app.get('/api/security-groups', async (req, res) => {
    try {
        const { search, vpc, limit = 50 } = req.query;
        
        let params = {
            MaxResults: parseInt(limit)
        };
        
        if (vpc) {
            params.Filters = [
                {
                    Name: 'vpc-id',
                    Values: [vpc]
                }
            ];
        }
        
        const data = await ec2.describeSecurityGroups(params).promise();
        let securityGroups = data.SecurityGroups;
        
        // 검색 필터 적용
        if (search) {
            const searchLower = search.toLowerCase();
            securityGroups = securityGroups.filter(sg => 
                sg.GroupName.toLowerCase().includes(searchLower) ||
                sg.GroupId.toLowerCase().includes(searchLower) ||
                (sg.Description && sg.Description.toLowerCase().includes(searchLower))
            );
        }
        
        // 데이터 변환
        const transformedData = securityGroups.map(sg => ({
            id: sg.GroupId,
            name: sg.GroupName,
            description: sg.Description,
            vpcId: sg.VpcId,
            ownerId: sg.OwnerId,
            inboundRules: sg.IpPermissions.length,
            outboundRules: sg.IpPermissionsEgress.length,
            tags: sg.Tags || [],
            rules: {
                inbound: sg.IpPermissions,
                outbound: sg.IpPermissionsEgress
            }
        }));
        
        addAuditLog('VIEW', 'Security Groups', `Retrieved ${transformedData.length} security groups`, 'user', req.ip);
        
        res.json({
            data: transformedData,
            total: transformedData.length,
            message: 'Security groups retrieved successfully'
        });
        
    } catch (error) {
        console.error('Security Groups API Error:', error);
        addAuditLog('ERROR', 'Security Groups', `Failed to retrieve: ${error.message}`, 'system');
        
        res.status(500).json({
            error: 'Failed to retrieve security groups',
            message: error.message
        });
    }
});

// 특정 Security Group 조회
app.get('/api/security-groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const data = await ec2.describeSecurityGroups({
            GroupIds: [id]
        }).promise();
        
        if (data.SecurityGroups.length === 0) {
            return res.status(404).json({
                error: 'Security group not found'
            });
        }
        
        const sg = data.SecurityGroups[0];
        const transformedData = {
            id: sg.GroupId,
            name: sg.GroupName,
            description: sg.Description,
            vpcId: sg.VpcId,
            ownerId: sg.OwnerId,
            tags: sg.Tags || [],
            rules: {
                inbound: sg.IpPermissions,
                outbound: sg.IpPermissionsEgress
            }
        };
        
        addAuditLog('VIEW', 'Security Group', `Viewed details for ${id}`, 'user', req.ip);
        
        res.json({
            data: transformedData,
            message: 'Security group retrieved successfully'
        });
        
    } catch (error) {
        console.error('Security Group Detail API Error:', error);
        res.status(500).json({
            error: 'Failed to retrieve security group',
            message: error.message
        });
    }
});

// 요청 목록 조회
app.get('/api/requests', (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        
        let requests = [...memoryStore.requests];
        
        if (status) {
            requests = requests.filter(r => r.status === status);
        }
        
        requests = requests.slice(0, parseInt(limit));
        
        addAuditLog('VIEW', 'Requests', `Retrieved ${requests.length} requests`, 'user', req.ip);
        
        res.json({
            data: requests,
            total: requests.length,
            message: 'Requests retrieved successfully'
        });
        
    } catch (error) {
        console.error('Requests API Error:', error);
        res.status(500).json({
            error: 'Failed to retrieve requests',
            message: error.message
        });
    }
});

// 새 요청 생성
app.post('/api/requests/create', (req, res) => {
    try {
        const { type, securityGroupId, rule, justification, requestedBy } = req.body;
        
        const requestId = `req-${Date.now()}`;
        const request = {
            id: requestId,
            type,
            securityGroupId,
            rule,
            justification,
            requestedBy,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reviewedBy: null,
            reviewedAt: null,
            comments: []
        };
        
        memoryStore.requests.push(request);
        memoryStore.stats.totalRequests++;
        memoryStore.stats.pendingRequests++;
        
        addAuditLog('CREATE', 'Request', `Created ${type} request for SG ${securityGroupId}`, requestedBy, req.ip);
        
        res.status(201).json({
            data: request,
            message: 'Request created successfully'
        });
        
    } catch (error) {
        console.error('Create Request API Error:', error);
        res.status(500).json({
            error: 'Failed to create request',
            message: error.message
        });
    }
});

// 요청 승인
app.post('/api/requests/approve', (req, res) => {
    try {
        const { requestId, reviewerEmail, comments } = req.body;
        
        const request = memoryStore.requests.find(r => r.id === requestId);
        if (!request) {
            return res.status(404).json({
                error: 'Request not found'
            });
        }
        
        request.status = 'approved';
        request.reviewedBy = reviewerEmail;
        request.reviewedAt = new Date().toISOString();
        request.updatedAt = new Date().toISOString();
        if (comments) {
            request.comments.push({
                text: comments,
                author: reviewerEmail,
                timestamp: new Date().toISOString()
            });
        }
        
        // 통계 업데이트
        memoryStore.stats.pendingRequests--;
        memoryStore.stats.approvedRequests++;
        
        addAuditLog('APPROVE', 'Request', `Approved request ${requestId}`, reviewerEmail, req.ip);
        
        res.json({
            data: request,
            message: 'Request approved successfully'
        });
        
    } catch (error) {
        console.error('Approve Request API Error:', error);
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
        
        const request = memoryStore.requests.find(r => r.id === requestId);
        if (!request) {
            return res.status(404).json({
                error: 'Request not found'
            });
        }
        
        request.status = 'rejected';
        request.reviewedBy = reviewerEmail;
        request.reviewedAt = new Date().toISOString();
        request.updatedAt = new Date().toISOString();
        if (comments) {
            request.comments.push({
                text: comments,
                author: reviewerEmail,
                timestamp: new Date().toISOString()
            });
        }
        
        // 통계 업데이트
        memoryStore.stats.pendingRequests--;
        memoryStore.stats.rejectedRequests++;
        
        addAuditLog('REJECT', 'Request', `Rejected request ${requestId}`, reviewerEmail, req.ip);
        
        res.json({
            data: request,
            message: 'Request rejected successfully'
        });
        
    } catch (error) {
        console.error('Reject Request API Error:', error);
        res.status(500).json({
            error: 'Failed to reject request',
            message: error.message
        });
    }
});

// 감사 로그 조회
app.get('/api/audit-logs', (req, res) => {
    try {
        const { limit = 100, action, user } = req.query;
        
        let logs = [...memoryStore.auditLogs];
        
        if (action) {
            logs = logs.filter(log => log.action === action);
        }
        
        if (user) {
            logs = logs.filter(log => log.user.includes(user));
        }
        
        // 최신 순으로 정렬
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        logs = logs.slice(0, parseInt(limit));
        
        res.json({
            data: logs,
            total: logs.length,
            message: 'Audit logs retrieved successfully'
        });
        
    } catch (error) {
        console.error('Audit Logs API Error:', error);
        res.status(500).json({
            error: 'Failed to retrieve audit logs',
            message: error.message
        });
    }
});

// 네트워크 시각화 데이터
app.get('/api/network-visualization', async (req, res) => {
    try {
        const data = await ec2.describeSecurityGroups().promise();
        const securityGroups = data.SecurityGroups;
        
        const nodes = securityGroups.map(sg => ({
            id: sg.GroupId,
            label: sg.GroupName,
            group: sg.VpcId,
            title: `${sg.GroupName} (${sg.GroupId})\nVPC: ${sg.VpcId}\nRules: ${sg.IpPermissions.length} in, ${sg.IpPermissionsEgress.length} out`
        }));
        
        const edges = [];
        securityGroups.forEach(sg => {
            sg.IpPermissions.forEach(rule => {
                rule.UserIdGroupPairs?.forEach(pair => {
                    if (pair.GroupId) {
                        edges.push({
                            from: pair.GroupId,
                            to: sg.GroupId,
                            label: `${rule.IpProtocol}:${rule.FromPort || 'all'}`,
                            arrows: 'to'
                        });
                    }
                });
            });
        });
        
        addAuditLog('VIEW', 'Network Visualization', 'Generated network visualization data', 'user', req.ip);
        
        res.json({
            data: {
                nodes,
                edges
            },
            message: 'Network visualization data retrieved successfully'
        });
        
    } catch (error) {
        console.error('Network Visualization API Error:', error);
        res.status(500).json({
            error: 'Failed to retrieve network visualization data',
            message: error.message
        });
    }
});

// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
    });
});

// 에러 핸들러
app.use((error, req, res, next) => {
    console.error('Unhandled Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log('🛡️ AWS Security Group Manager - Enhanced API v2.0');
    console.log('✨ Amazon Q Enhanced - Memory-based & AWS SDK Integration');
    console.log('');
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
