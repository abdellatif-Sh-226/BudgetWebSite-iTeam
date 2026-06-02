import { getFakeTransactions, getFakeCategories, getFakeUsers } from '../api/usersApi.js';

const CU = window.CU || JSON.parse(sessionStorage.getItem('budgetcollab_user')) || { role: 'admin', id: '1' };
let sharedMembers = [];
let editingSharedId = null;

function fmt(amount) {
    return Number(amount).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND';
}

function uid() {
    return 'shared_' + Date.now() + Math.random().toString(36).substr(2, 5);
}

function getUserName(id) {
    const u = getFakeUsers().find(u => u.id === id);
    return u ? u.name : '?';
}

function getGroupCats(groupId) {
    return (getFakeCategories() || []).filter(c => c.groupId === groupId);
}

function getSharedDB() {
    const data = localStorage.getItem('budgetcollab_shared');
    return data ? JSON.parse(data) : [];
}

function saveSharedDB(list) {
    localStorage.setItem('budgetcollab_shared', JSON.stringify(list));
}

function renderShared() {
    const all = getSharedDB();
    const users = getFakeUsers();
    const txs = getFakeTransactions();
    const mine = CU.role === 'admin' ? all : all.filter(s => s.members.includes(CU.id));

    document.getElementById('sharedSubtitle').textContent = CU.role === 'admin'
        ? 'Tous les budgets partagés'
        : 'Les budgets dont vous faites partie';

    document.getElementById('sharedList').innerHTML = mine.length ? mine.map(s => {
        const members = s.members.map(id => users.find(u => u.id === id)).filter(Boolean);
        const spent = txs.filter(t => s.members.includes(t.userId) && t.type === 'expense' && t.dest === `group-${s.id}`).reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const pct = Math.min((spent / (s.limit || 1)) * 100, 100);
        const color = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--success)';
        const recentTxs = txs.filter(t => s.members.includes(t.userId) && t.dest === `group-${s.id}`).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
        const isOwner = s.ownerId === CU.id;

        return `<div class="section" style="margin-bottom:20px">
            <div class="section-header">
                <div>
                    <div class="section-title">👥 ${s.name}</div>
                    <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${s.desc || ''}</div>
                    ${s.locked ? '<div style="font-size:12px;color:var(--warning);margin-top:6px">🔒 Groupe verrouillé</div>' : ''}
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                    ${(isOwner || CU.role === 'admin') ? `<button class="icon-btn" onclick="openSharedModal('${s.id}')">✏️</button>` : ''}
                    ${(isOwner || CU.role === 'admin') ? `<button class="icon-btn del" onclick="deleteShared('${s.id}')">🗑️</button>` : ''}
                </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
                ${members.map(m => `<span class="pill"><span class="avatar" style="width:22px;height:22px;font-size:10px;display:inline-flex">${m.name.charAt(0)}</span>${m.name}${m.id === s.ownerId ? '<span style="color:var(--accent);font-size:10px">★</span>' : ''}</span>`).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
                <span style="color:var(--text-muted)">Dépensé ensemble: <strong style="color:${color}">${fmt(spent)}</strong></span>
                <span style="color:var(--text-muted)">Plafond: <strong>${fmt(s.limit || 0)}</strong></span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
            ${recentTxs.length ? `<div style="margin-top:16px;font-size:12px;color:var(--text-muted);margin-bottom:8px">Transactions du groupe :</div>
            ${recentTxs.map(t => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${getUserName(t.userId)} · ${t.desc}</span><span style="color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</span></div>`).join('')}` : ''}
        </div>`;
    }).join('') : '<div class="section"><div class="empty-state">Aucun budget partagé</div></div>';
}

function openSharedModal(id) {
    editingSharedId = id || null;
    const titleEl = document.getElementById('sharedModalTitle');
    if (id) {
        const all = getSharedDB();
        const shared = all.find(s => s.id === id);
        if (!shared || (shared.ownerId !== CU.id && CU.role !== 'admin')) return;
        titleEl.textContent = 'Modifier le budget partagé';
        document.getElementById('sharedName').value = shared.name;
        document.getElementById('sharedDesc').value = shared.desc || '';
        document.getElementById('sharedLimit').value = shared.limit;
        sharedMembers = [...shared.members];
    } else {
        titleEl.textContent = 'Créer un budget partagé';
        document.getElementById('sharedName').value = '';
        document.getElementById('sharedDesc').value = '';
        document.getElementById('sharedLimit').value = '';
        sharedMembers = [CU.id];
    }
    document.getElementById('sharedMemberEmail').value = '';
    renderSharedMembersUI();
    document.getElementById('sharedModal').classList.add('open');
}

function addSharedMember() {
    const email = document.getElementById('sharedMemberEmail').value.trim();
    const users = getFakeUsers();
    const u = users.find(u => u.email === email);
    if (!u) { alert('Utilisateur introuvable'); return; }
    if (sharedMembers.includes(u.id)) { alert('Déjà ajouté'); return; }
    sharedMembers.push(u.id);
    document.getElementById('sharedMemberEmail').value = '';
    renderSharedMembersUI();
}

function renderSharedMembersUI() {
    const users = getFakeUsers();
    document.getElementById('sharedMembersList').innerHTML = sharedMembers.map(id => {
        const u = users.find(u => u.id === id);
        return `<span class="pill">${u?.name || id}${id !== CU.id ? `<span style="cursor:pointer;color:var(--danger);margin-left:4px" onclick="removeSharedMember('${id}')">×</span>` : ' (vous)'}</span>`;
    }).join('');
}

function removeSharedMember(id) {
    sharedMembers = sharedMembers.filter(m => m !== id);
    renderSharedMembersUI();
}

function saveShared() {
    const name = document.getElementById('sharedName').value.trim();
    const desc = document.getElementById('sharedDesc').value.trim();
    const limit = parseFloat(document.getElementById('sharedLimit').value) || 0;
    if (!name || sharedMembers.length === 0) return;
    const all = getSharedDB();
    if (editingSharedId) {
        saveSharedDB(all.map(s => s.id === editingSharedId ? { ...s, name, desc, limit, members: [...sharedMembers], locked: true } : s));
    } else {
        all.push({ id: uid(), ownerId: CU.id, name, desc, limit, members: [...sharedMembers], createdAt: new Date().toISOString(), locked: true });
        saveSharedDB(all);
    }
    editingSharedId = null;
    closeModal('sharedModal');
    renderShared();
}

function deleteShared(id) {
    if (!confirm('Supprimer ce budget partagé ?')) return;
    saveSharedDB(getSharedDB().filter(s => s.id !== id));
    renderShared();
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

window.openSharedModal = openSharedModal;
window.closeModal = closeModal;
window.addSharedMember = addSharedMember;
window.removeSharedMember = removeSharedMember;
window.saveShared = saveShared;
window.deleteShared = deleteShared;

document.addEventListener('DOMContentLoaded', renderShared);
