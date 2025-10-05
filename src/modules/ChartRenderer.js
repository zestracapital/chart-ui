// ChartRenderer.js - Chart.js integration and UI updates
export function createOrUpdateChart({ container, canvas, chart, currentTheme, currentChartType, primaryData, secondaryData, primaryTitle, secondaryTitle }) {
  if (chart) chart.destroy();
  const themes = {
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
  const t = themes[currentTheme] || themes.light;

  function getPaddedRange(dataArray) {
    if (!dataArray || dataArray.length === 0) return { min: 0, max: 0 };
    const values = dataArray.map(d => parseFloat(d.y));
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const range = dataMax - dataMin;
    const padding = Math.max(range * 0.08, Math.abs(dataMax) * 0.02);
    return { min: dataMin - padding, max: dataMax + padding };
  }

  const hasSecondary = Array.isArray(secondaryData) && secondaryData.length > 0;
  const datasets = [{
    label: primaryTitle,
    data: primaryData,
    borderColor: t.line1,
    backgroundColor: currentChartType === 'bar' ? t.barBg : `${t.line1}15`,
    borderWidth: 3,
    fill: false,
    type: currentChartType === 'bar' ? 'bar' : 'line',
    yAxisID: 'y',
    pointRadius: 0,
    pointHoverRadius: 6,
    tension: 0.3
  }];
  if (hasSecondary) {
    datasets.push({
      label: secondaryTitle,
      data: secondaryData,
      borderColor: t.line2,
      backgroundColor: `${t.line2}15`,
      borderWidth: 3,
      fill: false,
      type: 'line',
      yAxisID: 'y1',
      pointRadius: 0,
      pointHoverRadius: 6,
      tension: 0.3
    });
  }

  const primaryRange = getPaddedRange(primaryData);
  const secondaryRange = hasSecondary ? getPaddedRange(secondaryData) : null;

  const scales = {
    x: {
      type: 'time',
      time: { unit: 'month', displayFormats: { month: 'MMM yyyy' } },
      grid: { color: t.gridColor, drawBorder: false },
      ticks: { color: t.textColor, maxTicksLimit: 10, font: { size: 11, weight: '500' } },
      border: { display: false }
    },
    y: {
      min: primaryRange.min,
      max: primaryRange.max,
      grid: { color: t.gridColor, drawBorder: false },
      ticks: { color: t.textColor, font: { size: 11, weight: '500' }, callback: (v) => v.toLocaleString() },
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
      ticks: { color: t.textColor, font: { size: 11, weight: '500' }, callback: (v) => v.toLocaleString() },
      border: { display: false }
    };
  }

  const ctx = canvas.getContext('2d');
  const newChart = new Chart(ctx, {
    type: currentChartType === 'bar' ? 'bar' : 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: hasSecondary, position: 'top', align: 'start', labels: { color: t.textColor, usePointStyle: true, padding: 20, font: { size: 12, weight: '600' } } },
        tooltip: { backgroundColor: t.tooltipBg, titleColor: t.tooltipText, bodyColor: t.tooltipText, borderWidth: 0, cornerRadius: 12, padding: 16, titleFont: { size: 13, weight: '600' }, bodyFont: { size: 12, weight: '500' }, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}` } }
      },
      scales,
      elements: { line: { tension: 0.3 }, point: { hoverBorderWidth: 3 } }
    }
  });
  return newChart;
}

export function updateHistoricalStats(container, data) {
  const c3 = container.querySelector('#zd-3m-change');
  const c6 = container.querySelector('#zd-6m-change');
  const c1 = container.querySelector('#zd-1y-change');
  if (!data || data.length === 0) {
    if (c3) c3.textContent = '--';
    if (c6) c6.textContent = '--';
    if (c1) c1.textContent = '--';
    return;
  }
  const now = new Date();
  const current = data[data.length - 1].y;
  const threeMonthsAgo = new Date(now.getTime()); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sixMonthsAgo = new Date(now.getTime()); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const oneYearAgo = new Date(now.getTime()); oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);
  const near = (target) => {
    let closest = data[0];
    let minDiff = Math.abs(new Date(data[0].x) - target);
    for (let i = 1; i < data.length; i++) {
      const diff = Math.abs(new Date(data[i].x) - target);
      if (diff < minDiff) { minDiff = diff; closest = data[i]; }
    }
    return closest.y;
  };
  const v3 = near(threeMonthsAgo), v6 = near(sixMonthsAgo), v12 = near(oneYearAgo);
  const p3 = ((current - v3) / v3) * 100;
  const p6 = ((current - v6) / v6) * 100;
  const p12 = ((current - v12) / v12) * 100;
  if (c3) { c3.textContent = `${p3 >= 0 ? '+' : ''}${p3.toFixed(2)}%`; c3.style.color = p3 >= 0 ? '#4CAF50' : '#F44336'; }
  if (c6) { c6.textContent = `${p6 >= 0 ? '+' : ''}${p6.toFixed(2)}%`; c6.style.color = p6 >= 0 ? '#4CAF50' : '#F44336'; }
  if (c1) { c1.textContent = `${p12 >= 0 ? '+' : ''}${p12.toFixed(2)}%`; c1.style.color = p12 >= 0 ? '#4CAF50' : '#F44336'; }
}

export function updateLastUpdate(container, dateStr) {
  const el = container.querySelector('#zd-last-update');
  if (!el || !dateStr) return;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
  let text = 'Last updated: ';
  if (diffDays === 1) text += 'Yesterday';
  else if (diffDays < 7) text += `${diffDays} days ago`;
  else text += date.toLocaleDateString();
  el.textContent = text;
}
