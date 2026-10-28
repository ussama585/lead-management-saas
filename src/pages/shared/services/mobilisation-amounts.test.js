import { describe, it, expect, vi } from 'vitest';
import api from './api.js';
import { getSuperAdminMobilisationAmounts } from './admin-graphs.js';

vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../utils/api.js', () => ({ MAIN_SYSTEM_BASE_URL: 'https://example.com' }));

describe('Super Admin mobilisation amounts', () => {
  const groups = { Meta: [], Data: [{ assigned_to_id: 8, assigned_to_name: 'Ahmed Raza', mobilisation_amount: 0 }], Website: [] };
  it('passes the date range and selected company to the accounts endpoint', async () => {
    api.get.mockResolvedValue({ data: { data: groups } });
    expect(await getSuperAdminMobilisationAmounts({ startDate: '2026-10-01', endDate: '2026-10-31', companyId: '1' })).toEqual(groups);
    expect(api.get).toHaveBeenLastCalledWith('/accounts/leads-mobilisation-amounts', { params: { start_date: '2026-10-01', end_date: '2026-10-31', company_id: '1' } });
  });
  it('supports root-level groups and omits unused filters', async () => {
    api.get.mockResolvedValue({ data: groups });
    expect(await getSuperAdminMobilisationAmounts()).toEqual(groups);
    expect(api.get).toHaveBeenLastCalledWith('/accounts/leads-mobilisation-amounts', { params: {} });
  });
  it.each([{ success: false, message: 'Forbidden' }, {}, null])('reports failed or malformed responses', async data => {
    api.get.mockResolvedValue({ data });
    await expect(getSuperAdminMobilisationAmounts()).rejects.toThrow();
  });
});
