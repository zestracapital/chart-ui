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
      console.log('Zestra Dashboard initialized:', containerId);
      return instance;
    } catch (error) {
      console.error('Zestra Dashboard initialization failed:', error);
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

// Export singleton instance
export default new DashboardManager();