// tableTransaction.js
import { getFakeTransactions, getFakeCategories, getFakeBudgets, getFakeUsers } from '../api/usersApi.js';

// Helper to translate text safely
const t = (key) => window.langFR ? (window.langFR[key] || key) : key;
const fmtSafe = (v) => Number(v).toFixed(2);

// --- Data Fetchers ---
function getCategoryInfo(catId) {
    const cats = getFakeCategories();
    const cat = cats.find(c => c.id === catId);
    return cat || { name: 'Autre', color: 'var(--text-muted)' };
}

function getBudgetName(budgetId) {
    const budgets = getFakeBudgets();
    const budget = budgets.find(b => b.id === budgetId);
    return budget ? budget.name : 'Autre';
}

function getUserName(userId) {
    const users = getFakeUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Inconnu';
}

// --- HTML Generators ---
function createRowHTML(tx, CU) {
    const dateStr = new Date(tx.date).toLocaleDateString('fr-TN');
    const noteHTML = tx.notes ? `<div class="note-text">${tx.notes}</div>` : '';
    
    // Use layout.css colors dynamically based on category
    const cat = getCategoryInfo(tx.catId);
    const catBadge = `<span class="badge" style="color: ${cat.color}; border: 1px solid ${cat.color};">${cat.name}</span>`;
    
    const typeClass = tx.type === 'income' ? 'badge-income' : 'badge-expense';
    const typeLabel = tx.type === 'income' ? t('income') : t('expense');
    const typeBadge = `<span class="badge ${typeClass}">${typeLabel}</span>`;
    
    const budgetBadge = `<span class="badge" style="background:var(--color-12);color:var(--text-muted);font-size:11px">${getBudgetName(tx.dest)}</span>`;
    
    let userCell = '';
    if (CU.role === 'admin') {
        userCell = `<td><span class="pill" style="font-size:12px">${getUserName(tx.userId)}</span></td>`;
    }
    
    const amountColor = tx.type === 'income' ? 'var(--success)' : 'var(--danger)';
    const amountSign = tx.type === 'income' ? '+' : '−';
    const amountCell = `<td style="font-weight:600;color:${amountColor}">${amountSign}${fmtSafe(tx.amount)}</td>`;
    
    let actionsHTML = '<span class="text-muted">—</span>';
    if (tx.userId === CU.id || CU.role === 'admin') {
        actionsHTML = `
            <button class="icon-btn" onclick="editTx('${tx.id}')">✏️</button>
            <button class="icon-btn del" onclick="deleteTx('${tx.id}')">🗑️</button>
        `;
    }

    return `
        <tr>
            <td class="text-muted">${dateStr}</td>
            <td>${tx.desc}${noteHTML}</td>
            <td>${catBadge}</td>
            <td>${typeBadge}</td>
            <td>${budgetBadge}</td>
            ${userCell}
            ${amountCell}
            <td><div class="actions">${actionsHTML}</div></td>
        </tr>
    `;
}

// --- Main Render Function ---
export function renderTransactionsTable() {
  const catSel = document.getElementById('txFilterCat');
  
  // Populate category filter from fake API
  if (catSel && catSel.children.length <= 1) {
    const cats = getFakeCategories();
    catSel.innerHTML = '<option value="" data-translate="allCategories">Toutes catégories</option>' + 
        cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  const filterType = document.getElementById('txFilterType')?.value || '';
  const filterCat = document.getElementById('txFilterCat')?.value || '';
  const filterUser = document.getElementById('txFilterUser')?.value || '';
  
  let txs = getFakeTransactions().sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply filters
  if (filterType) txs = txs.filter(tx => tx.type === filterType);
  if (filterCat) txs = txs.filter(tx => tx.catId === filterCat);
  if (filterUser) txs = txs.filter(tx => tx.userId === filterUser);

  const txBody = document.getElementById('txBody');
  if (!txBody) return;

  const CU = window.CU || { role: 'admin', id: '1' };

  // Render Table Body
  if (txs.length > 0) {
      txBody.innerHTML = txs.map(tx => createRowHTML(tx, CU)).join('');
  } else {
      txBody.innerHTML = `<tr><td colspan="${CU.role === 'admin' ? 8 : 7}" class="empty-state" data-translate="noTransactions">Aucune transaction</td></tr>`;
  }
}

// Ensure the table renders and filters work on load
document.addEventListener('DOMContentLoaded', () => {
    ['txFilterType', 'txFilterCat', 'txFilterUser'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('change', renderTransactionsTable);
    });
    // initial render
    renderTransactionsTable();
});
