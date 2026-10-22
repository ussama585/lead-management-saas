import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { loginSuperAdmin } from './auth-service.js';

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
  it.each(['admin', 'super_admin'])('submits form data and accepts the %s role', async role => {
    axios.post.mockResolvedValue({ data: { success: true, data: { ...account, user_type: role } } });
    const result = await loginSuperAdmin({ email: ' admin@example.test ', password: 'test-password' });
    const [url, form] = axios.post.mock.calls[0];
    expect(url).toBe('https://example.test/api/accounts/superuser/login');
    expect(form.get('email')).toBe('admin@example.test');
    expect(form.get('password')).toBe('test-password');
    expect(storage.setItem).toHaveBeenCalledWith('access_token', 'test-access');
    expect(storage.setItem).toHaveBeenCalledWith('refresh_token', 'test-refresh');
    expect(result.user_type).toBe(role);
    expect(result).not.toHaveProperty('access');
    expect(result).not.toHaveProperty('refresh');
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
