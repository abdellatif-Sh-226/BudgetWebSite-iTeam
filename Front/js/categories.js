import { 
    getFakeTransactions, 
    getFakeCategories, 
    getFakeBudgets, 
    saveFakeCategories 
} from '../api/usersApi.js';

const CU = window.CU || JSON.parse(sessionStorage.getItem('budgetcollab_user')) || { role: 'admin', id: '1' };
let editCategoryId = null;

function getHexColor(colorStr) {
    if (!colorStr) return '#e94560';
    if (colorStr.startsWith('#')) return colorStr;
    const temp = document.createElement('div');
    temp.style.color = colorStr;
    document.body.appendChild(temp);
    const computed = getComputedStyle(temp).color;
    document.body.removeChild(temp);
    const match = computed.match(/\d+/g);
    if (match && match.length >= 3) {
        const r = parseInt(match[0]).toString(16).padStart(2, '0');
        const g = parseInt(match[1]).toString(16).padStart(2, '0');
        const b = parseInt(match[2]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return '#e94560';
}

function resolveColor(colorStr) {
    if (colorStr && colorStr.startsWith('var(')) {
        const varName = colorStr.substring(4, colorStr.length - 1).trim();
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#6c757d';
    }
    return colorStr || '#6c757d';
}

function renderCategories() {
    const cats = getFakeCategories();
    const txs = getFakeTransactions();
    const budgets = getFakeBudgets();
    
    const subtitleEl = document.getElementById('pageSubtitle');
    const scopeSection = document.getElementById('categoryScopeSection');
    if (CU.role === 'admin') {
        if (subtitleEl) subtitleEl.textContent = "Catégories globales — configurées pour tous les utilisateurs (Admin)";
        if (scopeSection) scopeSection.classList.add('admin-scope');
    } else {
        if (subtitleEl) subtitleEl.textContent = "Vos catégories privées — visibles uniquement par vous";
        if (scopeSection) scopeSection.classList.remove('admin-scope');
    }

    const catBody = document.getElementById('catBody');
    if (!catBody) return;

    if (cats.length === 0) {
        catBody.innerHTML = `<tr><td colspan="4" class="empty-state"><div class="empty-state-icon">📂</div><div class="empty-state-text">Aucune catégorie existante</div></td></tr>`;
        return;
    }

    catBody.innerHTML = cats.map(c => {
        const txCount = txs.filter(t => t.catId === c.id).length;
        const budgetCount = budgets.filter(b => b.catId === c.id).length;
        let usage = [];
        if (txCount > 0) usage.push(`${txCount} transaction(s)`);
        if (budgetCount > 0) usage.push(`${budgetCount} budget(s)`);
        const usageHtml = usage.length > 0
            ? `<span class="usage-badge has-data">${usage.join(', ')}</span>`
            : `<span class="usage-badge">Aucun(e)</span>`;
        const colorResolved = resolveColor(c.color);
        
        return `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>
                    <div class="category-color">
                        <div class="color-swatch" style="background: ${colorResolved}"></div>
                        <span class="color-label">${colorResolved}</span>
                    </div>
                </td>
                <td>${usageHtml}</td>
                <td>
                    <div class="actions-cell">
                        <button class="icon-btn" onclick="editCat('${c.id}')" title="Modifier">✏️</button>
                        <button class="icon-btn danger" onclick="deleteCat('${c.id}')" title="Supprimer">🗑️</button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function openCatModal() {
    editCategoryId = null;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = "Ajouter une catégorie";
    const nameInput = document.getElementById('catName');
    if (nameInput) nameInput.value = '';
    const colorInput = document.getElementById('catColor');
    if (colorInput) colorInput.value = '#e94560';
    const hexPreview = document.getElementById('colorHexPreview');
    if (hexPreview) hexPreview.textContent = '#e94560';
    const modal = document.getElementById('catModal');
    if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
    editCategoryId = null;
}

function editCat(catId) {
    const cats = getFakeCategories();
    const cat = cats.find(c => c.id === catId);
    if (!cat) return;
    editCategoryId = catId;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = "Modifier la catégorie";
    const nameInput = document.getElementById('catName');
    if (nameInput) nameInput.value = cat.name;
    const colorInput = document.getElementById('catColor');
    if (colorInput) colorInput.value = getHexColor(cat.color);
    const hexPreview = document.getElementById('colorHexPreview');
    if (hexPreview) hexPreview.textContent = getHexColor(cat.color);
    const modal = document.getElementById('catModal');
    if (modal) modal.classList.add('open');
}

function saveCat() {
    const nameInput = document.getElementById('catName');
    const colorInput = document.getElementById('catColor');
    if (!nameInput || !colorInput) return;
    const name = nameInput.value.trim();
    const color = colorInput.value;
    if (!name) { alert("Veuillez saisir un nom de catégorie."); return; }
    const cats = getFakeCategories();
    const duplicate = cats.find(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== editCategoryId);
    if (duplicate) { alert("Une catégorie avec ce nom existe déjà."); return; }
    if (editCategoryId) {
        const index = cats.findIndex(c => c.id === editCategoryId);
        if (index !== -1) { cats[index].name = name; cats[index].color = color; }
    } else {
        cats.push({ id: 'cat_' + Date.now(), name, color });
    }
    saveFakeCategories(cats);
    renderCategories();
    closeModal('catModal');
}

function deleteCat(catId) {
    const cats = getFakeCategories();
    const cat = cats.find(c => c.id === catId);
    if (!cat) return;
    const txs = getFakeTransactions();
    const budgets = getFakeBudgets();
    const txCount = txs.filter(t => t.catId === catId).length;
    const budgetCount = budgets.filter(b => b.catId === catId).length;
    let confirmMsg = `Voulez-vous vraiment supprimer la catégorie "${cat.name}" ?`;
    if (txCount > 0 || budgetCount > 0) {
        confirmMsg = `La catégorie "${cat.name}" est utilisée dans ${txCount} transaction(s) et ${budgetCount} budget(s). Voulez-vous continuer ?`;
    }
    if (confirm(confirmMsg)) {
        saveFakeCategories(cats.filter(c => c.id !== catId));
        renderCategories();
    }
}

function translatePage() {
    const lang = window.langFR || {};
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (lang[key]) el.textContent = lang[key];
    });
}

window.openCatModal = openCatModal;
window.closeModal = closeModal;
window.editCat = editCat;
window.saveCat = saveCat;
window.deleteCat = deleteCat;

document.addEventListener('DOMContentLoaded', () => {
    translatePage();
    renderCategories();
    if (CU.name) {
        const avatar = document.getElementById('sidebarAvatar');
        if (avatar) avatar.textContent = CU.name.charAt(0).toUpperCase();
        const sName = document.getElementById('sidebarName');
        if (sName) sName.textContent = CU.name;
    }
});
