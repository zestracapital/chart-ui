/**
 * Chart Renderer Module  
 * Handles Chart.js integration and chart rendering
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
        line3: '#4CAF50',
        line4: '#9C27B0',
        line5: '#FFEB3B',
        line6: '#008CFF',
        line7: '#FF0077',
        line8: '#8D6E63',
        line9: '#FF9800',
        line10: '#009688',
        barBg: 'rgba(0, 188, 212, 0.8)'
      },
      dark: {
        gridColor: 'rgba(255, 255, 255, 0.08)',
        textColor: '#8899a6',
        tooltipBg: 'rgba(21, 32, 43, 0.95)',
        tooltipText: '#ffffff',
        line1: '#26C6DA',
        line2: '#FF7043',
        line3: '#66BB6A',
        line4: '#D450FF',
        line5: '#FFF176',
        line6: '#509EFF',
        line7: '#FF50A5',
        line8: '#A1887F',
        line9: '#FFB74D',
        line10: '#4DB6AC',
        barBg: 'rgba(38, 198, 218, 0.8)'
      }
    };
  }

  updateChartTheme() {
    if (!this.dashboard.chart) return;
    const currentTheme = this.themes[this.dashboard.currentTheme] || this.themes.light;
    
    this.dashboard.chart.options.scales.x.ticks.color = currentTheme.textColor;
    this.dashboard.chart.options.scales.y.ticks.color = currentTheme.textColor;
    this.dashboard.chart.options.scales.x.grid.color = currentTheme.gridColor;
    this.dashboard.chart.options.scales.y.grid.color = currentTheme.gridColor;
    
    this.dashboard.chart.options.plugins.tooltip.backgroundColor = currentTheme.tooltipBg;
    this.dashboard.chart.options.plugins.tooltip.titleColor = currentTheme.tooltipText;
    this.dashboard.chart.options.plugins.tooltip.bodyColor = currentTheme.tooltipText;
    this.dashboard.chart.options.plugins.legend.labels.color = currentTheme.textColor;
    
    if (this.dashboard.chart.data.datasets && this.dashboard.chart.data.datasets.length > 0) {
      this.dashboard.chart.data.datasets.forEach((dataset, index) => {
        const colorKey = `line${index + 1}`;
        const color = currentTheme[colorKey] || `hsl(${(index * 37) % 360}, 75%, 50%)`;
        
        dataset.borderColor = color;
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
    
    const primaryTension = chartTypeConfig.type === 'line' ? 0.3 : 0;

    datasets.push({
      label: primary.title,
      data: primary.current,
      borderColor: currentTheme.line1,
      backgroundColor: this.dashboard.currentChartType === 'bar' ? currentTheme.barBg : `${currentTheme.line1}15`,
      borderWidth: 3,
      type: chartTypeConfig.type,
      tension: primaryTension, 
      fill: chartTypeConfig.fill,
      pointRadius: chartTypeConfig.pointRadius,
      pointHoverRadius: chartTypeConfig.pointHoverRadius,
      yAxisID: 'y', 
    });

    comparisons.forEach((comp, index) => {
      const secondaryChartTypeConfig = this.dashboard.chartTypesModule.getChartConfig('line');
      
      const colorKey = `line${index + 2}`; 
      const color = currentTheme[colorKey] || `hsl(${((index + 1) * 37) % 360}, 75%, 50%)`; 
      
      datasets.push({
        label: comp.title,
        data: comp.current,
        borderColor: color,
        backgroundColor: `${color}15`,
        borderWidth: 3,
        fill: secondaryChartTypeConfig.fill,
        type: 'line',
        tension: 0.3,
        yAxisID: 'y', 
        pointRadius: secondaryChartTypeConfig.pointRadius,
        pointHoverRadius: secondaryChartTypeConfig.pointHoverRadius,
      });
    });

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
