import DataFetcher from './DataFetcher.js';
import ChartRenderer from './ChartRenderer.js';
import SearchModule from './SearchModule.js';
import ComparisonModule from './ComparisonModule.js';
import TimeframeModule from './TimeframeModule.js';
import ThemeModule from './ThemeModule.js';
import LLMModule from './LLMModule.js'; // Import the new LLM module
import ChartTypesModule from './ChartTypesModule.js'; // Import the new Chart Types module

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
    // Updated structure to support multiple comparisons
    this.chartDataStore = {
      primary: { full: [], current: [], title: '', slug: '', lastUpdate: null },
      comparisons: [] // Array to hold multiple comparison datasets
    };
    this.currentChartType = 'line';
    this.currentTheme = 'light';
    this.searchDebounceTimer = null;
    
    // Initialize modules
    this.dataFetcher = new DataFetcher();
    this.chartRenderer = new ChartRenderer(this);
    this.searchModule = new SearchModule(this);
    this.comparisonModule = new ComparisonModule(this);
    this.timeframeModule = new TimeframeModule(this);
    this.themeModule = new ThemeModule(this);
    this.llmModule = new LLMModule(this); // Initialize the new LLM module
    this.chartTypesModule = new ChartTypesModule(this); // Initialize the new Chart Types module

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
    // Render the exact HTML structure from zestra-dashboard.js
    const dashboardHTML = `
            <div class="zc-zestra-dashboard" data-theme="light">
                <!-- Header -->
                <header class="zd-header">
                    <div class="zd-header-content">
                        <div class="zd-brand-section">
                            <div class="zd-brand-text">
                                <h1>${this.config.title || "Zestra Capital - Economic Analytics"}</h1>
                                <span>${this.config.description || "Professional Economic Data Visualization & Analysis Platform"}</span>
                            </div>
                        </div>
                        
                        <div class="zd-header-controls">
                            ${this.config.showSearch !== false ? this.renderSearchControl() : ""}
                            
                            <div class="zd-control-buttons">
                                ${this.renderHeaderLLMButtons(this.config.llmConfig?.enabled && this.config.llmConfig?.showAnalysis, this.config.llmConfig?.enabled && this.config.llmConfig?.showNews)}
                                ${this.config.showThemeToggle !== false ? '<button class="zd-control-btn" id="zd-theme-toggle" title="Toggle Theme"><svg class="zd-sun-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg><svg class="zd-moon-icon" style="display: none;" viewBox="0 0 24 24" fill="currentColor"><path d="M12.009 24a12.067 12.067 0 0 1-8.466-3.543"/></svg></button>' : ""}
                                ${this.config.showFullscreen !== false ? '<button class="zd-control-btn" id="zd-fullscreen-toggle" title="Fullscreen"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>' : ""}
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="zd-main">
                    <div class="zd-chart-wrapper">
                        <!-- Chart Controls -->
                        <div class="zd-chart-controls">
                            <div class="zd-chart-info">
                                <h2 id="zd-chart-title">Loading Default Indicator...</h2>
                                <div class="zd-chart-meta">
                                    <span id="zd-last-update" class="zd-last-update">Loading data...</span>
                                </div>
                            </div>
                            
                            <div class="zd-control-group">
                                ${this.config.showChartTypes !== false ? this.renderChartTypes() : ""}
                                ${this.config.showComparison !== false ? '<button id="zd-compare-btn" class="zd-compare-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>Add Comparison</button>' : ""}
                            </div>
                        </div>

                        <!-- LLM Analysis Section (Conditional, separate from stats) -->
                        <div id="zd-analysis-container" class="zd-analysis-container" style="display:none; margin-bottom: 20px;">
                            <div id="zd-analysis-box" class="zd-analysis-box">
                                <div class="zd-analysis-box-header">
                                    <h4 id="zd-analysis-title"></h4>
                                    <button id="zd-analysis-close" class="zd-analysis-close" title="Close Analysis">×</button>
                                </div>
                                <div id="zd-analysis-content" class="zd-analysis-content"></div>
                            </div>
                        </div>

                        <!-- Historical Change Cards (from temp version, placed here) -->
                        <div class="zd-stats-section">
                            <div class="zd-stats-grid">
                                <div class="zd-stat-card">
                                    <span class="zd-stat-label">3M Change</span>
                                    <span id="zd-3m-change" class="zd-stat-value">--</span>
                                </div>
                                <div class="zd-stat-card">
                                    <span class="zd-stat-label">6M Change</span>
                                    <span id="zd-6m-change" class="zd-stat-value">--</span>
                                </div>
                                <div class="zd-stat-card">
                                    <span class="zd-stat-label">1Y Change</span>
                                    <span id="zd-1y-change" class="zd-stat-value">--</span>
                                </div>
                            </div>
                        </div>

                        <!-- Timeframe Selection -->
                        ${this.config.showTimeframes !== false ? this.renderTimeframes() : ""}

                        <!-- Chart Container -->
                        <div class="zd-chart-container">
                            <canvas id="zd-main-chart" class="zd-main-chart"></canvas>
                            <div class="zd-watermark">Zestra Capital Analytics</div>
                            
                            <div id="zd-loading" class="zd-loading" style="display: flex;">
                                <div class="zd-loading-backdrop"></div>
                                <div class="zd-loading-content">
                                    <div class="zd-spinner"></div>
                                    <span class="zd-loading-text">Loading economic indicator...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Comparison Sidebar -->
                    ${this.config.showComparison !== false ? this.renderComparisonSidebar() : ""}
                </main>

                <!-- Compare Modal -->
                ${this.config.showComparison !== false ? this.renderCompareModal() : ""}
            </div>
        `;
    this.container.innerHTML = dashboardHTML;
  }

  renderSearchControl() {
    return `
            <div class="zd-search-container">
                <button id="zd-search-toggle" class="zd-search-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <span>Search Indicators</span>
                </button>
                
                <div id="zd-search-panel" class="zd-search-panel">
                    <div class="zd-search-box">
                        <input type="text" id="zd-search-input" class="zd-search-input" placeholder="Search economic indicators...">
                        <button class="zd-search-clear">×</button>
                    </div>
                    <div id="zd-search-results" class="zd-search-results"></div>
                </div>
            </div>
        `;
  }

  renderChartTypes() {
    return `
            <div class="zd-chart-types">
                <button id="zd-line-chart" class="zd-chart-type active" data-type="line" title="Line Chart">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                    </svg>
                </button>
                <button id="zd-bar-chart" class="zd-chart-type" data-type="bar" title="Bar Chart">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
                    </svg>
                </button>
            </div>
        `;
  }

  renderTimeframes() {
    return `
            <div class="zd-timeframe-section">
                <label class="zd-timeframe-label">Time Period:</label>
                <div class="zd-timeframe-buttons">
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
            </div>
        `;
  }

  renderComparisonSidebar() {
    return `
            <aside id="zd-comparison-sidebar" class="zd-comparison-sidebar">
                <div class="zd-sidebar-header">
                    <h3>Comparison Data</h3>
                    <button id="zd-close-sidebar" class="zd-close-sidebar">×</button>
                </div>
                <div class="zd-sidebar-content">
                    <div id="zd-comparison-list" class="zd-comparison-list">
                        <div class="zd-comparison-hint">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                            <span>Add a comparison indicator to analyze trends</span>
                        </div>
                    </div>
                </div>
            </aside>
        `;
  }

  renderCompareModal() {
    return `
            <div id="zd-compare-modal" class="zd-modal" style="display: none;">
                <div class="zd-modal-overlay"></div>
                <div class="zd-modal-content">
                    <div class="zd-modal-header">
                        <h3>Add Comparison Indicator</h3>
                        <button id="zd-close-compare-modal" class="zd-modal-close">×</button>
                    </div>
                    <div class="zd-modal-body">
                        <input type="text" id="zd-compare-search-input" class="zd-compare-search-input" placeholder="Search for indicators to compare...">
                        <ul id="zd-compare-search-results" class="zd-modal-results"></ul>
                    </div>
                </div>
            </div>
        `;
  }

  renderHeaderLLMButtons(showAnalysis, showNews) {
    let html = "";
    if (showNews) {
      html += `
                <button id="zd-get-news-btn" class="zd-llm-header-btn" title="Economic news powered by LLM" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    Latest News
                </button>`;
    }
    if (showAnalysis) {
      html += `
                <button id="zd-llm-analyze-btn" class="zd-llm-header-btn" title="Analyze the current chart and trends with LLM" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.75l2.25 4.5L19.5 6.75l-3 3.5 1.5 5.5-5.25-2-5.25 2 1.5-5.5-3-3.5 5.25-.5L12 1.75z"/></svg>
                    Analyze Chart
                </button>`;
    }
    return html;
  }

  renderAnalysisContent(title, content) {
    return `
            <div class="zd-analysis-box-header">
                <h4 id="zd-analysis-title">${title}</h4>
                <button id="zd-analysis-close" class="zd-analysis-close" title="Close Analysis">×</button>
            </div>
            <div id="zd-analysis-content" class="zd-analysis-content">${content.text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/^- /gm, "• ").replace(/\n/g, "<br>")}</div>
        `;
  }

  bindEvents() {
    // Bind events specific to the Dashboard module
    this.bindThemeToggle();
    this.bindFullscreenToggle();
    this.bindSearchToggle();
    this.bindChartTypeToggle();
    this.bindLLMButtons();
    this.bindAnalysisCloseEvent();
    this.bindCompareButton();
    this.bindCloseSidebar();
    this.bindCloseCompareModal();
    this.bindDraggableSidebar(); // Bind the draggable sidebar event
    this.bindTimeframeButtons();
    this.bindSearchInput();
    this.bindCompareSearchInput();
    document.addEventListener('click', (e) => {
      this.handleDocumentClick(e);
    });
  }

  bindThemeToggle() {
    const toggleBtn = this.container.querySelector('#zd-theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const dashboardEl = this.container.querySelector('.zc-zestra-dashboard');
        const isDark = dashboardEl.classList.toggle('dark-theme');
        const sunIcon = this.container.querySelector('.zd-sun-icon');
        const moonIcon = this.container.querySelector('.zd-moon-icon');
        if (sunIcon) sunIcon.style.display = isDark ? 'none' : 'block';
        if (moonIcon) moonIcon.style.display = isDark ? 'block' : 'none';
        this.currentTheme = isDark ? 'dark' : 'light';
        // Notify other modules or update chart theme
        this.chartRenderer.updateChartTheme();
      });
    }
  }

  bindFullscreenToggle() {
    const toggleBtn = this.container.querySelector('#zd-fullscreen-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const dashboardEl = this.container.querySelector('.zc-zestra-dashboard');
        if (!document.fullscreenElement) {
          dashboardEl.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      });
    }
  }

  bindSearchToggle() {
    const toggleBtn = this.container.querySelector('#zd-search-toggle');
    const panel = this.container.querySelector('#zd-search-panel');
    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
          const input = panel.querySelector('#zd-search-input');
          if (input) input.focus();
        }
      });
    }
  }

  bindChartTypeToggle() {
    const lineBtn = this.container.querySelector('#zd-line-chart');
    const barBtn = this.container.querySelector('#zd-bar-chart');
    if (lineBtn) {
      lineBtn.addEventListener('click', () => {
        this.container.querySelectorAll('.zd-chart-type').forEach(b => b.classList.remove('active'));
        lineBtn.classList.add('active');
        this.currentChartType = 'line';
        this.chartRenderer.createOrUpdateChart();
      });
    }
    if (barBtn) {
      barBtn.addEventListener('click', () => {
        this.container.querySelectorAll('.zd-chart-type').forEach(b => b.classList.remove('active'));
        barBtn.classList.add('active');
        this.currentChartType = 'bar';
        this.chartRenderer.createOrUpdateChart();
      });
    }
  }

  bindLLMButtons() {
    const analyzeBtn = this.container.querySelector('#zd-llm-analyze-btn');
    const newsBtn = this.container.querySelector('#zd-get-news-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        this.llmModule.runLLMQuery('analyze');
      });
    }
    if (newsBtn) {
      newsBtn.addEventListener('click', () => {
        this.llmModule.runLLMQuery('news');
      });
    }
  }

  bindAnalysisCloseEvent() {
    // Already handled in the main document click handler
  }

  bindCompareButton() {
    const compareBtn = this.container.querySelector('#zd-compare-btn');
    const modal = this.container.querySelector('#zd-compare-modal');
    if (compareBtn && modal) {
      compareBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        const input = modal.querySelector('#zd-compare-search-input');
        if (input) input.focus();
      });
    }
  }

  bindCloseSidebar() {
    const closeBtn = this.container.querySelector('#zd-close-sidebar');
    const sidebar = this.container.querySelector('#zd-comparison-sidebar');
    if (closeBtn && sidebar) {
      closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
      });
    }
  }

  bindCloseCompareModal() {
    const closeBtn = this.container.querySelector('#zd-close-compare-modal');
    const modal = this.container.querySelector('#zd-compare-modal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
    // Close modal if clicked outside
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
  }

  bindDraggableSidebar() {
    const sidebar = this.container.querySelector('#zd-comparison-sidebar');
    const header = this.container.querySelector('.zd-sidebar-header');

    if (!sidebar || !header) return;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      // Check if the click originated from the header or its children (like the title text)
      if (header.contains(e.target)) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        isDragging = true; // Start dragging if the click is anywhere within the header
      }
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, sidebar);
      }
    }

    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
  }

  bindTimeframeButtons() {
    const buttons = this.container.querySelectorAll('.zd-tf-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.timeframeModule.applyFilter(btn.dataset.range);
        // Clear analysis when timeframe changes
        this.clearAnalysisArea();
      });
    });
  }

  bindSearchInput() {
    const input = this.container.querySelector('#zd-search-input');
    const results = this.container.querySelector('#zd-search-results');
    const clearBtn = this.container.querySelector('.zd-search-clear');
    if (input && results) {
      input.addEventListener('input', () => {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          this.searchModule.performSearch(input.value, false);
        }, 300);
      });
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          input.value = '';
          results.innerHTML = '';
        });
      }
    }
  }

  bindCompareSearchInput() {
    const input = this.container.querySelector('#zd-compare-search-input');
    if (input) {
      input.addEventListener('input', () => {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          this.searchModule.performSearch(input.value, true);
        }, 300);
      });
    }
  }

  handleDocumentClick(e) {
    const searchPanel = this.container.querySelector('#zd-search-panel');
    const searchToggle = this.container.querySelector('#zd-search-toggle');
    if (searchPanel && searchToggle && !searchPanel.contains(e.target) && e.target !== searchToggle) {
      searchPanel.classList.remove('active');
    }

    // Handle closing analysis container if clicked close button
    if (e.target.id === 'zd-analysis-close') {
      this.clearAnalysisArea();
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
        slug: indicator.slug, // Added slug
        lastUpdate: formattedData[formattedData.length - 1].x
      };

      // Clear all comparisons when switching primary
      this.chartDataStore.comparisons = [];
      // Assuming comparison items are handled by the ComparisonModule
      this.comparisonModule.clearComparisons();
      this.clearAnalysisArea(); // Clear analysis when primary indicator changes

      // Apply current timeframe
      const activeBtn = this.container.querySelector('.zd-tf-btn.active');
      if (activeBtn) {
        this.timeframeModule.applyFilter(activeBtn.dataset.range);
      }

      this.chartRenderer.createOrUpdateChart();
      this.enableLLMButtons(true); // Enable LLM buttons after successful load
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

  enableLLMButtons(enabled) {
    const analyzeBtn = this.container.querySelector('#zd-llm-analyze-btn');
    const newsBtn = this.container.querySelector('#zd-get-news-btn');
    if (analyzeBtn) analyzeBtn.disabled = !enabled;
    if (newsBtn) newsBtn.disabled = !enabled;
  }

  clearAnalysisArea() {
    const container = this.container.querySelector('#zd-analysis-container');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  }

  showEmptyState() {
    const chartTitle = this.container.querySelector('#zd-chart-title');
    const lastUpdate = this.container.querySelector('#zd-last-update');
    const loading = this.container.querySelector('#zd-loading');

    if (chartTitle) chartTitle.textContent = 'No Indicator Selected';
    if (lastUpdate) lastUpdate.textContent = 'Use the search button above to find indicators';
    if (loading) loading.style.display = 'none';
    this.enableLLMButtons(false); // Disable LLM buttons when no data
  }

  onComparisonDataUpdated() {
    // Get the *visible* comparison data from the module
    const visibleComparisonItems = this.comparisonModule.getAllVisibleComparisonData();

    // Clear the existing comparisons store
    this.chartDataStore.comparisons = [];

    // Populate chartDataStore.comparisons array with data from the module
    visibleComparisonItems.forEach(item => {
      if (item.series && item.series.length > 0) { // Check if data exists
        this.chartDataStore.comparisons.push({
          full: item.series,
          current: [...item.series], // Initially, current is the same as full
          title: item.title,
          slug: item.slug,
          visible: item.visible // Use the item's visibility status
        });
      }
    });

    // Re-render the chart to reflect the changes
    this.chartRenderer.createOrUpdateChart();
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.container.innerHTML = '';
  }
}

export default Dashboard;