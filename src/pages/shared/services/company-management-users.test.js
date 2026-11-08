import { describe, expect, it, vi } from 'vitest';
vi.mock('../store/user-store.js', () => ({ default: { getState: () => ({ user: {} }) } }));
import api from './api.js';
import { getCompanyManagementUsers, getUserTabCounts, getAccountCompanyId } from './users-service.js';
vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
describe('company User Management listing', () => {
  it('recovers the company from the signed-in account detail when OTP login omits it', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { id: 42, user_type: 'company_admin', company_id: 10 } } });
    expect(await getAccountCompanyId(42)).toBe(10);
    expect(api.get).toHaveBeenLastCalledWith('/accounts/detail/42');
  });
  it('does not substitute the account ID if its profile has no company', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { id: 42, user_type: 'company_admin' } } });
    await expect(getAccountCompanyId(42)).rejects.toThrow('account details do not include a company ID');
  });
  it('preserves account-detail API failures', async () => {
    api.get.mockResolvedValue({ data: { status: false, message: 'Account unavailable.' } });
    await expect(getAccountCompanyId(42)).rejects.toThrow('Account unavailable.');
  });
  it('reads tab counts for both admin roles from the wrapped counts response', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { total: 5, super_admin: 0, company_admin: 2, sales_manager: 1, sales_executive: 1, data_entry_executive: 1 } } });
    expect(await getUserTabCounts()).toEqual({ all: 5, total: 5, super_admin: 0, company_admin: 2, sales_manager: 1, sales_executive: 1, data_entry_executive: 1 });
    expect(api.get).toHaveBeenLastCalledWith('/accounts/users-count');
  });
  it('passes the company ID in the endpoint with table filters', async () => {
    const data = { count: 7, results: [{ id: 12, name: 'Ali Ahmed', user_type: 'company_admin' }] };
    api.get.mockResolvedValue({ data });
    expect(await getCompanyManagementUsers(1, { page: 2, pageSize: 25, userType: 'sales_executive', search: ' Ali ', sorting: [{ id: 'name', desc: true }] })).toEqual(data);
    expect(api.get).toHaveBeenLastCalledWith('/company/users/1', { params: { page: 2, size: 25, company_id: 1, user_type: 'sales_executive', search: 'Ali', sort_by: 'name', order: 'desc' } });
  });
  it('does not request an unscoped listing without a company ID', async () => {
    await expect(getCompanyManagementUsers(undefined)).rejects.toThrow('company ID');
  });
  it('reports unsuccessful responses', async () => {
    api.get.mockResolvedValue({ data: { status: false, message: 'Forbidden' } });
    await expect(getCompanyManagementUsers(1)).rejects.toThrow('Forbidden');
  });
});
