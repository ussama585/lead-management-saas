import { afterEach, describe, expect, it, vi } from 'vitest';
import { storedCompanyId } from './stored-company-id.js';

afterEach(() => vi.unstubAllGlobals());

describe('Company Admin company ID from local storage', () => {
  it.each([
    [{ company_id: 7 }, 7],
    [{ company: { id: 7 } }, 7],
    [{ company: '7' }, '7'],
    [{ company_id: null, company: 7 }, 7],
    [{ company_id: '', company: { id: 7 } }, 7],
  ])('reads supported persisted user shapes', (user, expected) => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => JSON.stringify(user)) });
    expect(storedCompanyId({})).toBe(expected);
    expect(localStorage.getItem).toHaveBeenCalledWith('user');
  });
  it('uses the current user if storage is malformed', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{invalid' });
    expect(storedCompanyId({ company_id: 8 })).toBe(8);
  });
  it('never substitutes the account ID for the company ID', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ id: 9 }) });
    expect(storedCompanyId({ id: 9 })).toBeNull();
  });
});
