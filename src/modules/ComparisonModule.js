/**
 * Comparison Module  
 * Handles comparison functionality and sidebar management
 * ~140 lines
 */
class ComparisonModule {
  constructor(dashboard) {
    this.dashboard = dashboard;
  }

  bindEvents() {
    const compareBtn = this.dashboard.container.querySelector('#zd-compare-btn');
    const compareModal = this.dashboard.container.querySelector('#zd-compare-modal');
    const closeCompareModal = this.dashboard.container.querySelector('#zd-close-compare-modal');
    const compareSearchInput = this.dashboard.container.querySelector('#zd-compare-search-input');
    const closeSidebar = this.dashboard.container.querySelector('#zd-close-sidebar');

    if (compareBtn && compareModal) {
      compareBtn.addEventListener('click', () => {
        compareModal.style.display = 'flex';
        if (compareSearchInput) compareSearchInput.focus();
      });
    }

    if (closeCompareModal && compareModal) {
      closeCompareModal.addEventListener('click', () => {
        compareModal.style.display = 'none';
      });
    }

    if (closeSidebar) {
      closeSidebar.addEventListener('click', () => {
        const sidebar = this.dashboard.container.querySelector('#zd-comparison-sidebar');
        if (sidebar) sidebar.classList.remove('active');
      });
    }

    if (compareSearchInput) {
      compareSearchInput.addEventListener('input', () => {
        clearTimeout(this.dashboard.searchDebounceTimer);
        this.dashboard.searchDebounceTimer = setTimeout(() => {
          this.dashboard.searchModule.performSearch(compareSearchInput.value, true);
        }, 300);
      });
    }

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (compareModal && (e.target === compareModal || e.target.classList.contains('zd-modal-overlay'))) {
        compareModal.style.display = 'none';
      }
    });
  }

  async addComparison(slug, name) {
    // Only allow 1 comparison (like working version)
    if (this.dashboard.compareItems.length >= 1) {
      alert('Only 1 comparison indicator allowed');
      return;
    }

    try {
      const data = await this.dashboard.dataFetcher.fetchComparisonData(slug);
      const series = data.series;
      
      const formattedData = series.map(point => ({
        x: new Date(point[0]),
        y: parseFloat(point[1])
      }));

      this.dashboard.chartDataStore.secondary = {
        full: formattedData,
        current: [...formattedData],
        title: name
      };

      this.dashboard.compareItems = [{ title: name, seriesId: slug, visible: true }];

      // Apply current timeframe
      const activeBtn = this.dashboard.container.querySelector('.zd-tf-btn.active');
      if (activeBtn) {
        this.dashboard.timeframeModule.applyFilter(activeBtn.dataset.range);
      }

      this.updateSidebar();
      this.dashboard.chartRenderer.createOrUpdateChart();
    } catch (error) {
      console.error('Error adding comparison:', error);
      alert('Failed to load comparison data');
    }
  }

  updateSidebar() {
    const sidebar = this.dashboard.container.querySelector('#zd-comparison-sidebar');
    const comparisonList = this.dashboard.container.querySelector('#zd-comparison-list');

    if (!sidebar || !comparisonList) return;

    if (this.dashboard.compareItems.length > 0) {
      sidebar.classList.add('active');
      comparisonList.innerHTML = '';

      this.dashboard.compareItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'zd-comparison-item';
        div.innerHTML = `
          <span class="zd-comparison-title">${item.title}</span>
          <div class="zd-comparison-actions">
            <button class="zd-comparison-action" data-action="toggle" data-index="${index}" title="Toggle Visibility">
              ${item.visible ? '👁' : '🚫'}
            </button>
            <button class="zd-comparison-action" data-action="remove" data-index="${index}" title="Remove">✕</button>
          </div>
        `;

        // Bind action events
        div.querySelectorAll('.zd-comparison-action').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            const index = parseInt(e.currentTarget.dataset.index);

            if (action === 'toggle') {
              this.dashboard.compareItems[index].visible = !this.dashboard.compareItems[index].visible;
              if (this.dashboard.compareItems[index].visible) {
                this.dashboard.chartRenderer.createOrUpdateChart();
              } else {
                this.dashboard.chartDataStore.secondary = { full: [], current: [], title: '' };
                this.dashboard.chartRenderer.createOrUpdateChart();
              }
              this.updateSidebar();
            } else if (action === 'remove') {
              this.dashboard.compareItems.splice(index, 1);
              this.dashboard.chartDataStore.secondary = { full: [], current: [], title: '' };
              this.updateSidebar();
              this.dashboard.chartRenderer.createOrUpdateChart();
            }
          });
        });

        comparisonList.appendChild(div);
      });
    } else {
      sidebar.classList.remove('active');
    }
  }
}

export default ComparisonModule;