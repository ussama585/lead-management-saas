import { afterEach, expect, it, vi } from 'vitest';
import { leadOptionCompanyId } from './lead-option-company.js';
afterEach(() => vi.unstubAllGlobals());
it('uses the saved listing company on a detail page without company data', () => {
  vi.stubGlobal('window', { location: { pathname: '/super-admin/leads/5', search: '' } });
  vi.stubGlobal('sessionStorage', { getItem: () => '1' });
  expect(leadOptionCompanyId()).toBe('1');
  expect(leadOptionCompanyId(2)).toBe('2');
});
it('does not reuse a saved company after clearing the listing filter', () => {
  vi.stubGlobal('window', { location: { pathname: '/super-admin/leads', search: '' } });
  vi.stubGlobal('sessionStorage', { getItem: () => '1' });
  expect(leadOptionCompanyId()).toBeNull();
});
it('uses the URL company before saved company context', () => {
  vi.stubGlobal('window', { location: { pathname: '/super-admin/leads/5', search: '?company_id=3' } });
  vi.stubGlobal('sessionStorage', { getItem: () => '1' });
  expect(leadOptionCompanyId()).toBe('3');
});
