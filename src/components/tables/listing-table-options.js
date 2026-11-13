// Keep page-level state/API contracts intact while moving the table renderer to MRT.
export function listingColumns(columns) {
  return columns.map(({ title, dataIndex, key, sorter, width, align, render }) => ({
    id: String(key ?? dataIndex),
    header: title,
    ...(dataIndex ? { accessorKey: dataIndex, accessorFn: row => row[dataIndex] } : {}),
    ...(width ? { size: width } : {}),
    enableSorting: Boolean(sorter),
    enableColumnFilter: false,
    ...(align ? {
      muiTableHeadCellProps: { align },
      muiTableBodyCellProps: { align },
    } : {}),
    ...(render ? { Cell: ({ cell, row }) => render(cell.getValue(), row.original, row.index) } : {}),
  }));
}

export function listingPagination(pagination) {
  return { pageIndex: pagination.current - 1, pageSize: pagination.pageSize };
}

export function nextListingPagination(updater, current) {
  const next = typeof updater === 'function' ? updater(listingPagination(current)) : updater;
  return { current: next.pageSize === current.pageSize ? next.pageIndex + 1 : 1, pageSize: next.pageSize };
}

export function listingSorting(sorting) {
  return sorting.sortBy ? [{ id: sorting.sortBy, desc: sorting.order === 'desc' }] : [];
}

export function nextListingSorting(updater, current) {
  const next = typeof updater === 'function' ? updater(listingSorting(current)) : updater;
  return next[0] ? { sortBy: next[0].id, order: next[0].desc ? 'desc' : 'asc' } : {};
}
