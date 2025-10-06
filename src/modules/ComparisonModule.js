/**
 * Comparison Module  
 * Handles comparison functionality and sidebar management
 * ~140 lines
 */
class ComparisonModule {
  constructor(dashboard) {
    this.dashboard = dashboard;
    // Initialize compareItems array
    this.compareItems = [];
  }

  bindEvents() {
    // Events are now handled in the Dashboard module
  }

  updateSidebar() {
    const sidebar = this.dashboard.container.querySelector('#zd-comparison-sidebar');
    const comparisonList = this.dashboard.container.querySelector('#zd-comparison-list');

    if (!sidebar || !comparisonList) return;

    if (this.compareItems.length > 0) {
      sidebar.classList.add('active');
      comparisonList.innerHTML = '';

      this.compareItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'zd-comparison-item';
        div.innerHTML = `
          <span style="opacity: ${item.visible ? 1 : 0.5}">${item.title}</span>
          <div class="zd-comparison-actions">
            <button class="zd-comparison-action" data-action="toggle" data-index="${index}" title="${item.visible ? 'Hide' : 'Show'}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="${item.visible ? 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7z' : 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'}"/>
              </svg>
            </button>
            <button class="zd-comparison-action" data-action="remove" data-index="${index}" title="Remove">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        `;

        // Bind action events
        div.querySelectorAll('.zd-comparison-action').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            const index = parseInt(e.currentTarget.dataset.index);

            if (action === 'toggle') {
              this.toggleComparison(index);
            } else if (action === 'remove') {
              this.removeComparison(index);
            }
          });
        });

        comparisonList.appendChild(div);
      });
    } else {
      sidebar.classList.remove('active');
    }
  }

  async fetchAndAddComparison(itemData) {
    // Allow up to 10 comparison indicators
    if (this.compareItems.length >= 10) {
      alert('Maximum of 10 comparison indicators allowed');
      return;
    }

    try {
      // Fetch the actual data for the comparison indicator
      const comparisonData = await this.dashboard.dataFetcher.addComparisonData(itemData.slug);

      // Add the item with the fetched data
      this.compareItems.push({ 
        ...itemData, 
        series: comparisonData.series, // Add the fetched series data
        visible: true 
      });
      this.updateSidebar();

      // Notify the dashboard that comparison data has been added/updated
      // The dashboard will then update chartDataStore.secondary and re-render
      this.dashboard.onComparisonDataUpdated();
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      alert('Failed to load comparison data');
    }
  }

  // Kept for potential direct addition if data is already available
  addComparison(itemData) {
    // Allow up to 10 comparison indicators
    if (this.compareItems.length >= 10) {
      alert('Maximum of 10 comparison indicators allowed');
      return;
    }

    this.compareItems.push({ ...itemData, visible: true });
    this.updateSidebar();
    this.dashboard.onComparisonDataUpdated(); // Notify dashboard if this is called directly
  }

  removeComparison(index) {
    this.compareItems.splice(index, 1);
    this.updateSidebar();
    this.dashboard.onComparisonDataUpdated(); // Notify dashboard to re-render
  }

  toggleComparison(index) {
    if (this.compareItems[index]) {
      this.compareItems[index].visible = !this.compareItems[index].visible;
      this.updateSidebar();
      this.dashboard.onComparisonDataUpdated(); // Notify dashboard to re-render
    }
  }

  getVisibleStatus() {
    // Return true if any comparison item is visible
    return this.compareItems.some(item => item.visible);
  }

  getAllVisibleComparisonData() {
    // Return an array of all comparison items that are visible
    return this.compareItems.filter(item => item.visible);
  }

  // Kept for potential direct usage, returns the first visible item
  getComparisonData() {
    if (this.compareItems.length > 0 && this.compareItems[0].visible) {
      return this.compareItems[0];
    }
    return null;
  }

  clearComparisons() {
    this.compareItems = [];
    this.updateSidebar();
    this.dashboard.onComparisonDataUpdated(); // Notify dashboard to re-render
  }
}

export default ComparisonModule;