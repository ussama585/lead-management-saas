import { describe, expect, it } from 'vitest';
import { applyCompanyFilter, companyFilterSection, selectedCompany } from './company-filter.js';

describe('Super Admin company filter', () => {
  it.each(['', 'user-management', 'sales-manager-listing', 'sales-executive-listing', 'leads', 'data-leads', 'meta-leads', 'follow-up', 'audit-history-list'])(
    'enables the %s overview for Super Admin only', (slug) => {
      expect(companyFilterSection('super_admin', `/super-admin/${slug}`)).toBeTruthy();
      expect(companyFilterSection('company_admin', `/super-admin/${slug}`)).toBeNull();
    },
  );
  it('excludes details, forms, settings and existing Sales Data filter', () => {
    for (const slug of ['data-leads/1', 'data-leads/create-job/1', 'settings', 'data-entry-table']) {
      expect(companyFilterSection('super_admin', `/super-admin/${slug}`)).toBeNull();
    }
  });
  const location = { pathname: '/super-admin/data-leads', search: '?company_id=3' };
  it.each(['/data-leads/list', '/data-leads/list-count', '/data-leads/stats', '/meta-leads/list', '/lead-generation/list?page=2', '/accounts/all-users', '/sales-executive/list', '/follow-up/user-list', '/activity/list'])(
    'adds company_id to %s preserving existing filters', (url) => {
      const config = { url, params: { search: 'test', assigned: true } };
      applyCompanyFilter(config, 'super_admin', location);
      expect(config.params).toEqual({ search: 'test', assigned: true, company_id: '3' });
    },
  );
  it('leaves All companies and other roles unchanged', () => {
    for (const [role, search] of [['super_admin', ''], ['sales_manager', '?company_id=3']]) {
      const config = { url: '/data-leads/list' };
      applyCompanyFilter(config, role, { ...location, search });
      expect(config.params).toBeUndefined();
    }
  });
  it('does not change options, details, external requests or writes', () => {
    for (const config of [
      { url: '/company/simple-list' }, { url: '/data-leads/details/1' },
      { url: 'https://example.com/api/list' }, { url: '/data-leads/list', skipAuth: true },
      { url: '/data-leads/create', method: 'post' },
    ]) {
      applyCompanyFilter(config, 'super_admin', location);
      expect(config.params).toBeUndefined();
    }
  });
  it('preserves URLSearchParams and rejects invalid IDs', () => {
    const config = { url: '/activity/list', params: new URLSearchParams('page=2') };
    applyCompanyFilter(config, 'admin', { ...location, pathname: '/admin/audit-history-list' });
    expect(config.params.toString()).toBe('page=2&company_id=3');
    expect(selectedCompany('?company_id=abc')).toBeNull();
    expect(selectedCompany('?company_id=0')).toBeNull();
  });
});
