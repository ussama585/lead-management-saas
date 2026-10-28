import ManualLocationInput from './manual-location-input.jsx';
import { Select } from './ui/app-select.jsx';
import { Input } from './ui/app-controls.jsx';
import React, { useMemo } from 'react';

import { formatCurrencyInput, getCurrencySymbol, toNumericValue, normalizeJobId, formatNumber } from '../pages/shared/utils/job-utils.js';
import { citiesNames } from '../pages/shared/utils/countries.js';
import './contract-summary-form.css';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/contract-summary-form.css';

const ContractSummaryForm = ({
  showContractFields,
  jobCount,
  vacancies,
  pricingType,
  remarks,
  contractCurrency,
  pricingTypeOptions,
  remarksLabel,
  remarksRequired,
  loading,
  updatingProposal,
  viewOnlyMode,
  jobCountError,
  vacanciesError,
  pricingTypeError,
  remarksError,
  totalContractError,
  mobilizationError,
  selectedJobIds,
  availableJobs,
  jobRowData,
  mobilizationAmount,
  onPricingTypeChange,
  onRemarksChange,
  onMobilizationChange,
  onMobilizationFocus,
  // Proposal document fields (Conversion modal)
  proposalDate,
  proposalCity,
  replacementGuaranteeDuration,
  turnaroundTime,
  onProposalDateChange,
  onProposalCityChange,
  onReplacementGuaranteeDurationChange,
  onTurnaroundTimeChange,
}) => {
  // Calculate totals from job data instead of using response data - use exact same logic as table
  const calculatedTotals = useMemo(() => {
    if (!availableJobs || !selectedJobIds || selectedJobIds.length === 0) {
      return {
        jobCount: 0,
        vacancies: 0,
        subtotal: 0,
        discount: 0,
        total: 0,
      };
    }

    const totals = selectedJobIds.reduce((acc, jobId) => {
      const job = availableJobs.find((j) => normalizeJobId(j) === jobId);
      if (!job) return acc;

      const rowData = jobRowData[jobId] || {};

      // Use charges per resource and discount per resource (same logic as jobs-selection-table.jsx)
      const numericChargesPerResource = toNumericValue(rowData.chargesPerResource || '');
      const discountPerResourceNumeric = toNumericValue(rowData.discountPerResource || '');

      const resourcesValue = rowData.resources ?? (job?.number_of_vacancies ?? 1);
      const numericResources = Number(resourcesValue) || 1;

      const amountAfterDiscountPerResourceNumeric =
        numericChargesPerResource > 0
          ? Math.max(numericChargesPerResource - discountPerResourceNumeric, 0)
          : 0;

      // Line-level calculations
      const subtotalNumeric = numericChargesPerResource * numericResources;
      const discountNumeric = discountPerResourceNumeric * numericResources;
      const totalNumeric = amountAfterDiscountPerResourceNumeric * numericResources;

      return {
        jobCount: acc.jobCount + 1,
        vacancies: acc.vacancies + numericResources,
        subtotal: acc.subtotal + subtotalNumeric,
        discount: acc.discount + discountNumeric,
        total: acc.total + totalNumeric,
      };
    }, { jobCount: 0, vacancies: 0, subtotal: 0, discount: 0, total: 0 });

    return totals;
  }, [selectedJobIds, availableJobs, jobRowData]);

  if (!showContractFields) {
    // Remarks-only mode
    return (
      <div className="mb-0">
        <label className="contract-summary-form__remarks-only-label">
          {remarksLabel}
          {(remarksRequired || showContractFields) && <span className="contract-summary-form__label-asterisk--brand">*</span>}
        </label>
        <Input.TextArea
          value={remarks}
          onChange={(e) => onRemarksChange(e.target.value)}
          disabled={loading || viewOnlyMode}
          rows={4}
          maxLength={1000}
          className="custom-textarea contract-summary-form__textarea-full"
          placeholder=""
        />
        {remarksError && (
          <div className="contract-summary-form__error-text">{remarksError}</div>
        )}
      </div>
    );
  }

  // Contract fields mode
  const currencySymbol = getCurrencySymbol(contractCurrency);

  return (
    <div
      className="contract-summary-form contract-summary-form__grid"
    >
      {/* Left side: No. of Jobs, No. of Resources, Pricing Type, Remarks */}
      <div>
        <div className="contract-summary-form__field-block">
          <div className="flex-between contract-summary-form__field-header">
            <label
              className="contract-summary-form__field-label"
            >
              No. of Jobs<span className="contract-summary-form__label-asterisk">*</span>:
            </label>
            <span className="contract-summary-form__field-value">
              {jobCount || 0}
            </span>
          </div>
          <div className="contract-summary-form__divider" />
          {jobCountError && (
            <div className="contract-summary-form__error-text--tight">{jobCountError}</div>
          )}
        </div>

        <div className="contract-summary-form__field-block">
          <div className="flex-between contract-summary-form__field-header">
            <label
              className="contract-summary-form__field-label"
            >
              No. of Resources<span className="contract-summary-form__label-asterisk">*</span>:
            </label>
            <span className="contract-summary-form__field-value">
              {vacancies || 0}
            </span>
          </div>
          <div className="contract-summary-form__divider" />
          {vacanciesError && (
            <div className="contract-summary-form__error-text--tight">
              {vacanciesError}
            </div>
          )}
        </div>

        <div className="contract-summary-form__field-block">
          <label
            className="contract-summary-form__block-label"
          >
            Pricing Type <span className="contract-summary-form__label-asterisk">*</span>
          </label>
          <Select
            className="antd-input dropdown contract-summary-select contract-summary-form__select-full"
            value={pricingType || undefined}
            options={pricingTypeOptions}
            placeholder="Select pricing type"
            onChange={onPricingTypeChange}
            status={pricingTypeError ? 'error' : ''}
            allowClear
            disabled={loading || updatingProposal}
          />
          {pricingTypeError && (
            <div className="contract-summary-form__error-text">{pricingTypeError}</div>
          )}
        </div>

        {/* Proposal document fields (Proposal Date is in modal top row) */}
        {onProposalDateChange != null && (
          <>
            <div className="contract-summary-form__field-block">
              <label className="contract-summary-form__block-label">
                Proposal City
              </label>
              <ManualLocationInput
                className="antd-input dropdown contract-summary-select contract-summary-form__select-full"
                value={proposalCity || undefined}
                onChange={(value) => onProposalCityChange(value || '')}
                placeholder="Select city"
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={loading || updatingProposal}
              />
            </div>
            <div className="contract-summary-form__field-block">
              <label className="contract-summary-form__block-label">
                Replacement Guarantee Duration
              </label>
              <Select
                className="antd-input dropdown contract-summary-select contract-summary-form__select-full"
                value={
                  replacementGuaranteeDuration
                    ? replacementGuaranteeDuration === '4 weeks'
                      ? '1 month'
                      : replacementGuaranteeDuration
                    : undefined
                }
                onChange={(value) => {
                  const normalized = value === '4 weeks' ? '1 month' : value || '';
                  onReplacementGuaranteeDurationChange(normalized);
                }}
                options={[
                  { value: '2 weeks', label: '2 weeks' },
                  { value: '3 weeks', label: '3 weeks' },
                  { value: '1 month', label: '1 month ' },
                ]}
                placeholder="Select duration"
                disabled={loading || updatingProposal}
                allowClear
              />
            </div>
            <div className="contract-summary-form__field-block">
              <label className="contract-summary-form__block-label">
                Turnaround Time
              </label>
              <Select
                className="antd-input dropdown contract-summary-select contract-summary-form__select-full"
                value={
                  turnaroundTime
                    ? turnaroundTime === '14 working days'
                      ? '2 weeks'
                      : turnaroundTime === '4 weeks'
                        ? '1 month'
                        : turnaroundTime
                    : undefined
                }
                onChange={(value) => {
                  const normalized =
                    value === '14 working days'
                      ? '2 weeks'
                      : value === '4 weeks'
                        ? '1 month'
                        : value || '';
                  onTurnaroundTimeChange(normalized);
                }}
                options={[
                  { value: '5-7 working days', label: '5-7 working days' },
                  { value: '7-10 working days', label: '7-10 working days' },
                  { value: '10-12 working days', label: '10-12 working days' },
                  { value: '15-30 working days', label: '15-30 working days' },
                ]}
                placeholder="Select turnaround"
                disabled={loading || updatingProposal}
                allowClear
              />
            </div>
          </>
        )}

        <div className="mb-0">
          <label
            className="contract-summary-form__block-label"
          >
            {remarksLabel}
            {remarksRequired && <span className="contract-summary-form__label-asterisk"></span>}
          </label>
          <Input.TextArea
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            disabled={loading || viewOnlyMode || updatingProposal}
            rows={4}
            maxLength={1000}
            className="custom-textarea contract-summary-form__textarea-full"
            placeholder="Enter your remarks"
          />
          {remarksError && (
            <div className="contract-summary-form__error-text">{remarksError}</div>
          )}
        </div>
      </div>

      {/* Right side: Financial summary */}
      <div>
        <div className="contract-summary-form__summary-row">
          <div className="flex-between contract-summary-form__summary-row-inner">
            <span className="contract-summary-form__summary-label">Sub-Total Contract Amount:</span>
            <span className="contract-summary-form__summary-value">
              {calculatedTotals.subtotal > 0 ? `${currencySymbol}${formatNumber(calculatedTotals.subtotal)}` : `${currencySymbol}0`}
            </span>
          </div>
        </div>

        <div className="contract-summary-form__summary-row">
          <div className="flex-between contract-summary-form__summary-row-inner">
            <span className="contract-summary-form__summary-label">Discount Amount:</span>
            <span className="contract-summary-form__summary-value">
              {calculatedTotals.discount > 0 ? `${currencySymbol}${formatNumber(calculatedTotals.discount)}` : `${currencySymbol}0`}
            </span>
          </div>
        </div>

        <div className="contract-summary-form__summary-row">
          <div className="flex-between contract-summary-form__summary-row-inner">
            <span className="contract-summary-form__summary-label">Discount Percentage:</span>
            <span className="contract-summary-form__summary-value">
              {calculatedTotals.subtotal > 0 ? `${((calculatedTotals.discount / calculatedTotals.subtotal) * 100).toFixed(2)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="contract-summary-form__summary-row">
          <div className="flex-between contract-summary-form__summary-row-inner">
            <span className="contract-summary-form__summary-label">Final Contract Amount:</span>
            <span className="contract-summary-form__summary-value--strong">
              {calculatedTotals.total > 0 ? `${currencySymbol}${formatNumber(calculatedTotals.total)}` : `${currencySymbol}0`}
            </span>
          </div>
          {totalContractError && (
            <div className="contract-summary-form__error-text--tight">
              {totalContractError}
            </div>
          )}
        </div>

        <div className="contract-summary-form__mobilization-block">
          <label
            className="contract-summary-form__block-label"
          >
            Mobilization Amount<span className="contract-summary-form__label-asterisk">*</span>
          </label>
          <Input
            value={mobilizationAmount ? `${currencySymbol}${mobilizationAmount}` : ''}
            onChange={(e) => {
              const formatted = formatCurrencyInput(e.target.value);
              onMobilizationChange(formatted);
            }}
            onFocus={(e) => {
              const val = e.target.value.replace(/[^\d.]/g, '');
              e.target.value = val;
            }}
            disabled={loading || updatingProposal}
            className="custom-input contract-summary-form__input-full"
            placeholder="Enter mobilization amount"
          />
          {mobilizationError && (
            <div className="contract-summary-form__error-text">
              {mobilizationError}
            </div>
          )}
        </div>

        <div className="contract-summary-form__summary-row">
          <div className="flex-between contract-summary-form__summary-row-inner">
            <span className="contract-summary-form__summary-label">Remaining Payment:</span>
            <span className="contract-summary-form__summary-value">
              {(() => {
                const totalNumeric = calculatedTotals.total || 0;
                const mobilizationNumeric = toNumericValue(mobilizationAmount || '');
                const remaining = Math.max(0, totalNumeric - mobilizationNumeric);
                return `${currencySymbol}${formatNumber(remaining)}`;
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractSummaryForm;
