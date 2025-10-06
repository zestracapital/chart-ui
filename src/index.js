// Main entry point - imports all modules and styles
import './styles/dashboard.css';
import Dashboard from './modules/Dashboard.js';
import DataFetcher from './modules/DataFetcher.js'; 
import ChartRenderer from './modules/ChartRenderer.js';
import SearchModule from './modules/SearchModule.js';
import ComparisonModule from './modules/ComparisonModule.js';
import TimeframeModule from './modules/TimeframeModule.js';
import ThemeModule from './modules/ThemeModule.js';
import UIControls from './modules/UIControls.js';
import DashboardManager from './modules/DashboardManager.js';

// Export the global dashboard manager to window
window.ZCZestraDashboard = DashboardManager;

// Auto-initialize dashboards on page load
const initializedContainers = new Set();

function initializeDashboardContainers() {
  const containers = document.querySelectorAll('.zc-zestra-dashboard-container[data-config]');
  
  containers.forEach(container => {
    if (initializedContainers.has(container.id)) {
      return; // Skip if already initialized
    }
    try {
      const config = JSON.parse(container.dataset.config);
      const instance = window.ZCZestraDashboard.init(container.id, config);
      if (instance) {
        initializedContainers.add(container.id);
      }
    } catch (error) {
      console.error('Auto-initialization failed for container:', container.id, error);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboardContainers);
} else {
  initializeDashboardContainers();
}