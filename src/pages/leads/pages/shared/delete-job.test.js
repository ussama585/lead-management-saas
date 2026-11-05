import { describe, it, expect, vi } from 'vitest';
import api from '../../../shared/services/api.js';
import { deleteWebsiteLeadJob } from '../../../shared/services/leads.js';
import { deleteMetaLeadJob } from '../../../shared/services/metaLeads.js';
import { deleteHeadhuntingJob } from '../../../shared/services/headhunting.js';

vi.mock('../../../shared/services/api.js', () => ({ default: { delete: vi.fn() } }));
vi.mock('../../../shared/store/user-store.js', () => ({ default: vi.fn() }));

describe('Website Lead job deletion', () => {
  it.each([
    [deleteMetaLeadJob, '/meta-leads/delete-meta-lead-job/3'],
    [deleteHeadhuntingJob, '/headhunting/delete-job/3'],
  ])('deletes other job types without a reason body: %s', async (remove, endpoint) => {
    api.delete.mockResolvedValue({ data: { success: true } });
    await remove(3);
    expect(api.delete).toHaveBeenLastCalledWith(endpoint);
  });
  it('sends trimmed remarks as delete_reason in the DELETE body', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    await deleteWebsiteLeadJob(3, '  No longer required  ');
    expect(api.delete).toHaveBeenLastCalledWith('/lead-generation/delete-job/3', { data: { delete_reason: 'No longer required' } });
  });
  it.each(['', '   ', undefined])('deletes without requiring remarks: %s', async reason => {
    api.delete.mockClear();
    api.delete.mockResolvedValue({ data: { success: true } });
    await deleteWebsiteLeadJob(3, reason);
    expect(api.delete).toHaveBeenCalledWith('/lead-generation/delete-job/3');
  });
  it('reports API rejection', async () => {
    api.delete.mockResolvedValue({ data: { success: false, message: 'Deletion denied' } });
    await expect(deleteWebsiteLeadJob(3, 'Cancelled')).rejects.toThrow('Deletion denied');
  });
});
