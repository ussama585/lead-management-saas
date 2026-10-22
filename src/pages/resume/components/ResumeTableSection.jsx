import React from 'react';
import NewTableComponent from '../../../components/tables/new-table.jsx';
import SelectedRowsActions from './SelectedRowsActions.jsx';
import { formatCount } from '../../shared/utils/formatters.js';

const ResumeTableSection = ({
  selectedCount,
  isAdmin,
  onDownloadSelected,
  totalCount,
  columns,
  tableRows,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  isLoading,
  selectedRows,
  onRowSelectionChange,
}) => {
  return (
    <>
      <SelectedRowsActions
        selectedCount={selectedCount}
        isAdmin={isAdmin}
        onDownloadSelected={onDownloadSelected}
      />

      <NewTableComponent
        totalCount={totalCount}
        columns={columns}
        data={tableRows}
        heading={`CVs (${formatCount(totalCount)})`}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        enableMultiSort={false}
        globalFilter=""
        enableGlobalFilter={false}
        isLoading={isLoading}
        enableRowSelection={true}
        rowSelection={selectedRows}
        onRowSelectionChange={onRowSelectionChange}
        getRowId={(row, index) => row.id?.toString() || `row-${index}`}
        columnVisibility={{ id: false }}
      />
    </>
  );
};

export default ResumeTableSection;
