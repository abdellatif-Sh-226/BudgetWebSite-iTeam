// Multi-language support for the Budget Website
// Object containing translations for different languages

const translations = {
  en: {
    // General
    appTitle: "Budget Tracker",
    welcome: "Welcome to your personal budget manager",

    // Navigation
    home: "Home",
    transactions: "Transactions",
    settings: "Settings",

    // Balance
    currentBalance: "Current Balance",
    totalIncome: "Total Income",
    totalExpenses: "Total Expenses",

    // Transaction Form
    addTransaction: "Add Transaction",
    transactionType: "Type",
    income: "Income",
    expense: "Expense",
    amount: "Amount",
    description: "Description",
    add: "Add",
    cancel: "Cancel",

    // Transaction List
    recentTransactions: "Recent Transactions",
    date: "Date",
    type: "Type",
    desc: "Description",
    amt: "Amount",
    noTransactions: "No transactions yet",

    // Messages
    transactionAdded: "Transaction added successfully",
    invalidAmount: "Please enter a valid amount",
    descriptionRequired: "Description is required",

    // Buttons
    clearAll: "Clear All",
    export: "Export Data"
  },
  es: {
    // General
    appTitle: "Rastreador de Presupuesto",
    welcome: "Bienvenido a tu gestor personal de presupuesto",

    // Navigation
    home: "Inicio",
    transactions: "Transacciones",
    settings: "Configuración",

    // Balance
    currentBalance: "Saldo Actual",
    totalIncome: "Ingresos Totales",
    totalExpenses: "Gastos Totales",

    // Transaction Form
    addTransaction: "Agregar Transacción",
    transactionType: "Tipo",
    income: "Ingreso",
    expense: "Gasto",
    amount: "Monto",
    description: "Descripción",
    add: "Agregar",
    cancel: "Cancelar",

    // Transaction List
    recentTransactions: "Transacciones Recientes",
    date: "Fecha",
    type: "Tipo",
    desc: "Descripción",
    amt: "Monto",
    noTransactions: "Aún no hay transacciones",

    // Messages
    transactionAdded: "Transacción agregada exitosamente",
    invalidAmount: "Por favor ingrese un monto válido",
    descriptionRequired: "La descripción es requerida",

    // Buttons
    clearAll: "Limpiar Todo",
    export: "Exportar Datos"
  }
  // Add more languages as needed, e.g., fr, ar, etc.
};

// Current language (can be set by user preference, default to 'en')
let currentLanguage = 'en';

// Function to get translated text
function t(key) {
  return translations[currentLanguage][key] || key;
}

// Function to set language
function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    // Re-render the UI if needed
    updateUI();
  }
}

// Function to update UI with current language (to be implemented in app.js)
function updateUI() {
  // This will be called to refresh text elements
}