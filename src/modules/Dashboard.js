import DataFetcher from './DataFetcher.js';
import ChartRenderer from './ChartRenderer.js';
import SearchModule from './SearchModule.js';
import ComparisonModule from './ComparisonModule.js';
import TimeframeModule from './TimeframeModule.js';
import ThemeModule from './ThemeModule.js';
import UIControls from './UIControls.js';
import LLMModule from './LLMModule.js'; // Import the new LLM module

/**
 * Main Dashboard Class (Core Module)
 * Handles initialization, state management, and coordination between modules
 * ~380 lines
 */
class Dashboard {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.chart = null;
    this.chartDataStore = {
      primary: { full: [], current: [], title: '', lastUpdate: null },
      secondary: { full: [], current: [], title: '' }
    };
    this.currentChartType = 'line';
    this.currentTheme = 'light';
    this.compareItems = [];
    this.searchDebounceTimer = null;
    
    // Initialize modules
    this.dataFetcher = new DataFetcher();
    this.chartRenderer = new ChartRenderer(this);
    this.searchModule = new SearchModule(this);
    this.comparisonModule = new ComparisonModule(this);
    this.timeframeModule = new TimeframeModule(this);
    this.themeModule = new ThemeModule(this);
    this.uiControls = new UIControls(this);
    this.llmModule = new LLMModule(this); // Initialize the new LLM module

    this.init();
  }

  init() {
    this.render();
    this.setInitialTimeframeFromConfig();
    this.bindEvents();
    this.loadDefaultIndicator();
  }

  setInitialTimeframeFromConfig() {
    const raw = (this.config && this.config.defaultTimeRange ? String(this.config.defaultTimeRange) : '').toUpperCase();
    if (!raw) return;
    
    let match = null;
    if (raw === 'ALL') match = 'all';
    else if (raw.endsWith('Y')) match = String(parseInt(raw, 10) || 5);
    else if (raw.endsWith('M')) {
      const m = parseInt(raw, 10) || 6;
      match = (m / 12).toString();
    }
    
    if (!match) return;
    
    const btns = this.container.querySelectorAll('.zd-tf-btn');
    btns.forEach(b => b.classList.remove('active'));
    const target = this.container.querySelector(`.zd-tf-btn[data-range="${match}"]`);
    if (target) target.classList.add('active');
  }

  render() {
    const dashboardHTML = `
      <div class="zc-zestra-dashboard" data-theme="light">
        <div class="zd-header">
          <div class="zd-header-left">
            <h2 id="zd-chart-title">Loading Default Indicator...</h2>
            <p id="zd-last-update">Loading data...</p>
          </div>
          <div class="zd-header-controls">
            ${this.config.showChartTypes !== false ? this.renderChartTypes() : ''}
            ${this.config.showComparison !== false ? '<button id="zd-compare-btn" class="zd-btn zd-btn-secondary" title="Add Comparison">+</button>' : ''}
            ${this.config.showSearch !== false ? '<button id="zd-search-toggle" class="zd-btn zd-btn-secondary" title="Search">🔍</button>' : ''}
            ${this.config.showLLM !== false ? '<button id="zd-llm-analyze-btn" class="zd-btn zd-btn-secondary" title="Analyze Chart">🧠</button>' : ''}
            ${this.config.showLLM !== false ? '<button id="zd-get-news-btn" class="zd-btn zd-btn-secondary" title="Get Latest News">📰</button>' : ''}
            ${this.config.showThemeToggle !== false ? '<button id="zd-theme-toggle" class="zd-btn zd-btn-secondary" title="Toggle Theme"><span class="zd-sun-icon">☀</span><span class="zd-moon-icon" style="display:none">🌙</span></button>' : ''}
            ${this.config.showFullscreen !== false ? '<button id="zd-fullscreen-toggle" class="zd-btn zd-btn-secondary" title="Fullscreen">⛶</button>' : ''}
          </div>
        </div>

        <div class="zd-stats-bar">
          <div class="zd-stat">
            <span class="zd-stat-label">3M Change</span>
            <span id="zd-3m-change" class="zd-stat-value">--</span>
          </div>
          <div class="zd-stat">
            <span class="zd-stat-label">6M Change</span>
            <span id="zd-6m-change" class="zd-stat-value">--</span>
          </div>
          <div class="zd-stat">
            <span class="zd-stat-label">1Y Change</span>
            <span id="zd-1y-change" class="zd-stat-value">--</span>
          </div>
        </div>

        ${this.config.showTimeframes !== false ? this.renderTimeframes() : ''}

        <div class="zd-chart-container">
          <div class="zd-brand">Zestra Capital Analytics</div>
          <div id="zd-loading" class="zd-loading" style="display:none">
            <div class="zd-spinner"></div>
            Loading economic indicator...
          </div>
          <canvas id="zd-main-chart"></canvas>
        </div>

        ${this.config.showLLM !== false ? this.renderLLMAnalysisSection() : ''}
        ${this.config.showSearch !== false ? this.renderSearchPanel() : ''}
        ${this.config.showComparison !== false ? this.renderComparisonSidebar() : ''}
        ${this.config.showComparison !== false ? this.renderCompareModal() : ''}
      </div>
    `;
    this.container.innerHTML = dashboardHTML;
  }

  renderChartTypes() {
    return `
      <div class="zd-chart-types">
        <button id="zd-line-chart" class="zd-chart-type active" title="Line Chart">📈</button>
        <button id="zd-bar-chart" class="zd-chart-type" title="Bar Chart">📊</button>
      </div>
    `;
  }

  renderTimeframes() {
    return `
      <div class="zd-timeframes">
        <span class="zd-tf-label">Time Period:</span>
        <button class="zd-tf-btn" data-range="0.25">3M</button>
        <button class="zd-tf-btn" data-range="0.5">6M</button>
        <button class="zd-tf-btn" data-range="1">1Y</button>
        <button class="zd-tf-btn" data-range="2">2Y</button>
        <button class="zd-tf-btn" data-range="3">3Y</button>
        <button class="zd-tf-btn active" data-range="5">5Y</button>
        <button class="zd-tf-btn" data-range="10">10Y</button>
        <button class="zd-tf-btn" data-range="15">15Y</button>
        <button class="zd-tf-btn" data-range="20">20Y</button>
        <button class="zd-tf-btn" data-range="all">All</button>
      </div>
    `;
  }

  renderLLMAnalysisSection() {
    return `
      <div id="zd-analysis-container" class="zd-analysis-container" style="display:none; margin-bottom: var(--space-20);">
        <div class="zd-analysis-box">
          <div class="zd-analysis-box-header">
            <h4 id="zd-analysis-title"></h4>
            <button id="zd-analysis-close" class="zd-analysis-close" title="Close Analysis">✕</button>
          </div>
          <div id="zd-analysis-content" class="zd-analysis-content"></div>
        </div>
      </div>
    `;
  }

  renderSearchPanel() {
    return `
      <div id="zd-search-panel" class="zd-search-panel">
        <div class="zd-search-header">
          <input type="text" id="zd-search-input" placeholder="Search economic indicators..." />
          <button class="zd-search-clear">✕</button>
        </div>
        <ul id="zd-search-results" class="zd-search-results"></ul>
      </div>
    `;
  }

  renderComparisonSidebar() {
    return `
      <div id="zd-comparison-sidebar" class="zd-comparison-sidebar">
        <div class="zd-sidebar-header">
          <h3>Comparison Data</h3>
          <button id="zd-close-sidebar" class="zd-close-btn">✕</button>
        </div>
        <div id="zd-comparison-list" class="zd-comparison-list"></div>
        <div class="zd-sidebar-empty">
          <p>Add a comparison indicator to analyze trends</p>
        </div>
      </div>
    `;
  }

  renderCompareModal() {
    return `
      <div id="zd-compare-modal" class="zd-modal-overlay" style="display:none">
        <div class="zd-modal">
          <div class="zd-modal-header">
            <h3>Add Comparison Indicator</h3>
            <button id="zd-close-compare-modal" class="zd-close-btn">✕</button>
          </div>
          <div class="zd-modal-body">
            <input type="text" id="zd-compare-search-input" placeholder="Search indicators..." />
            <ul id="zd-compare-search-results" class="zd-search-results"></ul>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.themeModule.bindEvents();
    this.uiControls.bindFullscreenEvents();
    this.searchModule.bindEvents();
    this.uiControls.bindChartTypeEvents();
    this.timeframeModule.bindEvents();
    this.comparisonModule.bindEvents();
    this.llmModule.bindEvents(); // Bind LLM events

    // Bind LLM close event
    const closeBtn = this.container.querySelector('#zd-analysis-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const container = this.container.querySelector('#zd-analysis-container');
        if (container) {
          container.style.display = 'none';
        }
      });
    }
  }

  async loadDefaultIndicator() {
    const candidates = [];
    if (this.config && this.config.defaultIndicator) {
      candidates.push(String(this.config.defaultIndicator));
    }
    
    const list = Array.isArray(window.zcDmtConfig?.indicators) ? window.zcDmtConfig.indicators : [];
    list.forEach(i => {
      if (i && i.slug && !candidates.includes(i.slug)) candidates.push(i.slug);
    });

    for (let i = 0; i < candidates.length; i++) {
      const slug = candidates[i];
      const ok = await this.tryLoadIndicator(slug);
      if (ok) return;
    }
    
    this.showEmptyState();
  }

  async tryLoadIndicator(slug) {
    const loading = this.container.querySelector('#zd-loading');
    const chartTitle = this.container.querySelector('#zd-chart-title');
    
    try {
      if (loading) loading.style.display = 'flex';
      if (chartTitle) chartTitle.textContent = 'Loading...';
      
      const data = await this.dataFetcher.fetchIndicatorData(slug);
      const indicator = data.indicator;
      const series = data.series;
      
      const formattedData = series.map(point => ({
        x: new Date(point[0]),
        y: parseFloat(point[1])
      }));

      this.chartDataStore.primary = {
        full: formattedData,
        current: [...formattedData],
        title: indicator.name,
        lastUpdate: formattedData[formattedData.length - 1].x
      };

      // Clear secondary and comparisons when switching primary
      this.chartDataStore.secondary = { full: [], current: [], title: '' };
      this.compareItems = [];
      this.comparisonModule.updateSidebar();

      // Apply current timeframe
      const activeBtn = this.container.querySelector('.zd-tf-btn.active');
      if (activeBtn) {
        this.timeframeModule.applyFilter(activeBtn.dataset.range);
      }

      this.chartRenderer.createOrUpdateChart();
      if (loading) loading.style.display = 'none';
      return true;
    } catch (e) {
      if (loading) loading.style.display = 'none';
      console.error('Error loading indicator:', e);
      return false;
    }
  }

  async loadIndicator(slug) {
    const ok = await this.tryLoadIndicator(slug);
    if (ok) return;

    // Fallback: try other available indicators from config
    const candidates = [];
    const list = Array.isArray(window.zcDmtConfig?.indicators) ? window.zcDmtConfig.indicators : [];
    list.forEach(i => {
      if (i && i.slug && i.slug !== slug && !candidates.includes(i.slug)) {
        candidates.push(i.slug);
      }
    });

    for (let i = 0; i < candidates.length; i++) {
      if (await this.tryLoadIndicator(candidates[i])) return;
    }

    const chartTitle = this.container.querySelector('#zd-chart-title');
    if (chartTitle) chartTitle.textContent = 'Error loading data: No data available for this indicator';
    this.showEmptyState();
  }

  showEmptyState() {
    const chartTitle = this.container.querySelector('#zd-chart-title');
    const lastUpdate = this.container.querySelector('#zd-last-update');
    const loading = this.container.querySelector('#zd-loading');

    if (chartTitle) chartTitle.textContent = 'No Indicator Selected';
    if (lastUpdate) lastUpdate.textContent = 'Use the search button above to find indicators';
    if (loading) loading.style.display = 'none';
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.container.innerHTML = '';
  }
}

export default Dashboard;