import React from 'react';
import { Box, Typography } from '@mui/material';
import NewTableComponent from './new-table.jsx';

// Compatibility interface for existing server-paginated user/target pages.
// Rendering and shared table appearance belong to NewTableComponent.
export default function TableComponent({
  totalCount, columns, data, heading = 'Default', pagination, onPaginationChange,
  sorting, onSortingChange, globalFilter, onGlobalFilterChange,
  isLoading = false, isFetching = false,
}) {
  const handlePaginationChange = updater => {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    const pageSizeChanged = next.pageSize !== pagination.pageSize;
    const nextPagination = pageSizeChanged ? { ...next, pageIndex: 0 } : next;
    if (nextPagination.pageIndex !== pagination.pageIndex || pageSizeChanged) {
      onPaginationChange(nextPagination);
    }
  };

  return <NewTableComponent mrtOptions={{
    columns: columns.map(col => ({
      header: col.header,
      accessorKey: col.accessorKey || col.accessor,
      accessorFn: col.accessorFn,
      id: col.id || col.accessorKey,
      Cell: col.Cell,
      enableSorting: col.enableSorting !== undefined ? col.enableSorting : true,
      muiTableHeadCellProps: {
        sx: { fontWeight: '600', borderBottom: '1px solid #ddd' },
        align: 'center',
      },
      muiTableBodyCellProps: { align: 'center' },
    })),
    data,
    enableGlobalFilter: true,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    enableSortingRemoval: true,
    enableMultiSort: false,
    state: { isLoading, showProgressBars: isFetching, pagination, globalFilter, sorting },
    onGlobalFilterChange,
    options: { search: true },
    enablePagination: true,
    rowCount: totalCount,
    onPaginationChange: handlePaginationChange,
    onSortingChange: newSorting => onSortingChange(newSorting),
    muiTopToolbarProps: { sx: { backgroundColor: '#fff', alignItems: 'center', '& > .MuiBox-root': { alignItems: 'center' } } },
    muiTableContainerProps: { sx: { minWidth: 0, maxWidth: '100%', overflowX: 'auto' } },
    muiTablePaperProps: { elevation: 0, sx: { backgroundColor: 'transparent', boxShadow: 'none', border: '1px solid var(--border, #ddd)', borderRadius: '8px', overflow: 'hidden' } },
    muiTableBodyRowProps: ({ row }) => ({
      className: row.index % 2 === 0 ? 'table-body-row-odd' : 'table-body-row',
    }),
    renderTopToolbarCustomActions: () => <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 20px' }}>
      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '18px', color: 'black', display: 'flex', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%', alignItems: 'center' }}>
        {heading} ({totalCount})
      </Typography>
    </Box>,
  }} />;
}
