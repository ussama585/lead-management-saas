import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import LeadListingActions from './lead-listing-actions.jsx';

const state = vi.hoisted(() => ({ role: 'company_admin', items: [], navigate: vi.fn(), edit: vi.fn() }));
vi.mock('../pages/shared/store/user-store.js', () => ({ default: () => ({ user: { user_type: state.role } }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate, useLocation: () => ({ pathname: '/company-admin/data-leads', search: '?page=2' }) }));
vi.mock('react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('./ui/dropdown-menu.jsx', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => children,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }) => { state.items.push(onSelect); return <div>{children}</div>; },
}));
vi.mock('./LeadEditModal.jsx', () => ({ default: ({ trigger }) => trigger({ onClick: state.edit }) }));
vi.mock('../pages/shared/services/api.js', () => ({ default: {} }));
vi.mock('../pages/shared/services/metaLeads.js', () => ({ updateMetaLead: vi.fn() }));

beforeEach(() => { state.role = 'company_admin'; state.items = []; vi.clearAllMocks(); });

it('shows one menu trigger and preserves view and edit callbacks', () => {
  const onView = vi.fn();
  const onEdit = vi.fn();
  const html = renderToStaticMarkup(<LeadListingActions lead={{ id: 9 }} source="data" onView={onView} onEdit={onEdit} />);
  expect(html.match(/<button/g)).toHaveLength(1);
  expect(html).toContain('Lead actions');
  expect(html).toContain('View');
  expect(html).toContain('Edit');
  state.items[0](); state.items[1]();
  expect(onView).toHaveBeenCalledOnce();
  expect(onEdit).toHaveBeenCalledOnce();
});

it('opens the existing edit modal through its menu trigger', () => {
  renderToStaticMarkup(<LeadListingActions lead={{ id: 9 }} source="meta" />);
  state.items[1]();
  expect(state.edit).toHaveBeenCalledOnce();
});

it('preserves role restrictions', () => {
  state.role = 'sales_executive';
  expect(renderToStaticMarkup(<LeadListingActions lead={{ id: 9 }} source="data" />)).toBe('');
});
