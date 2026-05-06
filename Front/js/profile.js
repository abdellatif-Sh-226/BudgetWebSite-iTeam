// Profile Logic
function loadProfile() {
  if (CU) {
    document.getElementById('sidebarAvatar').textContent = CU.name.charAt(0).toUpperCase();
    document.getElementById('sidebarName').textContent = CU.name;
    document.getElementById('sidebarRoleBadge').innerHTML = CU.role === 'admin'
      ? '<span class="role-badge-admin">👑 Admin</span>'
      : '<span class="role-badge-user">👤 Utilisateur</span>';

    document.getElementById('profileAvatar').textContent = CU.name.charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = CU.name;
    document.getElementById('profileEmail').textContent = CU.email;
    document.getElementById('profileRoleBadge').innerHTML = CU.role === 'admin'
      ? '<span class="role-badge-admin">👑 Administrateur</span>'
      : '<span class="role-badge-user">👤 Utilisateur</span>';

    // Fill form
    document.getElementById('profileNameInput').value = CU.name;
    document.getElementById('profileEmailInput').value = CU.email;
    document.getElementById('profileLanguage').value = CU.language || 'fr';
  }
}

function saveProfile() {
  const name = document.getElementById('profileNameInput').value.trim();
  const email = document.getElementById('profileEmailInput').value.trim();
  const language = document.getElementById('profileLanguage').value;

  if (!name || !email) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  // Update user data
  CU.name = name;
  CU.email = email;
  CU.language = language;

  // Update in users array
  const users = DB.get('users') || [];
  const userIndex = users.findIndex(u => u.id === CU.id);
  if (userIndex !== -1) {
    users[userIndex] = { ...CU };
    DB.set('users', users);
  }

  // Persist current user after profile update
  setCurrentUser(CU);

  // Update UI
  loadProfile();
  updateUI();

  alert('Profil mis à jour avec succès');
}

function resetProfileForm() {
  loadProfile();
}

function changePassword() {
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  document.getElementById('passwordModal').style.display = 'flex';
}

function savePassword() {
  const current = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;

  if (!current || !newPass || !confirm) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  if (CU.password !== current) {
    alert('Mot de passe actuel incorrect');
    return;
  }

  if (newPass !== confirm) {
    alert('Les mots de passe ne correspondent pas');
    return;
  }

  if (newPass.length < 6) {
    alert('Le mot de passe doit contenir au moins 6 caractères');
    return;
  }

  // Update password
  const users = DB.get('users') || [];
  const userIndex = users.findIndex(u => u.id === CU.id);
  if (userIndex !== -1) {
    users[userIndex].password = newPass;
    DB.set('users', users);
    CU.password = newPass;
    setCurrentUser(CU);
  }

  closeModal('passwordModal');
  alert('Mot de passe changé avec succès');
}
