/**
 * Chart Renderer Module  
 * Handles Chart.js integration and chart rendering
 * ~180 lines
 */
class ChartRenderer {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.themes = {
      light: {
        gridColor: 'rgba(0, 0, 0, 0.05)',
        textColor: '#5b7083',
        tooltipBg: 'rgba(255, 255, 255, 0.95)',
        tooltipText: '#14171a',
        line1: '#00BCD4',
        line2: '#FF5722',
        barBg: 'rgba(0, 188, 212, 0.8)'
      },
      dark: {
        gridColor: 'rgba(255, 255, 255, 0.08)',
        textColor: '#8899a6',
        tooltipBg: 'rgba(21, 32, 43, 0.95)',
        tooltipText: '#ffffff',
        line1: '#26C6DA',
        line2: '#FF7043',
        barBg: 'rgba(38, 198, 218, 0.8)'
      }
    };
  }

  updateChartTheme() {
    if (!this.dashboard.chart) return;
    const currentTheme = this.themes[this.dashboard.currentTheme] || this.themes.light;
    
    // Update scales
    this.dashboard.chart.options.scales.x.ticks.color = currentTheme.textColor;
    this.dashboard.chart.options.scales.y.ticks.color = currentTheme.textColor;
    this.dashboard.chart.options.scales.x.grid.color = currentTheme.gridColor;
    this.dashboard.chart.options.scales.y.grid.color = currentTheme.gridColor;
    
    if (this.dashboard.chart.options.scales.y1) {
      this.dashboard.chart.options.scales.y1.ticks.color = currentTheme.textColor;
      this.dashboard.chart.options.scales.y1.grid.color = 'transparent';
    }
    
    // Update plugins
    this.dashboard.chart.options.plugins.tooltip.backgroundColor = currentTheme.tooltipBg;
    this.dashboard.chart.options.plugins.tooltip.titleColor = currentTheme.tooltipText;
    this.dashboard.chart.options.plugins.tooltip.bodyColor = currentTheme.tooltipText;
    this.dashboard.chart.options.plugins.legend.labels.color = currentTheme.textColor;
    
    // Update datasets
    if (this.dashboard.chart.data.datasets && this.dashboard.chart.data.datasets.length > 0) {
      this.dashboard.chart.data.datasets[0].borderColor = currentTheme.line1;
      this.dashboard.chart.data.datasets[0].backgroundColor = this.dashboard.currentChartType === 'bar' ? currentTheme.barBg : `${currentTheme.line1}15`;
      if (this.dashboard.chart.data.datasets.length > 1) {
        this.dashboard.chart.data.datasets[1].borderColor = currentTheme.line2;
        this.dashboard.chart.data.datasets[1].backgroundColor = `${currentTheme.line2}15`;
      }
    }
    
    this.dashboard.chart.update();
  }

  createOrUpdateChart() {
    const canvas = this.dashboard.container.querySelector('#zd-main-chart');
    const chartTitle = this.dashboard.container.querySelector('#zd-chart-title');
    const lastUpdate = this.dashboard.container.querySelector('#zd-last-update');

    if (!canvas) return;

    const primary = this.dashboard.chartDataStore.primary;
    const comparisons = this.dashboard.chartDataStore.comparisons;
    const visibleComparisons = comparisons.filter(comp => comp.visible && comp.current && comp.current.length > 0);
    const hasVisibleComparisons = visibleComparisons.length > 0;

    if (!primary.current || primary.current.length === 0) {
      if (chartTitle) chartTitle.textContent = 'No data available';
      // Ensure loading is hidden if no data
      const loading = this.dashboard.container.querySelector('#zd-loading');
      if (loading) loading.style.display = 'none';
      return;
    }

    // Destroy existing chart
    if (this.dashboard.chart) {
      this.dashboard.chart.destroy();
    }

    // Update UI elements
    if (chartTitle) chartTitle.textContent = primary.title;
    if (lastUpdate) this.updateLastUpdate(primary.lastUpdate);
    this.updateHistoricalStats(primary.current);

    const currentTheme = this.themes[this.dashboard.currentTheme] || this.themes.light;
    
    // Get chart type configuration
    const chartTypeConfig = this.dashboard.chartTypesModule.getChartConfig(this.dashboard.currentChartType);
    
    // Calculate ranges
    const getRange = (data) => {
      if (!data || data.length === 0) return { min: 0, max: 0 };
      const values = data.map(item => parseFloat(item.y));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const padding = Math.max(.08 * range, .02 * Math.abs(max)); // Match zestra-dashboard.js logic
      return { min: min - padding, max: max + padding };
    };
    
    // Calculate the overall range for the primary Y-axis based on all visible data
    const allVisibleData = [primary.current, ...visibleComparisons.map(comp => comp.current)];
    const allValues = allVisibleData.flatMap(data => data.map(item => parseFloat(item.y))).filter(val => !isNaN(val));
    
    if (allValues.length === 0) {
      // Fallback if no visible data points
      const primaryRange = getRange(primary.current);
      var primaryRangeForScales = primaryRange;
    } else {
      const overallMin = Math.min(...allValues);
      const overallMax = Math.max(...allValues);
      const overallRange = overallMax - overallMin;
      const padding = Math.max(.08 * overallRange, .02 * Math.abs(overallMax)); // Match zestra-dashboard.js logic
      var primaryRangeForScales = { min: overallMin - padding, max: overallMax + padding };
    }
    
    // For multiple comparisons, we use a single Y-axis ('y').
    // The secondaryRange calculation is no longer needed for separate axes.
    // const primaryRange = getRange(primary.current);
    // const secondaryRange = hasSecondary ? getRange(secondary.current) : null;

    // Create datasets
    const datasets = [{
      label: primary.title,
      data: primary.current,
      borderColor: currentTheme.line1,
      backgroundColor: this.dashboard.currentChartType === 'bar' ? currentTheme.barBg : `${currentTheme.line1}15`,
      borderWidth: 3,
      // Use properties from the chart type configuration
      type: chartTypeConfig.type,
      tension: chartTypeConfig.tension,
      fill: chartTypeConfig.fill,
      pointRadius: chartTypeConfig.pointRadius,
      pointHoverRadius: chartTypeConfig.pointHoverRadius,
      yAxisID: 'y', // All datasets use the same Y-axis
    }];

    // Add a dataset for each visible comparison
    visibleComparisons.forEach((comp, index) => {
      // Secondary chart type is always 'line' for comparison
      const secondaryChartTypeConfig = this.dashboard.chartTypesModule.getChartConfig('line');
      // Cycle through theme colors for multiple comparisons
      const compColorKey = `line${index + 2}`; // line1 is primary, line2, line3, etc. for comparisons
      const compColor = currentTheme[compColorKey] || `hsl(${(index * 137.5) % 360}, 75%, 50%)`; // Fallback to generated color if theme runs out
      
      datasets.push({
        label: comp.title,
        data: comp.current,
        borderColor: compColor, // Use a different color for each comparison
        backgroundColor: `${compColor}15`, // Lighter fill color
        borderWidth: 3,
        fill: secondaryChartTypeConfig.fill,
        type: secondaryChartTypeConfig.type,
        yAxisID: 'y', // All datasets use the same Y-axis
        pointRadius: secondaryChartTypeConfig.pointRadius,
        pointHoverRadius: secondaryChartTypeConfig.pointHoverRadius,
        tension: secondaryChartTypeConfig.tension
      });
    });

    // Create scales
    const scales = {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          displayFormats: { month: 'MMM yyyy' }
        },
        grid: { color: currentTheme.gridColor, drawBorder: false },
        ticks: {
          color: currentTheme.textColor,
          maxTicksLimit: 10,
          font: { size: 11, weight: '500' }
        },
        border: { display: false }
      },
      y: {
        min: primaryRangeForScales.min,
        max: primaryRangeForScales.max,
        grid: { color: currentTheme.gridColor, drawBorder: false },
        ticks: {
          color: currentTheme.textColor,
          font: { size: 11, weight: '500' },
          callback: function(value) { return value.toLocaleString(); }
        },
        position: 'left',
        border: { display: false }
      }
    };

    // No longer adding secondary Y-axes (y1, etc.) as all data uses the primary Y-axis 'y'

    // Create chart
    const ctx = canvas.getContext('2d');
    this.dashboard.chart = new Chart(ctx, {
      type: this.dashboard.currentChartType === 'bar' ? 'bar' : 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: datasets.length > 1, // Show legend if there's more than one dataset (primary + comparisons)
            position: 'top',
            align: 'start',
            labels: {
              color: currentTheme.textColor,
              usePointStyle: true,
              padding: 20,
              font: { size: 12, weight: '600' }
            }
          },
          tooltip: {
            backgroundColor: currentTheme.tooltipBg,
            titleColor: currentTheme.tooltipText,
            bodyColor: currentTheme.tooltipText,
            borderWidth: 0,
            cornerRadius: 12,
            padding: 16,
            titleFont: { size: 13, weight: '600' },
            bodyFont: { size: 12, weight: '500' },
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales,
        elements: {
          point: { hoverBorderWidth: 3 }
        }
      }
    });

    // Ensure loading is hidden after chart creation
    const loading = this.dashboard.container.querySelector('#zd-loading');
    if (loading) loading.style.display = 'none';
  }

  updateHistoricalStats(data) {
    const change3M = this.dashboard.container.querySelector('#zd-3m-change');
    const change6M = this.dashboard.container.querySelector('#zd-6m-change');
    const change1Y = this.dashboard.container.querySelector('#zd-1y-change');

    if (!data || data.length === 0) {
      if (change3M) change3M.textContent = '--';
      if (change6M) change6M.textContent = '--';
      if (change1Y) change1Y.textContent = '--';
      return;
    }

    const currentDate = new Date();
    const current = data[data.length - 1].y;

    // Calculate dates for 3M, 6M, 1Y ago
    const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, currentDate.getDate());
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, currentDate.getDate());
    const oneYearAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 12, currentDate.getDate());

    // Find closest values
    const findValueForDate = (targetDate) => {
      let closest = data[0];
      let minDiff = Math.abs(new Date(data[0].x) - targetDate);

      for (let i = 1; i < data.length; i++) {
        const diff = Math.abs(new Date(data[i].x) - targetDate);
        if (diff < minDiff) {
          minDiff = diff;
          closest = data[i];
        }
      }
      return closest.y;
    };

    const val3M = findValueForDate(threeMonthsAgo);
    const val6M = findValueForDate(sixMonthsAgo);
    const val1Y = findValueForDate(oneYearAgo);

    // Calculate percentage changes
    const change3MPercent = ((current - val3M) / Math.abs(val3M)) * 100;
    const change6MPercent = ((current - val6M) / Math.abs(val6M)) * 100;
    const change1YPercent = ((current - val1Y) / Math.abs(val1Y)) * 100;

    // Update DOM elements
    if (change3M) {
      change3M.textContent = `${change3MPercent >= 0 ? '+' : ''}${change3MPercent.toFixed(2)}%`;
      change3M.style.color = change3MPercent >= 0 ? '#4CAF50' : '#F44336';
    }

    if (change6M) {
      change6M.textContent = `${change6MPercent >= 0 ? '+' : ''}${change6MPercent.toFixed(2)}%`;
      change6M.style.color = change6MPercent >= 0 ? '#4CAF50' : '#F44336';
    }

    if (change1Y) {
      change1Y.textContent = `${change1YPercent >= 0 ? '+' : ''}${change1YPercent.toFixed(2)}%`;
      change1Y.style.color = change1YPercent >= 0 ? '#4CAF50' : '#F44336';
    }
  }

  updateLastUpdate(dateStr) {
    const lastUpdate = this.dashboard.container.querySelector('#zd-last-update');
    if (!lastUpdate || !dateStr) return;

    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let updateText = 'Last updated: ';
    if (diffDays === 1) {
      updateText += 'Yesterday';
    } else if (diffDays < 7) {
      updateText += `${diffDays} days ago`;
    } else {
      updateText += date.toLocaleDateString();
    }

    lastUpdate.textContent = updateText;
  }
}

export default ChartRenderer;