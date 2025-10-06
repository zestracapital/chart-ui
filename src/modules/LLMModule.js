/**
 * LLM Module
 * Handles LLM analysis and news queries
 * ~150 lines
 */
class LLMModule {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.isLLMRunning = false;
    this.wpConfig = window.zcDmtConfig || {};
  }

  bindEvents() {
    const analyzeBtn = this.dashboard.container.querySelector('#zd-llm-analyze-btn');
    const newsBtn = this.dashboard.container.querySelector('#zd-get-news-btn');

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        this.runLLMQuery('analyze');
      });
    }

    if (newsBtn) {
      newsBtn.addEventListener('click', () => {
        this.runLLMQuery('news');
      });
    }
  }

  getQueryContext(type, data) {
    const { title: indicatorTitle, slug: indicatorSlug, current: seriesData } = data.primary;
    const latestPoint = seriesData[seriesData.length - 1];
    const latestDate = latestPoint ? latestPoint.x.toLocaleDateString() : 'N/A';
    const latestValue = latestPoint ? latestPoint.y.toLocaleString() : 'N/A';

    // Get last 12 months of data
    const last12Months = seriesData.slice(-12).map(point => 
      `${point.x.getFullYear()}-${point.x.getMonth() + 1}: ${point.y.toFixed(2)}`
    ).join('; ');

    if (type === 'analyze') {
      return {
        systemPrompt: "You are a world-class financial analyst. Your task is to provide a concise, single-paragraph analysis (100 words max) of the recent trend (last 12 months) of the provided economic indicator data. Focus on rate of change, peaks, troughs, and overall direction. Do not include external information or citations.",
        userQuery: `Analyze the data trend and write a professional, short analysis paragraph. Context: The chart displays the economic indicator "${indicatorTitle}" (Slug: ${indicatorSlug}). The latest data point on ${latestDate} is ${latestValue}. The time series data for the last 12 months is: ${last12Months}.`,
        useGoogleSearch: false
      };
    } else if (type === 'news') {
      return {
        systemPrompt: "You are a senior economic reporter. Your task is to find the latest real-time news and reports related to the given economic indicator and summarize the findings into 3 concise, impactful bullet points. Always include the source links in the response.",
        userQuery: `What are the latest real-time economic news updates for the indicator "${indicatorTitle}"? Summarize in 3 bullet points. Context: Latest value: ${latestValue}.`,
        useGoogleSearch: true
      };
    }

    return null;
  }

  async callLLMRequest(systemPrompt, userQuery, useGoogleSearch = false) {
    // Use WordPress AJAX endpoint with nonce
    const formData = new FormData();
    formData.append('action', 'zc_dmt_run_llm_query'); // Example action name
    formData.append('nonce', this.wpConfig.chartNonce || this.wpConfig.nonce);
    formData.append('system_prompt', systemPrompt);
    formData.append('user_query', userQuery);
    formData.append('use_google_search', useGoogleSearch ? '1' : '0');

    try {
      const response = await fetch(this.wpConfig.ajaxUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        // Handle specific errors like 429 (rate limit) or 5xx (server error)
        if (response.status === 429) {
          throw new Error(`LLM API rate limit exceeded (429). Please try again later.`);
        } else if (response.status >= 500) {
          throw new Error(`LLM server error (${response.status}). Please try again later.`);
        } else {
          throw new Error(`LLM API request failed (${response.status}).`);
        }
      }

      const json = await response.json();
      if (json.status === 'success' && json.data) {
        return json.data;
      } else {
        throw new Error(json.message || 'LLM server response format is invalid.');
      }
    } catch (error) {
      console.error('LLM Fetch Error:', error);
      return { error: error.message };
    }
  }

  async runLLMQuery(type) {
    if (this.isLLMRunning) {
      console.warn('LLM query already in progress.');
      return;
    }

    const context = this.getQueryContext(type, this.dashboard.chartDataStore);
    if (!context) {
      console.error('Could not generate LLM context.');
      return;
    }

    this.isLLMRunning = true;
    this.showLoading(type);

    const result = await this.callLLMRequest(context.systemPrompt, context.userQuery, context.useGoogleSearch);

    this.hideLoading();
    this.displayResult(type, result);

    this.isLLMRunning = false;
  }

  showLoading(type) {
    const analyzeBtn = this.dashboard.container.querySelector('#zd-llm-analyze-btn');
    const newsBtn = this.dashboard.container.querySelector('#zd-get-news-btn');
    const analysisContainer = this.dashboard.container.querySelector('#zd-analysis-container');
    const analysisTitle = this.dashboard.container.querySelector('#zd-analysis-title');
    const analysisContent = this.dashboard.container.querySelector('#zd-analysis-content');

    if (analyzeBtn) analyzeBtn.disabled = true;
    if (newsBtn) newsBtn.disabled = true;

    if (analysisContainer) {
      analysisContainer.style.display = 'block';
    }

    if (analysisTitle) {
      analysisTitle.textContent = `Generating ${type}...`;
    }

    if (analysisContent) {
      analysisContent.innerHTML = '<div class="zd-spinner"></div><span class="zd-loading-text">Processing...</span>';
    }
  }

  hideLoading() {
    const analyzeBtn = this.dashboard.container.querySelector('#zd-llm-analyze-btn');
    const newsBtn = this.dashboard.container.querySelector('#zd-get-news-btn');

    if (analyzeBtn) analyzeBtn.disabled = false;
    if (newsBtn) newsBtn.disabled = false;
  }

  displayResult(type, result) {
    const analysisContainer = this.dashboard.container.querySelector('#zd-analysis-container');
    const analysisTitle = this.dashboard.container.querySelector('#zd-analysis-title');
    const analysisContent = this.dashboard.container.querySelector('#zd-analysis-content');

    if (result.error) {
      if (analysisContent) {
        analysisContent.innerHTML = `<p><strong>Error:</strong> ${result.error}</p>`;
      }
    } else {
      if (analysisContainer) {
        analysisContainer.style.display = 'block';
      }
      if (analysisTitle) {
        analysisTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} for ${this.dashboard.chartDataStore.primary.title}`;
      }
      if (analysisContent) {
        // Basic formatting: **bold**, - lists
        let formattedText = result.text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/^- (.*?)(\n|$)/gm, '<li>$1</li>')
          .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        analysisContent.innerHTML = formattedText;
      }
    }
  }
}

export default LLMModule;