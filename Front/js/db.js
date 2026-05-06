const STORAGE_KEY_USER = 'budgetcollab_userId';
const STORAGE_KEY_CACHE = 'budgetcollab_cache';

let _cache = {
  users: [],
  categories: [],
  transactions: [],
  budgets: [],
  sharedBudgets: []
};
let currentUser = null;

const fakeData = {
  users: [
    { id: 1, name: 'Admin', email: 'admin@demo.com', password: 'admin123', role: 'admin', active: true },
    { id: 2, name: 'Sara', email: 'sara@demo.com', password: 'sara123', role: 'user', active: true },
    { id: 3, name: 'John', email: 'john@demo.com', password: 'john123', role: 'user', active: true },
    { id: 4, name: 'Marie', email: 'marie@demo.com', password: 'marie123', role: 'user', active: true }
  ],
  categories: [
    { id: 1, name: 'Alimentation', color: '#FF6B6B', icon: '🍎' },
    { id: 2, name: 'Transport', color: '#4ECDC4', icon: '🚗' },
    { id: 3, name: 'Loisirs', color: '#45B7D1', icon: '🎮' },
    { id: 4, name: 'Santé', color: '#96CEB4', icon: '🏥' },
    { id: 5, name: 'Éducation', color: '#FFEAA7', icon: '📚' }
  ],
  transactions: [
    { id: 1, userId: 2, type: 'expense', amount: 45.50, categoryId: 1, description: 'Courses supermarché', date: '2024-01-15', dest: 'personal' },
    { id: 2, userId: 2, type: 'expense', amount: 12.00, categoryId: 2, description: 'Bus mensuel', date: '2024-01-10', dest: 'personal' },
    { id: 3, userId: 2, type: 'income', amount: 2500.00, categoryId: null, description: 'Salaire', date: '2024-01-01', dest: 'personal' },
    { id: 4, userId: 3, type: 'expense', amount: 89.99, categoryId: 3, description: 'Jeu vidéo', date: '2024-01-12', dest: 'personal' }
  ],
  budgets: [
    { id: 1, userId: 2, name: 'Alimentation', limit: 400, catId: 1, period: 'monthly', start: '2024-01-01', end: '2024-01-31' },
    { id: 2, userId: 2, name: 'Transport', limit: 100, catId: 2, period: 'monthly', start: '2024-01-01', end: '2024-01-31' },
    { id: 3, userId: 3, name: 'Loisirs', limit: 200, catId: 3, period: 'monthly', start: '2024-01-01', end: '2024-01-31' }
  ],
  sharedBudgets: [
    { id: 1, name: 'Vacances été', members: [2, 3], description: 'Budget partagé pour les vacances', createdBy: 2, createdAt: '2024-01-01T00:00:00.000Z' }
  ]
};

function restoreCache() {
  const savedCache = sessionStorage.getItem(STORAGE_KEY_CACHE);
  if (savedCache) {
    try {
      _cache = JSON.parse(savedCache);
    } catch (e) {
      _cache = JSON.parse(JSON.stringify(fakeData));
    }
  } else {
    _cache = JSON.parse(JSON.stringify(fakeData));
  }
}

function restoreSession() {
  restoreCache();
  const savedUserId = sessionStorage.getItem(STORAGE_KEY_USER);
  if (savedUserId) {
    currentUser = (_cache.users || []).find(u => String(u.id) === savedUserId) || null;
  } else {
    currentUser = null;
  }
}

function persistCache() {
  sessionStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(_cache));
}

function persistUser() {
  if (currentUser) {
    sessionStorage.setItem(STORAGE_KEY_USER, String(currentUser.id));
  } else {
    sessionStorage.removeItem(STORAGE_KEY_USER);
  }
}

function persistSession() {
  persistCache();
  persistUser();
}

const DB = {
  get: k => (_cache[k] !== undefined ? _cache[k] : null),
  set: (k, v) => {
    _cache[k] = v;
    persistSession();
  }
};

function getCurrentUser() {
  return currentUser;
}

function setCurrentUser(user) {
  currentUser = user;
  persistUser();
}

function clearCurrentUser() {
  currentUser = null;
  persistUser();
}

function loginUser(email, password) {
  const user = (_cache.users || []).find(u => u.email === email && u.password === password && u.active !== false);
  if (!user) return null;
  setCurrentUser(user);
  return user;
}

async function apiFetch(path, options = {}) {
  await new Promise(resolve => setTimeout(resolve, 50));

  if (path === 'api/data.php') {
    return {
      users: _cache.users,
      categories: _cache.categories,
      transactions: _cache.transactions,
      budgets: _cache.budgets,
      sharedBudgets: _cache.sharedBudgets,
      currentUser: currentUser
    };
  }

  if (path === 'api/login.php') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    const user = loginUser(body.email, body.password);
    if (!user) {
      throw new Error('Email ou mot de passe incorrect.');
    }
    return { success: true, currentUser: user };
  }

  if (path === 'api/logout.php') {
    clearCurrentUser();
    return { success: true };
  }

  if (path.startsWith('api/save.php')) {
    return { success: true };
  }

  throw new Error(`Unknown API endpoint: ${path}`);
}

function _showSaveIndicator() {
  const ind = document.getElementById('_saveInd');
  if (!ind) return;
  ind.style.opacity = '1';
  clearTimeout(ind._t);
  ind._t = setTimeout(() => (ind.style.opacity = '0'), 1200);
}

async function saveEntity(entity, payload) {
  try {
    await apiFetch(`api/save.php?entity=${encodeURIComponent(entity)}`, { method: 'POST', body: payload });
    _showSaveIndicator();
  } catch (e) {
    console.error('Failed to save entity', entity, e);
  }
}

async function loadAppData() {
  const data = await apiFetch('api/data.php', { method: 'GET' });
  _cache.users = data.users || [];
  _cache.categories = data.categories || [];
  _cache.transactions = data.transactions || [];
  _cache.budgets = data.budgets || [];
  _cache.sharedBudgets = data.sharedBudgets || [];
  currentUser = data.currentUser || null;
  persistSession();
}

restoreSession();
