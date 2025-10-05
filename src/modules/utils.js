// utils.js - Helper functions for the dashboard

// DOM Query helpers
export function qs(parent, selector) {
  return parent.querySelector(selector);
}

export function qsa(parent, selector) {
  return parent.querySelectorAll(selector);
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Format date helper
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
  
  let text = 'Last updated: ';
  if (diffDays === 1) text += 'Yesterday';
  else if (diffDays < 7) text += `${diffDays} days ago`;
  else text += date.toLocaleDateString();
  
  return text;
}

// Parse value to number
export function parseValue(val) {
  if (val === null || val === undefined) return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
}

// Calculate percentage change
export function calculateChange(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Format percentage
export function formatPercentage(value, decimals = 2) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// Get color for percentage change
export function getChangeColor(value) {
  return value >= 0 ? '#4CAF50' : '#F44336';
}

// Find nearest data point by date
export function findNearestDataPoint(dataArray, targetDate) {
  if (!dataArray || dataArray.length === 0) return null;
  
  let closest = dataArray[0];
  let minDiff = Math.abs(new Date(dataArray[0].x) - targetDate);
  
  for (let i = 1; i < dataArray.length; i++) {
    const diff = Math.abs(new Date(dataArray[i].x) - targetDate);
    if (diff < minDiff) {
      minDiff = diff;
      closest = dataArray[i];
    }
  }
  
  return closest;
}

// Filter data by timeframe
export function filterDataByTimeframe(data, range) {
  if (!data || data.length === 0) return data;
  
  const now = new Date();
  let startDate = new Date(now);
  
  switch (range) {
    case '3m':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case '5y':
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
    case '10y':
      startDate.setFullYear(startDate.getFullYear() - 10);
      break;
    case 'all':
    default:
      return data;
  }
  
  return data.filter(d => new Date(d.x) >= startDate);
}

// Create loader element
export function showLoader(container, selector) {
  const element = qs(container, selector);
  if (!element) return;
  
  const loader = document.createElement('div');
  loader.className = 'zd-loader';
  loader.innerHTML = '<div class="zd-spinner"></div>';
  element.appendChild(loader);
}

// Remove loader element
export function hideLoader(container, selector) {
  const element = qs(container, selector);
  if (!element) return;
  
  const loader = element.querySelector('.zd-loader');
  if (loader) loader.remove();
}

// Show error message
export function showError(container, message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'zd-error-message';
  errorDiv.textContent = message;
  container.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Truncate text
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Escape HTML
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Get theme colors
export function getThemeColors(theme) {
  const themes = {
    light: {
      gridColor: 'rgba(0, 0, 0, 0.05)',
      textColor: '#5b7083',
      tooltipBg: 'rgba(255, 255, 255, 0.95)',
      tooltipText: '#14171a',
      line1: '#00BCD4',
      line2: '#FF5722',
      barBg: 'rgba(0, 188, 212, 0.8)'
    },
    dark: {
      gridColor: 'rgba(255, 255, 255, 0.08)',
      textColor: '#8899a6',
      tooltipBg: 'rgba(21, 32, 43, 0.95)',
      tooltipText: '#ffffff',
      line1: '#26C6DA',
      line2: '#FF7043',
      barBg: 'rgba(38, 198, 218, 0.8)'
    }
  };
  
  return themes[theme] || themes.light;
}
