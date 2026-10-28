import { describe, it, expect, vi } from 'vitest';
import api from './api.js';
import { getSuperAdminLeadStatusDistribution } from './admin-graphs.js';

vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../utils/api.js', () => ({ MAIN_SYSTEM_BASE_URL: 'https://example.com' }));

describe('Super Admin lead status distribution', () => {
  it('sends source, company and dates and unwraps the status counts', async () => {
    const rows = [{ status: 'Activated', count: 4 }, { status: 'Pending', count: 0 }];
    api.get.mockResolvedValue({ data: { status: true, data: rows } });
    expect(await getSuperAdminLeadStatusDistribution({ leadType: 'Data', companyId: '5', startDate: '2026-10-01', endDate: '2026-10-28' })).toEqual(rows);
    expect(api.get).toHaveBeenLastCalledWith('/accounts/lead-status-distribute', { params: { lead_type: 'Data', company_id: '5', start_date: '2026-10-01', end_date: '2026-10-28' } });
  });
  it('handles empty results without sending unused filters', async () => {
    api.get.mockResolvedValue({ data: { status: true, data: [] } });
    expect(await getSuperAdminLeadStatusDistribution()).toEqual([]);
    expect(api.get).toHaveBeenLastCalledWith('/accounts/lead-status-distribute', { params: {} });
  });
  it.each([null, {}, { status: false, message: 'Forbidden' }, { data: {} }])('reports failed or invalid responses', async data => {
    api.get.mockResolvedValue({ data });
    await expect(getSuperAdminLeadStatusDistribution()).rejects.toThrow();
  });
});
