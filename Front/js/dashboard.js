import { getFakeTransactions, getFakeCategories, getFakeBudgets, getFakeUsers } from '../api/usersApi.js';

const CU = window.CU || JSON.parse(sessionStorage.getItem('budgetcollab_user')) || { role: 'admin', id: '1' };
let pieCI = null;
let lineCI = null;

function fmt(amount) {
    return Number(amount).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND';
}

function getScopedTxs() {
    const txs = getFakeTransactions();
    return CU.role === 'admin' ? txs : txs.filter(t => t.userId === CU.id);
}

function getCategoryInfo(catId) {
    const cats = getFakeCategories();
    return cats.find(c => c.id === catId) || { name: 'Autre', color: 'var(--text-muted)' };
}

function getUserName(userId) {
    const users = getFakeUsers();
    const u = users.find(u => u.id === userId);
    return u ? u.name : 'Inconnu';
}

function resolveColor(colorStr) {
    if (colorStr && colorStr.startsWith('var(')) {
        const varName = colorStr.substring(4, colorStr.length - 1).trim();
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#6c757d';
    }
    return colorStr || '#6c757d';
}

function renderDashboard() {
    const now = new Date();
    const dateEl = document.getElementById('dashDate');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('fr-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const roleEl = document.getElementById('dashRoleInfo');
    if (roleEl) {
        roleEl.innerHTML = CU.role === 'admin'
            ? '<span class="role-badge-admin">👑 Admin — vue globale</span>'
            : '<span class="role-badge-user">👤 Vos données uniquement</span>';
    }

    const txs = getScopedTxs();
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
    const balance = income - expense;
    const savingRate = income > 0 ? ((balance / income) * 100).toFixed(0) : 0;

    const cardsEl = document.getElementById('dashCards');
    if (cardsEl) {
        cardsEl.innerHTML = `
            <div class="card"><div class="card-label">Total revenus</div><div class="card-value success">${fmt(income)}</div></div>
            <div class="card"><div class="card-label">Total dépenses</div><div class="card-value danger">${fmt(expense)}</div></div>
            <div class="card"><div class="card-label">Solde</div><div class="card-value ${balance >= 0 ? 'success' : 'danger'}">${fmt(balance)}</div></div>
            <div class="card"><div class="card-label">Taux d'épargne</div><div class="card-value ${savingRate >= 20 ? 'success' : savingRate >= 0 ? 'warning' : 'danger'}">${savingRate}%</div></div>`;
    }

    const myBudgets = getFakeBudgets().filter(b => b.userId === CU.id);
    const myTxs = CU.role === 'admin' ? txs : getFakeTransactions().filter(t => t.userId === CU.id);
    let alerts = '';
    myBudgets.forEach(b => {
        const spent = myTxs
            .filter(t => t.type === 'expense' && t.dest === `budget-${b.id}` && (!b.catId || t.catId === b.catId))
            .reduce((s, t) => s + parseFloat(t.amount), 0);
        if (b.limit > 0) {
            const pct = (spent / parseFloat(b.limit)) * 100;
            if (pct >= 100) alerts += `<div class="alert alert-danger"><span class="alert-icon">⚠️</span><div><strong>Budget "${b.name}" dépassé !</strong><br>${fmt(spent)} / ${fmt(b.limit)} (${pct.toFixed(0)}%)</div></div>`;
            else if (pct >= 80) alerts += `<div class="alert alert-warning"><span class="alert-icon">⚡</span><div><strong>Budget "${b.name}" proche de la limite</strong><br>${fmt(spent)} / ${fmt(b.limit)} (${pct.toFixed(0)}%)</div></div>`;
        }
    });
    const alertsEl = document.getElementById('dashAlerts');
    if (alertsEl) {
        alertsEl.innerHTML = alerts;
        alertsEl.style.display = alerts ? 'block' : 'none';
    }

    const cats = getFakeCategories();
    const expByCat = cats
        .map(c => ({ name: c.name, color: c.color, total: txs.filter(t => t.type === 'expense' && t.catId === c.id).reduce((s, t) => s + parseFloat(t.amount), 0) }))
        .filter(c => c.total > 0);

    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        if (pieCI) pieCI.destroy();
        pieCI = new Chart(pieCtx, {
            type: 'doughnut',
            data: { labels: expByCat.map(c => c.name), datasets: [{ data: expByCat.map(c => c.total), backgroundColor: expByCat.map(c => resolveColor(c.color)), borderWidth: 0 }] },
            options: { plugins: { legend: { labels: { color: '#e0e0e0', font: { size: 11 } } } }, cutout: '65%', responsive: true, maintainAspectRatio: false }
        });
    }

    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({ label: d.toLocaleDateString('fr-TN', { month: 'short' }), y: d.getFullYear(), m: d.getMonth() });
    }
    const iByM = months.map(m => txs.filter(t => t.type === 'income' && new Date(t.date).getMonth() === m.m && new Date(t.date).getFullYear() === m.y).reduce((s, t) => s + parseFloat(t.amount), 0));
    const eByM = months.map(m => txs.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === m.m && new Date(t.date).getFullYear() === m.y).reduce((s, t) => s + parseFloat(t.amount), 0));

    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
        if (lineCI) lineCI.destroy();
        lineCI = new Chart(lineCtx, {
            type: 'line',
            data: { labels: months.map(m => m.label), datasets: [
                { label: 'Revenus', data: iByM, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)', tension: .4, fill: true },
                { label: 'Dépenses', data: eByM, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)', tension: .4, fill: true }
            ] },
            options: { plugins: { legend: { labels: { color: '#e0e0e0', font: { size: 11 } } } }, scales: { x: { ticks: { color: '#8892b0' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#8892b0' }, grid: { color: 'rgba(255,255,255,0.05)' } } }, responsive: true, maintainAspectRatio: false }
        });
    }

    const recent = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
    const userHeader = document.getElementById('userHeader');
    if (userHeader) userHeader.style.display = CU.role === 'admin' ? '' : 'none';

    const txBody = document.getElementById('dashTxBody');
    if (txBody) {
        txBody.innerHTML = recent.map(t => {
            const cat = getCategoryInfo(t.catId);
            const catColor = resolveColor(cat.color);
            const userCell = CU.role === 'admin' ? `<td><span class="pill" style="font-size:12px">${getUserName(t.userId)}</span></td>` : '';
            return `<tr>
                <td class="text-muted">${new Date(t.date).toLocaleDateString('fr-TN')}</td>
                <td>${t.desc}${t.notes ? `<div class="note-text">${t.notes}</div>` : ''}</td>
                <td><span class="badge" style="background:${catColor}22;color:${catColor}">${cat.name}</span></td>
                ${userCell}
                <td style="font-weight:600;color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</td>
            </tr>`;
        }).join('') || `<tr><td colspan="${CU.role === 'admin' ? 5 : 4}" class="empty-state">Aucune transaction</td></tr>`;
    }
}

function openProfileModal() {
    document.getElementById('profName').value = CU.name;
    document.getElementById('profEmail').value = CU.email || '';
    document.getElementById('profMsg').textContent = '';
    document.getElementById('profMsg').style.color = '';
    document.getElementById('profileModal').classList.add('open');
}

function saveProfile() {
    const name = document.getElementById('profName').value.trim();
    const email = document.getElementById('profEmail').value.trim();
    const msg = document.getElementById('profMsg');
    if (!name || !email) {
        msg.textContent = 'Nom et email requis.';
        msg.style.color = 'var(--danger)';
        return;
    }
    CU.name = name;
    CU.email = email;
    window.CU = CU;
    sessionStorage.setItem('budgetcollab_user', JSON.stringify(CU));
    const avatar = document.getElementById('sidebarAvatar');
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
    const sName = document.getElementById('sidebarName');
    if (sName) sName.textContent = name;
    msg.textContent = 'Profil mis à jour !';
    msg.style.color = 'var(--success)';
    setTimeout(() => closeModal('profileModal'), 1000);
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

window.openProfileModal = openProfileModal;
window.saveProfile = saveProfile;
window.closeModal = closeModal;

document.addEventListener('DOMContentLoaded', () => {
    if (window.CU) CU.name = window.CU.name;
    const avatar = document.getElementById('sidebarAvatar');
    if (avatar && CU.name) avatar.textContent = CU.name.charAt(0).toUpperCase();
    const sName = document.getElementById('sidebarName');
    if (sName && CU.name) sName.textContent = CU.name;
    renderDashboard();
});
