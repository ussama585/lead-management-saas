import { describe, it, expect, vi } from 'vitest';
import api from '../pages/shared/services/api.js';
import { updateLeadCardFields } from './lead-card-updates.js';

vi.mock('../pages/shared/services/api.js', () => ({ default: { patch: vi.fn() } }));

describe('lead detail card updates use listing endpoints', () => {
  it.each([{ status: 'SaaS Client', remarks: 'Discussed requirements' }, { assigned_to: 25 }])('uses JSON for Data Lead changes: %j', async values => {
    api.patch.mockResolvedValue({ data: { success: true } });
    await updateLeadCardFields('Data Lead', 10, values);
    expect(api.patch).toHaveBeenLastCalledWith('/data-leads/details/10', values);
  });
  it.each([{ status: 'Contacted', remarks: 'Called today' }, { assigned_to: 25 }])('uses FormData for Website Lead changes: %j', async values => {
    api.patch.mockResolvedValue({ data: { message: 'Updated' } });
    await updateLeadCardFields('Website Lead', 10, values);
    const [url, body] = api.patch.mock.lastCall;
    expect(url).toBe('/lead-generation/update/10');
    expect(body).toBeInstanceOf(FormData);
    expect(Object.fromEntries(body)).toEqual(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)])));
  });
  it('reports API validation failures', async () => {
    api.patch.mockResolvedValue({ data: { success: false, message: 'Invalid status' } });
    await expect(updateLeadCardFields('Website Lead', 10, { status: 'Bad' })).rejects.toThrow('Invalid status');
  });
});
