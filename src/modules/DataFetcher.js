/**
 * Data Fetcher Module
 * Handles all WordPress AJAX calls and data fetching
 * ~120 lines
 */
class DataFetcher {
  constructor() {
    this.wpConfig = window.zcDmtConfig || {};
  }

  async fetchIndicatorData(slug) {
    // Use WordPress AJAX endpoint with nonce
    const formData = new FormData();
    formData.append('action', 'zc_dmt_get_data');
    formData.append('nonce', this.wpConfig.chartNonce || this.wpConfig.nonce);
    formData.append('slug', slug);

    const response = await fetch(this.wpConfig.ajaxUrl, {
      method: 'POST',
      body: formData
    });

    const json = await response.json();
    
    // Check for 'status' => 'success' instead of 'success' => true
    if (!json || json.status !== 'success' || !json.data || !Array.isArray(json.data.series) || json.data.series.length === 0) {
      console.error('API response did not meet success criteria:', json);
      throw new Error('No data');
    }
    
    return json.data;
  }

  async fetchComparisonData(slug) {
    // Use WordPress AJAX endpoint with nonce for comparison
    const formData = new FormData();
    formData.append('action', 'zc_dmt_get_data');
    formData.append('nonce', this.wpConfig.chartNonce || this.wpConfig.nonce);
    formData.append('slug', slug);

    const response = await fetch(this.wpConfig.ajaxUrl, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();

    if (data.status === 'success' && data.data.series && data.data.series.length > 0) {
      return data.data;
    } else {
      console.error('Comparison API response did not meet success criteria:', data);
      throw new Error('No comparison data available');
    }
  }

  getAvailableIndicators() {
    return this.wpConfig.indicators || [];
  }

  filterIndicators(query) {
    if (query.length < 2) return [];
    
    const indicators = this.getAvailableIndicators();
    return indicators.filter(indicator => 
      (indicator.name && indicator.name.toLowerCase().includes(query.toLowerCase())) ||
      (indicator.slug && indicator.slug.toLowerCase().includes(query.toLowerCase())) ||
      (indicator.source_type && indicator.source_type.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

export default DataFetcher;