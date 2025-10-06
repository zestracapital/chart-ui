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
    // Extract LLM config from the global config
    this.llmConfig = this.dashboard.config.llmConfig || { enabled: false, showAnalysis: false, showNews: false, apiUrl: '', apiKey: '', model: '' };
    this.ajaxUrl = this.wpConfig.ajaxUrl || this.llmConfig.apiUrl;
    this.action = this.llmConfig.action || 'zc_dmt_run_llm_query';
  }

  bindEvents() {
    // Events are now handled in the Dashboard module
  }

  getQueryContext(type, data) {
    const { title: indicatorTitle, slug: indicatorSlug, current: seriesData } = data.primary;
    const latestPoint = seriesData[seriesData.length - 1];
    const latestDate = latestPoint ? latestPoint.x.toLocaleDateString() : 'N/A';
    const latestValue = latestPoint ? latestPoint.y.toLocaleString() : 'N/A';

    // Get last 12 months of data - match zestra-dashboard.js logic
    const last12Months = seriesData.slice(-12).map(point => 
      `${point.x.getFullYear()}-${(point.x.getMonth() + 1).toString().padStart(2, '0')}: ${point.y.toFixed(2)}`
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
        userQuery: `What are the latest real-time economic news updates for the indicator \"${indicatorTitle}\"? Summarize in 3 bullet points. Context: Latest value: ${latestValue}.`,
        useGoogleSearch: true
      };
    }

    return null;
  }

  async callLLMRequest(systemPrompt, userQuery, useGoogleSearch = false, maxRetries = 3) {
    // Use WordPress AJAX endpoint with nonce - match zestra-dashboard.js logic
    const formData = new FormData();
    formData.append('action', this.action);
    formData.append('nonce', this.wpConfig.chartNonce || this.wpConfig.nonce);
    formData.append('system_prompt', systemPrompt);
    formData.append('user_query', userQuery);
    formData.append('use_google_search', useGoogleSearch ? '1' : '0');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(this.ajaxUrl, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const json = await response.json();
          if (json.status === 'success' && json.data) {
            return json.data;
          } else if (json.status === 'error' && json.message) {
            // Check for rate limiting (429) and retry if not the last attempt
            if (response.status === 429 && attempt < maxRetries - 1) {
              console.warn(`LLM API returned 429 (Throttled), retrying (${attempt + 1}/${maxRetries - 1})...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Exponential backoff
              continue; // Retry
            }
            return { error: json.message };
          }
          return { error: 'LLM server response format is invalid.' };
        }

        // Handle server errors (5xx) with retry
        if (response.status >= 500 && response.status < 600 && attempt < maxRetries - 1) {
          console.warn(`LLM API returned ${response.status} (Server Error), retrying (${attempt + 1}/${maxRetries - 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Exponential backoff
          continue; // Retry
        }

        throw new Error(`HTTP error! Status: ${response.status}`);
      } catch (error) {
        console.error(`LLM Fetch Error (Attempt ${attempt + 1}/${maxRetries}):`, error);
        if (attempt === maxRetries - 1) {
          return { error: `Could not connect to the LLM backend server after ${maxRetries} attempts. Details: ${error.message}` };
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    return { error: 'LLM service failed after maximum retries.' };
  }

  async runLLMQuery(type) {
    if (this.isLLMRunning) {
      console.warn('LLM query already in progress.');
      return { error: 'LLM query already in progress.' };
    }

    const context = this.getQueryContext(type, this.dashboard.chartDataStore);
    if (!context) {
      console.error('Could not generate LLM context.');
      return { error: 'Could not generate LLM context.' };
    }

    this.isLLMRunning = true;
    // The loading and display logic is handled by the Dashboard module
    const loading = this.dashboard.container.querySelector('#zd-loading');
    const analyzeBtn = this.dashboard.container.querySelector('#zd-llm-analyze-btn');
    const newsBtn = this.dashboard.container.querySelector('#zd-get-news-btn');
    const analysisContainer = this.dashboard.container.querySelector('#zd-analysis-container');
    const analysisTitle = this.dashboard.container.querySelector('#zd-analysis-title');
    const analysisContent = this.dashboard.container.querySelector('#zd-analysis-content');

    if (analyzeBtn) analyzeBtn.disabled = true;
    if (newsBtn) newsBtn.disabled = true;
    if (analysisContainer) analysisContainer.style.display = 'block';
    if (analysisTitle) analysisTitle.textContent = `Generating ${type}...`;
    if (analysisContent) analysisContent.innerHTML = '<div class="zd-spinner"></div><span class="zd-loading-text">Processing...</span>';
    if (loading) loading.style.display = 'flex';

    const result = await this.callLLMRequest(context.systemPrompt, context.userQuery, context.useGoogleSearch);

    if (analyzeBtn) analyzeBtn.disabled = false;
    if (newsBtn) newsBtn.disabled = false;
    if (loading) loading.style.display = 'none';

    if (result.error) {
      if (analysisContent) {
        analysisContent.innerHTML = `<p><strong>Error:</strong> ${result.error}</p>`;
      }
    } else {
      // Use the dashboard's renderAnalysisContent method or similar logic
      if (analysisContainer) {
        analysisContainer.innerHTML = this.dashboard.renderAnalysisContent(`${type.charAt(0).toUpperCase() + type.slice(1)} for ${this.dashboard.chartDataStore.primary.title}`, result);
        analysisContainer.style.display = 'block';
      }
    }

    this.isLLMRunning = false;
    return result;
  }
}

export default LLMModule;