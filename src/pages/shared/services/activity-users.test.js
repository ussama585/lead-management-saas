import { expect, it, vi } from 'vitest';
import api from './api.js';
import { getAccountsAllUsers } from './admin-graphs.js';
vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
it('passes the selected company when loading activity user options', async () => {
  api.get.mockResolvedValue({ data: [{ id: 8, name: 'Ali' }] });
  expect(await getAccountsAllUsers('3')).toEqual([{ id: 8, name: 'Ali' }]);
  expect(api.get).toHaveBeenLastCalledWith('/accounts/simple-users-list', { params: { company_id: '3' } });
});
it('omits company params for other roles', async () => {
  api.get.mockResolvedValue({ data: [] });
  await getAccountsAllUsers();
  expect(api.get).toHaveBeenLastCalledWith('/accounts/simple-users-list');
});
