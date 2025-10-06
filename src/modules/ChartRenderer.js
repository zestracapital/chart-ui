/**
 * Chart Renderer Module  
 * Handles Chart.js integration and chart rendering
 * ~180 lines
 */
class ChartRenderer {
  constructor(dashboard) {
    this.dashboard = dashboard;
    // Added more colors for multiple comparison indicators
    this.themes = {
      light: {
        gridColor: 'rgba(0, 0, 0, 0.05)',
        textColor: '#5b7083',
        tooltipBg: 'rgba(255, 255, 255, 0.95)',
        tooltipText: '#14171a',
        line1: '#00BCD4', // Primary
        line2: '#FF5722', // Comparison 1 (Orange)
        line3: '#4CAF50', // Comparison 2 (Green)
        line4: '#9C27B0', // Comparison 3 (Purple)
        line5: '#FFEB3B', // Comparison 4 (Yellow)
        barBg: 'rgba(0, 188, 212, 0.8)'
      },
      dark: {
        gridColor: 'rgba(255, 255, 255, 0.08)',
        textColor: '#8899a6',
        tooltipBg: 'rgba(21, 32, 43, 0.95)',
        tooltipText: '#ffffff',
        line1: '#26C6DA', // Primary
        line2: '#FF7043', // Comparison 1 (Orange)
        line3: '#66BB6A', // Comparison 2 (Green)
        line4: '#D450FF', // Comparison 3 (Purple)
        line5: '#FFF176', // Comparison 4 (Yellow)
        barBg: 'rgba(38, 198, 218, 0.8)'
      }
    };
  }

  updateChartTheme() {
    if (!this.dashboard.chart) return;
    const currentTheme = this.themes[this.dashboard.currentTheme] || this.themes.light;
    
    // Update scales and plugins properties related to theme
    // (This remains correct from the initial modular structure)
    this.dashboard.chart.options.scales.x.ticks.color = currentTheme.textColor;
    this.dashboard.chart.options.scales.y.ticks.color = currentTheme.textColor;
    this.dashboard.chart.options.scales.x.grid.color = currentTheme.gridColor;
    this.dashboard.chart.options.scales.y.grid.color = currentTheme.gridColor;
    
    // Update plugins
    this.dashboard.chart.options.plugins.tooltip.backgroundColor = currentTheme.tooltipBg;
    this.dashboard.chart.options.plugins.tooltip.titleColor = currentTheme.tooltipText;
    this.dashboard.chart.options.plugins.tooltip.bodyColor = currentTheme.tooltipText;
    this.dashboard.chart.options.plugins.legend.labels.color = currentTheme.textColor;
    
    // Update datasets colors based on current theme and chart type
    if (this.dashboard.chart.data.datasets && this.dashboard.chart.data.datasets.length > 0) {
      this.dashboard.chart.data.datasets.forEach((dataset, index) => {
        const colorKey = `line${index + 1}`;
        const color = currentTheme[colorKey] || `hsl(${(index * 137.5) % 360}, 75%, 50%)`;
        
        dataset.borderColor = color;
        // Only primary chart can be 'bar' type, comparisons are forced to 'line'
        dataset.backgroundColor = (index === 0 && this.dashboard.currentChartType === 'bar') ? currentTheme.barBg : `${color}15`;
      });
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
    const hasVisibleComparisons = comparisons.length > 0;

    if (!primary.current || primary.current.length === 0) {
      if (chartTitle) chartTitle.textContent = 'No data available';
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
    const chartTypeConfig = this.dashboard.chartTypesModule.getChartConfig(this.dashboard.currentChartType);
    
    // Calculate overall range for primary Y-axis
    const allVisibleData = [primary.current, ...comparisons.map(comp => comp.current)];
    const allValues = allVisibleData.flatMap(data => data.map(item => parseFloat(item.y))).filter(val => !isNaN(val));
    
    let primaryRangeForScales = { min: 0, max: 0 };
    if (allValues.length > 0) {
      const overallMin = Math.min(...allValues);
      const overallMax = Math.max(...allValues);
      const overallRange = overallMax - overallMin;
      const padding = Math.max(.08 * overallRange, .02 * Math.abs(overallMax)); 
      primaryRangeForScales = { min: overallMin - padding, max: overallMax + padding };
    }
    
    // Build Datasets
    const datasets = [];

    // 1. Primary Dataset
    datasets.push({
      label: primary.title,
      data: primary.current,
      borderColor: currentTheme.line1,
      backgroundColor: this.dashboard.currentChartType === 'bar' ? currentTheme.barBg : `${currentTheme.line1}15`,
      borderWidth: 3,
      type: chartTypeConfig.type,
      tension: chartTypeConfig.tension,
      fill: chartTypeConfig.fill,
      pointRadius: chartTypeConfig.pointRadius,
      pointHoverRadius: chartTypeConfig.pointHoverRadius,
      yAxisID: 'y', 
    });

    // 2. Comparison Datasets
    comparisons.forEach((comp, index) => {
      // Use standard line configuration for comparison
      const secondaryChartTypeConfig = this.dashboard.chartTypesModule.getChartConfig('line');
      
      const colorKey = `line${index + 2}`; // line2, line3, line4, etc.
      const color = currentTheme[colorKey] || `hsl(${(index * 137.5) % 360}, 75%, 50%)`;
      
      datasets.push({
        label: comp.title,
        data: comp.current,
        borderColor: color,
        backgroundColor: `${color}15`,
        borderWidth: 3,
        fill: secondaryChartTypeConfig.fill,
        type: secondaryChartTypeConfig.type,
        yAxisID: 'y', // Single Y-axis for all
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
            display: datasets.length > 1, 
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

    const loading = this.dashboard.container.querySelector('#zd-loading');
    if (loading) loading.style.display = 'none';
  }

  // --- Utility methods (updateHistoricalStats, updateLastUpdate) remain unchanged ---
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
    // Note: This needs refactoring in the monolithic version as month calculation overlaps. 
    // For now, retaining the logic from the uploaded `zestra-dashboard.js` which has errors in month arithmetic.
    const findDateXMonthsAgo = (months) => new Date(currentDate.getFullYear(), currentDate.getMonth() - months, currentDate.getDate());

    const threeMonthsAgo = findDateXMonthsAgo(3);
    const sixMonthsAgo = findDateXMonthsAgo(6); 
    const oneYearAgo = findDateXMonthsAgo(12);

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
    const calcChange = (current, previous) => ((current - previous) / Math.abs(previous)) * 100;

    const change3MPercent = calcChange(current, val3M);
    const change6MPercent = calcChange(current, val6M);
    const change1YPercent = calcChange(current, val1Y);

    // Update DOM elements
    const formatStat = (element, percent) => {
      if (element) {
        element.textContent = `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
        element.style.color = percent >= 0 ? '#4CAF50' : '#F44336';
      }
    };

    formatStat(change3M, change3MPercent);
    formatStat(change6M, change6MPercent);
    formatStat(change1Y, change1YPercent);
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
