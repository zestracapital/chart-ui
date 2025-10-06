/**
 * Chart Renderer Module  
 * Handles Chart.js integration and chart rendering
 */
class ChartRenderer {
  constructor(dashboard) {
    this.dashboard = dashboard;
    // Expanded color palette for up to 10 distinct comparison lines
    this.themes = {
      light: {
        gridColor: 'rgba(0, 0, 0, 0.05)',
        textColor: '#5b7083',
        tooltipBg: 'rgba(255, 255, 255, 0.95)',
        tooltipText: '#14171a',
        line1: '#00BCD4', // Primary - Teal
        line2: '#FF5722', // Comp 1 - Orange
        line3: '#4CAF50', // Comp 2 - Green
        line4: '#9C27B0', // Comp 3 - Purple
        line5: '#FFEB3B', // Comp 4 - Yellow
        line6: '#008CFF', // Comp 5 - Blue
        line7: '#FF0077', // Comp 6 - Pink
        line8: '#8D6E63', // Comp 7 - Brown
        line9: '#FF9800', // Comp 8 - Deep Orange
        line10: '#009688', // Comp 9 - Cyan
        barBg: 'rgba(0, 188, 212, 0.8)'
      },
      dark: {
        gridColor: 'rgba(255, 255, 255, 0.08)',
        textColor: '#8899a6',
        tooltipBg: 'rgba(21, 32, 43, 0.95)',
        tooltipText: '#ffffff',
        line1: '#26C6DA', // Primary - Cyan
        line2: '#FF7043', // Comp 1 - Coral
        line3: '#66BB6A', // Comp 2 - Light Green
        line4: '#D450FF', // Comp 3 - Light Purple
        line5: '#FFF176', // Comp 4 - Light Yellow
        line6: '#509EFF', // Comp 5 - Light Blue
        line7: '#FF50A5', // Comp 6 - Light Pink
        line8: '#A1887F', // Comp 7 - Light Brown
        line9: '#FFB74D', // Comp 8 - Light Deep Orange
        line10: '#4DB6AC', // Comp 9 - Light Cyan
        barBg: 'rgba(38, 198, 218, 0.8)'
      }
    };
  }

  // Helper to get color, cycling dynamically after line10
  getDatasetColor(index, currentTheme) {
    const colorKey = `line${index + 1}`;
    // Dynamic HSL Fallback (starts after pre-defined colors)
    if (index >= 10) {
      // Use index 10 (line11) onward for dynamic generation
      // Use a formula that spreads colors out in the HSL space
      const hue = (index * 37) % 360; 
      return `hsl(${hue}, 75%, 50%)`;
    }
    return currentTheme[colorKey] || `hsl(${(index * 37) % 360}, 75%, 50%)`;
  }

  updateChartTheme() {
    if (!this.dashboard.chart) return;
    const currentTheme = this.themes[this.dashboard.currentTheme] || this.themes.light;
    
    // Update colors for scales, plugins, and axes
    this.dashboard.chart.options.scales.x.ticks.color = currentTheme.textColor;
    this.dashboard.chart.options.scales.y.ticks.color = currentTheme.textColor;
    this.dashboard.chart.options.scales.x.grid.color = currentTheme.gridColor;
    this.dashboard.chart.options.scales.y.grid.color = currentTheme.gridColor;
    this.dashboard.chart.options.plugins.tooltip.backgroundColor = currentTheme.tooltipBg;
    this.dashboard.chart.options.plugins.tooltip.titleColor = currentTheme.tooltipText;
    this.dashboard.chart.options.plugins.tooltip.bodyColor = currentTheme.tooltipText;
    this.dashboard.chart.options.plugins.legend.labels.color = currentTheme.textColor;
    
    // Update datasets colors
    if (this.dashboard.chart.data.datasets && this.dashboard.chart.data.datasets.length > 0) {
      this.dashboard.chart.data.datasets.forEach((dataset, index) => {
        const color = this.getDatasetColor(index, currentTheme);
        
        dataset.borderColor = color;
        // Only primary chart (index 0) uses barBg if type is bar
        dataset.backgroundColor = (index === 0 && dataset.type === 'bar') ? currentTheme.barBg : `${color}15`;
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
    
    if (!primary.current || primary.current.length === 0) {
      if (chartTitle) chartTitle.textContent = 'No data available';
      const loading = this.dashboard.container.querySelector('#zd-loading');
      if (loading) loading.style.display = 'none';
      return;
    }

    if (this.dashboard.chart) {
      this.dashboard.chart.destroy();
    }

    if (chartTitle) chartTitle.textContent = primary.title;
    if (lastUpdate) this.updateLastUpdate(primary.lastUpdate);

    const currentTheme = this.themes[this.dashboard.currentTheme] || this.themes.light;
    const chartTypeConfig = this.dashboard.chartTypesModule.getChartConfig(this.dashboard.currentChartType);
    
    // Calculate overall range for primary Y-axis based on ALL visible data
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
    
    const datasets = [];
    
    // 1. Primary Dataset
    datasets.push({
      label: primary.title,
      data: primary.current,
      borderColor: this.getDatasetColor(0, currentTheme),
      backgroundColor: this.dashboard.currentChartType === 'bar' ? currentTheme.barBg : `${this.getDatasetColor(0, currentTheme)}15`,
      borderWidth: 3,
      type: chartTypeConfig.type,
      tension: chartTypeConfig.tension, 
      fill: chartTypeConfig.fill,
      pointRadius: chartTypeConfig.pointRadius,
      pointHoverRadius: chartTypeConfig.pointHoverRadius,
      yAxisID: 'y', 
    });

    // 2. Comparison Datasets (Fix: Use chartTypeConfig for all lines)
    comparisons.forEach((comp, index) => {
      // Use the same chart type configuration as the primary chart
      const color = this.getDatasetColor(index + 1, currentTheme); // Start at index 1 (line2)
      
      datasets.push({
        label: comp.title,
        data: comp.current,
        borderColor: color,
        backgroundColor: `${color}15`,
        borderWidth: 3,
        fill: chartTypeConfig.fill,
        type: chartTypeConfig.type, // Use the chart type from the config
        tension: chartTypeConfig.tension, // Use the tension from the config
        yAxisID: 'y', 
        pointRadius: chartTypeConfig.pointRadius,
        pointHoverRadius: chartTypeConfig.pointHoverRadius,
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
