/**
 * Zestra Capital Chart UI - Main Entry Point
 * Modular Dashboard JavaScript for WordPress Integration
 */

// Import CSS
import './styles/dashboard.css';

// Import modules
import ZestraDashboard from './modules/Dashboard';
import DashboardManager from './modules/DashboardManager';

// Export for global access
export default DashboardManager;

// Auto-initialize on page load
if (typeof window !== 'undefined') {
    window.ZCZestraDashboard = DashboardManager;
}
