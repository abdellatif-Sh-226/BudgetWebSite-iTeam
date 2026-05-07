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
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-logo">💰 <span>${t('appTitle')}</span></div>
        <div class="sidebar-user">
            <div class="avatar" id="sidebarAvatar">A</div>
            <div class="sidebar-user-info">
                <div class="sidebar-user-name" id="sidebarName">Admin</div>
                <div class="sidebar-role-badge" id="sidebarRoleBadge"></div>
            </div>
        </div>
        <nav class="nav" id="sidebarNav">
            <div class="nav-item" data-target="dashboard">
                <span class="nav-icon">📊</span><span>${t('dashboard')}</span>
            </div>
            <div class="nav-item" data-target="transactions">
                <span class="nav-icon">💳</span><span>${t('transactions')}</span>
            </div>
            <div class="nav-item active" data-target="budgets">
                <span class="nav-icon">📈</span><span>${t('budgets')}</span>
            </div>
            <div class="nav-item" data-target="categories">
                <span class="nav-icon">🏷️</span><span>${t('categories')}</span>
            </div>
            <div class="nav-item" data-target="profile">
                <span class="nav-icon">👤</span><span>${t('profile')}</span>
            </div>
            <div class="nav-item" data-target="shared">
                <span class="nav-icon">🤝</span><span>${t('shared')}</span>
            </div>
        </nav>
        <div class="sidebar-bottom">
            <div class="nav-item logout-item" data-action="logout">
                <span class="nav-icon">🚪</span><span>${t('logout')}</span>
            </div>
        </div>
    `;

    sidebar.querySelectorAll('.nav-item').forEach((item) => {
        const target = item.dataset.target;
        const action = item.dataset.action;

        if (target) {
            item.addEventListener('click', () => {
                if (typeof navigateTo === 'function') {
                    navigateTo(target);
                } else {
                    window.location.href = target + '.html';
                }
            });
        }

        if (action === 'logout') {
            item.addEventListener('click', () => {
                if (typeof doLogout === 'function') {
                    doLogout();
                }
            });
        }
    });

    return sidebar;
}
