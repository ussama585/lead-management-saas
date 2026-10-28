import React from 'react';
import { Route, matchRoutes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { createRoleRoutes } from './role-routes.jsx';
import { getRoleHome, getRolePath, USER_TYPES } from '../pages/auth/role-home.js';
import { canAccessRoute } from '../pages/auth/role-access.js';

const Guard = () => null;
const routes = <>
  <Route path='/admin/leads/:id' element={<Guard allowedRoles={['admin']} />} />
  <Route path='/admin/meta-leads/:id' element={<Guard allowedRoles={['admin']} />} />
  <Route path='/admin/meta-leads/:id/job/:jobId' element={<Guard allowedRoles={['admin']} />} />
  <Route path='/data-leads' element={<Guard allowedRoles={USER_TYPES} />} />
  <Route path='/data-leads/create-job/:id' element={<Guard allowedRoles={['super_admin', 'company_admin', 'sales_manager', 'sales_executive']} />} />
  <Route path='/data-leads/:leadId/edit/:jobId' element={<Guard allowedRoles={['super_admin', 'company_admin', 'sales_manager', 'sales_executive']} />} />
  <Route path='/data-leads/:leadId/jobs/:jobId' element={<Guard allowedRoles={['super_admin', 'company_admin', 'sales_manager', 'sales_executive']} />} />
  <Route path='/settings' element={<Guard allowedRoles={USER_TYPES} />} />
  <Route path='/super-admin/companies' element={<Guard allowedRoles={['super_admin']} />} />
  <Route path='/super-admin/companies/:id' element={<Guard allowedRoles={['super_admin']} />} />
</>;

// Match the same direct Route children used by the application.
const children = routes.props.children;
describe('role-specific URLs', () => {
  it.each([
    ['/company-admin/data-leads/create-job/42', { id: '42' }],
    ['/company-admin/data-leads/42/edit/7', { leadId: '42', jobId: '7' }],
    ['/company-admin/data-leads/42/jobs/7', { leadId: '42', jobId: '7' }],
  ])('allows Company Admin access to %s', (path, params) => {
    const definitions = createRoleRoutes(children, 'company_admin').map(route => route.props);
    expect(matchRoutes(definitions, path)[0].params).toEqual(params);
    expect(canAccessRoute('company_admin', ['super_admin', 'company_admin', 'sales_manager', 'sales_executive'], path)).toBe(true);
  });
  it.each(['super_admin', 'admin', 'company_admin'])('opens Meta Lead jobs within the %s layout', role => {
    const path = `${getRoleHome(role)}/meta-leads/42/job/7`;
    const definitions = createRoleRoutes(children, role).map(route => route.props);
    expect(matchRoutes(definitions, path)[0].params).toEqual({ id: '42', jobId: '7' });
    expect(canAccessRoute(role, ['admin'], path)).toBe(true);
  });
  it.each(['super_admin', 'admin', 'company_admin'])('opens Meta Lead details within the %s layout', role => {
    const path = `${getRoleHome(role)}/meta-leads/42`;
    const definitions = createRoleRoutes(children, role).map(route => route.props);
    expect(matchRoutes(definitions, path)[0].params.id).toBe('42');
    expect(canAccessRoute(role, ['admin'], path)).toBe(true);
    expect(canAccessRoute(role, ['sales_manager'], '/sales-manager/meta-leads/42')).toBe(false);
  });
  it.each(['super_admin', 'admin', 'company_admin'])('opens Website Lead details within the %s layout', role => {
    const path = getRolePath(role, '/leads/42');
    const definitions = createRoleRoutes(children, role).map(route => route.props);
    expect(path).toBe(`${getRoleHome(role)}/leads/42`);
    expect(matchRoutes(definitions, path)[0].params.id).toBe('42');
    expect(canAccessRoute(role, ['admin'], path)).toBe(true);
    expect(canAccessRoute(role, ['sales_executive'], '/sales-executive/leads/42')).toBe(false);
  });
  it('registers company details only for Super Admin', () => {
    const definitions = createRoleRoutes(children, 'super_admin').map(route => route.props);
    expect(matchRoutes(definitions, '/super-admin/companies/42')[0].params.id).toBe('42');
    expect(canAccessRoute('company_admin', ['super_admin'], '/super-admin/companies/42')).toBe(false);
    expect(createRoleRoutes(children, 'company_admin').some(route => route.props.path === '/company-admin/companies/:id')).toBe(false);
  });
  it.each(USER_TYPES)('registers shared pages under the %s prefix', role => {
    const definitions = createRoleRoutes(children, role).map(route => route.props);
    expect(matchRoutes(definitions, `${getRoleHome(role)}/data-leads`)).not.toBeNull();
    expect(matchRoutes(definitions, `${getRoleHome(role)}/settings`)).not.toBeNull();
    expect(getRolePath(role, '/data-leads')).toBe(`${getRoleHome(role)}/data-leads`);
  });
  it('matches company admin detail URLs with their parameters', () => {
    const definitions = createRoleRoutes(children, 'company_admin').map(route => route.props);
    expect(matchRoutes(definitions, '/company-admin/leads/42')[0].params.id).toBe('42');
    expect(getRolePath('company_admin', '/admin/leads/42')).toBe('/company-admin/leads/42');
  });
  it('keeps canonical URLs stable and supports the legacy admin role', () => {
    expect(getRolePath('company_admin', '/company-admin/leads/42')).toBe('/company-admin/leads/42');
    expect(getRolePath('admin', '/admin/settings')).toBe('/super-admin/settings');
  });
  it('rejects other role prefixes and does not register Companies for company admins', () => {
    expect(canAccessRoute('company_admin', ['admin'], '/super-admin/leads/1')).toBe(false);
    expect(canAccessRoute('super_admin', ['admin'], '/company-admin/settings')).toBe(false);
    const paths = createRoleRoutes(children, 'company_admin').map(route => route.props.path);
    expect(paths).not.toContain('/company-admin/companies');
  });
});
