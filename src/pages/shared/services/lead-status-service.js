import api from './api.js';

function assertSuccess(payload) {
  if (payload?.success === false || payload?.status === false) throw new Error(payload.message || 'The lead status request failed.');
  return payload;
}

export async function listLeadStatuses(params) {
  const { data } = params?.company_id ? await api.get('/company-admin/lead-status-list', { params: { company_id: params.company_id } }) : await api.get('/company-admin/lead-status-list');
  assertSuccess(data);
  if (!Array.isArray(data)) throw new Error('Could not read the lead status list.');
  return data;
}

export async function getLeadStatus(id, companyId = null) {
  const endpoint = `/company-admin/lead-status/${encodeURIComponent(id)}`;
  const { data } = companyId ? await api.get(endpoint, { params: { company_id: companyId } }) : await api.get(endpoint);
  const payload = assertSuccess(data);
  if (!payload?.data || payload.data.id == null || typeof payload.data.name !== 'string') {
    throw new Error('Could not read the lead status details.');
  }
  return payload.data;
}

export async function createLeadStatus(name, companyId = null) {
  const { data } = await api.post('/company-admin/lead-status-create', { ...(companyId ? { company_id: Number(companyId) } : {}), name: name.trim() });
  return assertSuccess(data);
}

export async function updateLeadStatus(id, name, companyId = null) {
  const endpoint = `/company-admin/lead-status/${encodeURIComponent(id)}`;
  const body = { name: name.trim() };
  const { data } = companyId ? await api.patch(endpoint, body, { params: { company_id: companyId } }) : await api.patch(endpoint, body);
  return assertSuccess(data);
}

export async function deleteLeadStatus(id, companyId = null) {
  const endpoint = `/company-admin/lead-status/${encodeURIComponent(id)}`;
  const { data } = companyId ? await api.delete(endpoint, { params: { company_id: companyId } }) : await api.delete(endpoint);
  return assertSuccess(data);
}

export function leadStatusError(error) {
  const payload = error?.response?.data;
  const text = payload?.message || payload?.detail || payload?.name || error?.message;
  return Array.isArray(text) ? text.join(' ') : typeof text === 'string' ? text : 'The request failed. Please try again.';
}
