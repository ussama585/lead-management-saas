import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ role: 'super_admin', queries: [], columns: [] }));
vi.mock('../pages/shared/store/user-store.js', () => ({ default: selector => selector({ user: { id: 1, user_type: state.role, company_id: 9 } }) }));
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams('company_id=9')] }));
vi.mock('../pages/shared/services/api.js', () => ({ default: { get: vi.fn().mockResolvedValue({ data: [{ id: 2, name: 'Sara', user_type: 'sales_manager' }] }) } }));
vi.mock('react-query', () => ({
  useQuery: (...args) => {
    state.queries.push(args.length === 1 ? args[0] : { queryKey: args[0], ...args[2] });
    return { data: args.length === 1 ? [] : { users: [{ id: 8, name: 'Ahmed', email: 'a@example.com' }], total_users: 1 }, refetch: vi.fn() };
  },
  useMutation: () => ({ mutate: vi.fn(), isLoading: false }),
}));
vi.mock('./ui/app-modal.jsx', () => ({ Modal: ({ children }) => <div>{children}</div> }));
vi.mock('./tables/new-table.jsx', () => ({ default: ({ columns, data }) => {
  state.columns = columns;
  const Action = columns.find(column => column.accessorKey === 'action').Cell;
  return <Action row={{ original: data[0] }} />;
} }));
import ManageAssigneesModal from './manage-assignees-modal.jsx';
import api from '../pages/shared/services/api.js';

beforeEach(() => { state.queries = []; });
it.each(['super_admin', 'company_admin'])('opens and enables assignee queries for %s', async role => {
  state.role = role;
  const html = renderToStaticMarkup(<ManageAssigneesModal visible queryKey="assigned" fetchAssigned={vi.fn()} />);
  expect(html).toContain('Add Users');
  expect(html).toContain('Remove');
  expect(state.queries.every(query => query.enabled)).toBe(true);
  expect(state.queries[0].queryKey).toEqual(['assigned', 1, role, role === 'super_admin' ? '9' : 9]);
  expect(await state.queries[1].queryFn()).toEqual([{ id: 2, name: 'Sara', user_type: 'sales_manager' }]);
  expect(api.get).toHaveBeenCalledWith('/accounts/users-for-assigning', { params: { company_id: role === 'super_admin' ? '9' : 9 } });
});
it('does not expose management or fetch assignees to sales executives', () => {
  state.role = 'sales_executive';
  expect(renderToStaticMarkup(<ManageAssigneesModal visible queryKey="assigned" />)).toBe('');
  expect(state.queries.every(query => !query.enabled)).toBe(true);
});
