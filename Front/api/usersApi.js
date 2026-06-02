// Fake API for development with localStorage persistence
const storageKeyCategories = 'budgetcollab_categories';
const storageKeyBudgets = 'budgetcollab_budgets';
const storageKeyTransactions = 'budgetcollab_transactions';

export const fakeCategories = [
    { id: 'cat_food', name: 'Alimentation', color: 'var(--danger)' },
    { id: 'cat_salary', name: 'Salaire', color: 'var(--success)' },
    { id: 'cat_transport', name: 'Transport', color: 'var(--accent)' },
    { id: 'cat_rent', name: 'Logement', color: '#e83e8c' },
    { id: 'cat_entertainment', name: 'Loisirs', color: 'var(--warning)' }
];

export const fakeBudgets = [
    { id: 'budget_1', name: 'Alimentation Mensuelle', limit: 140.00, userId: '1', catId: 'cat_food' },
    { id: 'budget_2', name: 'Sorties & Loisirs', limit: 100.00, userId: '1', catId: 'cat_entertainment' },
    { id: 'account_main', name: 'Compte principal', limit: 5000.00, userId: '1' }
];

export const fakeUsers = [
    { id: '1', name: 'Admin' },
    { id: '2', name: 'Collaborateur' }
];

const fakeTransactions = [
    // June 2026 (Current Month)
    { id: 't1', date: '2026-06-02T10:00:00', desc: 'Achat Supermarché', notes: 'Courses de la semaine', catId: 'cat_food', type: 'expense', dest: 'budget_1', userId: '1', amount: 150.00 },
    { id: 't2', date: '2026-06-01T08:30:00', desc: 'Salaire Juin', notes: 'Virement mensuel', catId: 'cat_salary', type: 'income', dest: 'account_main', userId: '1', amount: 3200.00 },
    { id: 't3', date: '2026-06-02T14:20:00', desc: 'Cinéma & Popcorn', notes: 'Sortie weekend', catId: 'cat_entertainment', type: 'expense', dest: 'budget_2', userId: '1', amount: 85.00 },
    
    // May 2026
    { id: 't4', date: '2026-05-15T18:00:00', desc: 'Essence', notes: 'Plein voiture', catId: 'cat_transport', type: 'expense', dest: 'account_main', userId: '1', amount: 90.00 },
    { id: 't5', date: '2026-05-01T09:00:00', desc: 'Salaire Mai', notes: 'Virement mensuel', catId: 'cat_salary', type: 'income', dest: 'account_main', userId: '1', amount: 3200.00 },
    { id: 't6', date: '2026-05-05T12:00:00', desc: 'Loyer', notes: 'Mensualité appartement', catId: 'cat_rent', type: 'expense', dest: 'account_main', userId: '1', amount: 800.00 },
    
    // April 2026
    { id: 't7', date: '2026-04-01T09:00:00', desc: 'Salaire Avril', notes: '', catId: 'cat_salary', type: 'income', dest: 'account_main', userId: '1', amount: 3200.00 },
    { id: 't8', date: '2026-04-10T11:00:00', desc: 'Restaurant', notes: 'Dîner équipe', catId: 'cat_entertainment', type: 'expense', dest: 'budget_2', userId: '1', amount: 120.00 },
    { id: 't9', date: '2026-04-20T16:00:00', desc: 'Abonnement Netflix', notes: 'Mensuel', catId: 'cat_entertainment', type: 'expense', dest: 'budget_2', userId: '1', amount: 35.00 },
    
    // March 2026
    { id: 't10', date: '2026-03-01T09:00:00', desc: 'Salaire Mars', notes: '', catId: 'cat_salary', type: 'income', dest: 'account_main', userId: '1', amount: 3200.00 },
    { id: 't11', date: '2026-03-05T12:00:00', desc: 'Loyer', notes: '', catId: 'cat_rent', type: 'expense', dest: 'account_main', userId: '1', amount: 800.00 },
    { id: 't12', date: '2026-03-12T10:00:00', desc: 'Courses Carrefour', notes: '', catId: 'cat_food', type: 'expense', dest: 'budget_1', userId: '1', amount: 280.00 },
    
    // February 2026
    { id: 't13', date: '2026-02-01T09:00:00', desc: 'Salaire Février', notes: '', catId: 'cat_salary', type: 'income', dest: 'account_main', userId: '1', amount: 3000.00 },
    { id: 't14', date: '2026-02-14T20:30:00', desc: 'Cadeau St Valentin', notes: '', catId: 'cat_entertainment', type: 'expense', dest: 'budget_2', userId: '1', amount: 150.00 },
    
    // January 2026
    { id: 't15', date: '2026-01-01T09:00:00', desc: 'Salaire Janvier', notes: '', catId: 'cat_salary', type: 'income', dest: 'account_main', userId: '1', amount: 3000.00 },
    { id: 't16', date: '2026-01-08T15:00:00', desc: 'Soldes Hiver', notes: 'Habits', catId: 'cat_entertainment', type: 'expense', dest: 'budget_2', userId: '1', amount: 250.00 }
];

export function getFakeTransactions() {
    if (!localStorage.getItem(storageKeyTransactions)) {
        localStorage.setItem(storageKeyTransactions, JSON.stringify(fakeTransactions));
    }
    return JSON.parse(localStorage.getItem(storageKeyTransactions));
}

export function getFakeCategories() {
    if (!localStorage.getItem(storageKeyCategories)) {
        localStorage.setItem(storageKeyCategories, JSON.stringify(fakeCategories));
    }
    return JSON.parse(localStorage.getItem(storageKeyCategories));
}

export function getFakeBudgets() {
    if (!localStorage.getItem(storageKeyBudgets)) {
        localStorage.setItem(storageKeyBudgets, JSON.stringify(fakeBudgets));
    }
    return JSON.parse(localStorage.getItem(storageKeyBudgets));
}

export function getFakeUsers() {
    return fakeUsers;
}

// Setters to persist mutations
export function saveFakeCategories(categories) {
    localStorage.setItem(storageKeyCategories, JSON.stringify(categories));
}

export function saveFakeTransactions(transactions) {
    localStorage.setItem(storageKeyTransactions, JSON.stringify(transactions));
}

export function saveFakeBudgets(budgets) {
    localStorage.setItem(storageKeyBudgets, JSON.stringify(budgets));
}


