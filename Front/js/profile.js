const CU = window.CU || JSON.parse(sessionStorage.getItem('budgetcollab_user')) || { role: 'admin', id: '1' };

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
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('profName').value = CU.name || '';
    document.getElementById('profEmail').value = CU.email || '';
    if (CU.name) {
        const avatar = document.getElementById('sidebarAvatar');
        if (avatar) avatar.textContent = CU.name.charAt(0).toUpperCase();
        const sName = document.getElementById('sidebarName');
        if (sName) sName.textContent = CU.name;
    }
});

window.saveProfile = saveProfile;
