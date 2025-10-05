/**
 * Zestra Capital Chart UI - Main Entry Point
 * Modular Dashboard JavaScript for WordPress Integration
 */

// Import CSS
import './styles/dashboard.css';

// Import all modules
import { Dashboard } from './modules/Dashboard.js';
import { fetchEconomicData, searchIndicators } from './modules/DataFetcher.js';
import { createOrUpdateChart, updateHistoricalStats, updateLastUpdate } from './modules/ChartRenderer.js';
import { bindUIControls } from './modules/UIControls.js';
import * as DashboardManager from './modules/DashboardManager.js';
import * as utils from './modules/utils.js';

// Export for global access and module usage
export { Dashboard, DashboardManager, utils };

// Default export is DashboardManager for easy import
export default DashboardManager;

// Auto-initialize on page load and expose to window for WordPress plugin
if (typeof window !== 'undefined') {
  // Main API
  window.ZestraDashboard = DashboardManager;
  
  // Also expose individual modules if needed
  window.ZCChart = {
    Dashboard,
    DashboardManager,
    utils,
    // Helper functions
    init: DashboardManager.initZestraDashboard,
    getInstance: DashboardManager.getDashboardInstance,
    destroy: DashboardManager.destroyDashboard
  };
}
