import api from './api.js';

export async function getDashboardExecutiveStats() {
  const { data } = await api.get('/sales-manager/executive-stats');
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load executive stats.');
  if (!Number.isFinite(data?.data?.total_executives) || !Array.isArray(data?.data?.executives)) throw new Error('Could not read executive stats.');
  return data.data;
}
