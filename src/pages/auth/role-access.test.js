import { describe, expect, it } from 'vitest';
import { canAccessRoute, getLayoutRole } from './role-access.js';
import { roleHome, getRoleHome } from './role-home.js';

describe('role access', () => {
  it('lists only the five supported user types', () => {
    expect(Object.keys(roleHome)).toEqual(['super_admin', 'company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive']);
    expect(getRoleHome('admin')).toBe('/super-admin');
  });
  it.each(['recruitment_manager', 'recruitment_executive', 'accountant', 'project_manager', 'marketing_manager'])('rejects retired role %s', role => {
    expect(getRoleHome(role)).toBeUndefined();
    expect(canAccessRoute(role, [role])).toBe(false);
  });
  it.each([
    '/admin/main-stats', '/admin/project-listing', '/admin/project-detail/1/example',
    '/project-listing-page/1', '/job-description-request', '/headhunting-client',
    '/client-head-hunting/1', '/add-new-client-headhunting', '/edit-project-headhunting/1',
    '/saas-job-headhunting/1', '/admin/jobs', '/admin/deleted-jobs', '/admin/deleted-projects',
    '/admin/meta-spending', '/admin/meta-spending-campaign-detail', '/accountant/invoices',
    '/admin/resumes', '/resume-upload', '/cv-listing', '/profile-listing',
    '/admin/google-form', '/admin/edit-google-form/1', '/admin/screening-forms',
    '/admin/available-questionnaires', '/admin/response-analysis/1', '/admin/deliverables',
    '/project-payments/1',
  ])('blocks removed super admin components at %s while preserving other admin roles', path => {
    expect(canAccessRoute('super_admin', ['admin'], path)).toBe(false);
    expect(canAccessRoute('company_admin', ['admin'], path)).toBe(true);
    expect(canAccessRoute('admin', ['admin'], path)).toBe(false);
  });
  it.each(['/admin', '/admin/user-management', '/admin/settings', '/admin/leads/1',
    '/admin/meta-leads', '/data-leads', '/job-detail/1', '/admin/follow-up', '/admin/sales-data-detail/1',
  ])('preserves retained super admin routes at %s', path => {
    expect(canAccessRoute('super_admin', ['admin'], path)).toBe(true);
    expect(canAccessRoute('admin', ['admin'], path)).toBe(true);
  });
  it.each(['admin', 'super_admin', 'company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive'])('provides a dashboard for %s', role => {
    expect(getRoleHome(role)).toBeTruthy();
    expect(canAccessRoute(role, [getLayoutRole(role)], getRoleHome(role))).toBe(true);
  });
  it.each(['sales_manager', 'sales_executive', 'data_entry_executive', '', undefined, 'unknown'])('rejects admin URLs for %s', role => {
    expect(canAccessRoute(role, ['admin'], '/admin/user-management')).toBe(false);
  });
  it('recognizes administrator roles on existing admin routes', () => {
    expect(canAccessRoute('admin', ['super_admin'], '/admin/settings')).toBe(true);
    expect(canAccessRoute('super_admin', ['admin'], '/admin/settings')).toBe(true);
    expect(canAccessRoute('super_admin', ['admin'], '/admin/settings')).toBe(true);
    expect(canAccessRoute('company_admin', ['admin'], '/admin/settings')).toBe(true);
    expect(canAccessRoute('company_admin', ['admin'], '/admin/user-management')).toBe(true);
  });
  it('does not grant access to another role workspace', () => {
    expect(canAccessRoute('sales_manager', ['sales_executive'])).toBe(false);
    expect(canAccessRoute('sales_executive', ['sales_manager'])).toBe(false);
    expect(canAccessRoute('data_entry_executive', ['sales_manager', 'sales_executive'])).toBe(false);
  });
});
