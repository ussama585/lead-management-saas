import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { loginWithPassword, loginUser } from './auth-service.js';
vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('../utils/api.js', () => ({ API_URL: 'https://example.test/api/' }));
const storage = { setItem: vi.fn() };
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('localStorage', storage); });
afterEach(() => vi.unstubAllGlobals());

describe('email OTP login', () => {
  it('requests OTP using email and password without establishing a session', async () => {
    axios.post.mockResolvedValue({ data: { success: true, data: { email: 'user@example.test', otp_required: true, otp: '123456' } } });
    const result = await loginWithPassword({ email: ' user@example.test ', password: 'password' });
    const [url, body] = axios.post.mock.lastCall;
    expect(url).toBe('https://example.test/api/accounts/login');
    expect(Object.fromEntries(body)).toEqual({ email: 'user@example.test', password: 'password' });
    expect(result).toEqual({ email: 'user@example.test', otp_required: true });
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it.each(['company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive'])('creates the %s session only after OTP verification', async role => {
    axios.post.mockResolvedValue({ data: { success: true, data: { id: 5, user_type: role, company_id: 8, access: 'access', refresh: 'refresh' } } });
    const result = await loginUser({ email: ' user@example.test ', otp: '012345' });
    const [url, body] = axios.post.mock.lastCall;
    expect(url).toBe('https://example.test/api/accounts/validate-otp');
    expect(Object.fromEntries(body)).toEqual({ email: 'user@example.test', otp: '012345' });
    expect(result).toMatchObject({ id: 5, user_type: role, company_id: 8 });
    expect(result).not.toHaveProperty('access');
    expect(storage.setItem).toHaveBeenCalledWith('access_token', 'access');
    expect(storage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh');
  });
  it('supports the flat verification response', async () => {
    axios.post.mockResolvedValue({ data: { id: 1, user_type: 'sales_executive', access: 'access', refresh: 'refresh' } });
    expect((await loginUser({ email: 'user@example.test', otp: '012345' })).id).toBe(1);
  });
  it('supports nested user details and preserves company scope', async () => {
    axios.post.mockResolvedValue({ data: { data: { access: 'access', refresh: 'refresh', user: { id: 1, user_type: 'company_admin', company: { id: 8 } } } } });
    expect(await loginUser({ email: 'user@example.test', otp: '012345' })).toMatchObject({ company: { id: 8 } });
  });
  it.each([
    { success: false, message: 'Invalid OTP' },
    { data: { user_type: 'company_admin' } },
    { data: { user_type: 'unsupported', access: 'access', refresh: 'refresh' } },
  ])('does not save tokens for failed or incomplete verification: %j', async data => {
    axios.post.mockResolvedValue({ data });
    await expect(loginUser({ email: 'user@example.test', otp: '123456' })).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('rejects direct non-OTP responses on regular login', async () => {
    axios.post.mockResolvedValue({ data: { user_type: 'company_admin', access: 'access', refresh: 'refresh' } });
    await expect(loginWithPassword({ email: 'user@example.test', password: 'password' })).rejects.toThrow('OTP verification');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('shows credential rejection', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });
    await expect(loginWithPassword({ email: 'user@example.test', password: 'wrong' })).rejects.toThrow('Invalid credentials');
  });
});
