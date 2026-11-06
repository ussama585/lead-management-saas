import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { loginSuperAdmin, loginUser } from './auth-service.js';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('../utils/api.js', () => ({ API_URL: 'https://example.test/api/' }));

let storage;
beforeEach(() => {
  storage = { setItem: vi.fn() };
  vi.stubGlobal('localStorage', storage);
  vi.clearAllMocks();
});
afterEach(() => vi.unstubAllGlobals());

const account = { id: 1, name: 'Super Admin', email: 'admin@example.test', user_type: 'super_admin', is_superuser: true, access: 'test-access', refresh: 'test-refresh' };

describe('super admin login', () => {
  it.each(['admin', 'super_admin'])('persists the %s session only after the second API succeeds', async role => {
    axios.post.mockResolvedValueOnce({ data: { success: true, data: { email: 'admin@example.test', otp_required: true, otp: '123456' } } });
    const challenge = await loginSuperAdmin({ email: ' admin@example.test ', password: 'test-password' });
    const [url, form] = axios.post.mock.calls[0];
    expect(url).toBe('https://example.test/api/accounts/superuser/login');
    expect(Object.fromEntries(form)).toEqual({ email: 'admin@example.test', password: 'test-password' });
    expect(challenge).toEqual({ email: 'admin@example.test', otp_required: true });
    expect(storage.setItem).not.toHaveBeenCalled();
    axios.post.mockResolvedValueOnce({ data: { ...account, user_type: role } });
    const result = await loginUser({ email: challenge.email, otp: '012345', superAdminOnly: true });
    const [verifyUrl, verifyBody] = axios.post.mock.calls[1];
    expect(verifyUrl).toBe('https://example.test/api/accounts/validate-otp');
    expect(Object.fromEntries(verifyBody)).toEqual({ email: 'admin@example.test', otp: '012345' });
    expect(result.user_type).toBe(role);
    expect(storage.setItem).toHaveBeenCalledWith('access_token', 'test-access');
    expect(storage.setItem).toHaveBeenCalledWith('refresh_token', 'test-refresh');
    expect(result).not.toHaveProperty('access');
  });
  it('does not store tokens when super admin OTP verification fails', async () => {
    axios.post.mockResolvedValue({ data: { success: false, message: 'Invalid OTP' } });
    await expect(loginUser({ email: 'admin@example.test', otp: '000000', superAdminOnly: true })).rejects.toThrow('Invalid OTP');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('checks the verified role before persisting a super admin session', async () => {
    axios.post.mockResolvedValue({ data: { ...account, user_type: 'company_admin' } });
    await expect(loginUser({ email: 'admin@example.test', otp: '123456', superAdminOnly: true })).rejects.toThrow('super admin access');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it.each([
    { success: false, message: 'Invalid credentials' },
    { success: true, data: { ...account, access: undefined } },
    { success: true, data: { ...account, refresh: '' } },
    { success: true, data: { ...account, user_type: 'company_admin' } },
  ])('does not persist an unsuccessful or invalid session', async payload => {
    axios.post.mockResolvedValue({ data: payload });
    await expect(loginSuperAdmin({ email: 'admin@example.test', password: 'test-password' })).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('reports API errors without writing tokens', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });
    await expect(loginSuperAdmin({ email: 'admin@example.test', password: 'test-password' })).rejects.toThrow('Invalid credentials');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
