import { getFakeTransactions, getFakeCategories, getFakeBudgets, getFakeUsers, saveFakeTransactions } from '../api/usersApi.js';

const CU = window.CU || JSON.parse(sessionStorage.getItem('budgetcollab_user')) || { role: 'admin', id: '1' };
let editTxId = null;

function fmt(amount) {
    return Number(amount).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND';
}

function uid() {
    return 'tx_' + Date.now() + Math.random().toString(36).substr(2, 5);
}

function getCatName(id) {
    const c = getFakeCategories().find(c => c.id === id);
    return c ? c.name : '—';
}

function getCatColor(id) {
    const c = getFakeCategories().find(c => c.id === id);
    return c ? c.color : '#888';
}

function getUserName(id) {
    const u = getFakeUsers().find(u => u.id === id);
    return u ? u.name : '?';
}

function getBudgetName(destId) {
    if (destId === 'wallet') return '📱 Mon portefeuille';
    if (destId && destId.startsWith('budget-')) {
        const bid = destId.replace('budget-', '');
        const b = getFakeBudgets().find(b => b.id === bid);
        return b ? `🎯 ${b.name}` : '🎯 Budget';
    }
    return '—';
}

function getVisibleCats() {
    return getFakeCategories();
}

function getScopedTxs() {
    const all = getFakeTransactions();
    return CU.role === 'admin' ? all : all.filter(t => t.userId === CU.id);
}

function renderTransactions() {
    const subtitle = document.getElementById('txPageSubtitle');
    const title = document.getElementById('txPageTitle');
    const userFilter = document.getElementById('txFilterUser');
    const userHeader = document.getElementById('txUserHeader');
    if (CU.role === 'admin') {
        if (title) title.textContent = 'Toutes les transactions';
        if (subtitle) subtitle.textContent = '';
        if (userFilter) userFilter.style.display = 'inline-block';
        if (userHeader) userHeader.style.display = '';
        if (userFilter) {
            const prev = userFilter.value;
            userFilter.innerHTML = '<option value="">Tous les utilisateurs</option>' + getFakeUsers().map(u => `<option value="${u.id}">${u.name}</option>`).join('');
            if (prev) userFilter.value = prev;
        }
    } else {
        if (title) title.textContent = 'Mes transactions';
        if (subtitle) subtitle.textContent = 'Vous ne voyez que vos propres transactions';
        if (userFilter) userFilter.style.display = 'none';
        if (userHeader) userHeader.style.display = 'none';
    }

    const cats = getVisibleCats();
    const catSel = document.getElementById('txFilterCat');
    if (catSel) {
        const prev = catSel.value;
        catSel.innerHTML = '<option value="">Toutes catégories</option>' + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        if (prev) catSel.value = prev;
    }

    const filterType = document.getElementById('txFilterType')?.value || '';
    const filterCat = document.getElementById('txFilterCat')?.value || '';
    const filterUser = document.getElementById('txFilterUser')?.value || '';
    let txs = getScopedTxs().sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filterType) txs = txs.filter(t => t.type === filterType);
    if (filterCat) txs = txs.filter(t => t.catId === filterCat);
    if (filterUser) txs = txs.filter(t => t.userId === filterUser);

    const txBody = document.getElementById('txBody');
    if (!txBody) return;

    const colCount = CU.role === 'admin' ? 8 : 7;
    txBody.innerHTML = txs.length ? txs.map(t => {
        const catColor = getCatColor(t.catId);
        return `<tr>
            <td class="text-muted">${new Date(t.date).toLocaleDateString('fr-TN')}</td>
            <td>${t.desc}${t.notes ? `<div class="note-text">${t.notes}</div>` : ''}</td>
            <td><span class="badge" style="background:${catColor}22;color:${catColor}">${getCatName(t.catId)}</span></td>
            <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Revenu' : 'Dépense'}</span></td>
            <td><span class="badge" style="background:rgba(255,255,255,0.08);color:var(--text-muted);font-size:11px">${getBudgetName(t.dest)}</span></td>
            ${CU.role === 'admin' ? `<td><span class="pill" style="font-size:12px">${getUserName(t.userId)}</span></td>` : ''}
            <td style="font-weight:600;color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</td>
            <td><div class="actions">
                ${(t.userId === CU.id || CU.role === 'admin') ? `<button class="icon-btn" onclick="editTx('${t.id}')">✏️</button><button class="icon-btn del" onclick="deleteTx('${t.id}')">🗑️</button>` : '<span class="text-muted">—</span>'}
            </div></td>
        </tr>`;
    }).join('') : `<tr><td colspan="${colCount}" class="empty-state">Aucune transaction</td></tr>`;
}

function openTxModal(id) {
    editTxId = id || null;
    const cats = getVisibleCats();
    document.getElementById('txCat').innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const budgets = getFakeBudgets().filter(b => CU.role === 'admin' || b.userId === CU.id);
    let destHTML = '<option value="wallet">📱 Mon portefeuille</option>';
    destHTML += budgets.map(b => `<option value="budget-${b.id}">🎯 ${b.name}</option>`).join('');
    document.getElementById('txDest').innerHTML = destHTML;

    if (id) {
        const tx = getFakeTransactions().find(t => t.id === id);
        if (!tx) return;
        document.getElementById('txModalTitle').textContent = 'Modifier la transaction';
        document.getElementById('txType').value = tx.type;
        document.getElementById('txDesc').value = tx.desc;
        document.getElementById('txAmount').value = tx.amount;
        document.getElementById('txDate').value = tx.date;
        document.getElementById('txDest').value = tx.dest || 'wallet';
        document.getElementById('txCat').value = tx.catId || cats[0]?.id || '';
        document.getElementById('txNotes').value = tx.notes || '';
    } else {
        document.getElementById('txModalTitle').textContent = 'Ajouter une transaction';
        document.getElementById('txType').value = 'expense';
        document.getElementById('txDesc').value = '';
        document.getElementById('txAmount').value = '';
        document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('txDest').value = 'wallet';
        document.getElementById('txCat').value = cats[0]?.id || '';
        document.getElementById('txNotes').value = '';
    }
    syncTxTypeToDestination();
    document.getElementById('txModal').classList.add('open');
}

function syncTxTypeToDestination() {
    const dest = document.getElementById('txDest').value;
    const typeEl = document.getElementById('txType');
    if (dest && dest.startsWith('budget-')) {
        typeEl.value = 'expense';
        typeEl.disabled = true;
    } else {
        typeEl.disabled = false;
    }
}

function saveTx() {
    let type = document.getElementById('txType').value;
    const desc = document.getElementById('txDesc').value.trim();
    const amount = parseFloat(document.getElementById('txAmount').value);
    const date = document.getElementById('txDate').value;
    const catId = document.getElementById('txCat').value;
    const notes = document.getElementById('txNotes').value.trim();
    const dest = document.getElementById('txDest').value;
    if (!desc || !amount || !date || !dest) return;
    if (dest && dest.startsWith('budget-')) type = 'expense';
    let txs = getFakeTransactions();
    if (editTxId) {
        txs = txs.map(t => t.id === editTxId ? { ...t, type, desc, amount, date, catId, notes, dest } : t);
    } else {
        txs.push({ id: uid(), userId: CU.id, type, desc, amount, date, catId, notes, dest });
    }
    saveFakeTransactions(txs);
    closeModal('txModal');
    renderTransactions();
}

function editTx(id) { openTxModal(id); }

function deleteTx(id) {
    if (!confirm('Supprimer cette transaction ?')) return;
    const txs = getFakeTransactions().filter(t => t.id !== id);
    saveFakeTransactions(txs);
    renderTransactions();
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

window.openTxModal = openTxModal;
window.closeModal = closeModal;
window.saveTx = saveTx;
window.editTx = editTx;
window.deleteTx = deleteTx;
window.syncTxTypeToDestination = syncTxTypeToDestination;
window.renderTransactions = renderTransactions;

document.addEventListener('DOMContentLoaded', () => {
    renderTransactions();
});
