import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { saveTableState, loadTableState } from '../../shared/utils/persistTableState.js';

/**
 * Custom hook for managing table state (pagination, sorting, filtering)
 * Handles URL params and sessionStorage persistence
 */
export const useTableState = (tableKey, defaultTab = '') => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialMount = useRef(true);
  
  // Load persisted state
  const initialState = loadTableState(tableKey, searchParams, {
    defaultTab,
    tab: defaultTab,
  });
  
  // State
  const [selectedTab, setSelectedTab] = useState(initialState.tab || defaultTab);
  const [pagination, setPagination] = useState({
    pageIndex: initialState.pageIndex,
    pageSize: initialState.pageSize,
  });
  const [globalFilter, setGlobalFilter] = useState(initialState.search);
  const [sorting, setSorting] = useState(initialState.sorting);
  const [columnVisibility, setColumnVisibility] = useState({});
  
  // Handle global filter change
  const handleGlobalFilterChange = (value) => {
    setGlobalFilter(value === undefined || value === null ? '' : value);
  };
  
  // Custom sorting handler (toggles between asc/desc, never clears)
  const handleSortingChange = (newSorting) => {
    if ((!newSorting || newSorting.length === 0) && sorting && sorting.length > 0 && sorting[0]?.id) {
      const currentSort = sorting[0];
      const toggledSort = [{
        id: currentSort.id,
        desc: !currentSort.desc
      }];
      setSorting(toggledSort);
    } else {
      setSorting(newSorting);
    }
  };
  
  // Persist state to URL and sessionStorage
  useEffect(() => {
    saveTableState(tableKey, {
      tab: selectedTab,
      defaultTab,
      search: globalFilter,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
    }, setSearchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, globalFilter, pagination.pageIndex, pagination.pageSize, sorting]);
  
  // Reset pagination when filters change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [selectedTab, globalFilter]);
  
  return {
    selectedTab,
    setSelectedTab,
    pagination,
    setPagination,
    globalFilter,
    setGlobalFilter,
    handleGlobalFilterChange,
    sorting,
    setSorting,
    handleSortingChange,
    columnVisibility,
    setColumnVisibility,
  };
};

