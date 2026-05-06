// Transactions Logic
function loadTransactions() {
  if (CU) {
    document.getElementById('sidebarAvatar').textContent = CU.name.charAt(0).toUpperCase();
    document.getElementById('sidebarName').textContent = CU.name;
    document.getElementById('sidebarRoleBadge').innerHTML = CU.role === 'admin'
      ? '<span class="role-badge-admin">👑 Admin</span>'
      : '<span class="role-badge-user">👤 Utilisateur</span>';

    populateCategoryFilter();
    renderTransactionsTable();
  }
}

function populateCategoryFilter() {
  const categories = DB.get('categories') || [];
  const select = document.getElementById('txFilterCat');
  select.innerHTML = '<option value="">Toutes catégories</option>';
  categories.forEach(cat => {
    select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
}

function renderTransactionsTable() {
  const transactions = (DB.get('transactions') || []).filter(t => t.userId === CU.id);
  const tbody = document.getElementById('transactionsBody');
  const noTx = document.getElementById('noTransactions');

  const filterType = document.getElementById('txFilterType').value;
  const filterCat = document.getElementById('txFilterCat').value;

  const filtered = transactions.filter(t => {
    if (filterType && t.type !== filterType) return false;
    if (filterCat && t.categoryId !== parseInt(filterCat)) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    noTx.style.display = 'block';
    return;
  }

  noTx.style.display = 'none';
  tbody.innerHTML = filtered.map(t => `
    <tr>
      <td>${new Date(t.date).toLocaleDateString('fr-FR')}</td>
      <td>${t.description}</td>
      <td>${getCatName(t.categoryId)}</td>
      <td class="${t.type === 'income' ? 'success' : 'danger'}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</td>
      <td><span class="badge ${t.type}">${t.type === 'income' ? 'Revenu' : 'Dépense'}</span></td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editTx(${t.id})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTx(${t.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openTxModal(txId = null) {
  const modal = document.getElementById('txModal');
  const title = modal.querySelector('.modal-title');
  const saveBtn = modal.querySelector('button[onclick="saveTx()"]');

  if (txId) {
    const tx = (DB.get('transactions') || []).find(t => t.id === txId);
    if (tx) {
      document.getElementById('txType').value = tx.type;
      document.getElementById('txDesc').value = tx.description;
      document.getElementById('txAmount').value = tx.amount;
      document.getElementById('txDate').value = tx.date;
      document.getElementById('txCat').value = tx.categoryId;
      document.getElementById('txNotes').value = tx.notes || '';
      title.textContent = 'Modifier la transaction';
      saveBtn.setAttribute('data-edit-id', txId);
    }
  } else {
    document.getElementById('txType').value = 'expense';
    document.getElementById('txDesc').value = '';
    document.getElementById('txAmount').value = '';
    document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('txCat').value = '';
    document.getElementById('txNotes').value = '';
    title.textContent = 'Ajouter une transaction';
    saveBtn.removeAttribute('data-edit-id');
  }

  populateTxCategories();
  modal.style.display = 'flex';
}

function populateTxCategories() {
  const categories = DB.get('categories') || [];
  const select = document.getElementById('txCat');
  select.innerHTML = '<option value="">Sélectionner une catégorie</option>';
  categories.forEach(cat => {
    select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
}

function saveTx() {
  const type = document.getElementById('txType').value;
  const desc = document.getElementById('txDesc').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date = document.getElementById('txDate').value;
  const catId = parseInt(document.getElementById('txCat').value);
  const notes = document.getElementById('txNotes').value.trim();

  if (!desc || !amount || !date || !catId) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }

  const transactions = DB.get('transactions') || [];
  const saveBtn = document.querySelector('button[onclick="saveTx()"]');
  const editId = saveBtn.getAttribute('data-edit-id');

  if (editId) {
    const index = transactions.findIndex(t => t.id === parseInt(editId));
    if (index !== -1) {
      transactions[index] = { ...transactions[index], type, description: desc, amount, date, categoryId: catId, notes };
    }
  } else {
    const newTx = {
      id: Date.now(),
      type,
      description: desc,
      amount,
      date,
      categoryId: catId,
      notes,
      userId: CU.id
    };
    transactions.push(newTx);
  }

  DB.set('transactions', transactions);
  closeModal('txModal');
  renderTransactionsTable();
}

function editTx(txId) {
  openTxModal(txId);
}

function deleteTx(txId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
    const transactions = DB.get('transactions') || [];
    const filtered = transactions.filter(t => t.id !== txId);
    DB.set('transactions', filtered);
    renderTransactionsTable();
  }
}

function syncTxTypeToDestination() {
  // For now, just wallet
}
