import { describe, it, expect, vi } from 'vitest';
import api from '../../../shared/services/api.js';
import { emptyDataLeadJob, leadJobPayload, saveLeadJob, getLeadJob } from './lead-job-form.jsx';

vi.mock('../../../shared/services/api.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('../../../shared/store/user-store.js', () => ({ default: () => ({ user: {} }) }));

describe.each([
  ['data', 'data_lead', '/data-leads/create-job', '/data-leads/update-job/7'],
  ['meta', 'meta_lead', '/meta-leads/create-job', '/meta-leads/update-job/7'],
  ['website', 'lead_generation_request', '/lead-generation/create-job', '/lead-generation/job/7'],
])('%s shared job form API', (source, leadKey, createEndpoint, editEndpoint) => {
  const values = { ...emptyDataLeadJob, data_lead: 12, skills: [], degrees: [] };
  it('sends only the correct lead relationship', () => {
    const payload = leadJobPayload(values, source);
    expect(payload[leadKey]).toBe(12);
    ['data_lead', 'meta_lead', 'lead_generation_request'].filter(key => key !== leadKey).forEach(key => expect(payload).not.toHaveProperty(key));
  });
  it('creates with the correct endpoint and shared fields', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    await saveLeadJob(source, values);
    expect(api.post).toHaveBeenLastCalledWith(createEndpoint, expect.objectContaining({ [leadKey]: 12, min_experience: 0, max_experience: 0 }));
  });
  it('updates through the correct endpoint', async () => {
    api.patch.mockResolvedValue({ data: { success: true } });
    await saveLeadJob(source, values, 7);
    expect(api.patch).toHaveBeenLastCalledWith(editEndpoint, expect.objectContaining({ [leadKey]: 12 }));
  });
  it('loads enveloped job data', async () => {
    api.get.mockResolvedValue({ data: { data: { id: 7, job_title: 'Developer' } } });
    expect(await getLeadJob(source, 7)).toEqual({ id: 7, job_title: 'Developer' });
    expect(api.get).toHaveBeenLastCalledWith(editEndpoint);
  });
  it('rejects unsuccessful updates', async () => {
    api.patch.mockResolvedValue({ data: { success: false, message: 'Invalid job' } });
    await expect(saveLeadJob(source, values, 7)).rejects.toThrow('Invalid job');
  });
});
