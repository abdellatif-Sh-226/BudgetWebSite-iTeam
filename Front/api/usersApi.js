// Fake API for development
export const fakeCategories = [
    { id: 'cat_food', name: 'Alimentation', color: 'var(--danger)' },
    { id: 'cat_salary', name: 'Salaire', color: 'var(--success)' }
];

export const fakeBudgets = [
    { id: 'budget_1', name: 'Budget Mensuel' },
    { id: 'account_main', name: 'Compte principal' }
];

export const fakeUsers = [
    { id: '1', name: 'Admin' }
];

const fakeTransactions = [
    {
        id: '1',
        date: '2026-05-07T10:00:00',
        desc: 'Achat supermarché',
        notes: 'Courses semaine',
        catId: 'cat_food',
        type: 'expense',
        dest: 'budget_1',
        userId: '1',
        amount: 150.00
    },
    {
        id: '2',
        date: '2026-05-06T15:30:00',
        desc: 'Salaire',
        notes: 'Mai 2026',
        catId: 'cat_salary',
        type: 'income',
        dest: 'account_main',
        userId: '1',
        amount: 3000.00
    }
];

export function getFakeTransactions() {
    return fakeTransactions;
}

export function getFakeCategories() {
    return fakeCategories;
}

export function getFakeBudgets() {
    return fakeBudgets;
}

export function getFakeUsers() {
    return fakeUsers;
}
