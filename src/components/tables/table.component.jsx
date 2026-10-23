import React from 'react';
import {MaterialReactTable} from "material-react-table";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import '../../assets/styles/legacy/table/table-component.css';

// Create a custom theme to override default MUI component styles
const theme = createTheme({
  typography: { fontFamily: 'Inter, sans-serif' },
  shape: { borderRadius: 8 },
  components: {
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: '#0f172a',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#0f172a',
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          color: '#0f172a',
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        icon: {
          color: '#0f172a',
        },
      },
    },
  },
});

export default function TableComponent({
  totalCount,
  columns,
  data,
  initialState,
  heading = "Default",
  pagination, // Receive pagination state from parent
  onPaginationChange, // Callback to parent
  onPageSizeChange, // Callback to parent
  sorting, // Receive sorting state from parent
  onSortingChange, // Callback for sorting updates
  globalFilter, // Current search query
  onGlobalFilterChange, // Callback for search updates
  isLoading = false,
  isFetching = false,

}) {
  // console.log(pagination, 'paginationpagination')

  const handlePaginationChange = (updater) => {
    const newPagination =
      typeof updater === 'function' ? updater(pagination) : updater;

    const pageSizeChanged = newPagination.pageSize !== pagination.pageSize;
    if (pageSizeChanged) {
      newPagination.pageIndex = 0; // reset to page 1 when pageSize changes
    }

    if (
      newPagination.pageIndex !== pagination.pageIndex ||
      pageSizeChanged
    ) {
      onPaginationChange(newPagination); // Only call if there's a real change
    }

  };

  return (
    <ThemeProvider theme={theme}>
      <div className="table-wrapper">
        <MaterialReactTable
          // enableColumnOrdering={true}
          columns={columns.map((col) => ({
            header: col.header,
            accessorKey: col.accessorKey || col.accessor,
            accessorFn: col.accessorFn,
            id: col.id || col.accessorKey,
            Cell: col.Cell,
            // Respect per-column sorting configuration (e.g. action columns)
            enableSorting: col.enableSorting !== undefined ? col.enableSorting : true,
            muiTableHeadCellProps: {
              sx: { fontWeight: '600', borderBottom: '1px solid #ddd' },
              align: 'center',
            },
            muiTableBodyCellProps: { align: 'center', },
          }))}
          data={data}
          enableGlobalFilter
          manualFiltering={true}
          manualPagination
          manualSorting // Enable server-side sorting
          enableSortingRemoval={true}
          enableMultiSort={false}
          // initialState={initialState}

          state={{
            isLoading,
            showProgressBars: isFetching,
            pagination,
            globalFilter,
            sorting, // Pass sorting state
          }}
          onGlobalFilterChange={onGlobalFilterChange}
          options={{
            search: true
          }}
          enablePagination
          rowCount={totalCount}
          onPaginationChange={handlePaginationChange}
          onSortingChange={(newSorting) => onSortingChange(newSorting)}
          muiTableContainerProps={{ sx: { minWidth: 0, maxWidth: '100%', overflowX: 'auto' } }}
          muiTablePaperProps={{ elevation: 0, sx: { backgroundColor: 'transparent', boxShadow: 'none', border: '1px solid var(--border, #ddd)', borderRadius: '8px', overflow: 'hidden' } }}
          muiTableBodyRowProps={({ row }) => ({
            className: row.index % 2 === 0 ? 'table-body-row-odd' : 'table-body-row',
          })}
          renderTopToolbarCustomActions={({ table }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 20px',
              }}
            >
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: 'black',
                  display: 'flex',
                  flexWrap: 'wrap',
                  minWidth: 0,
                  maxWidth: '100%',
                  alignItems: 'center',
                }}
              >
                {heading} ({totalCount})
              </Typography>
            </Box>
          )}
        />
      </div>
    </ThemeProvider>
  );
}

