import { describe, it, expect, vi } from 'vitest';
import api from './api.js';
import { getSuperAdminLeadStatusDistribution, getSuperAdminMobilisationAmounts } from './admin-graphs.js';
import { getSuperAdminTotalLeadsReceived } from './admin-total-leads.js';
import { dashboardEndpoint } from './dashboard-endpoint.js';

vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../utils/api.js', () => ({ MAIN_SYSTEM_BASE_URL: 'https://example.com' }));

describe.each(['company_admin', 'sales_manager', 'sales_executive', 'super_admin'])('%s dashboard endpoints', userType => {
  const prefix = userType === 'super_admin' ? 'accounts' : userType.replaceAll('_', '-');
  it('uses the role prefix for lead counts', () => {
    expect(dashboardEndpoint('lead-stats', userType)).toBe(`/${prefix}/lead-stats`);
  });
  it('uses the role prefix for status distribution', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    await getSuperAdminLeadStatusDistribution({ userType });
    expect(api.get).toHaveBeenLastCalledWith(`/${prefix}/lead-status-distribute`, { params: {} });
  });
  it('uses the role prefix for total received', async () => {
    api.get.mockResolvedValue({ data: { totalCount: 0, timeSeriesData: [] } });
    await getSuperAdminTotalLeadsReceived({ userType });
    expect(api.get).toHaveBeenLastCalledWith(`/${prefix}/total-lead-received`, { params: { period: 'month' } });
  });
  it('uses the role prefix for mobilisation amounts', async () => {
    api.get.mockResolvedValue({ data: { data: { Meta: [], Data: [], Website: [] } } });
    await getSuperAdminMobilisationAmounts({ userType });
    expect(api.get).toHaveBeenLastCalledWith(`/${prefix}/leads-mobilisation-amounts`, { params: {} });
  });
});
