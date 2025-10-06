/**
 * Chart Types Module
 * Defines properties and potential data transformations for different chart types
 * ~50 lines
 */
class ChartTypesModule {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.types = {
      line: {
        type: 'line',
        tension: 0.3, // Default tension for line charts
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 6,
        // Example: Potential data transformation for line charts
        // transformData: (data) => this.interpolateData(data) // Not implemented here, just an example
      },
      bar: {
        type: 'bar',
        tension: 0, // Bars don't have tension
        fill: true,
        pointRadius: 0, // Bars don't typically have points
        pointHoverRadius: 0,
        // Example: Potential data transformation for bar charts
        // transformData: (data) => this.aggregateData(data) // Not implemented here, just an example
      },
      // Future chart types can be added here
      // scatter: { ... },
      // area: { ... },
    };
  }

  getChartConfig(type) {
    return this.types[type] || this.types.line; // Default to line if type not found
  }

  // Placeholder for potential data interpolation for line charts
  // interpolateData(data) {
  //   // Implementation for smoothing/interpolating line data points
  //   return data; // Placeholder
  // }

  // Placeholder for potential data aggregation for bar charts
  // aggregateData(data) {
  //   // Implementation for aggregating data points for bars
  //   return data; // Placeholder
  // }
}

export default ChartTypesModule;