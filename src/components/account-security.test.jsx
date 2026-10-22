import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api, { storeRefreshedTokens } from '../pages/shared/services/api.js';
import { changePassword } from './change-password-dialog.jsx';
import { refreshSession } from './refresh-token-settings.jsx';
import { changePasswordSchema } from '../pages/auth/schemas/change-password-schema.js';
import { canAccessRoute } from '../pages/auth/role-access.js';

vi.mock('../pages/shared/services/api.js', () => ({ default: { post: vi.fn() }, storeRefreshedTokens: vi.fn() }));
vi.mock('antd', () => ({ Alert: () => null, Input: () => null, Modal: () => null, Button: () => null, Card: () => null, message: {} }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'saved-refresh') });
});
afterEach(() => vi.unstubAllGlobals());

describe('password reset for signed-in users', () => {
  it('sends only the old and new passwords as JSON', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    await changePassword({ old_password: 'old-secret', new_password: 'new-secret', confirm_password: 'new-secret' });
    expect(api.post).toHaveBeenCalledWith('/accounts/change-password', { old_password: 'old-secret', new_password: 'new-secret' });
  });
  it('handles unsuccessful responses', async () => {
    api.post.mockResolvedValue({ data: { success: false, message: 'Current password is incorrect.' } });
    await expect(changePassword({})).rejects.toThrow('Current password is incorrect.');
  });
  it('validates required current password, password length, and confirmation', async () => {
    const valid = { old_password: 'old-password', new_password: 'new-password', confirm_password: 'new-password' };
    await expect(changePasswordSchema.validate(valid)).resolves.toEqual(valid);
    await expect(changePasswordSchema.validate({ ...valid, old_password: '' })).rejects.toThrow('current password');
    await expect(changePasswordSchema.validate({ ...valid, new_password: 'short', confirm_password: 'short' })).rejects.toThrow('8 characters');
    await expect(changePasswordSchema.validate({ ...valid, confirm_password: 'different' })).rejects.toThrow('match');
  });
});

describe('manual refresh', () => {
  it('uses saved refresh token as multipart form data without retrying itself', async () => {
    const tokens = { access: 'new-access' };
    api.post.mockResolvedValue({ data: tokens });
    await refreshSession();
    const [url, body, config] = api.post.mock.calls[0];
    expect(url).toBe('/accounts/token/refresh');
    expect(body.get('refresh')).toBe('saved-refresh');
    expect(config).toEqual({ skipTokenRefresh: true });
    expect(storeRefreshedTokens).toHaveBeenCalledWith(tokens);
  });
  it('does not send a request without a refresh token', async () => {
    localStorage.getItem.mockReturnValue(null);
    await expect(refreshSession()).rejects.toThrow('Please sign in again');
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('shared settings access', () => {
  const roles = ['super_admin', 'company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive'];
  it.each([...roles, 'admin'])('allows %s to open Settings for session renewal', role => {
    expect(canAccessRoute(role, roles, '/settings')).toBe(true);
  });
});
