import api from './api.js';

export async function listDeletedLeadJobs(source, { leadId, pagination, sorting = [], search = '' }) {
  const prefixes = { website: '/lead-generation/job-list', data: '/data-leads/jobs', meta: '/meta-leads/jobs' };
  if (!prefixes[source] || !leadId) throw new Error('A valid job source and lead are required.');
  const { data } = await api.get(`${prefixes[source]}/${encodeURIComponent(leadId)}`, {
    params: { is_active: false, page: pagination.pageIndex + 1, size: pagination.pageSize,
      search, sort_by: sorting[0]?.id || '', order: sorting[0]?.desc ? 'desc' : 'asc' },
  });
  if (data?.success === false || data?.status === false) throw new Error(data.message || 'Could not load deleted jobs.');
  const result = Array.isArray(data?.data?.results) ? data.data : data;
  if (!Array.isArray(result) && !Array.isArray(result?.results)) throw new Error('Could not read deleted jobs.');
  return result;
}

export async function restoreLeadJob(source, jobId) {
  const prefixes = { website: '/lead-generation/job', data: '/data-leads/update-job', meta: '/meta-leads/update-job' };
  if (!prefixes[source]) throw new Error('Unsupported job source.');
  const { data } = await api.patch(`${prefixes[source]}/${encodeURIComponent(jobId)}`, { is_active: true });
  if (data?.success === false || data?.status === false) throw new Error(data.message || 'Could not restore job.');
  return data;
}

export async function deleteDataLeadJobWithRemarks(jobId, reason) {
  if (!reason?.trim()) throw new Error('Please add remarks before deleting this job.');
  const body = new FormData();
  body.append('delete_reason', reason.trim());
  const { data } = await api.delete(`/data-leads/delete-data-lead-job/${encodeURIComponent(jobId)}`, { data: body });
  if (data?.success === false || data?.status === false) throw new Error(data.message || 'Could not delete job.');
  return data;
}
