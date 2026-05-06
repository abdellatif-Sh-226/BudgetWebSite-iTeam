// Main App Logic for Budget Tracker
// Handles transactions, balance calculation, and UI updates

class BudgetApp {
  constructor() {
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    const form = document.getElementById('transaction-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addTransaction();
      });
    }

    // Language selector (if added to UI)
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        setLanguage(e.target.value);
      });
    }
  }

  addTransaction() {
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value.trim();

    if (!amount || amount <= 0) {
      alert(t('invalidAmount'));
      return;
    }

    if (!description) {
      alert(t('descriptionRequired'));
      return;
    }

    const transaction = {
      id: Date.now(),
      type,
      amount,
      description,
      date: new Date().toISOString()
    };

    this.transactions.push(transaction);
    this.saveTransactions();
    this.updateUI();
    this.clearForm();

    alert(t('transactionAdded'));
  }

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== id);
    this.saveTransactions();
    this.updateUI();
  }

  saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
  }

  getBalance() {
    return this.transactions.reduce((total, t) => {
      return t.type === 'income' ? total + t.amount : total - t.amount;
    }, 0);
  }

  getTotalIncome() {
    return this.transactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + t.amount, 0);
  }

  getTotalExpenses() {
    return this.transactions
      .filter(t => t.type === 'expense')
      .reduce((total, t) => total + t.amount, 0);
  }

  updateUI() {
    this.updateBalance();
    this.updateTransactionList();
    this.updateTexts(); // For multi-language
  }

  updateBalance() {
    const balanceEl = document.getElementById('current-balance');
    const incomeEl = document.getElementById('total-income');
    const expenseEl = document.getElementById('total-expenses');

    if (balanceEl) balanceEl.textContent = `$${this.getBalance().toFixed(2)}`;
    if (incomeEl) incomeEl.textContent = `$${this.getTotalIncome().toFixed(2)}`;
    if (expenseEl) expenseEl.textContent = `$${this.getTotalExpenses().toFixed(2)}`;
  }

  updateTransactionList() {
    const listEl = document.getElementById('transaction-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (this.transactions.length === 0) {
      listEl.innerHTML = `<p>${t('noTransactions')}</p>`;
      return;
    }

    this.transactions.slice(-10).reverse().forEach(transaction => {
      const item = document.createElement('div');
      item.className = `transaction-item ${transaction.type}`;
      item.innerHTML = `
        <div class="transaction-details">
          <strong>${transaction.description}</strong>
          <small>${new Date(transaction.date).toLocaleDateString()}</small>
        </div>
        <div class="transaction-amount ${transaction.type}">
          ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
        </div>
        <button class="btn btn-danger btn-sm" onclick="app.deleteTransaction(${transaction.id})">×</button>
      `;
      listEl.appendChild(item);
    });
  }

  updateTexts() {
    // Update all text elements with translations
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.getAttribute('data-translate');
      el.textContent = t(key);
    });
  }

  clearForm() {
    document.getElementById('transaction-form').reset();
  }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new BudgetApp();
});

// Make app available globally for onclick handlers
window.app = app;