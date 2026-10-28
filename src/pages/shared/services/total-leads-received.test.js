import { describe, it, expect, vi } from 'vitest';
import api from './api.js';
import { getSuperAdminTotalLeadsReceived } from './admin-total-leads.js';

vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));

describe('Super Admin total leads received', () => {
  it('passes company, date-time range and period to the accounts API', async () => {
    const response = { totalCount: 37, timeSeriesData: [{ period: '20 Oct 2026', count: 6 }] };
    api.get.mockResolvedValue({ data: response });
    expect(await getSuperAdminTotalLeadsReceived({ companyId: '5', startDate: '2026-10-01T00:00:00', endDate: '2026-10-28T00:00:00', period: 'month' })).toEqual(response);
    expect(api.get).toHaveBeenLastCalledWith('/accounts/total-lead-received', { params: { company_id: '5', start_date: '2026-10-01T00:00:00', end_date: '2026-10-28T00:00:00', period: 'month' } });
  });
  it('accepts empty results and omits optional filters', async () => {
    api.get.mockResolvedValue({ data: { totalCount: 0, timeSeriesData: [] } });
    expect(await getSuperAdminTotalLeadsReceived()).toEqual({ totalCount: 0, timeSeriesData: [] });
    expect(api.get).toHaveBeenLastCalledWith('/accounts/total-lead-received', { params: { period: 'month' } });
  });
  it.each([null, {}, { status: false, message: 'Forbidden' }, { totalCount: 1, timeSeriesData: null }])('reports failed or invalid responses', async data => {
    api.get.mockResolvedValue({ data });
    await expect(getSuperAdminTotalLeadsReceived()).rejects.toThrow();
  });
});
