// Dashboard Logic
let pieCI = null;
let lineCI = null;

function loadDashboard() {
  if (CU) {
    document.getElementById('sidebarAvatar').textContent = CU.name.charAt(0).toUpperCase();
    document.getElementById('sidebarName').textContent = CU.name;
    document.getElementById('sidebarRoleBadge').innerHTML = CU.role === 'admin'
      ? '<span class="role-badge-admin">👑 Admin</span>'
      : '<span class="role-badge-user">👤 Utilisateur</span>';

    document.getElementById('dashDate').textContent = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    loadDashboardCards();
    loadRecentTransactions();
    loadCharts();
  }
}

function loadDashboardCards() {
  const transactions = (DB.get('transactions') || []).filter(t => t.userId === CU.id);
  const totalBalance = transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
  const monthlyIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const cardsHtml = `
    <div class="card">
      <div class="card-label">Solde total</div>
      <div class="card-value ${totalBalance >= 0 ? 'success' : 'danger'}">${fmt(totalBalance)}</div>
    </div>
    <div class="card">
      <div class="card-label">Revenus</div>
      <div class="card-value success">${fmt(monthlyIncome)}</div>
    </div>
    <div class="card">
      <div class="card-label">Dépenses</div>
      <div class="card-value danger">${fmt(monthlyExpenses)}</div>
    </div>
  `;

  document.getElementById('dashCards').innerHTML = cardsHtml;
}

function loadRecentTransactions() {
  const transactions = (DB.get('transactions') || []).filter(t => t.userId === CU.id).slice(-5).reverse();
  const tbody = document.getElementById('dashTxBody');

  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Aucune transaction récente</td></tr>';
    return;
  }

  tbody.innerHTML = transactions.map(t => `
    <tr>
      <td>${new Date(t.date).toLocaleDateString('fr-FR')}</td>
      <td>${t.description}</td>
      <td>${getCatName(t.categoryId)}</td>
      <td class="${t.type === 'income' ? 'success' : 'danger'}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</td>
    </tr>
  `).join('');
}

function loadCharts() {
  const transactions = (DB.get('transactions') || []).filter(t => t.userId === CU.id);

  // Pie chart for expense categories
  const expenseByCat = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const catName = getCatName(t.categoryId);
    expenseByCat[catName] = (expenseByCat[catName] || 0) + t.amount;
  });

  const pieCtx = document.getElementById('pieChart').getContext('2d');
  if (pieCI) pieCI.destroy();
  pieCI = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: Object.keys(expenseByCat),
      datasets: [{
        data: Object.values(expenseByCat),
        backgroundColor: ['#e94560', '#0f3460', '#16213e', '#1a2744']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // Line chart for monthly evolution
  const monthlyData = {};
  transactions.forEach(t => {
    const month = new Date(t.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
    monthlyData[month][t.type] += t.amount;
  });

  const labels = Object.keys(monthlyData);
  const incomeData = labels.map(m => monthlyData[m].income);
  const expenseData = labels.map(m => monthlyData[m].expense);

  const lineCtx = document.getElementById('lineChart').getContext('2d');
  if (lineCI) lineCI.destroy();
  lineCI = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenus',
        data: incomeData,
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.1)'
      }, {
        label: 'Dépenses',
        data: expenseData,
        borderColor: '#f87171',
        backgroundColor: 'rgba(248, 113, 113, 0.1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function openProfileModal() {
  // For now, just navigate to profile page
  navigateTo('profile');
}