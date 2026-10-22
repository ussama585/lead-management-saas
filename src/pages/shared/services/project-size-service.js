import api from './api.js';

function assertSuccess(payload) {
  if (payload?.success === false) throw new Error(payload.message || 'The project size request failed.');
  return payload;
}

export async function listProjectSizes() {
  const { data } = await api.get('/company-admin/project-size-list');
  assertSuccess(data);
  if (!Array.isArray(data)) throw new Error('Could not read the project size list.');
  return data;
}

export async function getProjectSize(id) {
  const { data } = await api.get(`/company-admin/project-size/${encodeURIComponent(id)}`);
  const payload = assertSuccess(data);
  if (!payload?.data || payload.data.id == null || typeof payload.data.value !== 'string') {
    throw new Error('Could not read the project size details.');
  }
  return payload.data;
}

export async function createProjectSize(value) {
  const { data } = await api.post('/company-admin/project-size-create', { value: value.trim() });
  return assertSuccess(data);
}

export async function updateProjectSize(id, value) {
  const { data } = await api.patch(`/company-admin/project-size/${encodeURIComponent(id)}`, { value: value.trim() });
  return assertSuccess(data);
}

export async function deleteProjectSize(id) {
  const { data } = await api.delete(`/company-admin/project-size/${encodeURIComponent(id)}`);
  return assertSuccess(data);
}

export function projectSizeError(error) {
  const payload = error?.response?.data;
  const text = payload?.message || payload?.detail || payload?.value || error?.message;
  return Array.isArray(text) ? text.join(' ') : typeof text === 'string' ? text : 'The request failed. Please try again.';
}
