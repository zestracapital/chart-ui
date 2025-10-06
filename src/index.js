// Main entry point - imports all modules and styles
import './styles/dashboard.css';
import Dashboard from './modules/Dashboard.js';
import DataFetcher from './modules/DataFetcher.js'; 
import ChartRenderer from './modules/ChartRenderer.js';
import SearchModule from './modules/SearchModule.js';
import ComparisonModule from './modules/ComparisonModule.js';
import TimeframeModule from './modules/TimeframeModule.js';
import ThemeModule from './modules/ThemeModule.js';
import DashboardManager from './modules/DashboardManager.js';

// The global window.ZCZestraDashboard and auto-initialization logic 
// is now handled within DashboardManager.js according to zestra-dashboard.js

// Export the global dashboard manager to window (this is now redundant 
// as DashboardManager.js handles it, but keeping for clarity if needed)
// window.ZCZestraDashboard = DashboardManager;