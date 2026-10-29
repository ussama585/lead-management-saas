import { describe, it, expect, vi } from 'vitest';
import api from './api.js';
import { getSuperAdminLeadsStatusHealth, getLeadsStatusHealth } from './admin-graphs.js';

vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../utils/api.js', () => ({ MAIN_SYSTEM_BASE_URL: 'https://example.com' }));

describe('Super Admin lead status health', () => {
  it.each(['company_admin', 'sales_manager', 'sales_executive'])('uses the correct endpoint for %s', async userType => {
    const rows = [{ status: 'Activated', count: 3 }];
    api.get.mockResolvedValue({ data: { data: rows } });
    expect(await getLeadsStatusHealth({ userType, startDate: '2026-10-01', endDate: '2026-10-29' })).toEqual(rows);
    expect(api.get).toHaveBeenLastCalledWith(`/${userType.replaceAll('_', '-')}/leads-status-health`, { params: { start_date: '2026-10-01', end_date: '2026-10-29' } });
  });
  it('sends source, company and dates and unwraps the status counts', async () => {
    const rows = [{ status: 'Activated', count: 4 }, { status: 'Pending', count: 0 }];
    api.get.mockResolvedValue({ data: { status: true, data: rows } });
    expect(await getSuperAdminLeadsStatusHealth({ companyId: '5', startDate: '2026-10-01', endDate: '2026-10-28' })).toEqual(rows);
    expect(api.get).toHaveBeenLastCalledWith('/accounts/leads-status-health', { params: { company_id: '5', start_date: '2026-10-01', end_date: '2026-10-28' } });
  });
  it('handles empty results without sending unused filters', async () => {
    api.get.mockResolvedValue({ data: { status: true, data: [] } });
    expect(await getSuperAdminLeadsStatusHealth()).toEqual([]);
    expect(api.get).toHaveBeenLastCalledWith('/accounts/leads-status-health', { params: {} });
  });
  it.each([null, {}, { status: false, message: 'Forbidden' }, { data: {} }])('reports failed or invalid responses', async data => {
    api.get.mockResolvedValue({ data });
    await expect(getSuperAdminLeadsStatusHealth()).rejects.toThrow();
  });
});
