/**
 * Search Module
 * Handles search functionality and indicator filtering
 * ~90 lines
 */
class SearchModule {
  constructor(dashboard) {
    this.dashboard = dashboard;
  }

  bindEvents() {
    // Events are now handled in the Dashboard module
  }

  async performSearch(query, isCompare = false) {
    // Use the data fetcher's search method which matches zestra-dashboard.js
    const results = await this.dashboard.dataFetcher.performSearch(query, isCompare);
    const resultsContainer = isCompare ? 
      this.dashboard.container.querySelector('#zd-compare-search-results') :
      this.dashboard.container.querySelector('#zd-search-results');

    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';

    if (results.length > 0) {
      results.forEach(indicator => {
        const li = document.createElement('li');
        li.textContent = indicator.name || indicator.slug || 'Unknown Indicator';
        li.dataset.slug = indicator.slug; // Store slug for later use
        li.addEventListener('click', () => {
          if (isCompare) {
            // Add comparison using the comparison manager (fetches data internally)
            this.dashboard.comparisonModule.fetchAndAddComparison({
              title: indicator.name,
              slug: indicator.slug
            });
            
            const modal = this.dashboard.container.querySelector('#zd-compare-modal');
            if (modal) modal.style.display = 'none';
            const input = this.dashboard.container.querySelector('#zd-compare-search-input');
            if (input) input.value = '';
          } else {
            this.dashboard.loadIndicator(indicator.slug);
            const panel = this.dashboard.container.querySelector('#zd-search-panel');
            if (panel) panel.classList.remove('active');
            const input = this.dashboard.container.querySelector('#zd-search-input');
            if (input) input.value = '';
          }
        });
        resultsContainer.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No results found';
      li.style.opacity = '0.6';
      resultsContainer.appendChild(li);
    }
  }
}

export default SearchModule;