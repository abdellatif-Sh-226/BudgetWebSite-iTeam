const languages = {
    en: window.langEN || {},
    fr: window.langFR || {}
};

let currentLanguage = languages.en;

function t(key) {
    return currentLanguage[key] || key;
}

export function setSidebarLanguage(lang = 'en') {
    currentLanguage = languages[lang] || languages.en;
}

export function createSidebar() {
    const CU = window.CU || JSON.parse(sessionStorage.getItem('budgetcollab_user')) || { role: 'admin', id: '1', name: 'Admin' };
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';

    const navItems = [
        { id: 'dashboard', icon: '📊', label: t('dashboard') || 'Dashboard', page: 'dashboard.html' },
        { id: 'transactions', icon: '💸', label: t('transactions') || 'Transactions', page: 'transactions.html' },
        { id: 'budgets', icon: '📋', label: t('budgets') || 'Budgets', page: 'budgets.html' },
        { id: 'categories', icon: '🏷️', label: t('categories') || 'Catégories', page: 'categories.html' },
        { id: 'shared', icon: '👥', label: t('shared') || 'Partagés', page: 'shared.html' },
        { id: 'profile', icon: '👤', label: t('profile') || 'Profil', page: 'profile.html' }
    ];

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-logo">💰 <span>BudgetCollab</span></div>
        <div class="sidebar-user">
            <div class="avatar" id="sidebarAvatar">${CU.name ? CU.name.charAt(0).toUpperCase() : 'A'}</div>
            <div class="sidebar-user-info">
                <div class="sidebar-user-name" id="sidebarName">${CU.name || 'Admin'}</div>
                <div class="sidebar-role-badge" id="sidebarRoleBadge">${CU.role === 'admin' ? '<span class="role-badge-admin">👑 Admin</span>' : '<span class="role-badge-user">👤 Utilisateur</span>'}</div>
            </div>
        </div>
        <nav class="nav" id="sidebarNav">
            ${navItems.map(n => `
                <div class="nav-item ${currentPage === n.id ? 'active' : ''}" data-page="${n.page}">
                    <span class="nav-icon">${n.icon}</span><span>${n.label}</span>
                </div>
            `).join('')}
        </nav>
        <div class="sidebar-bottom">
            <div class="nav-item" id="logoutBtn">
                <span class="nav-icon">🚪</span><span>${t('logout') || 'Déconnexion'}</span>
            </div>
        </div>
    `;

    sidebar.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            window.location.href = item.dataset.page;
        });
    });

    const logoutBtn = sidebar.querySelector('#logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('budgetcollab_user');
            window.location.href = 'home.html';
        });
    }

    return sidebar;
}
