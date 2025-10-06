/**
 * Theme Module
 * Handles theme switching and visual appearance
 * ~70 lines
 */
class ThemeModule {
  constructor(dashboard) {
    this.dashboard = dashboard;
  }

  bindEvents() {
    const themeToggle = this.dashboard.container.querySelector('#zd-theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = this.dashboard.currentTheme !== 'dark';
        this.setTheme(isDark ? 'dark' : 'light');
      });
    }
  }

  setTheme(theme) {
    const dashboardEl = this.dashboard.container.querySelector('.zc-zestra-dashboard');
    const sunIcon = this.dashboard.container.querySelector('.zd-sun-icon');
    const moonIcon = this.dashboard.container.querySelector('.zd-moon-icon');

    if (theme === 'dark') {
      dashboardEl.classList.add('dark-theme');
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    } else {
      dashboardEl.classList.remove('dark-theme');
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    }

    this.dashboard.currentTheme = theme;
    if (this.dashboard.chart) this.dashboard.chartRenderer.updateChartTheme(); // Use updateChartTheme for just color change
  }

  getCurrentTheme() {
    const dashboardEl = this.dashboard.container.querySelector('.zc-zestra-dashboard');
    return dashboardEl.classList.contains('dark-theme') ? 'dark' : 'light';
  }
}

export default ThemeModule;
