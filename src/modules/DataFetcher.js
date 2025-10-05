// DataFetcher.js - WordPress AJAX + search helpers
export async function fetchIndicatorData(slug) {
  const wpConfig = window.zcDmtConfig || {};
  const formData = new FormData();
  formData.append('action', 'zc_dmt_get_data');
  formData.append('nonce', wpConfig.chartNonce || wpConfig.nonce);
  formData.append('slug', slug);
  const response = await fetch(wpConfig.ajaxUrl, { method: 'POST', body: formData });
  const json = await response.json();
  if (!json || json.status !== 'success' || !json.data || !Array.isArray(json.data.series) || json.data.series.length === 0) {
    console.error('API response did not meet success criteria:', json);
    throw new Error('No data');
  }
  return json.data;
}

export function searchIndicators(query) {
  const wpConfig = window.zcDmtConfig || {};
  const indicators = wpConfig.indicators || [];
  const q = String(query || '').toLowerCase();
  return indicators.filter(ind =>
    (ind.name && ind.name.toLowerCase().includes(q)) ||
    (ind.slug && ind.slug.toLowerCase().includes(q)) ||
    (ind.source_type && ind.source_type.toLowerCase().includes(q))
  );
}
