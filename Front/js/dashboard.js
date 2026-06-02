// dashboard.js
import { getFakeTransactions, getFakeCategories, getFakeBudgets, getFakeUsers } from '../api/usersApi.js';

// Setup current user context - matches window.CU or defaults to admin
const CU = window.CU || { role: 'admin', id: '1' };

let pieCI = null;
let lineCI = null;

// Currency Formatter for Tunisian Dinars (TND)
function fmt(amount) {
    return Number(amount).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND';
}

// Scoping logic: admin sees everything, user sees their own transactions
function getScopedTxs() {
    const txs = getFakeTransactions();
    if (CU.role === 'admin') {
        return txs;
    }
    return txs.filter(t => t.userId === CU.id);
}

function getCategoryInfo(catId) {
    const cats = getFakeCategories();
    const cat = cats.find(c => c.id === catId);
    return cat || { name: 'Autre', color: 'var(--text-muted)' };
}

function getUserName(userId) {
    const users = getFakeUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Inconnu';
}

// Helper to resolve CSS variable colors to hex colors dynamically for Chart.js
function resolveColor(colorStr) {
    if (colorStr && colorStr.startsWith('var(')) {
        const varName = colorStr.substring(4, colorStr.length - 1).trim();
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#6c757d';
    }
    return colorStr || '#6c757d';
}

// Translate page elements with data-translate attribute using langFR
function translatePage() {
    const lang = window.langFR || {};
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (lang[key]) {
            el.textContent = lang[key];
        }
    });
}

function renderDashboard() {
    // 1. Render date and user role info
    const now = new Date();
    const dateEl = document.getElementById('dashDate');
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('fr-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    const roleEl = document.getElementById('dashRoleInfo');
    if (roleEl) {
        roleEl.innerHTML = CU.role === 'admin'
            ? '<span class="role-badge-admin">👑 Admin — vue globale</span>'
            : '<span class="role-badge-user">👤 Vos données uniquement</span>';
    }

    // Get scoped transactions
    const txs = getScopedTxs();

    // 2. Compute main KPI values
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
    const balance = income - expense;
    const savingRate = income > 0 ? ((balance / income) * 100).toFixed(0) : 0;

    // 3. Render Cards
    const cardsEl = document.getElementById('dashCards');
    if (cardsEl) {
        cardsEl.innerHTML = `
            <div class="stat-card income-card">
                <div class="stat-card-icon">📥</div>
                <div class="stat-card-content">
                    <div class="stat-card-label">Total revenus</div>
                    <div class="stat-card-value text-success">${fmt(income)}</div>
                </div>
            </div>
            <div class="stat-card expense-card">
                <div class="stat-card-icon">📤</div>
                <div class="stat-card-content">
                    <div class="stat-card-label">Total dépenses</div>
                    <div class="stat-card-value text-danger">${fmt(expense)}</div>
                </div>
            </div>
            <div class="stat-card balance-card">
                <div class="stat-card-icon">${balance >= 0 ? '⚖️' : '⚠️'}</div>
                <div class="stat-card-content">
                    <div class="stat-card-label">Solde</div>
                    <div class="stat-card-value ${balance >= 0 ? 'text-success' : 'text-danger'}">${fmt(balance)}</div>
                </div>
            </div>
            <div class="stat-card savings-card">
                <div class="stat-card-icon">🐷</div>
                <div class="stat-card-content">
                    <div class="stat-card-label">Taux d'épargne</div>
                    <div class="stat-card-value ${savingRate >= 20 ? 'text-success' : savingRate >= 0 ? 'text-warning' : 'text-danger'}">${savingRate}%</div>
                </div>
            </div>
        `;
    }

    // 4. Budget alert calculations (for the current month)
    const myBudgets = getFakeBudgets().filter(b => b.userId === CU.id);
    const myTxs = CU.role === 'admin' ? txs : getFakeTransactions().filter(t => t.userId === CU.id);
    let alerts = '';
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    myBudgets.forEach(b => {
        const spent = myTxs
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && 
                       (t.dest === b.id || t.dest === `budget-${b.id}`) && 
                       (!b.catId || t.catId === b.catId) &&
                       tDate.getMonth() === currentMonth &&
                       tDate.getFullYear() === currentYear;
            })
            .reduce((s, t) => s + parseFloat(t.amount), 0);

        if (b.limit > 0) {
            const pct = (spent / parseFloat(b.limit)) * 100;
            if (pct >= 100) {
                alerts += `
                    <div class="alert alert-danger">
                        <span class="alert-icon">⚠️</span>
                        <div class="alert-content">
                            <strong>Budget "${b.name}" dépassé !</strong>
                            <span>Dépenses : ${fmt(spent)} sur un maximum de ${fmt(b.limit)} (${pct.toFixed(0)}%)</span>
                        </div>
                    </div>`;
            } else if (pct >= 80) {
                alerts += `
                    <div class="alert alert-warning">
                        <span class="alert-icon">⚡</span>
                        <div class="alert-content">
                            <strong>Budget "${b.name}" proche de la limite</strong>
                            <span>Dépenses : ${fmt(spent)} sur un maximum de ${fmt(b.limit)} (${pct.toFixed(0)}%)</span>
                        </div>
                    </div>`;
            }
        }
    });

    const alertsEl = document.getElementById('dashAlerts');
    if (alertsEl) {
        alertsEl.innerHTML = alerts;
        alertsEl.style.display = alerts ? 'flex' : 'none';
    }

    // Get color themes dynamically from CSS variable tokens
    const colorText = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#212529';
    const colorTextMuted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#6c757d';
    const colorBorder = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#dee2e6';
    const colorSuccess = getComputedStyle(document.documentElement).getPropertyValue('--success').trim() || '#28a745';
    const colorDanger = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#dc3545';

    // 5. Pie / Doughnut Chart: Expenses by Category
    const cats = getFakeCategories();
    const expByCat = cats
        .map(c => ({ 
            name: c.name, 
            color: c.color, 
            total: txs.filter(t => t.type === 'expense' && t.catId === c.id).reduce((s, t) => s + parseFloat(t.amount), 0) 
        }))
        .filter(c => c.total > 0);

    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        if (pieCI) pieCI.destroy();
        pieCI = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: expByCat.map(c => c.name),
                datasets: [{
                    data: expByCat.map(c => c.total),
                    backgroundColor: expByCat.map(c => resolveColor(c.color)),
                    borderWidth: 2,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff'
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colorText,
                            font: { family: 'inherit', size: 12, weight: '500' },
                            padding: 15
                        }
                    },
                    tooltip: {
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                cutout: '70%',
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // 6. Line Chart: 6 Months evolution
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1); // avoid end of month overflow
        d.setMonth(d.getMonth() - i);
        months.push({ label: d.toLocaleDateString('fr-TN', { month: 'short' }), y: d.getFullYear(), m: d.getMonth() });
    }

    const iByM = months.map(m => txs
        .filter(t => t.type === 'income' && new Date(t.date).getMonth() === m.m && new Date(t.date).getFullYear() === m.y)
        .reduce((s, t) => s + parseFloat(t.amount), 0)
    );
    const eByM = months.map(m => txs
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === m.m && new Date(t.date).getFullYear() === m.y)
        .reduce((s, t) => s + parseFloat(t.amount), 0)
    );

    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
        if (lineCI) lineCI.destroy();
        lineCI = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: months.map(m => m.label),
                datasets: [
                    {
                        label: 'Revenus',
                        data: iByM,
                        borderColor: colorSuccess,
                        backgroundColor: colorSuccess + '1a',
                        tension: 0.35,
                        fill: true,
                        borderWidth: 3,
                        pointBackgroundColor: colorSuccess,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Dépenses',
                        data: eByM,
                        borderColor: colorDanger,
                        backgroundColor: colorDanger + '1a',
                        tension: 0.35,
                        fill: true,
                        borderWidth: 3,
                        pointBackgroundColor: colorDanger,
                        pointHoverRadius: 7
                    }
                ]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colorText,
                            font: { family: 'inherit', size: 12, weight: '500' },
                            padding: 15
                        }
                    },
                    tooltip: {
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        ticks: { color: colorTextMuted, font: { family: 'inherit' } },
                        grid: { color: colorBorder + '1f', drawBorder: false }
                    },
                    y: {
                        ticks: { color: colorTextMuted, font: { family: 'inherit' } },
                        grid: { color: colorBorder + '1f', drawBorder: false }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // 7. Recent Transactions list (max 6)
    const recent = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
    const userHeader = document.getElementById('userHeader');
    if (userHeader) {
        userHeader.style.display = CU.role === 'admin' ? '' : 'none';
    }

    const txBody = document.getElementById('dashTxBody');
    if (txBody) {
        txBody.innerHTML = recent.map(t => {
            const cat = getCategoryInfo(t.catId);
            // Create category badge style with opacity background and borders
            const catColorResolved = resolveColor(cat.color);
            const catBadge = `<span class="badge" style="color: ${catColorResolved}; border: 1px solid ${catColorResolved}; background: ${catColorResolved}11;">${cat.name}</span>`;
            const userCell = CU.role === 'admin' ? `<td><span class="pill" style="font-size: 12px">${getUserName(t.userId)}</span></td>` : '';
            const amountColor = t.type === 'income' ? 'var(--success)' : 'var(--danger)';
            const amountSign = t.type === 'income' ? '+' : '−';

            return `
                <tr>
                    <td class="text-muted">${new Date(t.date).toLocaleDateString('fr-TN')}</td>
                    <td><strong>${t.desc}</strong>${t.notes ? `<div class="note-text">${t.notes}</div>` : ''}</td>
                    <td>${catBadge}</td>
                    ${userCell}
                    <td style="font-weight: 600; color: ${amountColor}">${amountSign}${fmt(t.amount)}</td>
                </tr>`;
        }).join('') || `<tr><td colspan="${CU.role === 'admin' ? 5 : 4}" class="empty-state">Aucune transaction</td></tr>`;
    }
}

// Run translations and initial rendering on page load
document.addEventListener('DOMContentLoaded', () => {
    translatePage();
    renderDashboard();
});
