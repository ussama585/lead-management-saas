import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ post: vi.fn(), retry: vi.fn(), response: vi.fn(), clearUser: vi.fn() }));
vi.mock('axios', () => ({ default: {
  create: () => Object.assign(mocks.retry, { interceptors: { request: { use: vi.fn() }, response: { use: mocks.response } } }),
  post: mocks.post,
} }));
vi.mock('../utils/api.js', () => ({ API_URL: 'https://example.test/api/' }));
vi.mock('../store/user-store.js', () => ({ default: { getState: () => ({ clearUser: mocks.clearUser }) } }));
import { storeRefreshedTokens } from './api.js';
const handleError = mocks.response.mock.calls[0][1];
let values;
beforeEach(() => {
  vi.clearAllMocks();
  values = new Map([['refresh_token', 'saved-refresh'], ['access_token', 'old-access']]);
  vi.stubGlobal('localStorage', { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) });
});
afterEach(() => vi.unstubAllGlobals());

describe('refresh response storage', () => {
  it('saves a new access token and preserves the refresh token when not rotated', () => {
    storeRefreshedTokens({ access: 'new-access' });
    expect(values.get('access_token')).toBe('new-access');
    expect(values.get('refresh_token')).toBe('saved-refresh');
  });
  it('supports nested responses and refresh rotation', () => {
    storeRefreshedTokens({ success: true, data: { access: 'new-access', refresh: 'new-refresh' } });
    expect(values.get('refresh_token')).toBe('new-refresh');
  });
  it.each([{ access: '' }, { success: false }, { access: 'new', refresh: '' }])('rejects invalid responses without overwriting the session', payload => {
    expect(() => storeRefreshedTokens(payload)).toThrow();
    expect(values.get('access_token')).toBe('old-access');
  });
});

describe('automatic renewal', () => {
  it('uses the new endpoint and form data, then retries with the new access token', async () => {
    mocks.post.mockResolvedValue({ data: { access: 'new-access' } });
    mocks.retry.mockResolvedValue({ status: 200 });
    const config = { headers: {} };
    await expect(handleError({ response: { status: 401 }, config })).resolves.toEqual({ status: 200 });
    expect(mocks.post.mock.calls[0][0]).toBe('https://example.test/api/accounts/token/refresh');
    expect(mocks.post.mock.calls[0][1].get('refresh')).toBe('saved-refresh');
    expect(config.headers.Authorization).toBe('Bearer new-access');
    expect(mocks.retry).toHaveBeenCalledWith(config);
  });
  it('does not recursively refresh a manual refresh request', async () => {
    const error = { response: { status: 401 }, config: { skipTokenRefresh: true } };
    await expect(handleError(error)).rejects.toBe(error);
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it('clears the session when automatic renewal fails', async () => {
    mocks.post.mockRejectedValue(new Error('Expired'));
    const error = { response: { status: 401 }, config: {} };
    await expect(handleError(error)).rejects.toBe(error);
    expect(values.has('access_token')).toBe(false);
    expect(values.has('refresh_token')).toBe(false);
    expect(mocks.clearUser).toHaveBeenCalled();
  });
});
