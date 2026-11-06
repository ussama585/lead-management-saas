import { beforeEach, expect, it, vi } from 'vitest';
import api from './api.js';
import { restoreLeadJob, deleteDataLeadJobWithRemarks, listDeletedLeadJobs } from './lead-job-lifecycle.js';
vi.mock('./api.js', () => ({ default: { post: vi.fn(), delete: vi.fn(), get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

it.each([
  ['website', '/lead-generation/job-list/12'],
  ['data', '/data-leads/jobs/12'],
  ['meta', '/meta-leads/jobs/12'],
])('lists deleted %s jobs using is_active=false', async (source, endpoint) => {
  api.get.mockResolvedValue({ data: { count: 1, results: [{ id: 7, job_title: 'Engineer' }] } });
  const result = await listDeletedLeadJobs(source, { leadId: 12, pagination: { pageIndex: 1, pageSize: 25 },
    sorting: [{ id: 'job_title', desc: true }], search: 'Engineer' });
  expect(api.get).toHaveBeenCalledWith(endpoint, { params: { is_active: false, page: 2, size: 25,
    sort_by: 'job_title', order: 'desc', search: 'Engineer' } });
  expect(result.results[0].id).toBe(7);
});
it('accepts a nested results response', async () => {
  api.get.mockResolvedValue({ data: { data: { count: 0, results: [] } } });
  expect(await listDeletedLeadJobs('meta', { leadId: 12, pagination: { pageIndex: 0, pageSize: 10 } }))
    .toEqual({ count: 0, results: [] });
});

it.each([
  ['website', '/lead-generation/job-restore/7'],
  ['data', '/data-leads/job-restore/7'],
  ['meta', '/meta-leads/job-restore/7'],
])('restores %s jobs with POST to the restore endpoint', async (source, endpoint) => {
  api.post.mockResolvedValue({ data: { success: true } });
  await restoreLeadJob(source, 7);
  expect(api.post).toHaveBeenCalledWith(endpoint);
});
it('uses the supplied data job deletion endpoint and form-data remarks', async () => {
  api.delete.mockResolvedValue({ data: { success: true } });
  await deleteDataLeadJobWithRemarks(7, ' Cancelled ');
  const [endpoint, config] = api.delete.mock.lastCall;
  expect(endpoint).toBe('/data-leads/delete-data-lead-job/7');
  expect(Object.fromEntries(config.data)).toEqual({ delete_reason: 'Cancelled' });
});
it('blocks empty deletion remarks', async () => {
  await expect(deleteDataLeadJobWithRemarks(7, ' ')).rejects.toThrow('Please add remarks');
  expect(api.delete).not.toHaveBeenCalled();
});
it('surfaces restore rejection', async () => {
  api.post.mockResolvedValue({ data: { status: false, message: 'Restore denied' } });
  await expect(restoreLeadJob('data', 7)).rejects.toThrow('Restore denied');
});
