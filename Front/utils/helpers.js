export function fmt(amount) {
    return Number(amount).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND';
}

export function uid(prefix = 'id') {
    return prefix + '_' + Date.now() + Math.random().toString(36).substr(2, 5);
}

export function getCU() {
    return window.CU || JSON.parse(sessionStorage.getItem('budgetcollab_user')) || { role: 'admin', id: '1' };
}

export function resolveColor(colorStr) {
    if (!colorStr) return '#6c757d';
    if (colorStr.startsWith('var(')) {
        const varName = colorStr.substring(4, colorStr.length - 1).trim();
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#6c757d';
    }
    return colorStr;
}
