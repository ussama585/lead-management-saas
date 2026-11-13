import { describe, expect, it, vi } from 'vitest';
import { listingColumns, listingPagination, nextListingPagination, listingSorting, nextListingSorting } from './listing-table-options.js';

describe('listing table column migration', () => {
  it('reads literal CSV headers rather than treating dots as nested object paths', () => {
    const [column] = listingColumns([{ title: 'Company Website', dataIndex: 'Company.Website', key: 'website' }]);
    expect(column.accessorFn({ 'Company.Website': 'example.com', Company: { Website: 'wrong' } })).toBe('example.com');
  });
  it('preserves record, value and index for existing action/cell callbacks', () => {
    const render = vi.fn(() => 'Company name');
    const [column] = listingColumns([{ title: 'Company', dataIndex: 'name', key: 'name', sorter: true, width: 200, render }]);
    const record = { id: 7, name: 'Test company' };
    expect(column.Cell({ cell: { getValue: () => record.name }, row: { original: record, index: 3 } })).toBe('Company name');
    expect(render).toHaveBeenCalledWith(record.name, record, 3);
    expect(column).toMatchObject({ id: 'name', accessorKey: 'name', header: 'Company', enableSorting: true, size: 200 });
  });
  it('keeps action columns unsortable and without a data accessor', () => {
    const [column] = listingColumns([{ title: 'Actions', key: 'actions', render: () => null }]);
    expect(column.id).toBe('actions');
    expect(column.enableSorting).toBe(false);
    expect(column).not.toHaveProperty('accessorKey');
  });
  it('preserves optional cell alignment', () => {
    expect(listingColumns([{ title: 'ID', dataIndex: 'id', align: 'center' }])[0]).toMatchObject({
      muiTableHeadCellProps: { align: 'center' }, muiTableBodyCellProps: { align: 'center' },
    });
  });
});

describe('server listing pagination and sorting', () => {
  it('converts one-based API pages to zero-based MRT pages', () => {
    expect(listingPagination({ current: 3, pageSize: 25 })).toEqual({ pageIndex: 2, pageSize: 25 });
  });
  it('supports direct and functional pagination updates without mutating state', () => {
    const current = { current: 3, pageSize: 25 };
    expect(nextListingPagination({ pageIndex: 3, pageSize: 25 }, current)).toEqual({ current: 4, pageSize: 25 });
    expect(nextListingPagination(previous => ({ ...previous, pageIndex: 1 }), current)).toEqual({ current: 2, pageSize: 25 });
    expect(current).toEqual({ current: 3, pageSize: 25 });
  });
  it('returns to the first page when the page size changes', () => {
    expect(nextListingPagination({ pageIndex: 5, pageSize: 50 }, { current: 6, pageSize: 10 })).toEqual({ current: 1, pageSize: 50 });
  });
  it('converts server sorting in both directions and allows clearing it', () => {
    const current = { sortBy: 'name', order: 'desc' };
    expect(listingSorting(current)).toEqual([{ id: 'name', desc: true }]);
    expect(nextListingSorting([{ id: 'created_at', desc: false }], current)).toEqual({ sortBy: 'created_at', order: 'asc' });
    expect(nextListingSorting(() => [], current)).toEqual({});
    expect(listingSorting({})).toEqual([]);
  });
});
