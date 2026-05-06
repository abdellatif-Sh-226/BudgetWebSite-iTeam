// Budgets Logic
function loadBudgets() {
  if (!CU) return;
  document.getElementById('sidebarAvatar').textContent = CU.name.charAt(0).toUpperCase();
  document.getElementById('sidebarName').textContent = CU.name;
  document.getElementById('sidebarRoleBadge').innerHTML = CU.role === 'admin'
    ? '<span class="role-badge-admin">👑 Admin</span>'
    : '<span class="role-badge-user">👤 Utilisateur</span>';

  populateBudgetCategories();
  renderBudgets();
}

function populateBudgetCategories() {
  const categories = DB.get('categories') || [];
  const select = document.getElementById('budgetCat');
  if (!select) return;
  select.innerHTML = '<option value="">Toutes catégories</option>' +
    categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

function renderBudgets() {
  const budgets = (DB.get('budgets') || []).filter(b => CU.role === 'admin' || b.userId === CU.id);
  const grid = document.getElementById('budgetsGrid');
  const noBudgets = document.getElementById('noBudgets');
  if (!grid || !noBudgets) return;

  if (budgets.length === 0) {
    grid.innerHTML = '';
    noBudgets.style.display = 'block';
    return;
  }

  noBudgets.style.display = 'none';
  grid.innerHTML = budgets.map(budget => {
    const spent = calculateBudgetSpent(budget);
    const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    const status = percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'success';

    return `
      <div class="budget-card">
        <div class="budget-header">
          <h3>${budget.name}</h3>
          <div class="budget-actions">
            <button class="btn btn-sm btn-secondary" onclick="editBudget(${budget.id})">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteBudget(${budget.id})">🗑️</button>
          </div>
        </div>
        <div class="budget-progress">
          <div class="progress-bar">
            <div class="progress-fill ${status}" style="width:${Math.min(percentage, 100)}%"></div>
          </div>
          <div class="progress-text">
            <span class="spent">${fmt(spent)}</span>
            <span class="separator">/</span>
            <span class="limit">${fmt(budget.limit)}</span>
          </div>
        </div>
        <div class="budget-details">
          <div class="budget-detail">
            <span class="label">Restant:</span>
            <span class="value ${status}">${fmt(Math.max(budget.limit - spent, 0))}</span>
          </div>
          <div class="budget-detail">
            <span class="label">Pourcentage:</span>
            <span class="value ${status}">${percentage.toFixed(1)}%</span>
          </div>
          <div class="budget-detail">
            <span class="label">Période:</span>
            <span class="value">${getPeriodLabel(budget.period)}</span>
          </div>
          ${budget.catId ? `<div class="budget-detail"><span class="label">Catégorie:</span><span class="value">${getCatName(budget.catId)}</span></div>` : ''}
        </div>
      </div>`;
  }).join('');
}

function calculateBudgetSpent(budget) {
  const transactions = DB.get('transactions') || [];
  const now = new Date();
  let startDate;

  switch (budget.period) {
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return transactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= startDate && (!budget.catId || t.categoryId === budget.catId))
    .reduce((sum, t) => sum + t.amount, 0);
}

function getPeriodLabel(period) {
  const labels = {
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    yearly: 'Annuel'
  };
  return labels[period] || 'Mensuel';
}

function openBudgetModal(budgetId = null) {
  const modal = document.getElementById('budgetModal');
  const title = modal?.querySelector('.modal-title');
  const saveBtn = modal?.querySelector('button[onclick="saveBudget()"]');
  if (!modal || !title || !saveBtn) return;

  populateBudgetCategories();

  if (budgetId) {
    const budget = (DB.get('budgets') || []).find(b => b.id === budgetId);
    if (budget) {
      document.getElementById('budgetName').value = budget.name;
      document.getElementById('budgetLimit').value = budget.limit;
      document.getElementById('budgetCat').value = budget.catId || '';
      document.getElementById('budgetPeriod').value = budget.period || 'monthly';
      document.getElementById('budgetNotes').value = budget.notes || '';
      title.textContent = 'Modifier le budget';
      saveBtn.setAttribute('data-edit-id', budgetId);
    }
  } else {
      document.getElementById('budgetName').value = '';
      document.getElementById('budgetLimit').value = '';
      document.getElementById('budgetCat').value = '';
      document.getElementById('budgetPeriod').value = 'monthly';
      document.getElementById('budgetNotes').value = '';
      title.textContent = 'Créer un budget';
      saveBtn.removeAttribute('data-edit-id');
  }

  modal.style.display = 'flex';
}

function saveBudget() {
  const name = document.getElementById('budgetName').value.trim();
  const limit = parseFloat(document.getElementById('budgetLimit').value);
  const catId = document.getElementById('budgetCat').value;
  const period = document.getElementById('budgetPeriod').value;
  const notes = document.getElementById('budgetNotes').value.trim();

  if (!name || !limit) {
    alert('Veuillez remplir le nom et la limite');
    return;
  }

  const budgets = DB.get('budgets') || [];
  const saveBtn = document.querySelector('button[onclick="saveBudget()"]');
  const editId = saveBtn?.getAttribute('data-edit-id');

  if (editId) {
    const index = budgets.findIndex(b => b.id === parseInt(editId, 10));
    if (index !== -1) {
      budgets[index] = { ...budgets[index], name, limit, catId: catId || null, period, notes };
    }
  } else {
    budgets.push({
      id: Date.now(),
      name,
      limit,
      catId: catId || null,
      period,
      notes,
      userId: CU.id
    });
  }

  DB.set('budgets', budgets);
  closeModal('budgetModal');
  renderBudgets();
}

function editBudget(budgetId) {
  openBudgetModal(budgetId);
}

function deleteBudget(budgetId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) return;
  DB.set('budgets', (DB.get('budgets') || []).filter(b => b.id !== budgetId));
  renderBudgets();
}
