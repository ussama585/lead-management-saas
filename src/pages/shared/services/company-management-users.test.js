import { describe, expect, it, vi } from 'vitest';
import api from './api.js';
import { getCompanyManagementUsers, getUserTabCounts } from './users-service.js';
vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
describe('company User Management listing', () => {
  it('reads tab counts for both admin roles from the wrapped counts response', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { total: 5, super_admin: 0, company_admin: 2, sales_manager: 1, sales_executive: 1, data_entry_executive: 1 } } });
    expect(await getUserTabCounts()).toEqual({ all: 5, total: 5, super_admin: 0, company_admin: 2, sales_manager: 1, sales_executive: 1, data_entry_executive: 1 });
    expect(api.get).toHaveBeenLastCalledWith('/accounts/users-count');
  });
  it('passes the company ID in the endpoint with table filters', async () => {
    const data = { count: 7, results: [{ id: 12, name: 'Ali Ahmed', user_type: 'company_admin' }] };
    api.get.mockResolvedValue({ data });
    expect(await getCompanyManagementUsers(1, { page: 2, pageSize: 25, userType: 'sales_executive', search: ' Ali ', sorting: [{ id: 'name', desc: true }] })).toEqual(data);
    expect(api.get).toHaveBeenLastCalledWith('/company/users/1', { params: { page: 2, size: 25, user_type: 'sales_executive', search: 'Ali', sort_by: 'name', order: 'desc' } });
  });
  it('does not request an unscoped listing without a company ID', async () => {
    await expect(getCompanyManagementUsers(undefined)).rejects.toThrow('company ID');
  });
  it('reports unsuccessful responses', async () => {
    api.get.mockResolvedValue({ data: { status: false, message: 'Forbidden' } });
    await expect(getCompanyManagementUsers(1)).rejects.toThrow('Forbidden');
  });
});
