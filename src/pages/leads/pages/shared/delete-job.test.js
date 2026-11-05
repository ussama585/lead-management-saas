import { describe, it, expect, vi } from 'vitest';
import api from '../../../shared/services/api.js';
import { deleteWebsiteLeadJob } from '../../../shared/services/leads.js';
import { deleteMetaLeadJob } from '../../../shared/services/metaLeads.js';
import { deleteHeadhuntingJob } from '../../../shared/services/headhunting.js';
import { deleteJobSchema } from './delete-job-schema.js';

vi.mock('../../../shared/services/api.js', () => ({ default: { delete: vi.fn() } }));
vi.mock('../../../shared/store/user-store.js', () => ({ default: vi.fn() }));

describe('Website Lead job deletion', () => {
  it.each([
    [deleteMetaLeadJob, '/meta-leads/delete-meta-lead-job/3'],
    [deleteHeadhuntingJob, '/headhunting/delete-job/3'],
  ])('includes deletion remarks for other job types: %s', async (remove, endpoint) => {
    api.delete.mockResolvedValue({ data: { success: true } });
    await remove(3, 'Position cancelled');
    const [url, config] = api.delete.mock.lastCall;
    expect(url).toBe(endpoint);
    const payload = config.data instanceof FormData ? Object.fromEntries(config.data) : config.data;
    expect(payload).toEqual({ delete_reason: 'Position cancelled' });
  });
  it('sends trimmed remarks as delete_reason in the DELETE body', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    await deleteWebsiteLeadJob(3, '  No longer required  ');
    expect(api.delete).toHaveBeenLastCalledWith('/lead-generation/delete-job/3', { data: { delete_reason: 'No longer required' } });
  });
  it.each(['', '   ', undefined])('blocks deletion without remarks: %s', async reason => {
    api.delete.mockClear();
    api.delete.mockResolvedValue({ data: { success: true } });
    await expect(deleteWebsiteLeadJob(3, reason)).rejects.toThrow('Please add remarks');
    expect(api.delete).not.toHaveBeenCalled();
  });
  it('requires nonblank remarks in the deletion modal', async () => {
    await expect(deleteJobSchema.validate({ remarks: '   ' })).rejects.toThrow('Please add remarks');
    await expect(deleteJobSchema.validate({ remarks: ' Cancelled ' })).resolves.toEqual({ remarks: 'Cancelled' });
  });
  it('reports API rejection', async () => {
    api.delete.mockResolvedValue({ data: { success: false, message: 'Deletion denied' } });
    await expect(deleteWebsiteLeadJob(3, 'Cancelled')).rejects.toThrow('Deletion denied');
  });
});
