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

  createOrUpdateChart() {
    const canvas = this.dashboard.container.querySelector('#zd-main-chart');
    const chartTitle = this.dashboard.container.querySelector('#zd-chart-title');
    const lastUpdate = this.dashboard.container.querySelector('#zd-last-update');
    const loading = this.dashboard.container.querySelector('#zd-loading');

    if (!canvas) return;

    const primaryData = this.dashboard.chartDataStore.primary.current;
    const secondaryData = this.dashboard.chartDataStore.secondary.current;
    const hasSecondary = secondaryData && secondaryData.length > 0;

    if (!primaryData || primaryData.length === 0) {
      if (chartTitle) chartTitle.textContent = 'No data available';
      if (loading) loading.style.display = 'none';
      return;
    }

    // Destroy existing chart
    if (this.dashboard.chart) {
      this.dashboard.chart.destroy();
    }

    // Update UI elements
    if (chartTitle) chartTitle.textContent = this.dashboard.chartDataStore.primary.title;
    if (lastUpdate) this.updateLastUpdate(this.dashboard.chartDataStore.primary.lastUpdate);
    this.updateHistoricalStats(primaryData);

    const currentTheme = this.themes[this.dashboard.currentTheme] || this.themes.light;
    const primaryRange = this.getPaddedRange(primaryData);
    const secondaryRange = hasSecondary ? this.getPaddedRange(secondaryData) : null;

    const datasets = [{
      label: this.dashboard.chartDataStore.primary.title,
      data: primaryData,
      borderColor: currentTheme.line1,
      backgroundColor: this.dashboard.currentChartType === 'bar' ? currentTheme.barBg : `${currentTheme.line1}15`,
      borderWidth: 3,
      fill: false,
      type: this.dashboard.currentChartType === 'bar' ? 'bar' : 'line',
      yAxisID: 'y',
      pointRadius: 0,
      pointHoverRadius: 6,
      tension: 0.3,
    }];

    if (hasSecondary) {
      datasets.push({
        label: this.dashboard.chartDataStore.secondary.title,
        data: secondaryData,
        borderColor: currentTheme.line2,
        backgroundColor: `${currentTheme.line2}15`,
        borderWidth: 3,
        fill: false,
        type: 'line',
        yAxisID: 'y1',
        pointRadius: 0,
        pointHoverRadius: 6,
        tension: 0.3,
      });
    }

    const scales = this.buildScales(currentTheme, primaryRange, secondaryRange, hasSecondary);

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
            display: hasSecondary,
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
          line: { tension: 0.3 },
          point: { hoverBorderWidth: 3 }
        }
      }
    });

    if (loading) loading.style.display = 'none';
  }

  getPaddedRange(dataArray) {
    if (!dataArray || dataArray.length === 0) return { min: 0, max: 0 };

    const values = dataArray.map(item => parseFloat(item.y));
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const range = dataMax - dataMin;
    const padding = Math.max(range * 0.08, Math.abs(dataMax) * 0.02);

    return {
      min: dataMin - padding,
      max: dataMax + padding
    };
  }

  buildScales(currentTheme, primaryRange, secondaryRange, hasSecondary) {
    const scales = {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          displayFormats: { month: 'MMM yyyy' }
        },
        grid: {
          color: currentTheme.gridColor,
          drawBorder: false
        },
        ticks: {
          color: currentTheme.textColor,
          maxTicksLimit: 10,
          font: { size: 11, weight: '500' }
        },
        border: { display: false }
      },
      y: {
        min: primaryRange.min,
        max: primaryRange.max,
        grid: {
          color: currentTheme.gridColor,
          drawBorder: false
        },
        ticks: {
          color: currentTheme.textColor,
          font: { size: 11, weight: '500' },
          callback: function(value) {
            return value.toLocaleString();
          }
        },
        position: 'left',
        border: { display: false }
      }
    };

    if (hasSecondary) {
      scales.y1 = {
        type: 'linear',
        display: true,
        position: 'right',
        min: secondaryRange.min,
        max: secondaryRange.max,
        grid: { drawOnChartArea: false },
        ticks: {
          color: currentTheme.textColor,
          font: { size: 11, weight: '500' },
          callback: function(value) {
            return value.toLocaleString();
          }
        },
        border: { display: false }
      };
    }

    return scales;
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

    // Find values for 3M, 6M, 1Y ago
    const threeMonthsAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 3));
    const sixMonthsAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 3)); // -6 from original
    const oneYearAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 6)); // -12 from original

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

    const threeMonthValue = findValueForDate(threeMonthsAgo);
    const sixMonthValue = findValueForDate(sixMonthsAgo);
    const oneYearValue = findValueForDate(oneYearAgo);

    // Calculate percentage changes
    const change3MPercent = ((current - threeMonthValue) / threeMonthValue * 100);
    const change6MPercent = ((current - sixMonthValue) / sixMonthValue * 100);
    const change1YPercent = ((current - oneYearValue) / oneYearValue * 100);

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