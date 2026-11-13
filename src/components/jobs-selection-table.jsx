import { message } from './ui/notifications.jsx';
import { Input } from './ui/app-controls.jsx';
import React from 'react';
import NewTableComponent from './tables/new-table.jsx';
import { Checkbox } from 'antd';
import { normalizeJobId, getJobLabel, formatNumber, toNumericValue, getCurrencySymbol, formatCurrencyInput } from '../pages/shared/utils/job-utils.js';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/jobs-selection-table.css';

const JobsSelectionTable = ({
  availableJobs,
  selectedJobIds,
  jobRowData,
  contractCurrency,
  loading,
  jobsLoading,
  jobsError,
  loadingProposal,
  onJobSelectionChange,
  onJobRowDataChange,
  showCheckboxes = true,
}) => {
  // Debug logging for conversion scenarios
 

  // Validate jobs from conversion API
  if (availableJobs && availableJobs.length > 0) {
   

    // Validate that all jobs have required fields
    const invalidJobs = availableJobs.filter(job => !job.id || !job.job_title);
    if (invalidJobs.length > 0) {
      console.error('[JobsSelectionTable] Some jobs are missing required fields:', invalidJobs);
    }
  } else {
    console.log('[JobsSelectionTable] No available jobs or empty array - jobsLoading:', jobsLoading, 'loadingProposal:', loadingProposal);
  }



  const handleChargesPerResourceChange = (jobId, value) => {
    const formatted = formatCurrencyInput(value);
    
    const updatedRowData = {
      ...jobRowData[jobId],
      chargesPerResource: formatted,
      discount: '', // Reset discount when charges change
    };
    
    onJobRowDataChange(jobId, updatedRowData);
  };

  // Discount field is now read-only; value comes from API / precomputed data

  const handleDiscountPerResourceChange = (jobId, value) => {
    const formatted = formatCurrencyInput(value);

    const job = availableJobs.find((j) => {
      const jId = normalizeJobId(j);
      return jId && jId === jobId;
    });

    if (job) {
      const rowData = jobRowData[jobId] || {};
      const chargesPerResource = toNumericValue(rowData.chargesPerResource || '');
      const discountPerResourceNumeric = toNumericValue(formatted);

      if (discountPerResourceNumeric > chargesPerResource) {
        message.error('Discount per resource cannot be greater than charges per resource');
        return;
      }
    }

    const updatedRowData = {
      ...jobRowData[jobId],
      discountPerResource: formatted,
    };

    onJobRowDataChange(jobId, updatedRowData);
  };

  if (loadingProposal) {
    return <div className="jobs-selection-table__status-text">Loading proposal data...</div>;
  }

  if (jobsLoading) {
    return <div className="jobs-selection-table__status-text">Loading jobs...</div>;
  }

  if (availableJobs.length === 0) {
     const isConversionScenario = showCheckboxes; // showCheckboxes is true for conversion scenarios
    if (isConversionScenario) {
      return (
        <div className="jobs-selection-table__status-text--error">
        Error
        </div>
      );
    }
    return (
      <div className="jobs-selection-table__status-text">
        No jobs available for this lead.
      </div>
    );
  }

  const currencyCode = contractCurrency ? (contractCurrency.match(/\(([^)]+)\)/) || [null, 'PKR'])[1] : 'PKR';
  const currencySymbol = getCurrencySymbol(contractCurrency);

  const rows = availableJobs.flatMap(job => {
    const jobId = normalizeJobId(job);
    if (!jobId) return [];
    const isSelected = selectedJobIds.includes(jobId);
    const rowData = jobRowData[jobId] || {};
    const resourcesValue = rowData.resources ?? (job?.number_of_vacancies ?? 1);
    const discountPerResourceValue = rowData.discountPerResource || '';
    const minSalary = rowData.minSalary ?? job?.min_salary ?? null;
    const maxSalary = rowData.maxSalary ?? job?.max_salary ?? null;
    const salaryDisplay = minSalary !== null && maxSalary !== null
      ? currencySymbol + formatNumber(minSalary) + ' - ' + currencySymbol + formatNumber(maxSalary)
      : minSalary !== null ? currencySymbol + formatNumber(minSalary)
        : maxSalary !== null ? currencySymbol + formatNumber(maxSalary) : '-';
    const charges = toNumericValue(rowData.chargesPerResource || '');
    const resources = Number(resourcesValue) || 1;
    const afterDiscount = charges > 0 ? Math.max(charges - toNumericValue(discountPerResourceValue), 0) : 0;
    const total = afterDiscount * resources;
    return [{ job, jobId, isSelected, rowData, resourcesValue, discountPerResourceValue, salaryDisplay,
      afterDiscountDisplay: isSelected && afterDiscount > 0 ? currencySymbol + formatNumber(afterDiscount) : '',
      totalDisplay: isSelected && total > 0 ? currencySymbol + formatNumber(total) : '' }];
  });
  const moneyInput = (row, discount) => {
    const { jobId, isSelected, rowData, discountPerResourceValue } = row;
    const value = discount ? discountPerResourceValue : rowData.chargesPerResource;
    if (!isSelected) return value ? currencySymbol + formatNumber(value) : '';
    return <Input value={value ? currencySymbol + value : ''}
      onChange={event => discount ? handleDiscountPerResourceChange(jobId, event.target.value)
        : handleChargesPerResourceChange(jobId, event.target.value)}
      onFocus={event => { event.target.value = event.target.value.replace(/[^\d.]/g, ''); }}
      placeholder="0" className="custom-input jobs-selection-table__cell-input" disabled={loading || !isSelected} />;
  };
  const columns = [
    ...(showCheckboxes ? [{ id: 'job_selection', header: '', size: 50, minSize: 50,
      muiTableHeadCellProps: { align: 'center' }, muiTableBodyCellProps: { align: 'center' },
      Header: () => <Checkbox
        checked={selectedJobIds.length === availableJobs.length && availableJobs.length > 0}
        indeterminate={selectedJobIds.length > 0 && selectedJobIds.length < availableJobs.length}
        onChange={event => {
          const next = event.target.checked ? availableJobs.filter(job => {
            const id = normalizeJobId(job);
            return toNumericValue((jobRowData[id] || {}).chargesPerResource || '') > 0;
          }).map(job => normalizeJobId(job)).filter(Boolean) : [];
          onJobSelectionChange(next);
        }} disabled={loading} />,
      Cell: ({ row }) => <Checkbox checked={row.original.isSelected}
        onChange={event => onJobSelectionChange(event.target.checked
          ? [...selectedJobIds, row.original.jobId] : selectedJobIds.filter(id => id !== row.original.jobId))}
        disabled={loading} />,
    }] : []),
    { id: 'job_title', header: 'Job Title', size: 200,
      Cell: ({ row }) => getJobLabel(row.original.job) },
    { id: 'salary', header: 'Salary per Resource', size: 200,
      Cell: ({ row }) => row.original.salaryDisplay },
    { id: 'charges', header: 'Charges per Resource (' + currencyCode + ')', size: 150,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => moneyInput(row.original, false) },
    { id: 'discount', header: 'Discount per Resource (' + currencyCode + ')', size: 150,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => moneyInput(row.original, true) },
    { id: 'after_discount', header: 'Charges After Discount (' + currencyCode + ')', size: 150,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => row.original.afterDiscountDisplay },
    { id: 'resources', header: 'No. of Resources', size: 100,
      muiTableHeadCellProps: { align: 'center' }, muiTableBodyCellProps: { align: 'center' },
      Cell: ({ row }) => row.original.resourcesValue },
    { id: 'total', header: 'Total', size: 120,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => row.original.totalDisplay },
  ];

  return <div className="jobs-selection-table__wrap">
    <NewTableComponent mrtOptions={{
      columns,
      data: rows,
      getRowId: row => row.jobId,
      enableRowSelection: false,
      enableSorting: false,
      enableColumnActions: false,
      enableColumnFilters: false,
      enableGlobalFilter: false,
      enableHiding: false,
      enablePagination: false,
      enableTopToolbar: false,
      enableBottomToolbar: false,
      muiTableProps: { className: 'jobs-selection-table__table', sx: { minWidth: 1220 } },
      muiTableBodyRowProps: { className: 'jobs-selection-table__row' },
      muiTableContainerProps: { sx: { overflowX: 'auto' } },
    }} />
    {jobsError && <div className="jobs-selection-table__error-text">{jobsError}</div>}
  </div>;
};

export default JobsSelectionTable;
