import api from './api.js';

function assertSuccess(payload) {
  if (payload?.success === false) throw new Error(payload.message || 'The project size request failed.');
  return payload;
}

export async function listProjectSizes(params) {
  const { data } = params?.company_id ? await api.get('/company-admin/project-size-list', { params: { company_id: params.company_id } }) : await api.get('/company-admin/project-size-list');
  assertSuccess(data);
  if (!Array.isArray(data)) throw new Error('Could not read the project size list.');
  return data;
}

export async function getProjectSize(id, companyId = null) {
  const endpoint = `/company-admin/project-size/${encodeURIComponent(id)}`;
  const { data } = companyId ? await api.get(endpoint, { params: { company_id: companyId } }) : await api.get(endpoint);
  const payload = assertSuccess(data);
  if (!payload?.data || payload.data.id == null || typeof payload.data.value !== 'string') {
    throw new Error('Could not read the project size details.');
  }
  return payload.data;
}

export async function createProjectSize(value, companyId = null) {
  const { data } = await api.post('/company-admin/project-size-create', { ...(companyId ? { company_id: Number(companyId) } : {}), value: value.trim() });
  return assertSuccess(data);
}

export async function updateProjectSize(id, value, companyId = null) {
  const endpoint = `/company-admin/project-size/${encodeURIComponent(id)}`;
  const body = { value: value.trim() };
  const { data } = companyId ? await api.patch(endpoint, body, { params: { company_id: companyId } }) : await api.patch(endpoint, body);
  return assertSuccess(data);
}

export async function deleteProjectSize(id, companyId = null) {
  const endpoint = `/company-admin/project-size/${encodeURIComponent(id)}`;
  const { data } = companyId ? await api.delete(endpoint, { params: { company_id: companyId } }) : await api.delete(endpoint);
  return assertSuccess(data);
}

export function projectSizeError(error) {
  const payload = error?.response?.data;
  const text = payload?.message || payload?.detail || payload?.value || error?.message;
  return Array.isArray(text) ? text.join(' ') : typeof text === 'string' ? text : 'The request failed. Please try again.';
}
