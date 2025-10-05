// UIControls.js - wires DOM events to a Dashboard instance
import { qs, qsa } from './utils.js';

export function bindUIControls(d) {
  // Theme toggle
  const themeToggle = qs(d.container, '#zd-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const dash = qs(d.container, '.zc-zestra-dashboard');
      dash.classList.toggle('dark-theme');
      const isDark = dash.classList.contains('dark-theme');
      const sun = qs(d.container, '.zd-sun-icon');
      const moon = qs(d.container, '.zd-moon-icon');
      if (sun) sun.style.display = isDark ? 'none' : 'block';
      if (moon) moon.style.display = isDark ? 'block' : 'none';
      d.currentTheme = isDark ? 'dark' : 'light';
      if (d.chart) d.renderChart();
    });
  }
  // Fullscreen
  const fs = qs(d.container, '#zd-fullscreen-toggle');
  if (fs) {
    fs.addEventListener('click', () => {
      const dash = qs(d.container, '.zc-zestra-dashboard');
      if (!document.fullscreenElement) dash.requestFullscreen().catch(err => console.error('Fullscreen error:', err));
      else document.exitFullscreen();
    });
  }
  // Search
  bindSearch(d);
  // Chart type
  bindChartTypes(d);
  // Timeframes
  bindTimeframes(d);
  // Comparison
  bindComparison(d);
}

function bindSearch(d) {
  const toggle = qs(d.container, '#zd-search-toggle');
  const panel = qs(d.container, '#zd-search-panel');
  const input = qs(d.container, '#zd-search-input');
  const results = qs(d.container, '#zd-search-results');
  const clear = qs(d.container, '.zd-search-clear');
  if (toggle && panel && input) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('active');
      if (panel.classList.contains('active')) input.focus();
    });
    input.addEventListener('input', () => {
      clearTimeout(d.searchDebounceTimer);
      d.searchDebounceTimer = setTimeout(() => d.performSearch(input.value, false), 300);
    });
    if (clear) clear.addEventListener('click', () => { if (input) input.value=''; if (results) results.innerHTML=''; });
  }
}

function bindChartTypes(d) {
  const lineBtn = qs(d.container, '#zd-line-chart');
  const barBtn = qs(d.container, '#zd-bar-chart');
  if (lineBtn) lineBtn.addEventListener('click', () => { qsa(d.container, '.zd-chart-type').forEach(b=>b.classList.remove('active')); lineBtn.classList.add('active'); d.currentChartType='line'; d.renderChart(); });
  if (barBtn) barBtn.addEventListener('click', () => { qsa(d.container, '.zd-chart-type').forEach(b=>b.classList.remove('active')); barBtn.classList.add('active'); d.currentChartType='bar'; d.renderChart(); });
}

function bindTimeframes(d) {
  qsa(d.container, '.zd-tf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa(d.container, '.zd-tf-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      d.applyTimeframeFilter(btn.dataset.range);
    });
  });
}

function bindComparison(d) {
  const btn = qs(d.container, '#zd-compare-btn');
  const modal = qs(d.container, '#zd-compare-modal');
  const closeModal = qs(d.container, '#zd-close-compare-modal');
  const cmpInput = qs(d.container, '#zd-compare-search-input');
  const closeSidebar = qs(d.container, '#zd-close-sidebar');
  if (btn && modal) btn.addEventListener('click', () => { modal.style.display='flex'; if (cmpInput) cmpInput.focus(); });
  if (closeModal && modal) closeModal.addEventListener('click', () => { modal.style.display='none'; });
  if (closeSidebar) closeSidebar.addEventListener('click', () => { const sb = qs(d.container,'#zd-comparison-sidebar'); if (sb) sb.classList.remove('active'); });
  if (cmpInput) cmpInput.addEventListener('input', () => { clearTimeout(d.searchDebounceTimer); d.searchDebounceTimer = setTimeout(()=> d.performSearch(cmpInput.value, true), 300); });
  document.addEventListener('click', (e) => {
    const searchPanel = qs(d.container, '#zd-search-panel');
    const searchToggle = qs(d.container, '#zd-search-toggle');
    if (searchPanel && !searchPanel.contains(e.target) && e.target !== searchToggle) searchPanel.classList.remove('active');
    if (modal && (e.target === modal || (e.target.classList && e.target.classList.contains('zd-modal-overlay')))) modal.style.display='none';
  });
}
