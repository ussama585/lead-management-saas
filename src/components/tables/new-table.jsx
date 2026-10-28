import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MaterialReactTable } from "material-react-table";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { debounce } from 'lodash';
import '../../assets/styles/legacy/table/table-component.css';

const DEFAULT_GLOBAL_FILTER_DEBOUNCE_MS = 300;

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

export default function NewTableComponent({
  totalCount,
  columns,
  data,
  initialState,
  heading = "Default",
  /** Merged into the title Typography `sx` (e.g. `{ color: '#000' }`) */
  headingSx = undefined,
  /** Tighter cell padding for dense dashboards */
  denseCells = false,
  /** e.g. `{ sx: { width: 'fit-content', maxWidth: '100%' } }` to avoid columns stretching across the full row */
  muiTableContainerProps,
  pagination = { pageIndex: 0, pageSize: 10 }, // Receive pagination state from parent
  onPaginationChange, // Callback to parent
  onPageSizeChange, // Callback to parent
  sorting, // Receive sorting state from parent
  onSortingChange, // Callback for sorting updates
  globalFilter, // Current search query
  onGlobalFilterChange, // Callback for search updates
  enableGlobalFilter = true, // When false, hide table search bar (page may provide its own)
  isLoading,
  enableRowSelection = true,
  rowSelection = {},
  onRowSelectionChange = () => {},
  getRowId = undefined,
  columnVisibility = {}, 
  onColumnVisibilityChange = () => {}, // Callback for column visibility changes
  enableStickyHeader = false, // New prop for sticky header
  getRowStyle = undefined, // Optional function to get custom row styles: (row, originalData) => ({ sx: {...} })
  globalFilterDebounceMs = DEFAULT_GLOBAL_FILTER_DEBOUNCE_MS, // Debounce delay for global filter (search) before notifying parent
  sortingDebounceMs = 0, // Debounce for sorting (0 = no debounce). Use 150–300 when sorting triggers API calls.
  enablePagination = true,
  /** When set, overrides MRT default rows-per-page options for this table only */
  pageSizeOptions = undefined,
}) {
  // Local state for search input so typing stays responsive; parent is notified after debounce
  const [localFilter, setLocalFilter] = useState(() => globalFilter ?? '');

  // Refs for latest callbacks so debounced functions stay stable and always invoke current handler
  const onGlobalFilterChangeRef = useRef(onGlobalFilterChange);
  const onSortingChangeRef = useRef(onSortingChange);
  onGlobalFilterChangeRef.current = onGlobalFilterChange;
  onSortingChangeRef.current = onSortingChange;

  // Sync from parent when globalFilter is set externally (e.g. URL, clear)
  useEffect(() => {
    const next = globalFilter ?? '';
    setLocalFilter((prev) => (String(prev) === String(next) ? prev : next));
  }, [globalFilter]);

  // Stable debounced global filter: only depends on delay; uses ref for latest callback
  const debouncedOnGlobalFilterChange = useMemo(() => {
    const delay = Number(globalFilterDebounceMs) > 0 ? Number(globalFilterDebounceMs) : DEFAULT_GLOBAL_FILTER_DEBOUNCE_MS;
    return debounce((value) => {
      onGlobalFilterChangeRef.current?.(value);
    }, delay);
  }, [globalFilterDebounceMs]);

  useEffect(() => {
    return () => debouncedOnGlobalFilterChange.cancel?.();
  }, [debouncedOnGlobalFilterChange]);

  const handleGlobalFilterChange = (updater) => {
    const next = typeof updater === 'function' ? updater(localFilter) : updater;
    setLocalFilter(next);
    debouncedOnGlobalFilterChange(next);
  };

  // Optional debounced sorting (stable; uses ref for latest callback)
  const debouncedOnSortingChange = useMemo(() => {
    if (Number(sortingDebounceMs) <= 0) return null;
    return debounce((newSorting) => {
      onSortingChangeRef.current?.(newSorting);
    }, Number(sortingDebounceMs));
  }, [sortingDebounceMs]);

  useEffect(() => {
    return () => debouncedOnSortingChange?.cancel?.();
  }, [debouncedOnSortingChange]);

  const handleSortingChange = (updater) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
    if (debouncedOnSortingChange) {
      debouncedOnSortingChange(newSorting);
    } else {
      onSortingChangeRef.current?.(newSorting);
    }
  };

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

  const hasSearch = !!(localFilter != null && String(localFilter).trim());
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const showGlobalFilter = enableGlobalFilter && (hasSearch || searchBarOpen);

  // When user closes the search bar, clear the filter so the API is called again without search
  const handleShowGlobalFilterChange = (updater) => {
    const next = typeof updater === 'function' ? updater(hasSearch || searchBarOpen) : updater;
    setSearchBarOpen(!!next);
    if (!next) {
      setLocalFilter('');
      debouncedOnGlobalFilterChange.cancel?.();
      onGlobalFilterChange?.('');
    }
  };


  // Compute columnOrder so that 'mrt-row-select' is always first if row selection is enabled
  const columnOrder = [
    ...(enableRowSelection ? ['mrt-row-select'] : []),
    ...columns.map(col => col.id || col.accessorKey),
  ];

  return (
    <ThemeProvider theme={theme}>
      <div className="table-wrapper">
        <MaterialReactTable
          size="small"
          enableRowNumbers={false}
          columns={columns}
          data={data}
          enableGlobalFilter={enableGlobalFilter}
          enableFilterMatchHighlighting={false}
          manualFiltering={true}
          manualPagination
          manualSorting
          enableMultiSort={true}
          enableHiding={true}
          enableStickyHeader={enableStickyHeader}
          enableSortingRemoval={true}
          state={{
            pagination,
            globalFilter: localFilter,
            sorting, // Pass sorting state
            columnOrder,
            isLoading,
            columnVisibility,
            showGlobalFilter,
            ...(enableRowSelection ? { rowSelection } : {}),
          }}
          onGlobalFilterChange={handleGlobalFilterChange}
          onShowGlobalFilterChange={handleShowGlobalFilterChange}
          onColumnVisibilityChange={onColumnVisibilityChange}
          options={{
            search: true
          }}
          enablePagination={enablePagination}
          rowCount={totalCount}
          muiPaginationProps={
            pageSizeOptions
              ? { rowsPerPageOptions: pageSizeOptions }
              : undefined
          }
          onPaginationChange={handlePaginationChange}
          onSortingChange={handleSortingChange}
          layoutMode="semantic"
          enableColumnActions={false}
          enableRowSelection={enableRowSelection}
          onRowSelectionChange={enableRowSelection ? onRowSelectionChange : undefined}
          getRowId={getRowId}
          muiTableHeadCellProps={{
                  sx: {
                      fontSize: '14px',
                      padding: denseCells ? '4px 6px' : '4px 8px',
                  },
              }}
              muiTableBodyCellProps={{
                  sx: {
                      fontSize: '14px',
                      height: '80px',
                      padding: denseCells ? '6px 6px' : '8px',
                  },
              }}
              muiTopToolbarProps={{
                  sx: {
                      padding: '6px 12px',         // reduced padding
                      minHeight: '40px',           // reduce overall height
                      backgroundColor: '#f5f5f5',  // light grey background
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px',
                      display: 'flex'

                  },
              }}
              muiTableContainerProps={{
                ...muiTableContainerProps,
                sx: [
                  { minWidth: 0, maxWidth: '100%', overflowX: 'auto' },
                  ...(Array.isArray(muiTableContainerProps?.sx) ? muiTableContainerProps.sx : [muiTableContainerProps?.sx || {}]),
                ],
              }}
          muiTablePaperProps={{
                  elevation: 0, // removes shadow
                  sx: {
                      marginTop: '10px',
                      minWidth: 0,
                      maxWidth: '100%',
                      boxShadow: 'none', // just in case
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border, #ddd)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                  },
              }}
              muiTableBodyRowProps={getRowStyle ? ({ row }) => {
                const originalData = row.original;
                const customStyle = getRowStyle(row, originalData);
                return customStyle || {};
              } : undefined}
              renderTopToolbarCustomActions={({ table }) => (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    minWidth: 0,
                    maxWidth: '100%',
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
                      color: '#0f172a',
                      display: 'flex',
                      minWidth: 0,
                      overflowWrap: 'anywhere',
                      alignItems: 'center',
                      ...headingSx,
                    }}
                  >
                    {heading} 
                  </Typography>
                </Box>
              )}
        />
      </div>
    </ThemeProvider>
  );
}

