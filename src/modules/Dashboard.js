name) {
    // Only allow 1 comparison
    if (this.compareItems.length >= 1) {
      alert('Only 1 comparison indicator allowed');
      return;
    }
    try {
      const data = await fetchIndicatorData(slug);
      if (data && Array.isArray(data.series) && data.series.length > 0) {
        const formatted = data.series.map(p => ({ x: new Date(p[0]), y: parseFloat(p[1]) }));
        this.chartDataStore.secondary = { full: formatted, current: [...formatted], title: name };
        this.compareItems = [{ title: name, seriesId: slug, visible: true }];
        const activeBtn = qs(this.container, '.zd-tf-btn.active');
        if (activeBtn) this.applyTimeframeFilter(activeBtn.dataset.range);
        this.updateComparisonSidebar();
        this.renderChart();
      } else {
        console.error('Comparison API response did not meet success criteria:', data);
      }
    } catch (err) {
      console.error('Error adding comparison:', err);
    }
  }

  updateComparisonSidebar() {
    const sidebar = qs(this.container, '#zd-comparison-sidebar');
    const list = qs(this.container, '#zd-comparison-list');
    if (!sidebar || !list) return;
    if (this.compareItems.length > 0) {
      sidebar.classList.add('active');
      list.innerHTML = '';
      this.compareItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'zd-comparison-item';
        div.innerHTML = `
          <span style="opacity: ${item.visible ? 1 : 0.5}">${item.title}</span>
          <div class="zd-comparison-actions">
            <button class="zd-comparison-action" data-action="toggle" data-index="${index}" title="${item.visible ? 'Hide' : 'Show'}">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="${item.visible ? 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7z' : 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'}"/>
              </svg>
            </button>
            <button class="zd-comparison-action" data-action="remove" data-index="${index}" title="Remove">
              <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>`;
        div.querySelectorAll('.zd-comparison-action').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            const idx = parseInt(e.currentTarget.dataset.index);
            if (action === 'toggle') {
              this.compareItems[idx].visible = !this.compareItems[idx].visible;
              if (this.compareItems[idx].visible) {
                this.renderChart();
              } else {
                this.chartDataStore.secondary = { full: [], current: [], title: '' };
                this.renderChart();
              }
              this.updateComparisonSidebar();
            } else if (action === 'remove') {
              this.compareItems.splice(idx, 1);
              this.chartDataStore.secondary = { full: [], current: [], title: '' };
              this.updateComparisonSidebar();
              this.renderChart();
            }
          });
        });
        list.appendChild(div);
      });
    } else {
      sidebar.classList.remove('active');
    }
  }

  applyTimeframeFilter(rangeInYears) {
    const filterData = (full) => {
      if (!full || full.length === 0) return [];
      if (rangeInYears === 'all') return [...full];
      const months = parseFloat(rangeInYears) * 12;
      const last = full[full.length - 1].x;
      const start = new Date(last);
      start.setMonth(start.getMonth() - months);
      return full.filter(d => d.x >= start);
    };
    if (this.chartDataStore.primary.full.length > 0) this.chartDataStore.primary.current = filterData(this.chartDataStore.primary.full);
    if (this.chartDataStore.secondary.full.length > 0) this.chartDataStore.secondary.current = filterData(this.chartDataStore.secondary.full);
    this.renderChart();
  }

  renderChart() {
    const canvas = qs(this.container, '#zd-main-chart');
    const chartTitle = qs(this.container, '#zd-chart-title');
    const lastUpdate = qs(this.container, '#zd-last-update');
    const loading = qs(this.container, '#zd-loading');
    if (!canvas) return;
    const primary = this.chartDataStore.primary.current;
    const secondary = this.chartDataStore.secondary.current;
    if (!primary || primary.length === 0) {
      if (chartTitle) chartTitle.textContent = 'No data available';
      if (loading) loading.style.display = 'none';
      return;
    }
    if (chartTitle) chartTitle.textContent = this.chartDataStore.primary.title;
    if (lastUpdate) updateLastUpdate(this.container, this.chartDataStore.primary.lastUpdate);
    updateHistoricalStats(this.container, primary);
    this.chart = createOrUpdateChart({
      container: this.container,
      canvas,
      chart: this.chart,
      currentTheme: this.currentTheme,
      currentChartType: this.currentChartType,
      primaryData: primary,
      secondaryData: secondary,
      primaryTitle: this.chartDataStore.primary.title,
      secondaryTitle: this.chartDataStore.secondary.title
    });
    if (loading) loading.style.display = 'none';
  }

  showEmptyState() {
    const chartTitle = qs(this.container, '#zd-chart-title');
    const lastUpdate = qs(this.container, '#zd-last-update');
    const loading = qs(this.container, '#zd-loading');
    if (chartTitle) chartTitle.textContent = 'No Indicator Selected';
    if (lastUpdate) lastUpdate.textContent = 'Use the search button above to find indicators';
    if (loading) loading.style.display = 'none';
  }

  destroy() {
    if (this.chart) this.chart.destroy();
    this.container.innerHTML = '';
  }
}
