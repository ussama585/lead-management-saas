import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import Filters from './user-management-filters.jsx';

const props = { role: 'all', onRoleChange: vi.fn(), onStatusChange: vi.fn(), onCreate: vi.fn() };
const find = (node, id) => React.isValidElement(node) && (node.props.id === id ? node : React.Children.toArray(node.props.children).map(child => find(child, id)).find(Boolean));

it('preserves the restricted company role choices and their counts', () => {
  const tree = Filters({ ...props, companyRolesOnly: true, counts: { sales_executive: 7 } });
  const select = find(tree, 'user-role-filter');
  expect(select.props.options.map(option => option.value)).toEqual(['all', 'company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive']);
  expect(select.props.options.find(option => option.value === 'sales_executive').label).toBe('Sales Executives (7)');
  expect(select.props.onChange).toBe(props.onRoleChange);
});

it('does not show company role filters on the Super Admin-only section', () => {
  const html = renderToStaticMarkup(<Filters {...props} superAdminOnly showAccountStatus />);
  expect(html).not.toContain('id="user-role-filter"');
  expect(html).toContain('id="user-active-filter"');
  expect(html).toContain('Create New User');
});

it('preserves inactive filtering and clears the all-statuses option correctly', () => {
  const onStatusChange = vi.fn();
  const tree = Filters({ ...props, showAccountStatus: true, onStatusChange });
  const select = find(tree, 'user-active-filter');
  select.props.onChange('false');
  expect(onStatusChange).toHaveBeenLastCalledWith('false');
  select.props.onChange('all');
  expect(onStatusChange).toHaveBeenLastCalledWith('');
});
