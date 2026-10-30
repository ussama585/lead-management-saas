import api from './api.js';

export function normalizeLeadCounts(response) {
  return response?.data && !Array.isArray(response.data) ? response.data : response || {};
}

export function leadCountTabs(response) {
  const counts = normalizeLeadCounts(response);
  const excluded = new Set(['total_count', 'total', 'count', 'assigned_count', 'success', 'status', 'current_page', 'total_pages']);
  return Object.entries(counts).filter(([key, count]) => !excluded.has(key) && typeof count === 'number')
    .map(([key]) => {
      const label = key.includes('_') || key === key.toLowerCase()
        ? key.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()).replace(/\bSaas\b/g, 'SaaS')
        : key;
      return { label, value: label, apiKey: key };
    });
}

export async function getLeadFilterCounts(params = {}) {
  const { data } = await api.get('/lead-generation/list-count', { params });
  if (data?.success === false || data?.status === false) throw new Error(data.message || 'Could not load lead counts.');
  return normalizeLeadCounts(data);
}
