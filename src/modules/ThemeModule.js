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
        const dashboard = this.dashboard.container.querySelector('.zc-zestra-dashboard');
        dashboard.classList.toggle('dark-theme');
        const isDark = dashboard.classList.contains('dark-theme');

        const sunIcon = this.dashboard.container.querySelector('.zd-sun-icon');
        const moonIcon = this.dashboard.container.querySelector('.zd-moon-icon');
        if (sunIcon) sunIcon.style.display = isDark ? 'none' : 'block';
        if (moonIcon) moonIcon.style.display = isDark ? 'block' : 'none';

        this.dashboard.currentTheme = isDark ? 'dark' : 'light';
        if (this.dashboard.chart) this.dashboard.chartRenderer.createOrUpdateChart();
      });
    }
  }

  setTheme(theme) {
    const dashboard = this.dashboard.container.querySelector('.zc-zestra-dashboard');
    const sunIcon = this.dashboard.container.querySelector('.zd-sun-icon');
    const moonIcon = this.dashboard.container.querySelector('.zd-moon-icon');

    if (theme === 'dark') {
      dashboard.classList.add('dark-theme');
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    } else {
      dashboard.classList.remove('dark-theme');
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    }

    this.dashboard.currentTheme = theme;
    if (this.dashboard.chart) this.dashboard.chartRenderer.createOrUpdateChart();
  }

  getCurrentTheme() {
    const dashboard = this.dashboard.container.querySelector('.zc-zestra-dashboard');
    return dashboard.classList.contains('dark-theme') ? 'dark' : 'light';
  }
}

export default ThemeModule;