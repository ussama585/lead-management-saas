import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../shared/services/api.js';
import { getJobDetails } from './data-lead-job-detail.jsx';
vi.mock('../../../shared/services/api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../../../shared/store/user-store.js', () => ({ default: () => ({ user: {} }) }));
beforeEach(() => vi.clearAllMocks());

describe('data lead job details from the lead jobs endpoint', () => {
  it('uses the parent lead ID and selects the requested job from results', async () => {
    api.get.mockResolvedValue({ data: { status: true, results: [{ id: 1, job_title: 'Other job' }, { id: 7, job_title: 'Requested job' }], next: null } });
    expect(await getJobDetails('7', '42')).toEqual({ id: 7, job_title: 'Requested job' });
    expect(api.get).toHaveBeenCalledWith('/data-leads/jobs/42', { params: { page: 1, size: 100 } });
  });
  it('finds jobs on later pages without requesting the hostname from next', async () => {
    api.get.mockResolvedValueOnce({ data: { status: true, results: [{ id: 1 }], next: 'http://127.0.0.1:8000/api/data-leads/jobs/42?page=2' } })
      .mockResolvedValueOnce({ data: { status: true, results: [{ id: 7 }], next: null } });
    expect(await getJobDetails(7, 42)).toEqual({ id: 7 });
    expect(api.get).toHaveBeenLastCalledWith('/data-leads/jobs/42', { params: { page: 2, size: 100 } });
  });
  it('does not show an unrelated job when the requested one is missing', async () => {
    api.get.mockResolvedValue({ data: { status: true, results: [{ id: 1 }], next: null } });
    await expect(getJobDetails(7, 42)).rejects.toThrow('not found');
  });
  it.each([{ status: false, message: 'Forbidden' }, { status: true }])('handles failed or unreadable responses', async data => {
    api.get.mockResolvedValue({ data });
    await expect(getJobDetails(7, 42)).rejects.toThrow();
  });
});
