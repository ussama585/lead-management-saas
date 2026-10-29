import { describe, it, expect, vi } from 'vitest';
import api from '../../../shared/services/api.js';
import { getSuperAdminStats, dashboardStatCards } from './super-admin-stats.jsx';

vi.mock('../../../shared/services/api.js', () => ({ default: { get: vi.fn() } }));

describe('Super Admin dashboard stats', () => {
  it('loads manager lead counts with the selected stats scope', async () => {
    const stats = { website_leads_stats: { count: 0, trend: 0 }, data_leads_stats: { count: 2, trend: -10 }, meta_leads_stats: { count: 1, trend: 5 } };
    api.get.mockResolvedValue({ data: { status: true, data: stats } });
    expect(await getSuperAdminStats('/sales-manager/stats', { order_by: 'Executive Stats' })).toEqual(stats);
    expect(api.get).toHaveBeenLastCalledWith('/sales-manager/stats', { params: { order_by: 'Executive Stats' } });
  });
  it('unwraps company admin stats and displays all counts including zero', async () => {
    const stats = {
      company_admin_stats: { count: 2, trend: -100 },
      sales_manager_stats: { count: 1, trend: -100 },
      sales_executive_stats: { count: 1, trend: -100 },
      data_entry_executive: { count: 0, trend: 0 },
    };
    api.get.mockResolvedValue({ data: { status: true, message: 'Company statistics retrieved successfully.', data: stats } });
    const result = await getSuperAdminStats('/company-admin/stats');
    expect(result).toEqual(stats);
    expect(dashboardStatCards(result, {}).map(({ count, trend }) => ({ count, trend }))).toEqual([
      { count: 2, trend: -100 }, { count: 1, trend: -100 }, { count: 1, trend: -100 }, { count: 0, trend: 0 },
    ]);
  });
  it.each(['/accounts/stats', '/accounts/lead-stats'])('loads %s without the legacy stats endpoint', async endpoint => {
    const response = { company_stats: { count: 5, trend: 50 } };
    api.get.mockResolvedValue({ data: response });
    expect(await getSuperAdminStats(endpoint)).toEqual(response);
    expect(api.get).toHaveBeenLastCalledWith(endpoint);
  });
  it('keeps live zero counts and positive, negative and zero trends', () => {
    const result = dashboardStatCards({ data_leads: { count: 9, trend: 100 }, meta_leads: { count: 0, trend: -4 }, web_leads: { count: 2, trend: 0 }, status: true }, {});
    expect(result.map(({ key, count, trend }) => ({ key, count, trend }))).toEqual([
      { key: 'data_leads', count: 9, trend: 100 }, { key: 'meta_leads', count: 0, trend: -4 }, { key: 'web_leads', count: 2, trend: 0 },
    ]);
  });
  it('uses configured labels and ignores malformed counts', () => {
    expect(dashboardStatCards({ user_stats: { count: 19, trend: 11.11 }, invalid: { count: null } }, { user_stats: ['Total Users'] }))
      .toMatchObject([{ key: 'user_stats', title: 'Total Users', count: 19, trend: 11.11 }]);
  });
  it.each([null, [], { success: false, message: 'Forbidden' }])('reports failed or invalid responses', async data => {
    api.get.mockResolvedValue({ data });
    await expect(getSuperAdminStats('/accounts/stats')).rejects.toThrow();
  });
});
