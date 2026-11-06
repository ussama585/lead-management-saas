import { beforeEach, expect, it, vi } from 'vitest';
import api from './api.js';
import { requestDeleteUserOtp, validateDeleteUserOtp } from './users-service.js';
vi.mock('./api.js', () => ({ default: { delete: vi.fn() } }));
vi.mock('../store/user-store.js', () => ({ default: { getState: () => ({ user: {} }) } }));
beforeEach(() => vi.clearAllMocks());

it('requests OTP without a body, then confirms at the same endpoint with OTP', async () => {
  api.delete.mockResolvedValue({ data: { success: true } });
  await requestDeleteUserOtp(4);
  expect(api.delete).toHaveBeenNthCalledWith(1, '/accounts/detail/4');
  await validateDeleteUserOtp(4, ' 012345 ');
  const [endpoint, config] = api.delete.mock.calls[1];
  expect(endpoint).toBe('/accounts/detail/4');
  expect(Object.fromEntries(config.data)).toEqual({ otp: '012345' });
});
it('reports an unsuccessful OTP request', async () => {
  api.delete.mockResolvedValue({ data: { success: false, message: 'Cannot send OTP' } });
  await expect(requestDeleteUserOtp(4)).rejects.toThrow('Cannot send OTP');
});
it('rejects an invalid OTP response', async () => {
  api.delete.mockResolvedValue({ data: { status: false, message: 'Invalid OTP' } });
  await expect(validateDeleteUserOtp(4, '123456')).rejects.toThrow('Invalid OTP');
});
