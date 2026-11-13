import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import TableComponent from './new-table.jsx';

const captured = vi.hoisted(() => ({ options: null }));
vi.mock('material-react-table', () => ({ MaterialReactTable: props => {
  captured.options = props;
  return null;
} }));

const rows = [{ id: 9, name: 'A user' }];
const nameCell = ({ cell }) => <strong>{cell.getValue()}</strong>;
const accessorFn = row => row.name;
const columns = [{ header: 'Name', accessor: 'name', accessorFn, Cell: nameCell },
  { header: 'Actions', id: 'actions', enableSorting: false }];
const pagination = { pageIndex: 3, pageSize: 10 };
const sorting = [{ id: 'name', desc: true }];
let onPaginationChange;
let onSortingChange;
let onGlobalFilterChange;

beforeEach(() => {
  onPaginationChange = vi.fn();
  onSortingChange = vi.fn();
  onGlobalFilterChange = vi.fn();
  renderToStaticMarkup(<TableComponent serverListing columns={columns} data={rows} totalCount={41}
    heading="All users" pagination={pagination} sorting={sorting} globalFilter="Ada"
    onPaginationChange={onPaginationChange} onSortingChange={onSortingChange}
    onGlobalFilterChange={onGlobalFilterChange} isFetching />);
});

it('delegates the same rows, normalized accessors and custom cells', () => {
  expect(captured.options.data).toBe(rows);
  expect(captured.options.columns[0]).toMatchObject({ accessorKey: 'name', accessorFn, enableSorting: true });
  const args = { cell: { getValue: () => 'A user' }, row: { original: rows[0] } };
  expect(renderToStaticMarkup(captured.options.columns[0].Cell(args))).toBe(renderToStaticMarkup(nameCell(args)));
  expect(captured.options.columns[1].enableSorting).toBe(false);
  expect(captured.options.columns[0].muiTableHeadCellProps.align).toBe('center');
  expect(captured.options.columns[0].muiTableBodyCellProps.align).toBe('center');
});

it('retains controlled server filtering, paging, single sorting and progress state', () => {
  expect(captured.options).toMatchObject({ manualFiltering: true, manualPagination: true, manualSorting: true,
    enableMultiSort: false, rowCount: 41,
    state: { isLoading: false, showProgressBars: true, pagination, sorting, globalFilter: 'Ada' } });
  expect(captured.options.state.pagination).toBe(pagination);
  expect(captured.options.state.sorting).toBe(sorting);
  captured.options.onGlobalFilterChange('Bob');
  expect(onGlobalFilterChange).toHaveBeenCalledWith('Bob');
  const updater = previous => [...previous];
  captured.options.onSortingChange(updater);
  expect(onSortingChange).toHaveBeenCalledWith(updater);
});

it('keeps page navigation, resets page index for page size changes and ignores no-ops', () => {
  captured.options.onPaginationChange(previous => ({ ...previous, pageIndex: 4 }));
  expect(onPaginationChange).toHaveBeenLastCalledWith({ pageIndex: 4, pageSize: 10 });
  captured.options.onPaginationChange({ pageIndex: 3, pageSize: 25 });
  expect(onPaginationChange).toHaveBeenLastCalledWith({ pageIndex: 0, pageSize: 25 });
  onPaginationChange.mockClear();
  captured.options.onPaginationChange(pagination);
  expect(onPaginationChange).not.toHaveBeenCalled();
});

it('preserves row striping and the title with total', () => {
  expect(captured.options.muiTableBodyRowProps({ row: { index: 0 } })).toEqual({ className: 'table-body-row-odd' });
  expect(captured.options.muiTableBodyRowProps({ row: { index: 1 } })).toEqual({ className: 'table-body-row' });
  const html = renderToStaticMarkup(captured.options.renderTopToolbarCustomActions({}));
  expect(html).toContain('All users');
  expect(html).toContain('(41)');
});
