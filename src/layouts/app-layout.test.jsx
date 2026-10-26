import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ user: { id: 1, user_type: 'admin' }, path: '/admin', shell: null, navigate: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate, useLocation: () => ({ pathname: state.path }) }));
vi.mock('react-query', () => ({ useQuery: () => ({ data: 4 }) }));
vi.mock('../pages/shared/store/user-store.js', () => ({ default: () => ({ user: state.user }) }));
vi.mock('../pages/shared/services/api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../pages/shared/services/headhunting.js', () => ({ getProjectPaymentCount: vi.fn(), getSidebarStats: vi.fn() }));
vi.mock('./admin-shell.jsx', () => ({ default: props => { state.shell = props; return null; } }));
import AppLayout from './app-layout.jsx';
import DataEntryLayout from './app-layout-data-entry-executive.jsx';

function render(role, path = '/') {
  state.user = { id: 1, user_type: role };
  state.path = path;
  renderToStaticMarkup(<AppLayout><p>Existing screen</p></AppLayout>);
  return state.shell;
}
beforeEach(() => { state.navigate.mockClear(); state.shell = null; });

describe('role navigation after the shadcn migration', () => {
  it.each(['admin', 'super_admin'])('opens Companies for %s', role => {
    const shell = render(role, '/super-admin/companies');
    expect(shell.selectedKey).toBe('26');
    shell.onSelect({ key: '26' });
    expect(state.navigate).toHaveBeenCalledWith('/super-admin/companies');
  });
  it('keeps Companies hidden from company admins', () => {
    const shell = render('company_admin');
    expect(shell.menuItems.some(item => item.label === 'Companies')).toBe(false);
    shell.onSelect({ key: '26' });
    expect(state.navigate).not.toHaveBeenCalled();
  });
  it.each([
    ['sales_manager', ['Dashboard', 'Website Leads', 'Data Leads', 'Meta Leads', 'Follow-up', 'Sales Data', 'Sales Executives']],
    ['sales_executive', ['Dashboard', 'Website Leads', 'Data Leads', 'Meta Leads', 'Follow-up']],
  ])('shows the configured sidebar for %s', (role, labels) => {
    const shell = render(role);
    expect(shell.menuItems.map(item => item.label)).toEqual(labels);
    expect(shell.badges['25']).toBeUndefined();
    shell.onSelect({ key: '8' });
    shell.onSelect({ key: '25' });
    expect(state.navigate).not.toHaveBeenCalled();
    shell.onSelect({ key: '17' });
    expect(state.navigate).toHaveBeenCalledWith(`/${role.replaceAll('_', '-')}/follow-up`);
  });
  it.each(['admin', 'super_admin', 'company_admin'])('limits %s navigation to the configured administrator modules', role => {
    const shell = render(role, '/admin');
    expect(shell.menuItems.map(item => item.label)).toEqual([
      'Dashboard', 'User Activity', 'Website Leads', 'Data Leads', 'Meta Leads',
      'Follow-up', 'Sales Data', 'User Management', 'Sales Managers', 'Sales Executives', ...(role === 'company_admin' ? [] : ['Companies']), 'Settings',
    ]);
    expect(shell.badges['25']).toBeUndefined();
    for (const key of ['19', '6', '25', '8', '18', '22', '24', '14', '16', '23']) shell.onSelect({ key });
    expect(state.navigate).not.toHaveBeenCalled();
  });
  it.each(['super_admin', 'company_admin'])('provides working administrator navigation for %s', role => {
    const shell = render(role, '/admin');
    expect(shell.menuItems.map(item => item.label)).toContain('User Management');
    expect(shell.menuItems.some(item => item.label === 'Settings')).toBe(true);
    shell.onSelect({ key: '2' });
    expect(state.navigate).toHaveBeenCalledWith(`/${role.replaceAll('_', '-')}/user-management`);
  });
  it('ignores attempts to select a hidden administrative menu item', () => {
    const shell = render('sales_executive');
    shell.onSelect({ key: '21' });
    expect(state.navigate).not.toHaveBeenCalled();
  });
  it('preserves administrator navigation without a follow-up count badge', () => {
    const shell = render('admin', '/admin/edit-user/7');
    expect(shell.menuItems.map(item => item.label)).toEqual(expect.arrayContaining(['User Management', 'Settings']));
    expect(shell.selectedKey).toBe('2');
    expect(shell.badges['17']).toBeUndefined();
    expect(shell.badges['25']).toBeUndefined();
    shell.onSelect({ key: '21' });
    expect(state.navigate).toHaveBeenCalledWith('/super-admin/settings');
  });
  it.each(['sales_manager', 'sales_executive', 'recruitment_manager', 'recruitment_executive', 'accountant', 'marketing_manager', 'project_manager'])('does not expose admin settings or user management to %s', role => {
    const shell = render(role);
    expect(shell.menuItems.map(item => item.label)).not.toContain('Settings');
    expect(shell.menuItems.map(item => item.label)).not.toContain('User Management');
  });
  it('keeps the project manager menu limited and routes projects correctly', () => {
    const shell = render('project_manager', '/project-manager/follow-up');
    expect(shell.menuItems.map(item => item.label)).toEqual(['Dashboard', 'Clients', 'Projects', 'Follow-up']);
    expect(shell.selectedKey).toBe('17');
    shell.onSelect({ key: '13' });
    expect(state.navigate).toHaveBeenCalledWith('/project-manager/projects');
  });
  it('keeps marketing navigation on its existing URL conventions', () => {
    const shell = render('marketing_manager', '/marketing_manager/meta-spending');
    expect(shell.selectedKey).toBe('22');
    shell.onSelect({ key: '1' });
    expect(state.navigate).toHaveBeenCalledWith('/marketing-manager/dashboard');
    shell.onSelect({ key: '9' });
    expect(state.navigate).toHaveBeenLastCalledWith('/marketing_manager/meta-leads');
  });
  it('preserves the separate data-entry layout', () => {
    state.path = '/data-entry-executive/leads-table';
    renderToStaticMarkup(<DataEntryLayout />);
    expect(state.shell.menuItems.map(item => item.label)).toEqual(['Dashboard', 'Sales Data', 'Add Sales Data']);
    expect(state.shell.selectedKey).toBe('2');
    state.shell.onSelect({ key: '3' });
    expect(state.navigate).toHaveBeenCalledWith('/data-entry-executive/add-update-lead');
  });
});
