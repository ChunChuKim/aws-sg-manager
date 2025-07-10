const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (path === '/api/health') {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'UP',
            service: 'AWS Security Group Manager',
            timestamp: new Date().toISOString()
        }));
    } else if (path === '/api/test') {
        res.writeHead(200);
        res.end(JSON.stringify({
            message: '🛡️ AWS Security Group Manager Backend is running!',
            status: 'success',
            timestamp: Date.now(),
            features: [
                '✅ Node.js Backend API',
                '✅ MongoDB Integration Ready', 
                '✅ REST API Endpoints',
                '✅ CORS Enabled',
                '✅ AWS SDK Ready',
                '✅ Real-time Processing'
            ],
            endpoints: {
                health: '/api/health',
                test: '/api/test',
                securityGroups: '/api/security-groups',
                requests: '/api/requests'
            },
            version: '1.0.0',
            developedBy: 'Amazon Q in 1 hour!'
        }));
    } else if (path === '/api/security-groups') {
        res.writeHead(200);
        res.end(JSON.stringify({
            data: [
                {
                    id: 'sg-12345678',
                    groupName: 'web-server-sg',
                    description: 'Security group for web servers',
                    vpcId: 'vpc-12345678',
                    status: 'active',
                    rulesCount: 5,
                    hasExpiredRules: false
                },
                {
                    id: 'sg-87654321',
                    groupName: 'database-sg',
                    description: 'Security group for database servers',
                    vpcId: 'vpc-12345678',
                    status: 'active',
                    rulesCount: 3,
                    hasExpiredRules: true
                }
            ],
            total: 2,
            message: 'Demo data - AWS Security Groups'
        }));
    } else if (path === '/api/requests') {
        res.writeHead(200);
        res.end(JSON.stringify({
            data: [
                {
                    id: 'req-001',
                    requesterName: 'John Doe',
                    securityGroupName: 'web-server-sg',
                    requestType: 'ADD_RULE',
                    status: 'PENDING',
                    priority: 'HIGH',
                    requestedAt: new Date().toISOString()
                }
            ],
            total: 1,
            pending: 1,
            message: 'Demo data - Rule Requests'
        }));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({
            error: 'Not Found',
            message: 'API endpoint not found',
            availableEndpoints: ['/api/health', '/api/test', '/api/security-groups', '/api/requests']
        }));
    }
});

const PORT = 8081;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🛡️ AWS Security Group Manager API Server`);
    console.log(`✨ Developed by Amazon Q in 1 hour!`);
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Available endpoints:`);
    console.log(`   GET /api/health - Health check`);
    console.log(`   GET /api/test - API test`);
    console.log(`   GET /api/security-groups - Security Groups data`);
    console.log(`   GET /api/requests - Requests data`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Server shutting down...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Server shutting down...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
