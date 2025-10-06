/**
 * Timeframe Module
 * Handles timeframe filtering and controls
 * ~80 lines  
 */
class TimeframeModule {
  constructor(dashboard) {
    this.dashboard = dashboard;
  }

  bindEvents() {
    const timeframeButtons = this.dashboard.container.querySelectorAll('.zd-tf-btn');
    timeframeButtons.forEach(button => {
      button.addEventListener('click', () => {
        timeframeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.applyFilter(button.dataset.range);
      });
    });
  }

  applyFilter(rangeInYears) {
    const filterData = (fullData) => {
      if (fullData.length === 0) return [];
      if (rangeInYears === 'all') return [...fullData];

      const months = parseFloat(rangeInYears) * 12;
      const lastDataPointDate = fullData[fullData.length - 1].x;
      const startDate = new Date(lastDataPointDate);
      startDate.setMonth(startDate.getMonth() - months);

      return fullData.filter(d => d.x >= startDate);
    };

    if (this.dashboard.chartDataStore.primary.full.length > 0) {
      this.dashboard.chartDataStore.primary.current = filterData(this.dashboard.chartDataStore.primary.full);
    }

    if (this.dashboard.chartDataStore.secondary.full.length > 0) {
      this.dashboard.chartDataStore.secondary.current = filterData(this.dashboard.chartDataStore.secondary.full);
    }

    this.dashboard.chartRenderer.createOrUpdateChart();
  }
}

export default TimeframeModule;