import api from './api.js';

function assertSuccess(payload) {
  if (payload?.success === false) throw new Error(payload.message || 'The lead status request failed.');
  return payload;
}

export async function listLeadStatuses() {
  const { data } = await api.get('/company-admin/lead-status-list');
  assertSuccess(data);
  if (!Array.isArray(data)) throw new Error('Could not read the lead status list.');
  return data;
}

export async function getLeadStatus(id) {
  const { data } = await api.get(`/company-admin/lead-status/${encodeURIComponent(id)}`);
  const payload = assertSuccess(data);
  if (!payload?.data || payload.data.id == null || typeof payload.data.name !== 'string') {
    throw new Error('Could not read the lead status details.');
  }
  return payload.data;
}

export async function createLeadStatus(name) {
  const { data } = await api.post('/company-admin/lead-status-create', { name: name.trim() });
  return assertSuccess(data);
}

export async function updateLeadStatus(id, name) {
  const { data } = await api.patch(`/company-admin/lead-status/${encodeURIComponent(id)}`, { name: name.trim() });
  return assertSuccess(data);
}

export async function deleteLeadStatus(id) {
  const { data } = await api.delete(`/company-admin/lead-status/${encodeURIComponent(id)}`);
  return assertSuccess(data);
}

export function leadStatusError(error) {
  const payload = error?.response?.data;
  const text = payload?.message || payload?.detail || payload?.name || error?.message;
  return Array.isArray(text) ? text.join(' ') : typeof text === 'string' ? text : 'The request failed. Please try again.';
}
