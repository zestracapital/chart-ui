import Dashboard from './Dashboard.js';

/**
 * Dashboard Manager
 * Global instance management and initialization
 * ~100 lines
 */
class DashboardManager {
  constructor() {
    this.instances = new Map();
  }

  init(containerId, config = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Zestra Dashboard: Container not found:', containerId);
      return false;
    }

    // Prevent duplicate initialization
    if (this.instances.has(containerId)) {
      console.warn('Zestra Dashboard: Already initialized for container:', containerId);
      return this.instances.get(containerId);
    }

    try {
      const instance = new Dashboard(container, config);
      this.instances.set(containerId, instance);
      console.log('Zestra Dashboard (Modular) initialized:', containerId);
      return instance;
    } catch (error) {
      console.error('Zestra Dashboard (Modular) initialization failed:', error);
      return false;
    }
  }

  destroy(containerId) {
    const instance = this.instances.get(containerId);
    if (instance) {
      instance.destroy();
      this.instances.delete(containerId);
    }
  }

  getInstance(containerId) {
    return this.instances.get(containerId);
  }

  getAllInstances() {
    return Array.from(this.instances.values());
  }

  destroyAll() {
    this.instances.forEach((instance, containerId) => {
      this.destroy(containerId);
    });
  }
}

// Create the global object like in zestra-dashboard.js
const globalManager = new DashboardManager();

// Assign to window object like in zestra-dashboard.js
window.ZCZestraDashboard = {
  instances: new Map(),
  init: function(containerId, config = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Zestra Dashboard: Container not found:', containerId);
      return false;
    }

    if (this.instances.has(containerId)) {
      console.warn('Zestra Dashboard: Already initialized for container:', containerId);
      return this.instances.get(containerId);
    }

    try {
      const instance = new Dashboard(container, config);
      this.instances.set(containerId, instance);
      console.log('Zestra Dashboard (Modular) initialized:', containerId);
      return instance;
    } catch (error) {
      console.error('Zestra Dashboard (Modular) initialization failed:', error);
      return false;
    }
  },
  destroy: function(containerId) {
    const instance = this.instances.get(containerId);
    if (instance) {
      instance.destroy();
      this.instances.delete(containerId);
    }
  }
};

// Auto-initialization logic from zestra-dashboard.js
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

export default globalManager;