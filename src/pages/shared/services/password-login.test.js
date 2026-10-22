import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { loginWithPassword } from './auth-service.js';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('../utils/api.js', () => ({ API_URL: 'https://example.test/api/' }));
const storage = { setItem: vi.fn() };
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('localStorage', storage); });
afterEach(() => vi.unstubAllGlobals());

describe('password login without OTP', () => {
  it.each(['company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive'])('accepts the %s session and sends only email/password', async role => {
    axios.post.mockResolvedValue({ data: { success: true, data: { id: 5, email: 'user@example.test', user_type: role, access: 'test-access', refresh: 'test-refresh' } } });
    const user = await loginWithPassword({ email: ' user@example.test ', password: 'test-password' });
    const [url, form] = axios.post.mock.calls[0];
    expect(url).toBe('https://example.test/api/accounts/login');
    expect([...form.keys()]).toEqual(['email', 'password']);
    expect(form.get('email')).toBe('user@example.test');
    expect(user.user_type).toBe(role);
    expect(user).not.toHaveProperty('access');
    expect(storage.setItem).toHaveBeenCalledWith('access_token', 'test-access');
    expect(storage.setItem).toHaveBeenCalledWith('refresh_token', 'test-refresh');
  });
  it('accepts a flat session response', async () => {
    axios.post.mockResolvedValue({ data: { id: 1, user_type: 'sales_executive', access: 'access', refresh: 'refresh' } });
    expect((await loginWithPassword({ email: 'user@example.test', password: 'test-password' })).id).toBe(1);
  });
  it('does not navigate with an incomplete OTP-only response', async () => {
    axios.post.mockResolvedValue({ data: { user_type: 'sales_executive', message: 'OTP sent' } });
    await expect(loginWithPassword({ email: 'user@example.test', password: 'test-password' })).rejects.toThrow('Direct sign-in must be enabled');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('does not save tokens for unsupported users', async () => {
    axios.post.mockResolvedValue({ data: { user_type: 'accountant', access: 'access', refresh: 'refresh' } });
    await expect(loginWithPassword({ email: 'user@example.test', password: 'test-password' })).rejects.toThrow('supported user role');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('reports rejected credentials', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });
    await expect(loginWithPassword({ email: 'user@example.test', password: 'bad-password' })).rejects.toThrow('Invalid credentials');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
