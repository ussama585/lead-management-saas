import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api.js';
import { getAllUsers } from './users-service.js';

vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

describe('super admin all-users listing', () => {
  it('uses the all-users endpoint and preserves the paginated response', async () => {
    const payload = { status: true, count: 1, next: null, previous: null, results: [{ id: 11, name: 'Company Admin', user_type: 'company_admin', profile_pic: null, is_active: true }] };
    api.get.mockResolvedValue({ data: payload });
    expect(await getAllUsers()).toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/accounts/all-users', { params: { page: 1, size: 10 } });
  });
  it('sends search, role, active state, sort field and sort direction', async () => {
    api.get.mockResolvedValue({ data: { count: 0, results: [] } });
    await getAllUsers({ page: 2, pageSize: 25, search: ' user ', userType: 'sales_executive', isActive: 'false', sorting: [{ id: 'name', desc: true }] });
    expect(api.get).toHaveBeenCalledWith('/accounts/all-users', { params: {
      page: 2, size: 25, search: 'user', user_type: 'sales_executive', is_active: 'false', sort_by: 'name', order: 'desc',
    } });
  });
  it('supports false as an active filter and ascending sorting', async () => {
    api.get.mockResolvedValue({ data: { count: 0, results: [] } });
    await getAllUsers({ isActive: false, sorting: [{ id: 'email', desc: false }] });
    expect(api.get.mock.calls[0][1].params).toMatchObject({ is_active: false, sort_by: 'email', order: 'asc' });
  });
  it('rejects unsuccessful responses', async () => {
    api.get.mockResolvedValue({ data: { status: false, message: 'Not authorized' } });
    await expect(getAllUsers()).rejects.toThrow('Not authorized');
  });
  it('rejects invalid results instead of showing an empty table', async () => {
    api.get.mockResolvedValue({ data: {} });
    await expect(getAllUsers()).rejects.toThrow('Could not read');
  });
});
