/**
 * UI Controls Module
 * Handles miscellaneous UI controls and interactions
 * ~60 lines
 */
class UIControls {
  constructor(dashboard) {
    this.dashboard = dashboard;
  }

  bindFullscreenEvents() {
    const fullscreenToggle = this.dashboard.container.querySelector('#zd-fullscreen-toggle');
    if (fullscreenToggle) {
      fullscreenToggle.addEventListener('click', () => {
        const dashboard = this.dashboard.container.querySelector('.zc-zestra-dashboard');
        if (!document.fullscreenElement) {
          dashboard.requestFullscreen().catch(err => console.error('Fullscreen error:', err));
        } else {
          document.exitFullscreen();
        }
      });
    }
  }

  bindChartTypeEvents() {
    const lineChart = this.dashboard.container.querySelector('#zd-line-chart');
    const barChart = this.dashboard.container.querySelector('#zd-bar-chart');

    if (lineChart) {
      lineChart.addEventListener('click', () => {
        this.dashboard.container.querySelectorAll('.zd-chart-type').forEach(btn => btn.classList.remove('active'));
        lineChart.classList.add('active');
        this.dashboard.currentChartType = 'line';
        this.dashboard.chartRenderer.createOrUpdateChart();
      });
    }

    if (barChart) {
      barChart.addEventListener('click', () => {
        this.dashboard.container.querySelectorAll('.zd-chart-type').forEach(btn => btn.classList.remove('active'));
        barChart.classList.add('active');
        this.dashboard.currentChartType = 'bar';
        this.dashboard.chartRenderer.createOrUpdateChart();
      });
    }
  }
}

export default UIControls;