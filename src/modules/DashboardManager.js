// DashboardManager.js - Global dashboard instance management
import { Dashboard } from './Dashboard.js';

// Global registry of dashboard instances
const dashboardInstances = new Map();

/**
 * Get or create a dashboard instance for a specific container
 * @param {HTMLElement} container - The DOM container element
 * @param {Object} options - Dashboard configuration options
 * @returns {Dashboard} The dashboard instance
 */
export function getDashboardInstance(container, options = {}) {
  // Use container as key (or create unique id)
  const containerId = container.id || generateUniqueId();
  
  if (!container.id) {
    container.id = containerId;
  }
  
  // Return existing instance if found
  if (dashboardInstances.has(containerId)) {
    return dashboardInstances.get(containerId);
  }
  
  // Create new instance
  const dashboard = new Dashboard(container, options);
  dashboardInstances.set(containerId, dashboard);
  
  return dashboard;
}

/**
 * Initialize dashboard from global scope (for WordPress plugin)
 * @param {string} containerId - ID of the container element
 * @param {Object} options - Dashboard configuration options
 */
export function initZestraDashboard(containerId, options = {}) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return null;
  }
  
  return getDashboardInstance(container, options);
}

/**
 * Destroy a dashboard instance
 * @param {string|HTMLElement} containerOrId - Container element or ID
 */
export function destroyDashboard(containerOrId) {
  const containerId = typeof containerOrId === 'string' 
    ? containerOrId 
    : containerOrId.id;
  
  const dashboard = dashboardInstances.get(containerId);
  
  if (dashboard) {
    // Cleanup chart
    if (dashboard.chart) {
      dashboard.chart.destroy();
    }
    
    // Remove event listeners
    // (individual modules should handle their own cleanup)
    
    // Remove from registry
    dashboardInstances.delete(containerId);
  }
}

/**
 * Get all active dashboard instances
 * @returns {Array<Dashboard>} Array of dashboard instances
 */
export function getAllDashboards() {
  return Array.from(dashboardInstances.values());
}

/**
 * Check if a dashboard instance exists for a container
 * @param {string|HTMLElement} containerOrId - Container element or ID
 * @returns {boolean}
 */
export function hasDashboard(containerOrId) {
  const containerId = typeof containerOrId === 'string' 
    ? containerOrId 
    : containerOrId.id;
  
  return dashboardInstances.has(containerId);
}

/**
 * Generate a unique ID for containers without one
 * @returns {string} Unique identifier
 */
function generateUniqueId() {
  return `zestra-dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Refresh all dashboard instances
 */
export function refreshAllDashboards() {
  dashboardInstances.forEach(dashboard => {
    if (dashboard.currentEconomicIndicator) {
      dashboard.fetchEconomicData(dashboard.currentEconomicIndicator.seriesId);
    }
  });
}

/**
 * Expose to global window object for WordPress plugin compatibility
 */
if (typeof window !== 'undefined') {
  window.ZestraDashboard = {
    init: initZestraDashboard,
    getInstance: getDashboardInstance,
    destroy: destroyDashboard,
    getAll: getAllDashboards,
    has: hasDashboard,
    refreshAll: refreshAllDashboards
  };
}
