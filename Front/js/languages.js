// Translation Logic
let currentLanguage = localStorage.getItem('budgetcollab_lang') || 'fr';

const translations = {
  fr: typeof langFR !== 'undefined' ? langFR : {},
  en: typeof langEN !== 'undefined' ? langEN : {}
};

function t(key) {
  const dict = translations[currentLanguage];
  if (dict && dict[key]) {
    return dict[key];
  }
  return key; // fallback to key if not found
}

function updateUI() {
  const elements = document.querySelectorAll('[data-translate]');
  elements.forEach(el => {
    const key = el.getAttribute('data-translate');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t(key);
    } else {
        el.textContent = t(key);
    }
  });
  
  // Update switcher buttons
  const btns = document.querySelectorAll('.lang-btn');
  btns.forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('btnLang' + currentLanguage.toUpperCase());
  if (activeBtn) activeBtn.classList.add('active');
}

function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('budgetcollab_lang', lang);
    updateUI();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateUI();
});
