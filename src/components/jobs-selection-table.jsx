import React from 'react';
import { Input, message, Checkbox } from 'antd';
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

  return (
    <div className="jobs-selection-table__wrap">
      <div className="jobs-selection-table__border">
        <table className="jobs-selection-table__table">
          <thead>
            <tr className="jobs-selection-table__header-row">
              {showCheckboxes && (
                <th className="jobs-selection-table__th jobs-selection-table__th--checkbox">
                  <Checkbox
                    checked={selectedJobIds.length === availableJobs.length && availableJobs.length > 0}
                    indeterminate={selectedJobIds.length > 0 && selectedJobIds.length < availableJobs.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Select only jobs that have charges per resource
                        const jobsWithCharges = availableJobs.filter(job => {
                          const jobId = normalizeJobId(job);
                          const rowData = jobRowData[jobId] || {};
                          const chargesPerResource = toNumericValue(rowData.chargesPerResource || '');
                          const hasCharges = chargesPerResource > 0;
                          return hasCharges;
                        });

                        // Select only jobs that have charges per resource
                        const jobIdsWithCharges = jobsWithCharges.map(job => normalizeJobId(job)).filter(Boolean);
                        onJobSelectionChange(jobIdsWithCharges);
                      } else {
                        // Deselect all jobs
                        onJobSelectionChange([]);
                      }
                    }}
                    disabled={loading}
                  />
                </th>
              )}
              <th className="jobs-selection-table__th jobs-selection-table__th--title">Job Title</th>
              <th className="jobs-selection-table__th jobs-selection-table__th--salary">Salary per Resource</th>
              <th className="jobs-selection-table__th jobs-selection-table__th--charges">Charges per Resource ({currencyCode})</th>
              <th className="jobs-selection-table__th jobs-selection-table__th--discount">Discount per Resource ({currencyCode})</th>
              <th className="jobs-selection-table__th jobs-selection-table__th--after-discount">Charges After Discount ({currencyCode})</th>
              <th className="jobs-selection-table__th jobs-selection-table__th--resources">No. of Resources</th>
              <th className="jobs-selection-table__th--last">Total</th>
            </tr>
          </thead>
          <tbody>
            {availableJobs.map((job) => {
              const jobId = normalizeJobId(job);
              if (!jobId) return null;

              const isSelected = selectedJobIds.includes(jobId);
              const rowData = jobRowData[jobId] || {};

              const resourcesValue = rowData.resources ?? (job?.number_of_vacancies ?? 1);
              const discountPerResourceValue = rowData.discountPerResource || '';
              
              // Get min/max salary from rowData or job for display
              const minSalary = rowData.minSalary ?? job?.min_salary ?? null;
              const maxSalary = rowData.maxSalary ?? job?.max_salary ?? null;
              
              // Format salary display as currency with comma-separated amount (min - max)
              const salaryTypeDisplay = minSalary !== null && maxSalary !== null 
                ? `${currencySymbol}${formatNumber(minSalary)} - ${currencySymbol}${formatNumber(maxSalary)}`
                : minSalary !== null 
                  ? `${currencySymbol}${formatNumber(minSalary)}`
                  : maxSalary !== null
                    ? `${currencySymbol}${formatNumber(maxSalary)}`
                    : '-';

              // Use charges per resource instead of salary for calculations
              const chargesPerResource = toNumericValue(rowData.chargesPerResource || '');
              const numericResources = Number(resourcesValue) || 1;
              const discountPerResourceNumeric = toNumericValue(discountPerResourceValue);
              const amountAfterDiscountPerResourceNumeric = chargesPerResource > 0
                ? Math.max(chargesPerResource - discountPerResourceNumeric, 0)
                : 0;
              // Use per-resource based calculations
              const subtotalNumeric = chargesPerResource * numericResources;
              const discountNumeric = discountPerResourceNumeric * numericResources;
              const totalNumeric = amountAfterDiscountPerResourceNumeric * numericResources;

              const amountAfterDiscountPerResourceDisplay =
                isSelected && amountAfterDiscountPerResourceNumeric > 0 ? formatNumber(amountAfterDiscountPerResourceNumeric) : '';
              const subtotalDisplay = isSelected && subtotalNumeric > 0 ? formatNumber(subtotalNumeric) : '';
              const discountDisplay = isSelected && discountNumeric > 0 ? formatNumber(discountNumeric) : '';
              const totalDisplay = isSelected && totalNumeric > 0 ? formatNumber(totalNumeric) : '';

              return (
                <tr
                  key={jobId}
                  className="jobs-selection-table__row"
                >
                  {showCheckboxes && (
                    <td className="jobs-selection-table__td jobs-selection-table__td--checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Add job to selection
                            onJobSelectionChange([...selectedJobIds, jobId]);
                          } else {
                            // Remove job from selection
                            onJobSelectionChange(selectedJobIds.filter((id) => id !== jobId));
                          }
                        }}
                        disabled={loading}
                      />
                    </td>
                  )}
                  <td className="jobs-selection-table__td jobs-selection-table__td--title">
                    {getJobLabel(job)}
                  </td>
                  <td className="jobs-selection-table__td jobs-selection-table__td--salary">
                    {salaryTypeDisplay}
                  </td>
                  <td className="jobs-selection-table__td jobs-selection-table__td--input-cell">
                    {isSelected ? (
                      <Input
                        value={rowData.chargesPerResource ? `${currencySymbol}${rowData.chargesPerResource}` : ''}
                        onChange={(e) => handleChargesPerResourceChange(jobId, e.target.value)}
                        onFocus={(e) => {
                          const val = e.target.value.replace(/[^\d.]/g, '');
                          e.target.value = val;
                        }}
                        placeholder="0"
                        className="custom-input jobs-selection-table__cell-input"
                        disabled={loading || !isSelected}
                      />
                    ) : (
                      rowData.chargesPerResource ? `${currencySymbol}${formatNumber(rowData.chargesPerResource)}` : ''
                    )}
                  </td>
                  <td className="jobs-selection-table__td jobs-selection-table__td--input-cell">
                    {isSelected ? (
                      <Input
                        value={discountPerResourceValue ? `${currencySymbol}${discountPerResourceValue}` : ''}
                        onChange={(e) => handleDiscountPerResourceChange(jobId, e.target.value)}
                        onFocus={(e) => {
                          const val = e.target.value.replace(/[^\d.]/g, '');
                          e.target.value = val;
                        }}
                        placeholder="0"
                        className="custom-input jobs-selection-table__cell-input"
                        disabled={loading || !isSelected}
                      />
                    ) : (
                      discountPerResourceValue ? `${currencySymbol}${formatNumber(discountPerResourceValue)}` : ''
                    )}
                  </td>
                  <td className="jobs-selection-table__td jobs-selection-table__td--after-discount">
                    {amountAfterDiscountPerResourceDisplay ? `${currencySymbol}${amountAfterDiscountPerResourceDisplay}` : ''}
                  </td>
                  <td className="jobs-selection-table__td jobs-selection-table__td--resources">
                    {resourcesValue}
                  </td>
                  <td className="jobs-selection-table__td jobs-selection-table__td--total">
                    {totalDisplay ? `${currencySymbol}${totalDisplay}` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {jobsError && (
        <div className="jobs-selection-table__error-text">{jobsError}</div>
      )}
    </div>
  );
};

export default JobsSelectionTable;

