import { afterEach, expect, it, vi } from 'vitest';
import { leadModalCompanyPayload } from './lead-modal-company.js';
afterEach(() => vi.unstubAllGlobals());

it.each([{ company_id: 8 }, { company: 8 }, { company: { id: 8 } }])('uses the super admin lead company: %j', lead => {
  vi.stubGlobal('window', { location: { search: '?company_id=3' } });
  expect(leadModalCompanyPayload({ user_type: 'super_admin' }, lead)).toEqual({ company_id: 8 });
});
it('falls back to the selected company when the lead has no company field', () => {
  vi.stubGlobal('window', { location: { search: '?company_id=3' } });
  expect(leadModalCompanyPayload({ user_type: 'super_admin' }, {})).toEqual({ company_id: 3 });
});
it.each(['company_admin', 'sales_manager', 'sales_executive', 'marketing_manager'])('omits company for %s', user_type => {
  expect(leadModalCompanyPayload({ user_type }, { company_id: 8 })).toEqual({});
});
