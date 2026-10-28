import { describe, it, expect, vi } from 'vitest';
import api from '../../../shared/services/api.js';
import { deleteWebsiteLeadJob } from '../../../shared/services/leads.js';
import { deleteJobSchema } from './delete-job-schema.js';

vi.mock('../../../shared/services/api.js', () => ({ default: { delete: vi.fn() } }));

describe('Website Lead job deletion with remarks', () => {
  it('sends trimmed remarks as delete_reason in the DELETE body', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    await deleteWebsiteLeadJob(3, '  No longer required  ');
    expect(api.delete).toHaveBeenLastCalledWith('/lead-generation/delete-job/3', { data: { delete_reason: 'No longer required' } });
  });
  it.each(['', '   ', undefined])('blocks missing remarks before sending a request', async reason => {
    api.delete.mockClear();
    await expect(deleteWebsiteLeadJob(3, reason)).rejects.toThrow('Please add remarks');
    expect(api.delete).not.toHaveBeenCalled();
  });
  it('validates the remarks form', async () => {
    await expect(deleteJobSchema.validate({ remarks: '   ' })).rejects.toThrow();
    await expect(deleteJobSchema.validate({ remarks: ' Cancelled ' })).resolves.toEqual({ remarks: 'Cancelled' });
  });
  it('reports API rejection', async () => {
    api.delete.mockResolvedValue({ data: { success: false, message: 'Deletion denied' } });
    await expect(deleteWebsiteLeadJob(3, 'Cancelled')).rejects.toThrow('Deletion denied');
  });
});
