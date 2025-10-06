/**
 * Timeframe Module
 * Handles timeframe filtering and controls
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

  /**
   * Applies the date range filter to a given full dataset.
   * @param {string} rangeInYears E.g., '1', '5', 'all', '0.5'
   * @param {Array<Object>} fullData The full data array (optional for dashboard update)
   * @returns {Array<Object>} The filtered data array
   */
  applyFilter(rangeInYears, fullData = null) {
    const filterData = (data) => {
      if (data.length === 0) return [];
      if (rangeInYears === 'all') return [...data];

      const months = parseFloat(rangeInYears) * 12;
      const lastDataPointDate = data[data.length - 1].x;
      const startDate = new Date(lastDataPointDate);
      startDate.setMonth(startDate.getMonth() - months);

      return data.filter(d => d.x >= startDate);
    };

    // If passed a standalone dataset (used when fetching comparison data), return filtered data
    if (fullData) {
        return filterData(fullData);
    }
    
    // --- Update Dashboard's ChartDataStore ---
    
    // 1. Primary
    if (this.dashboard.chartDataStore.primary.full.length > 0) {
      this.dashboard.chartDataStore.primary.current = filterData(this.dashboard.chartDataStore.primary.full);
    }

    // 2. Comparisons
    this.dashboard.chartDataStore.comparisons.forEach(comp => {
      if (comp.full.length > 0) {
        comp.current = filterData(comp.full);
      }
    });

    this.dashboard.chartRenderer.createOrUpdateChart();
  }
}

export default TimeframeModule;
