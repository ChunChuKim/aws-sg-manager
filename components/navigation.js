// 공통 네비게이션 컴포넌트
function createNavigation(currentPage = '') {
    return `
        <nav class="main-navigation">
            <div class="nav-container">
                <div class="nav-brand">
                    <span class="material-icons">security</span>
                    <span class="brand-text">AWS Security Group Manager</span>
                </div>
                <div class="nav-menu">
                    <a href="/index.html" class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}">
                        <span class="material-icons">dashboard</span>
                        <span>Dashboard</span>
                    </a>
                    <a href="/sg-manager.html" class="nav-item ${currentPage === 'security-groups' ? 'active' : ''}">
                        <span class="material-icons">security</span>
                        <span>Security Groups</span>
                    </a>
                    <a href="/requests-manager.html" class="nav-item ${currentPage === 'requests' ? 'active' : ''}">
                        <span class="material-icons">assignment</span>
                        <span>Requests</span>
                    </a>
                    <a href="/network-visualization-enhanced.html" class="nav-item ${currentPage === 'network' ? 'active' : ''}">
                        <span class="material-icons">hub</span>
                        <span>Network</span>
                    </a>
                    <a href="/audit-logs.html" class="nav-item ${currentPage === 'audit' ? 'active' : ''}">
                        <span class="material-icons">history</span>
                        <span>Audit Logs</span>
                    </a>
                </div>
                <div class="nav-user">
                    <div class="user-info">
                        <span class="material-icons">account_circle</span>
                        <span>Admin</span>
                    </div>
                </div>
            </div>
        </nav>
    `;
}

// 공통 네비게이션 스타일
function getNavigationStyles() {
    return `
        <style>
            .main-navigation {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                position: sticky;
                top: 0;
                z-index: 1000;
            }
            
            .nav-container {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem 2rem;
            }
            
            .nav-brand {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.25rem;
                font-weight: 700;
            }
            
            .nav-menu {
                display: flex;
                gap: 0.5rem;
            }
            
            .nav-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                text-decoration: none;
                color: white;
                transition: all 0.2s;
                font-weight: 500;
            }
            
            .nav-item:hover {
                background: rgba(255,255,255,0.1);
                transform: translateY(-1px);
            }
            
            .nav-item.active {
                background: rgba(255,255,255,0.2);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .nav-user {
                display: flex;
                align-items: center;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                background: rgba(255,255,255,0.1);
            }
            
            @media (max-width: 768px) {
                .nav-container {
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .nav-menu {
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .nav-item span:last-child {
                    display: none;
                }
            }
        </style>
    `;
}
