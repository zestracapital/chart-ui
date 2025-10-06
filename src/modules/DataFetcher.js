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
    // Use WordPress AJAX endpoint with nonce - match zestra-dashboard.js
    const formData = new FormData();
    formData.append('action', 'zc_dmt_get_data');
    formData.append('nonce', this.wpConfig.chartNonce || this.wpConfig.nonce);
    formData.append('slug', slug);

    const response = await fetch(this.wpConfig.ajaxUrl, {
      method: 'POST',
      body: formData
    });

    const json = await response.json();
    
    // Check for 'status' => 'success' instead of 'success' => true - match zestra-dashboard.js
    if (!json || json.status !== 'success' || !json.data || !Array.isArray(json.data.series) || json.data.series.length === 0) {
      console.error('API response did not meet success criteria:', json);
      throw new Error('No data');
    }
    
    return json.data;
  }

  async tryLoadIndicator(slug) {
    try {
      const data = await this.fetchIndicatorData(slug);
      const indicator = data.indicator;
      const series = data.series.map(point => ({
        x: new Date(point[0]),
        y: parseFloat(point[1])
      }));
      
      return {
        indicator: {
          name: indicator.name,
          slug: indicator.slug
        },
        series: series,
        lastUpdate: series[series.length - 1].x
      };
    } catch (error) {
      console.error('Error loading indicator:', error);
      throw error;
    }
  }

  async addComparisonData(slug) {
    try {
      // Use WordPress AJAX endpoint with nonce for comparison - match zestra-dashboard.js
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
        const series = data.data.series.map(point => ({
          x: new Date(point[0]),
          y: parseFloat(point[1])
        }));
        
        return {
          title: data.data.indicator.name,
          slug: data.data.indicator.slug,
          series: series
        };
      } else {
        console.error('Comparison API response did not meet success criteria:', data);
        throw new Error('No comparison data');
      }
    } catch (error) {
      console.error('Error adding comparison:', error);
      throw error;
    }
  }

  async performSearch(query, isCompare = false) {
    // Match zestra-dashboard.js logic
    if (query.length < 2) return [];
    
    const indicators = this.wpConfig.indicators || [];
    return indicators.filter(indicator => 
      (indicator.name && indicator.name.toLowerCase().includes(query.toLowerCase())) ||
      (indicator.slug && indicator.slug.toLowerCase().includes(query.toLowerCase())) ||
      (indicator.source_type && indicator.source_type.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 20); // Limit to 20 results like zestra-dashboard.js
  }
}

export default DataFetcher;