// Categories Logic
function loadCategories() {
  if (CU) {
    document.getElementById('sidebarAvatar').textContent = CU.name.charAt(0).toUpperCase();
    document.getElementById('sidebarName').textContent = CU.name;
    document.getElementById('sidebarRoleBadge').innerHTML = CU.role === 'admin'
      ? '<span class="role-badge-admin">👑 Admin</span>'
      : '<span class="role-badge-user">👤 Utilisateur</span>';

    renderCategories();
  }
}

function renderCategories() {
  const categories = DB.get('categories') || [];
  const grid = document.getElementById('categoriesGrid');
  const noCategories = document.getElementById('noCategories');

  if (categories.length === 0) {
    grid.innerHTML = '';
    noCategories.style.display = 'block';
    return;
  }

  noCategories.style.display = 'none';
  grid.innerHTML = categories.map(category => {
    const transactionCount = getCategoryTransactionCount(category.id);
    const totalAmount = getCategoryTotalAmount(category.id);

    return `
      <div class="category-card">
        <div class="category-header">
          <div class="category-color" style="background-color: ${category.color}"></div>
          <h3>${category.name}</h3>
          <div class="category-actions">
            <button class="btn btn-sm btn-secondary" onclick="editCategory(${category.id})">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">🗑️</button>
          </div>
        </div>
        <div class="category-stats">
          <div class="stat">
            <span class="stat-label">Transactions</span>
            <span class="stat-value">${transactionCount}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Total dépensé</span>
            <span class="stat-value">${fmt(totalAmount)}</span>
          </div>
        </div>
        ${category.description ? `<div class="category-description">${category.description}</div>` : ''}
      </div>
    `;
  }).join('');
}

function getCategoryTransactionCount(categoryId) {
  const transactions = DB.get('transactions') || [];
  return transactions.filter(t => t.categoryId === categoryId).length;
}

function getCategoryTotalAmount(categoryId) {
  const transactions = DB.get('transactions') || [];
  return transactions
    .filter(t => t.categoryId === categoryId && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

function openCategoryModal(categoryId = null) {
  const modal = document.getElementById('categoryModal');
  const title = modal.querySelector('.modal-title');
  const saveBtn = modal.querySelector('button[onclick="saveCategory()"]');

  if (categoryId) {
    const category = (DB.get('categories') || []).find(c => c.id === categoryId);
    if (category) {
      document.getElementById('categoryName').value = category.name;
      document.getElementById('categoryColor').value = category.color;
      document.getElementById('categoryDesc').value = category.description || '';
      title.textContent = 'Modifier la catégorie';
      saveBtn.setAttribute('data-edit-id', categoryId);
    }
  } else {
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryColor').value = '#e94560';
    document.getElementById('categoryDesc').value = '';
    title.textContent = 'Ajouter une catégorie';
    saveBtn.removeAttribute('data-edit-id');
  }

  modal.style.display = 'flex';
}

function saveCategory() {
  const name = document.getElementById('categoryName').value.trim();
  const color = document.getElementById('categoryColor').value;
  const description = document.getElementById('categoryDesc').value.trim();

  if (!name) {
    alert('Veuillez saisir un nom pour la catégorie');
    return;
  }

  const categories = DB.get('categories') || [];
  const saveBtn = document.querySelector('button[onclick="saveCategory()"]');
  const editId = saveBtn.getAttribute('data-edit-id');

  if (editId) {
    const index = categories.findIndex(c => c.id === parseInt(editId));
    if (index !== -1) {
      categories[index] = { ...categories[index], name, color, description };
    }
  } else {
    const newCategory = {
      id: Date.now(),
      name,
      color,
      description
    };
    categories.push(newCategory);
  }

  DB.set('categories', categories);
  closeModal('categoryModal');
  renderCategories();
}

function editCategory(categoryId) {
  openCategoryModal(categoryId);
}

function deleteCategory(categoryId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Toutes les transactions associées garderont cette catégorie.')) {
    const categories = DB.get('categories') || [];
    const filtered = categories.filter(c => c.id !== categoryId);
    DB.set('categories', filtered);
    renderCategories();
  }
}
