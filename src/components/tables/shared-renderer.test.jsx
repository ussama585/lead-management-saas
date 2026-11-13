import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
const capture = vi.hoisted(() => ({ props: null }));
vi.mock('material-react-table', () => ({ MaterialReactTable: props => { capture.props = props; return <div>Table</div>; } }));
import NewTableComponent from './new-table.jsx';

beforeEach(() => { capture.props = null; });

it('preserves document table layout, content and editable fields without mounting MRT', () => {
  const html = renderToStaticMarkup(<NewTableComponent documentTable className="proposal-modal__table">
    <thead><tr><th>Position</th></tr></thead>
    <tbody><tr><td><input aria-label="Job title" defaultValue="Developer" /></td></tr></tbody>
  </NewTableComponent>);
  expect(html).toContain('<table class="app-shared-document-table proposal-modal__table">');
  expect(html).toContain('<th>Position</th>');
  expect(html).toContain('value="Developer"');
  expect(capture.props).toBeNull();
});

it('passes an existing editable table instance through unchanged', () => {
  const table = { options: { enableEditing: true }, setEditingCell: vi.fn(), refs: { editInputRefs: { current: {} } } };
  const html = renderToStaticMarkup(<NewTableComponent table={table} />);
  expect(capture.props.table).toBe(table);
  expect(Object.keys(capture.props)).toEqual(['table']);
  expect(html).toContain('app-data-table');
});

it('does not override page-controlled options with listing defaults', () => {
  const options = { columns: [], data: [], manualPagination: false, enableEditing: true, enablePagination: false,
    state: { sorting: [{ id: 'name', desc: true }] }, onSortingChange: vi.fn(), onPaginationChange: vi.fn() };
  renderToStaticMarkup(<NewTableComponent mrtOptions={options} />);
  expect(capture.props).toEqual({ ...options, editDisplayMode: 'table' });
  expect(capture.props.state).toBe(options.state);
  expect(capture.props.onSortingChange).toBe(options.onSortingChange);
});

it('retains the existing controlled API-listing interface', () => {
  const pagination = { pageIndex: 2, pageSize: 25 };
  const onPaginationChange = vi.fn();
  renderToStaticMarkup(<NewTableComponent columns={[{ header: 'Name', accessorKey: 'name' }]} data={[]}
    pagination={pagination} onPaginationChange={onPaginationChange} enableRowSelection={false} />);
  expect(capture.props.manualPagination).toBe(true);
  expect(capture.props.editDisplayMode).toBe('table');
  expect(capture.props.state.pagination).toBe(pagination);
  capture.props.onPaginationChange({ pageIndex: 3, pageSize: 25 });
  expect(onPaginationChange).toHaveBeenLastCalledWith({ pageIndex: 3, pageSize: 25 });
  capture.props.onPaginationChange({ pageIndex: 3, pageSize: 50 });
  expect(onPaginationChange).toHaveBeenLastCalledWith({ pageIndex: 0, pageSize: 50 });
});
