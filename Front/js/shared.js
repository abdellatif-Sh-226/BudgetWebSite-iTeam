// Shared Logic
function loadShared() {
  if (CU) {
    document.getElementById('sidebarAvatar').textContent = CU.name.charAt(0).toUpperCase();
    document.getElementById('sidebarName').textContent = CU.name;
    document.getElementById('sidebarRoleBadge').innerHTML = CU.role === 'admin'
      ? '<span class="role-badge-admin">👑 Admin</span>'
      : '<span class="role-badge-user">👤 Utilisateur</span>';

    renderShared();
  }
}

function renderShared() {
  const sharedBudgets = DB.get('sharedBudgets') || [];
  const grid = document.getElementById('sharedGrid');
  const noShared = document.getElementById('noShared');

  // Filter shared budgets where current user is a member
  const userShared = sharedBudgets.filter(sb => sb.members.includes(CU.id));

  if (userShared.length === 0) {
    grid.innerHTML = '';
    noShared.style.display = 'block';
    return;
  }

  noShared.style.display = 'none';
  grid.innerHTML = userShared.map(shared => {
    const memberNames = getSharedMemberNames(shared.members);
    const totalSpent = calculateSharedTotalSpent(shared.id);

    return `
      <div class="shared-card">
        <div class="shared-header">
          <h3>${shared.name}</h3>
          <div class="shared-actions">
            <button class="btn btn-sm btn-secondary" onclick="viewSharedDetails(${shared.id})">👁️</button>
            <button class="btn btn-sm btn-danger" onclick="leaveShared(${shared.id})">🚪</button>
          </div>
        </div>
        <div class="shared-info">
          <div class="shared-members">
            <span class="label">Membres:</span>
            <span class="value">${memberNames.join(', ')}</span>
          </div>
          <div class="shared-total">
            <span class="label">Total dépensé:</span>
            <span class="value">${fmt(totalSpent)}</span>
          </div>
        </div>
        ${shared.description ? `<div class="shared-description">${shared.description}</div>` : ''}
      </div>
    `;
  }).join('');
}

function getSharedMemberNames(memberIds) {
  const users = DB.get('users') || [];
  return memberIds.map(id => {
    const user = users.find(u => u.id === id);
    return user ? user.name : 'Utilisateur inconnu';
  });
}

function calculateSharedTotalSpent(sharedId) {
  const transactions = DB.get('transactions') || [];
  return transactions
    .filter(t => t.dest === `group-${sharedId}` && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

function openSharedModal() {
  document.getElementById('sharedName').value = '';
  document.getElementById('sharedMembers').value = '';
  document.getElementById('sharedDesc').value = '';
  document.getElementById('sharedModal').style.display = 'flex';
}

function saveShared() {
  const name = document.getElementById('sharedName').value.trim();
  const membersInput = document.getElementById('sharedMembers').value.trim();
  const description = document.getElementById('sharedDesc').value.trim();

  if (!name) {
    alert('Veuillez saisir un nom pour le budget partagé');
    return;
  }

  // Parse member emails
  const memberEmails = membersInput.split(',').map(email => email.trim()).filter(email => email);
  if (memberEmails.length === 0) {
    alert('Veuillez ajouter au moins un membre');
    return;
  }

  // Find user IDs for emails
  const users = DB.get('users') || [];
  const memberIds = [CU.id]; // Include creator

  for (const email of memberEmails) {
    const user = users.find(u => u.email === email);
    if (user) {
      if (!memberIds.includes(user.id)) {
        memberIds.push(user.id);
      }
    } else {
      alert(`Utilisateur avec l'email ${email} non trouvé`);
      return;
    }
  }

  const sharedBudgets = DB.get('sharedBudgets') || [];
  const newShared = {
    id: Date.now(),
    name,
    members: memberIds,
    description,
    createdBy: CU.id,
    createdAt: new Date().toISOString()
  };

  sharedBudgets.push(newShared);
  DB.set('sharedBudgets', sharedBudgets);

  closeModal('sharedModal');
  renderShared();
}

function viewSharedDetails(sharedId) {
  // For now, just show an alert
  alert('Fonctionnalité de visualisation détaillée à implémenter');
}

function leaveShared(sharedId) {
  if (confirm('Êtes-vous sûr de vouloir quitter ce budget partagé ?')) {
    const sharedBudgets = DB.get('sharedBudgets') || [];
    const sharedIndex = sharedBudgets.findIndex(sb => sb.id === sharedId);

    if (sharedIndex !== -1) {
      const shared = sharedBudgets[sharedIndex];
      shared.members = shared.members.filter(id => id !== CU.id);

      // If no members left, delete the shared budget
      if (shared.members.length === 0) {
        sharedBudgets.splice(sharedIndex, 1);
      } else {
        sharedBudgets[sharedIndex] = shared;
      }

      DB.set('sharedBudgets', sharedBudgets);
      renderShared();
    }
  }
}
