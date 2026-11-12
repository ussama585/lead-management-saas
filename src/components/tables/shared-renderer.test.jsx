import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
const capture = vi.hoisted(() => ({ props: null }));
vi.mock('material-react-table', () => ({ MaterialReactTable: props => { capture.props = props; return <div>Table</div>; } }));
import NewTableComponent from './new-table.jsx';

beforeEach(() => { capture.props = null; });

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
  expect(capture.props).toEqual(options);
  expect(capture.props.state).toBe(options.state);
  expect(capture.props.onSortingChange).toBe(options.onSortingChange);
});

it('retains the existing controlled API-listing interface', () => {
  const pagination = { pageIndex: 2, pageSize: 25 };
  const onPaginationChange = vi.fn();
  renderToStaticMarkup(<NewTableComponent columns={[{ header: 'Name', accessorKey: 'name' }]} data={[]}
    pagination={pagination} onPaginationChange={onPaginationChange} enableRowSelection={false} />);
  expect(capture.props.manualPagination).toBe(true);
  expect(capture.props.state.pagination).toBe(pagination);
  capture.props.onPaginationChange({ pageIndex: 3, pageSize: 25 });
  expect(onPaginationChange).toHaveBeenLastCalledWith({ pageIndex: 3, pageSize: 25 });
  capture.props.onPaginationChange({ pageIndex: 3, pageSize: 50 });
  expect(onPaginationChange).toHaveBeenLastCalledWith({ pageIndex: 0, pageSize: 50 });
});
