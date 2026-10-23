import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../shared/services/api.js';
import { getCompanyUsers } from './company-detail-page.jsx';

vi.mock('../../shared/services/api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('antd', () => ({ Alert: () => null, Avatar: () => null, Button: () => null, Card: () => null, Descriptions: () => null, Input: () => null, Modal: () => null, Space: () => null, Spin: () => null, Switch: () => null, Table: () => null, Tag: () => null, message: {} }));
vi.mock('../../shared/store/user-store.js', () => ({ default: () => ({ user: null }) }));
vi.mock('../../../components/breadcrumb.component.jsx', () => ({ default: () => null }));
vi.mock('../../../components/settings-delete-modal.jsx', () => ({ default: () => null }));

beforeEach(() => vi.clearAllMocks());
describe('company detail users', () => {
  it('always scopes the users list to the route company', async () => {
    const payload = { count: 1, results: [{ id: 7, name: 'User' }] };
    api.get.mockResolvedValue({ data: payload });
    expect(await getCompanyUsers('2')).toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/company/users/2', { params: { page: 1, size: 10 } });
  });
  it('keeps company scope while searching, sorting and paging', async () => {
    api.get.mockResolvedValue({ data: { count: 0, results: [] } });
    await getCompanyUsers('3', { page: 2, pageSize: 25, search: ' Alice ', sortBy: 'name', order: 'desc' });
    expect(api.get).toHaveBeenCalledWith('/company/users/3', { params: {
      page: 2, size: 25, search: 'Alice', sort_by: 'name', order: 'desc',
    } });
  });
  it('surfaces API failures and malformed results', async () => {
    api.get.mockResolvedValueOnce({ data: { status: false, message: 'Forbidden' } });
    await expect(getCompanyUsers('2')).rejects.toThrow('Forbidden');
    api.get.mockResolvedValueOnce({ data: {} });
    await expect(getCompanyUsers('2')).rejects.toThrow('Could not read');
  });
});
