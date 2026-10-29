import { expect, it, vi } from 'vitest';
import api from './api.js';
import { getDashboardExecutiveStats } from './dashboard-executive-stats.js';
vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
it('uses the documented endpoint and unwraps executive counts and people', async () => {
  const stats = { total_executives: 1, executives: [{ id: 8, name: 'Ahmed Raza', email: 'executive1@email.com' }] };
  api.get.mockResolvedValue({ data: { status: true, data: stats } });
  expect(await getDashboardExecutiveStats()).toEqual(stats);
  expect(api.get).toHaveBeenLastCalledWith('/sales-manager/executive-stats');
});
it('preserves zero executives', async () => {
  api.get.mockResolvedValue({ data: { status: true, data: { total_executives: 0, executives: [] } } });
  expect(await getDashboardExecutiveStats()).toEqual({ total_executives: 0, executives: [] });
});
it.each([{}, { status: false, message: 'Forbidden' }, { data: { total_executives: 1 } }])('rejects failed or malformed responses', async data => {
  api.get.mockResolvedValue({ data });
  await expect(getDashboardExecutiveStats()).rejects.toThrow();
});
