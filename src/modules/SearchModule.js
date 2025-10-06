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
    const searchToggle = this.dashboard.container.querySelector('#zd-search-toggle');
    const searchPanel = this.dashboard.container.querySelector('#zd-search-panel');
    const searchInput = this.dashboard.container.querySelector('#zd-search-input');
    const searchResults = this.dashboard.container.querySelector('#zd-search-results');
    const searchClear = this.dashboard.container.querySelector('.zd-search-clear');

    if (searchToggle && searchPanel && searchInput) {
      searchToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        searchPanel.classList.toggle('active');
        if (searchPanel.classList.contains('active')) {
          searchInput.focus();
        }
      });

      searchInput.addEventListener('input', () => {
        clearTimeout(this.dashboard.searchDebounceTimer);
        this.dashboard.searchDebounceTimer = setTimeout(() => {
          this.performSearch(searchInput.value, false);
        }, 300);
      });

      if (searchClear) {
        searchClear.addEventListener('click', () => {
          searchInput.value = '';
          searchResults.innerHTML = '';
        });
      }
    }

    // Close search panel when clicking outside
    document.addEventListener('click', (e) => {
      const searchPanel = this.dashboard.container.querySelector('#zd-search-panel');
      const searchToggle = this.dashboard.container.querySelector('#zd-search-toggle');

      if (searchPanel && !searchPanel.contains(e.target) && e.target !== searchToggle) {
        searchPanel.classList.remove('active');
      }
    });
  }

  async performSearch(query, isCompare = false) {
    if (query.length < 2) return;

    const filtered = this.dashboard.dataFetcher.filterIndicators(query);
    const resultsContainer = isCompare ? 
      this.dashboard.container.querySelector('#zd-compare-search-results') :
      this.dashboard.container.querySelector('#zd-search-results');

    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';

    if (filtered.length > 0) {
      filtered.slice(0, 20).forEach(indicator => {
        const li = document.createElement('li');
        li.textContent = indicator.name || indicator.slug || 'Unknown Indicator';
        li.addEventListener('click', () => {
          if (isCompare) {
            this.dashboard.comparisonModule.addComparison(indicator.slug, indicator.name);
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