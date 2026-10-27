import { message } from './ui/notifications.jsx';
import { Modal } from './ui/app-modal.jsx';
import { Select } from './ui/app-select.jsx';
import { Input } from './ui/app-controls.jsx';
import { Button } from './ui/app-controls.jsx';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { currencyOptions } from '../pages/shared/utils/countries.js';
import { ShowRemarkSchema } from '../pages/shared/schemas/remark.js';
import { getProjectProposal } from '../pages/shared/services/headhunting.js';
import { getConversionToPotential, createOrUpdateConversionToPotential } from '../pages/shared/services/leads.js';
import JobsSelectionTable from './jobs-selection-table.jsx';
import ContractSummaryForm from './contract-summary-form.jsx';
import JobValidationErrorsModal from './job-validation-errors-modal.jsx';
import { normalizeJobId, formatNumber, parseNumber, toNumericValue, formatCurrencyInput, getJobLabel, getCurrencySymbol } from '../pages/shared/utils/job-utils.js';
import { parseConversionJobValidationError } from '../pages/shared/utils/conversion-job-errors.js';

const VALID_CURRENCIES = new Set(currencyOptions.map((o) => o.value));
const resolveContractCurrency = (lead) => {
  const candidates = [
    lead?.contract_currency,
    lead?.jobs?.[0]?.currency,
    lead?.available_jobs?.[0]?.currency,
  ];
  return candidates.find((c) => c && VALID_CURRENCIES.has(c)) ?? 'Pakistani Rupee (PKR)';
};

/** Format proposal date for API: YYYY-MM-DD (API does not accept full ISO) */
const formatProposalDateForApi = (dateStr) => {
  if (!dateStr) return undefined;
  const d = dayjs(dateStr);
  return d.isValid() ? d.format('YYYY-MM-DD') : undefined;
};

// Custom hooks for better separation of concerns
const useValidationState = () => {
  const [remarksError, setRemarksError] = useState('');
  const [vacanciesError, setVacanciesError] = useState('');
  const [jobCountError, setJobCountError] = useState('');
  const [subTotalError, setSubTotalError] = useState('');
  const [discountAmountError, setDiscountAmountError] = useState('');
  const [discountPercentageError, setDiscountPercentageError] = useState('');
  const [totalContractError, setTotalContractError] = useState('');
  const [pricingTypeError, setPricingTypeError] = useState('');
  const [proposalError, setProposalError] = useState('');
  const [jobsError, setJobsError] = useState('');
  const [mobilizationError, setMobilizationError] = useState('');

  const clearAllErrors = () => {
    setRemarksError('');
    setProposalError('');
    setVacanciesError('');
    setJobCountError('');
    setSubTotalError('');
    setDiscountAmountError('');
    setDiscountPercentageError('');
    setTotalContractError('');
    setPricingTypeError('');
    setJobsError('');
    setMobilizationError('');
  };

  return {
    errors: {
      remarksError,
      vacanciesError,
      jobCountError,
      subTotalError,
      discountAmountError,
      discountPercentageError,
      totalContractError,
      pricingTypeError,
      proposalError,
      jobsError,
      mobilizationError,
    },
    setters: {
      setRemarksError,
      setVacanciesError,
      setJobCountError,
      setSubTotalError,
      setDiscountAmountError,
      setDiscountPercentageError,
      setTotalContractError,
      setPricingTypeError,
      setProposalError,
      setJobsError,
      setMobilizationError,
    },
    clearAllErrors,
  };
};

const useLeadState = (lead) => {
  const [remarks, setRemarks] = useState(lead?.remarks || '');
  const [contractCurrency, setContractCurrency] = useState(() => resolveContractCurrency(lead));
  const [subTotalAmount, setSubTotalAmount] = useState(lead?.contract_subtotal_amount || lead?.contract_price || '');
  const [discountAmount, setDiscountAmount] = useState(lead?.discount_amount || '');
  const [discountPercentage, setDiscountPercentage] = useState(lead?.discount_percentage || '');
  const [totalContractAmount, setTotalContractAmount] = useState(lead?.contract_price || '');
  const [vacancies, setVacancies] = useState(lead?.total_vacancies || '');
  const [jobCount, setJobCount] = useState(lead?.job_count || '');
  const [pricingType, setPricingType] = useState(lead?.pricing_type || '');
  const [mobilizationAmount, setMobilizationAmount] = useState('');
  const [isMobilizationManuallyEdited, setIsMobilizationManuallyEdited] = useState(false);
  // Proposal document fields (for generated proposal PDF)
  const [proposalDate, setProposalDate] = useState(lead?.proposal_date || lead?.created_at || '');
  const [proposalCity, setProposalCity] = useState(lead?.city || lead?.proposal_city || '');
  const [replacementGuaranteeDuration, setReplacementGuaranteeDuration] = useState(
    lead?.replacement_guarantee_duration || ''
  );
  const [turnaroundTime, setTurnaroundTime] = useState(
    // prefer explicit turnaround_time or turnaround_text from API; no local default
    lead?.turnaround_time || lead?.turnaround_text || ''
  );

  const initializeFromLead = (newLead) => {
    setRemarks(newLead?.remarks || '');
    setContractCurrency(resolveContractCurrency(newLead));

    const initialSubTotal = newLead?.contract_subtotal_amount || newLead?.contract_price || '';
    const initialDiscountAmount = newLead?.discount_amount || '';
    const initialDiscountPercent = newLead?.discount_percentage || '';
    const formattedSubTotal = initialSubTotal ? formatNumber(initialSubTotal) : '';
    const formattedDiscountAmount = initialDiscountAmount ? formatNumber(initialDiscountAmount) : '';
    const formattedDiscountPercent = initialDiscountPercent ? Number(initialDiscountPercent).toString() : '';
    const derivedTotal = Math.max(
      toNumericValue(formattedSubTotal) - toNumericValue(formattedDiscountAmount),
      0,
    );

    setSubTotalAmount(formattedSubTotal);
    setDiscountAmount(formattedDiscountAmount);
    setDiscountPercentage(formattedDiscountPercent);
    setTotalContractAmount(derivedTotal ? formatNumber(derivedTotal) : formattedSubTotal ? '0' : '');

    // Initialize mobilization amount from lead data if available
    if (newLead?.mobilization_charges) {
      setMobilizationAmount(formatNumber(newLead.mobilization_charges));
      setIsMobilizationManuallyEdited(true);
    } else {
      setMobilizationAmount('');
      setIsMobilizationManuallyEdited(true); // Treat as manually edited (empty) to prevent auto-generation
    }

    setVacancies(newLead?.total_vacancies || '');
    setJobCount(newLead?.job_count || '');
    setPricingType(newLead?.pricing_type || '');
    setProposalDate(newLead?.proposal_date || newLead?.created_at || '');
    setProposalCity(newLead?.city || newLead?.proposal_city || '');
    setReplacementGuaranteeDuration(newLead?.replacement_guarantee_duration || '');
    setTurnaroundTime(newLead?.turnaround_time || newLead?.turnaround_text || '');
  };

  return {
    state: {
      remarks,
      contractCurrency,
      subTotalAmount,
      discountAmount,
      discountPercentage,
      totalContractAmount,
      vacancies,
      jobCount,
      pricingType,
      mobilizationAmount,
      isMobilizationManuallyEdited,
      proposalDate,
      proposalCity,
      replacementGuaranteeDuration,
      turnaroundTime,
    },
    setters: {
      setRemarks,
      setContractCurrency,
      setSubTotalAmount,
      setDiscountAmount,
      setDiscountPercentage,
      setTotalContractAmount,
      setVacancies,
      setJobCount,
      setPricingType,
      setMobilizationAmount,
      setIsMobilizationManuallyEdited,
      setProposalDate,
      setProposalCity,
      setReplacementGuaranteeDuration,
      setTurnaroundTime,
    },
    initializeFromLead,
  };
};

const useJobManagement = (lead) => {
  const normalizeSelectedJobIds = (value) => {
    if (value === undefined || value === null || value === '') return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            return normalizeJobId(item);
          }
          if (item === 0 || item) {
            return String(item);
          }
          return null;
        })
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    }
    if (typeof value === 'number') {
      return [String(value)];
    }
    return [];
  };

  const [selectedJobIds, setSelectedJobIds] = useState(
    normalizeSelectedJobIds(lead?.selected_jobs)
  );
  const [availableJobs, setAvailableJobs] = useState(lead?.jobs || lead?.available_jobs || []);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [hasUserSelectedJobs, setHasUserSelectedJobs] = useState(false);
  const [jobRowData, setJobRowData] = useState({});
  const hasUserSelectedJobsRef = useRef(false);

  return {
    state: {
      selectedJobIds,
      availableJobs,
      jobsLoading,
      jobsError,
      hasUserSelectedJobs,
      jobRowData,
    },
    setters: {
      setSelectedJobIds,
      setAvailableJobs,
      setJobsLoading,
      setJobsError,
      setHasUserSelectedJobs,
      setJobRowData,
    },
    refs: {
      hasUserSelectedJobsRef,
    },
    utils: {
      normalizeSelectedJobIds,
    },
  };
};

const ShowRemarksLead = ({
  visible,
  onClose,
  lead,
  onSave,
  loading,
  extra,
  viewOnlyMode = false,
  showContractFields = false,
  remarksRequired = false,
  proposalRequired = true,
  isProposalAttached = false,
  saveButtonText = 'Convert',
  modalTitle = null,
  remarksLabel = 'Remarks',
  leadType // 'meta-leads', 'data-leads', or undefined (for regular leads)
}) => {
  // Debug logging for lead jobs


  // Use custom hooks for better separation of concerns
  const validationState = useValidationState();
  const leadState = useLeadState(lead);
  const jobManagement = useJobManagement(lead);

  // Additional state for component-specific logic
  const selectedJobIdsRef = useRef(jobManagement.state.selectedJobIds);
  const prevLeadIdRef = useRef(null);
  const [convertingLead, setConvertingLead] = useState(false);
  const [proposalData, setProposalData] = useState(null);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [isTotalContractManuallyEdited, setIsTotalContractManuallyEdited] = useState(false);
  const [isMobilizationManuallyEdited, setIsMobilizationManuallyEdited] = useState(false);
  const [jobValidationErrors, setJobValidationErrors] = useState(null);
  const resolvedLeadType = lead?.leadType || leadType;

  // Utility functions for data transformation and validation
const createJobPayload = (jobId, job, jobRowData, contractCurrency, summaryTotals) => {
  const rowData = jobRowData[jobId] || {};
  const minSalary = rowData.minSalary ?? job?.min_salary ?? null;
  const maxSalary = rowData.maxSalary ?? job?.max_salary ?? null;

  // Normalize min/max salary so API always receives min_salary <= max_salary
  const minSalaryNumeric = toNumericValue(minSalary || '');
  const maxSalaryNumeric = toNumericValue(maxSalary || '');
  const hasBothSalaries = minSalaryNumeric > 0 && maxSalaryNumeric > 0;
  const normalizedMinSalary = hasBothSalaries
    ? Math.min(minSalaryNumeric, maxSalaryNumeric)
    : (minSalaryNumeric || maxSalaryNumeric || 0);
  const normalizedMaxSalary = hasBothSalaries
    ? Math.max(minSalaryNumeric, maxSalaryNumeric)
    : (maxSalaryNumeric || minSalaryNumeric || 0);

  const currencySymbol = getCurrencySymbol(contractCurrency);
  const salaryRangeDisplay =
    normalizedMinSalary > 0 && normalizedMaxSalary > 0
      ? `${currencySymbol}${formatNumber(normalizedMinSalary)} - ${currencySymbol}${formatNumber(normalizedMaxSalary)}`
      : normalizedMinSalary > 0
        ? `${currencySymbol}${formatNumber(normalizedMinSalary)}`
        : normalizedMaxSalary > 0
          ? `${currencySymbol}${formatNumber(normalizedMaxSalary)}`
          : '';

  // Use charges per resource instead of salary
  const numericChargesPerResource = toNumericValue(rowData.chargesPerResource || '');
  const numericResources = Number(rowData.resources ?? job?.number_of_vacancies ?? 1);
  const discountPerResourceNumeric = toNumericValue(rowData.discountPerResource || '');
  const amountAfterDiscountPerResourceNumeric =
    numericChargesPerResource > 0
      ? Math.max(numericChargesPerResource - discountPerResourceNumeric, 0)
      : 0;

  // Line-level totals based on per-resource values
  const subtotalNumeric = numericChargesPerResource * numericResources; // Charges per resource × no of resources
  const discountNumeric = discountPerResourceNumeric * numericResources; // Discount per resource × no of resources
  const totalNumeric = amountAfterDiscountPerResourceNumeric * numericResources; // Amount after discount × no of resources

  // Keep salary type mapping for API compatibility (use average as default)
  const mapSalaryType = (salaryType) => {
    const type = (salaryType || '').toLowerCase();
    if (type.includes('minimum')) return 'minimum_salary';
    if (type.includes('average')) return 'average_salary';
    if (type.includes('maximum')) return 'maximum_salary';
    return 'average_salary';
  };

  return {
    id: jobId,
    job_title: getJobLabel(job),
    contract_salary_type: 'average_salary', // Default for API compatibility
    currency: contractCurrency || 'Pakistani Rupee (PKR)',
    // Combined salary range as a single key/value for API
    'min - max': salaryRangeDisplay,
    charges_per_resource: numericChargesPerResource,
    discount_per_resource: discountPerResourceNumeric,
    amount_after_discount_per_resource: amountAfterDiscountPerResourceNumeric,
    number_of_vacancies: numericResources,
    contract_subtotal_amount: subtotalNumeric,
    discount_amount: discountNumeric,
    contract_price: totalNumeric,
  };
};

const validateContractFields = (showContractFields, pricingType, mobilizationAmount, summaryTotals, selectedJobIds, availableJobs, setters) => {
  let hasValidationErrors = false;

  // Pricing type is mandatory when contract fields are shown
  if (!pricingType) {
    setters.setPricingTypeError('Pricing type is required');
    hasValidationErrors = true;
  }

  // Mobilization amount validation: cannot be null and cannot be greater than total contract
  const numericMobilization = toNumericValue(mobilizationAmount);
  if (!mobilizationAmount || mobilizationAmount.trim() === '') {
    setters.setMobilizationError('Mobilization amount is required');
    hasValidationErrors = true;
  } else if (numericMobilization > summaryTotals.total) {
    setters.setMobilizationError(`Mobilization amount cannot be greater than total contract amount (Rs. ${formatNumber(summaryTotals.total)})`);
    hasValidationErrors = true;
  }

  // Check both selectedJobIds AND availableJobs
  // Only show error if we have jobs available but none selected
  if (availableJobs && availableJobs.length > 0) {
    if (!selectedJobIds || selectedJobIds.length === 0) {
      setters.setJobsError('Please select at least one job');
      hasValidationErrors = true;
    }
  }

  return hasValidationErrors;
};

const validateJobs = (selectedJobIds, availableJobs, jobRowData, message) => {
  // Validate that jobs array is not empty
  if (!selectedJobIds || selectedJobIds.length === 0) {
    message.error('Please select at least one job');
    return false;
  }

  // Validate that selected jobs have charges per resource information
  const jobsWithoutCharges = selectedJobIds.filter(jobId => {
    const job = availableJobs.find(j => normalizeJobId(j) === jobId);
    if (!job) return true; // Job not found

    const rowData = jobRowData[jobId] || {};
    const chargesPerResource = toNumericValue(rowData.chargesPerResource || '');
    const hasCharges = chargesPerResource > 0;

    return !hasCharges;
  });

  if (jobsWithoutCharges.length > 0) {
    message.error(`Cannot convert to Potential Client. ${jobsWithoutCharges.length} selected job${jobsWithoutCharges.length > 1 ? 's' : ''} ${jobsWithoutCharges.length > 1 ? 'do' : 'does'} not have charges per resource information. Please add charges per resource before conversion.`);
    return false;
  }

  return true;
};

  // Initialize job row data when jobs are loaded and select all jobs by default
  useEffect(() => {
    if (!jobManagement.state.availableJobs || jobManagement.state.availableJobs.length === 0) return;

    // If we don't have any row data yet, initialize charges/discount per resource from available jobs
    if (!jobManagement.state.jobRowData || Object.keys(jobManagement.state.jobRowData).length === 0) {
      const initialJobData = {};

      jobManagement.state.availableJobs.forEach((job) => {
        const jobId = normalizeJobId(job);
        if (!jobId) return;

        const minSalary = job?.min_salary ?? null;
        const maxSalary = job?.max_salary ?? null;

        const chargesPerResource = job?.charges_per_resource
          ? job.charges_per_resource
          : (job?.contract_subtotal_amount && job?.number_of_vacancies)
            ? job.contract_subtotal_amount / job.number_of_vacancies
            : 0;

        const discountPerResource = job?.discount_per_resource
          ? job.discount_per_resource
          : (job?.discount_amount && job?.number_of_vacancies)
            ? job.discount_amount / job.number_of_vacancies
            : 0;

        initialJobData[jobId] = {
          chargesPerResource: chargesPerResource ? formatNumber(chargesPerResource) : '',
          discountPerResource: discountPerResource ? formatNumber(discountPerResource) : '',
          resources: job?.number_of_vacancies ?? 1,
          minSalary,
          maxSalary,
        };
      });

      jobManagement.setters.setJobRowData(initialJobData);
    }

    if (jobManagement.refs.hasUserSelectedJobsRef.current) return; // User has manually selected, don't auto-select
    if (jobManagement.state.selectedJobIds.length > 0) return; // Already have selections

    // Auto-select all jobs that have charges per resource information
    const jobsWithCharges = jobManagement.state.availableJobs.filter(job => {
      const jobId = normalizeJobId(job);
      if (!jobId) return false;

      const rowData = jobManagement.state.jobRowData[jobId] || {};
      const chargesPerResource = toNumericValue(rowData.chargesPerResource || '');
      const hasCharges = chargesPerResource > 0;

      return hasCharges;
    });

    const jobIdsWithCharges = jobsWithCharges.map(j => normalizeJobId(j)).filter(Boolean);

    if (jobIdsWithCharges.length > 0) {
      jobManagement.setters.setSelectedJobIds(jobIdsWithCharges);
    }
  }, [jobManagement.state.availableJobs, jobManagement.state.selectedJobIds.length, jobManagement.state.jobRowData, jobManagement.refs.hasUserSelectedJobsRef, jobManagement.setters]);
  // Calculate summary totals from selected jobs
  const summaryTotals = useMemo(() => {
    if (!jobManagement.state.availableJobs || jobManagement.state.selectedJobIds.length === 0) {
      return {
        jobCount: 0,
        vacancies: 0,
        subtotal: 0,
        discount: 0,
        total: 0,
      };
    }

    const totals = jobManagement.state.selectedJobIds.reduce((acc, jobId) => {
      const job = jobManagement.state.availableJobs.find((j) => normalizeJobId(j) === jobId);
      if (!job) return acc;

      const rowData = jobManagement.state.jobRowData[jobId] || {};

      // Use charges & discount per resource
      const numericChargesPerResource = toNumericValue(rowData.chargesPerResource || '');
      const discountPerResourceNumeric = toNumericValue(rowData.discountPerResource || '');
      const numericResources = Number(rowData.resources ?? job?.number_of_vacancies ?? 1);

      const amountAfterDiscountPerResourceNumeric =
        numericChargesPerResource > 0
          ? Math.max(numericChargesPerResource - discountPerResourceNumeric, 0)
          : 0;

      const subtotal = numericChargesPerResource * numericResources; // Charges per resource × no of resources
      const discount = discountPerResourceNumeric * numericResources; // Discount per resource × no of resources
      const total = amountAfterDiscountPerResourceNumeric * numericResources; // Amount after discount × no of resources

      return {
        jobCount: acc.jobCount + 1,
        vacancies: acc.vacancies + numericResources,
        subtotal: acc.subtotal + subtotal,
        discount: acc.discount + discount,
        total: acc.total + total,
      };
    }, { jobCount: 0, vacancies: 0, subtotal: 0, discount: 0, total: 0 });

    return totals;
  }, [jobManagement.state.selectedJobIds, jobManagement.state.availableJobs, jobManagement.state.jobRowData]);

  useEffect(() => {
    leadState.setters.setJobCount(summaryTotals.jobCount);
    leadState.setters.setVacancies(summaryTotals.vacancies);

    // Always auto-update proposal amounts from job totals (read-only, auto-calculated)
    if (summaryTotals.subtotal > 0) {
      // Sub-total after job-level discounts (this is what the contract discount applies to)
      const contractSubtotal = summaryTotals.total;

      // Calculate contract-level discount based on current settings
      let contractDiscountAmount = 0;
      let contractDiscountPercent = 0;

      // Priority: if discount percentage is set (even 0), use it to calculate amount
      if (leadState.state.discountPercentage !== undefined && leadState.state.discountPercentage !== null && leadState.state.discountPercentage !== '') {
        contractDiscountPercent = parseFloat(leadState.state.discountPercentage) || 0;
        contractDiscountAmount = (contractSubtotal * contractDiscountPercent) / 100;
      }
      // If no percentage but amount is set, use amount to calculate percentage
      else if (leadState.state.discountAmount && leadState.state.discountAmount.trim() !== '') {
        contractDiscountAmount = parseFloat(leadState.state.discountAmount.replace(/[^\d.]/g, '')) || 0;
        contractDiscountPercent = contractSubtotal > 0 ? (contractDiscountAmount / contractSubtotal) * 100 : 0;
      }
      // If neither is set, keep them at 0

      // Final total = contract subtotal - contract discount
      const finalTotal = Math.max(contractSubtotal - contractDiscountAmount, 0);

      leadState.setters.setSubTotalAmount(formatNumber(contractSubtotal));
      leadState.setters.setDiscountAmount(contractDiscountAmount > 0 ? formatNumber(contractDiscountAmount) : '');
      leadState.setters.setDiscountPercentage(contractDiscountPercent > 0 ? contractDiscountPercent.toFixed(2) : '');
      leadState.setters.setTotalContractAmount(formatNumber(finalTotal));
    } else if (jobManagement.state.selectedJobIds.length === 0) {
      // Clear amounts if no jobs selected (but keep if proposal data exists)
      if (!proposalData) {
        leadState.setters.setSubTotalAmount('');
        leadState.setters.setDiscountAmount('');
        leadState.setters.setTotalContractAmount('');
        leadState.setters.setDiscountPercentage('');
      }
    }
  }, [summaryTotals, jobManagement.state.selectedJobIds.length, proposalData, leadState.state.discountPercentage, leadState.state.discountAmount]);



  const pricingTypeOptions = [
    { value: 'Fixed Price', label: 'Fixed Price' },
    { value: 'Salary Based Price', label: 'Salary Based Price' }
  ];

  useEffect(() => {
    leadState.setters.setRemarks(lead?.remarks || '');
  }, []);
  
  useEffect(() => {
    jobManagement.refs.hasUserSelectedJobsRef.current = jobManagement.state.hasUserSelectedJobs;
  }, [jobManagement.state.hasUserSelectedJobs]);

  useEffect(() => {
    selectedJobIdsRef.current = jobManagement.state.selectedJobIds;
  }, [jobManagement.state.selectedJobIds]);

  useEffect(() => {
    if (!visible) {
      prevLeadIdRef.current = null;
      jobManagement.setters.setHasUserSelectedJobs(false);
      jobManagement.setters.setJobsError('');
      setJobValidationErrors(null);
    } else {
      // Clear stale job error when modal opens
      jobManagement.setters.setJobsError('');
    }
  }, [visible]);

  useEffect(() => {
    const currentLeadId = lead?.id ?? null;
    const leadChanged = currentLeadId && prevLeadIdRef.current && prevLeadIdRef.current !== currentLeadId;

    leadState.initializeFromLead(lead);
    setIsTotalContractManuallyEdited(false);

    validationState.clearAllErrors();

    if (leadChanged || (!jobManagement.refs.hasUserSelectedJobsRef.current && selectedJobIdsRef.current.length === 0)) {
      jobManagement.setters.setSelectedJobIds(jobManagement.utils.normalizeSelectedJobIds(lead?.selected_jobs));
      if (leadChanged) {
        jobManagement.setters.setHasUserSelectedJobs(false);
      }
    }

    // Only set availableJobs from lead if we don't have proposal data with jobs
    // This prevents clearing jobs that were loaded from proposal data
    if (leadChanged) {
      // Don't override if proposal data exists with jobs
      const hasProposalJobs = proposalData?.jobs && Array.isArray(proposalData.jobs) && proposalData.jobs.length > 0;
      const hasProposalToLoad = !!(lead?.proposal_id || lead?.id);

      if (hasProposalJobs) {
        // Keep proposal jobs, don't override - proposal fetching effect already set them
        // If jobs don't match, let proposal effect handle it (it will run after this)
      } else if (!hasProposalToLoad && ((lead?.jobs && Array.isArray(lead.jobs)) || (lead?.available_jobs && Array.isArray(lead.available_jobs)))) {
        jobManagement.setters.setAvailableJobs(lead?.jobs || lead?.available_jobs || []);
      } else if (!hasProposalToLoad) {
        // Only clear if we don't have a proposal to load
        jobManagement.setters.setAvailableJobs([]);
      }
      // If hasProposalToLoad but no proposalJobs yet, let the proposal fetching effect handle setting availableJobs
    } else if (!visible) {
      // Only clear when modal closes
      if (!proposalData?.jobs || !Array.isArray(proposalData.jobs) || proposalData.jobs.length === 0) {
        jobManagement.setters.setAvailableJobs([]);
      }
    }

    if (visible && currentLeadId) {
      prevLeadIdRef.current = currentLeadId;
    }
  }, [lead, visible, proposalData]);


  // Clear proposal error when isProposalAttached changes
  useEffect(() => {
    // Clear proposal error both when file is attached AND when modal opens fresh
    if (isProposalAttached || !visible) {
      validationState.setters.setProposalError('');
    }
  }, [isProposalAttached, visible]);

  // Fetch proposal/conversion data when modal opens
  useEffect(() => {
    let isMounted = true;

    const fetchProposalData = async () => {
      const leadId = lead?.id || null;
      const proposalId = lead?.proposal_id || null;

      if (!visible || !showContractFields || !leadId) {
        if (isMounted) {
          setProposalData(null);
          setLoadingProposal(false);
        }
        return;
      }

      const hasExistingJobs = (lead?.jobs && Array.isArray(lead.jobs) && lead.jobs.length > 0) ||
                             (lead?.available_jobs && Array.isArray(lead.available_jobs) && lead.available_jobs.length > 0);
      const isUpdateMode = !!(proposalId || lead?.conversionData);

      if (hasExistingJobs && isUpdateMode) {
        if (isMounted) {
          setProposalData(null);
          setLoadingProposal(false);
        }
        return;
      }

      // If conversionData is expected but not yet available, keep the loader on and wait
      // for the next render when conversionData arrives (dependency includes lead?.conversionData).
      // Use key presence (not truthiness) so an already-resolved "no draft exists" (conversionData: null)
      // doesn't get mistaken for "still fetching" and loop the loader forever.
      const conversionDataResolved = lead ? Object.prototype.hasOwnProperty.call(lead, 'conversionData') : false;
      if (!conversionDataResolved && !proposalId) {
        if (isMounted) {
          setLoadingProposal(true);
        }
        return;
      }

      if (isMounted) setLoadingProposal(true);

      try {
        let data = null;

        if (lead?.conversionData) {
          data = lead.conversionData;
        }

        if (!isMounted) return;
        setProposalData(data);

        if (data) {
          if (data.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
            const validJobs = data.jobs.filter(job => job.id && job.job_title);
            const proposalJobIds = validJobs.map(job => normalizeJobId(job)).filter(Boolean);

            if (isMounted) {
              jobManagement.setters.setAvailableJobs(validJobs);
              jobManagement.setters.setSelectedJobIds(proposalJobIds);
            }

            const proposalJobData = {};
            validJobs.forEach((job) => {
              const jobId = normalizeJobId(job);
              if (!jobId) return;

              const chargesPerResource = job?.charges_per_resource
                ? job.charges_per_resource
                : (job?.contract_subtotal_amount && job?.number_of_vacancies)
                  ? job.contract_subtotal_amount / job.number_of_vacancies
                  : 0;

              const discountPerResource = job?.discount_per_resource
                ? job.discount_per_resource
                : (job?.discount_amount && job?.number_of_vacancies)
                  ? job.discount_amount / job.number_of_vacancies
                  : 0;

              proposalJobData[jobId] = {
                chargesPerResource: chargesPerResource ? formatNumber(chargesPerResource) : '',
                discountPerResource: discountPerResource ? formatNumber(discountPerResource) : '',
                resources: job?.number_of_vacancies ?? 1,
                minSalary: job?.min_salary ?? null,
                maxSalary: job?.max_salary ?? null,
              };
            });

            if (isMounted) {
              jobManagement.setters.setJobRowData(proposalJobData);
              leadState.setters.setJobCount(proposalJobIds.length);
              leadState.setters.setVacancies(validJobs.reduce((sum, job) => sum + (job?.number_of_vacancies ?? 0), 0));
            }
          }

          if (isMounted) {
            leadState.setters.setContractCurrency(resolveContractCurrency({ contract_currency: data.contract_currency, jobs: data.jobs }));
            leadState.setters.setSubTotalAmount(data.contract_subtotal_amount ? formatNumber(data.contract_subtotal_amount) : '');
            leadState.setters.setDiscountAmount(data.discount_amount ? formatNumber(data.discount_amount) : '');
            leadState.setters.setDiscountPercentage(data.discount_percentage || '');
            leadState.setters.setTotalContractAmount(data.contract_price ? formatNumber(data.contract_price) : '');
            leadState.setters.setMobilizationAmount(data.mobilization_charges ? formatNumber(data.mobilization_charges) : '');
            leadState.setters.setRemarks(data.remarks || '');
            leadState.setters.setPricingType(data.pricing_type || '');
            leadState.setters.setProposalDate(data.proposal_date || data.created_at || data.date || '');
            leadState.setters.setProposalCity(data.proposal_city || data.city || '');
            leadState.setters.setReplacementGuaranteeDuration(data.replacement_guarantee_duration || '');
            leadState.setters.setTurnaroundTime(data.turnaround_time || data.turnaround_text || '');
          }
        }
      } catch (error) {
        console.error('Error fetching proposal data:', error);
        if (error?.response?.status !== 404) {
          message.error('Failed to load proposal data');
        }
        if (isMounted) setProposalData(null);
      } finally {
        if (isMounted) setLoadingProposal(false);
      }
    };

    fetchProposalData();

    return () => {
      isMounted = false;
    };
  }, [visible, showContractFields, lead?.proposal_id, lead?.id, lead?.conversionData]);

  const handleSave = async () => {
    setSavingData(true);

    const trimmedRemarks = (leadState.state.remarks || '').trim();

    // Reset all errors at the beginning
    validationState.clearAllErrors();

    let hasValidationErrors = false;

    // Only validate proposal if it's required AND not attached AND not updating existing proposal
    // Skip proposal validation when updating existing proposal (proposalData exists)
    const isUpdatingExistingProposal = !!(proposalData?.id || lead?.proposal_id);

    // Validate remarks when required OR when converting to potential client
    // Make remarks optional when updating existing proposal
    if ((remarksRequired || showContractFields) && !isUpdatingExistingProposal) {
      if (!trimmedRemarks) {
        validationState.setters.setRemarksError('Remarks cannot be empty');
        hasValidationErrors = true;
      }
    }

    if (proposalRequired && !isProposalAttached && !isUpdatingExistingProposal) {
      validationState.setters.setProposalError('Proposal PDF is required');
      hasValidationErrors = true;
    }

    // Validate contract fields if showContractFields is true
    if (showContractFields) {
      const contractValidationErrors = validateContractFields(
        showContractFields,
        leadState.state.pricingType,
        leadState.state.mobilizationAmount,
        summaryTotals,
        jobManagement.state.selectedJobIds,
        jobManagement.state.availableJobs,
        validationState.setters
      );
      hasValidationErrors = hasValidationErrors || contractValidationErrors;
    }
  
    // If we have validation errors so far, return early
    if (hasValidationErrors) {
    
      setSavingData(false);
      return;
    }
    
    // ⭐ KEY FIX: Only validate and send contract payload if showContractFields is true
    if (showContractFields) {
      // Determine the operation type to ensure correct API calls and avoid conflicts
      // hasExistingProposal is true only for actual proposal updates (not conversion data)
      const hasExistingProposal = !!lead?.proposal_id;
      const isConvertingToPotential = showContractFields && saveButtonText === 'Convert' && !hasExistingProposal;

     

      // Priority 1: If updating existing proposal, use update flow (no job fetching, no conversion API)
      // Priority 2: If converting to potential, use conversion flow (fetch jobs, use conversion API)
      // This ensures no API conflicts between update and conversion operations
      
      const payload = {
        contractCurrency: leadState.state.contractCurrency,
        subTotalAmount: leadState.state.subTotalAmount || '0', // Default to '0' if empty
        discountAmount: leadState.state.discountAmount,
        discountPercentage: leadState.state.discountPercentage,
        totalContractAmount: leadState.state.totalContractAmount || '0', // Default to '0' if empty
        vacancies: leadState.state.vacancies,
        jobCount: leadState.state.jobCount,
        pricingType: leadState.state.pricingType,
      };
  
      try {
        // Skip validation for conversion scenarios - conversion API handles its own validation
        if (!isConvertingToPotential) {
         
          await ShowRemarkSchema.validate(payload, { abortEarly: false });
       
        }
        
      
  
        // Keep job IDs as strings for consistent matching
        const stringJobIds = jobManagement.state.selectedJobIds
          .map((id) => String(id).trim())
          .filter((id) => id && id !== '');

        // Use the discount shown in contract-summary-form (sum of job-level discounts)
        const conversionJobLevelDiscountTotal = summaryTotals.discount;
        const conversionJobsSubtotal = summaryTotals.subtotal;
        const conversionCalculatedDiscountPercentage = conversionJobsSubtotal > 0 ? Number(((conversionJobLevelDiscountTotal / conversionJobsSubtotal) * 100).toFixed(2)) : 0;
  
        // Prepare the conversion payload matching the API format
        const conversionPayload = {
          contract_currency: leadState.state.contractCurrency || 'Pakistani Rupee (PKR)',
          contract_subtotal_amount: String(conversionJobsSubtotal || 0),
          pricing_type: leadState.state.pricingType,
          discount_amount: conversionJobLevelDiscountTotal,
          discount_percentage: conversionCalculatedDiscountPercentage,
          contract_price: String(summaryTotals.total || 0),
          mobilization_charges: String(
            parseNumber(leadState.state.mobilizationAmount)
            || parseNumber(mobilizationAmountDisplay)
            || (summaryTotals.total ? String(Math.round(summaryTotals.total * 0.5)) : '0')
          ), // Use user-edited value if available, otherwise auto-calculated (50% of total contract)
          remarks: trimmedRemarks || '',
          proposal_date: formatProposalDateForApi(leadState.state.proposalDate),
          proposal_city: leadState.state.proposalCity || '',
          replacement_guarantee_duration: leadState.state.replacementGuaranteeDuration ?? '',
          turnaround_time: leadState.state.turnaroundTime ?? '',
          jobs: stringJobIds
            .map((jobId) => {
              const job = jobManagement.state.availableJobs.find((j) => {
                const jId = normalizeJobId(j);
                return jId === jobId;
              });
              if (!job) {
                return null;
              }

              return createJobPayload(
                jobId,
                job,
                jobManagement.state.jobRowData,
                leadState.state.contractCurrency,
                summaryTotals
              );
            })
            .filter(Boolean),
        };
  
        // Use conversion-to-potential API for conversion scenarios (only if no existing proposal)
       
        
        if (isConvertingToPotential && !hasExistingProposal && lead?.id) {
        
          
          // Check if there are no jobs available for this lead
          if (!jobManagement.state.availableJobs || jobManagement.state.availableJobs.length === 0) {
            message.error('Cannot convert to Potential Client. No jobs available for this lead. Please add jobs before conversion.');
            validationState.setters.setJobsError('No jobs available for this lead');
            setSavingData(false);
            return;
          }
  
          // Validate jobs using the extracted utility function
          if (!validateJobs(stringJobIds, jobManagement.state.availableJobs, jobManagement.state.jobRowData, message)) {
            validationState.setters.setJobsError('Jobs validation failed');
            setSavingData(false);
            return;
          }
          
          setConvertingLead(true);
          try {
         
            const currentLeadType = lead?.leadType || leadType;
            const endpointType = currentLeadType === 'meta-leads' ? 'meta-leads' : currentLeadType === 'data-leads' ? 'data-leads' : 'lead-generation';
           const response = await createOrUpdateConversionToPotential(lead.id, conversionPayload, currentLeadType);
          

            // The conversion API handles everything, so we just need to update the status
            // Pass a special flag to indicate conversion was already handled
            const conversionHandledPayload = {
              _conversionHandled: true, // Flag to indicate conversion API was already called
              status: 'Potential Client',
            };

            // Call onSave to update status (conversion data already handled by API)
            await onSave(trimmedRemarks || undefined, conversionHandledPayload);

            // Close modal after successful conversion
            onClose();
            return;
          } catch (error) {
            const jobErrors = parseConversionJobValidationError(error);
            if (jobErrors) {
              setJobValidationErrors(jobErrors);
              return;
            }
            const errorData = error?.response?.data ?? error;
            const errorMessage = errorData?.message ||
                                errorData?.error ||
                                error?.message ||
                                'Failed to convert lead to Potential Client';
            message.error(errorMessage);
            return;
          } finally {
            setConvertingLead(false);
            setSavingData(false);
          }
        }
        
        // If we have proposalData, update via onSave callback (don't call update API separately)
        if (hasExistingProposal) {
       
          // Use the discount shown in contract-summary-form (sum of job-level discounts)
          const proposalJobLevelDiscountTotal = summaryTotals.discount;
          const proposalJobsSubtotal = summaryTotals.subtotal;
          const proposalCalculatedDiscountPercentage = proposalJobsSubtotal > 0 ? Number(((proposalJobLevelDiscountTotal / proposalJobsSubtotal) * 100).toFixed(2)) : 0;


          const proposalPayload = {
            contract_currency: leadState.state.contractCurrency || 'Pakistani Rupee (PKR)',
            contract_subtotal_amount: String(proposalJobsSubtotal || 0),
            pricing_type: leadState.state.pricingType,
            discount_amount: proposalJobLevelDiscountTotal,
            discount_percentage: proposalCalculatedDiscountPercentage,
            contract_price: String(summaryTotals.total || 0),
            mobilization_charges: String(
              parseNumber(leadState.state.mobilizationAmount)
              || parseNumber(mobilizationAmountDisplay)
              || (summaryTotals.total ? String(Math.round(summaryTotals.total * 0.5)) : '0')
            ),
            remarks: trimmedRemarks || '',
            proposal_date: formatProposalDateForApi(leadState.state.proposalDate),
            proposal_city: leadState.state.proposalCity || '',
            replacement_guarantee_duration: leadState.state.replacementGuaranteeDuration ?? '',
            turnaround_time: leadState.state.turnaroundTime ?? '',
            jobs: jobManagement.state.selectedJobIds.map((jobId) => {
              const job = jobManagement.state.availableJobs.find((j) => normalizeJobId(j) === jobId);
              if (!job) return null;

              return createJobPayload(jobId, job, jobManagement.state.jobRowData, leadState.state.contractCurrency, summaryTotals);
            }).filter(Boolean),
            // Mark as proposal update
            _isProposalUpdate: true,
            proposal_id: proposalData?.id || lead?.proposal_id
          };



          onSave(trimmedRemarks || undefined, proposalPayload);
          setSavingData(false);
          return;
        }
  
      // Use the discount shown in contract-summary-form (sum of job-level discounts)
      const finalJobLevelDiscountTotal = summaryTotals.discount;
      const finalJobsSubtotal = summaryTotals.subtotal;
      const finalCalculatedDiscountPercentage = finalJobsSubtotal > 0 ? Number(((finalJobLevelDiscountTotal / finalJobsSubtotal) * 100).toFixed(2)) : 0;
  
        // Otherwise, use the existing flow for new proposals (fallback to onSave)
        const finalPayload = {
          contract_currency: leadState.state.contractCurrency,
          contract_subtotal_amount: finalJobsSubtotal || 0,
          discount_amount: finalJobLevelDiscountTotal,
          discount_percentage: finalCalculatedDiscountPercentage,
          contract_price: summaryTotals.total || 0,
          total_contract_amount: summaryTotals.total || 0,
          total_vacancies: leadState.state.vacancies,
          job_count: leadState.state.jobCount,
          pricing_type: leadState.state.pricingType,
          selected_job_ids: stringJobIds,
          selected_jobs: stringJobIds,
          proposal_date: formatProposalDateForApi(leadState.state.proposalDate),
          proposal_city: leadState.state.proposalCity || '',
          replacement_guarantee_duration: leadState.state.replacementGuaranteeDuration ?? '',
          turnaround_time: leadState.state.turnaroundTime ?? '',
        };
  
        onSave(trimmedRemarks || undefined, finalPayload);
      } catch (err) {
      
        if (err.inner && Array.isArray(err.inner)) {
          err.inner.forEach(({ path, message }) => {
            if (path === 'vacancies') validationState.setters.setVacanciesError(message);
            if (path === 'subTotalAmount') validationState.setters.setSubTotalError(message);
            if (path === 'discountAmount') validationState.setters.setDiscountAmountError(message);
            if (path === 'discountPercentage') validationState.setters.setDiscountPercentageError(message);
            if (path === 'totalContractAmount') validationState.setters.setTotalContractError(message);
            if (path === 'jobCount') validationState.setters.setJobCountError(message);
          });
        }
    } finally {
      setSavingData(false);
      }
    } else {
      try {
      onSave(trimmedRemarks || undefined, undefined);
      } finally {
        setSavingData(false);
      }
    }
  };
  

  const updateTotals = ({
    nextDiscountAmount = leadState.state.discountAmount,
    nextDiscountPercent = leadState.state.discountPercentage,
    changed,
  }) => {
    // Use the current sub-total (calculated from jobs total)
    const subValue = toNumericValue(leadState.state.subTotalAmount);
    let discountValue = toNumericValue(nextDiscountAmount);
    let discountPercentValue = parseFloat(nextDiscountPercent) || 0;
  
    if (changed === 'amount') {
      // Ensure discount doesn't exceed subtotal
      discountValue = Math.min(discountValue, subValue);
      discountPercentValue = subValue > 0 ? (discountValue / subValue) * 100 : 0;
    } else if (changed === 'percent') {
      discountPercentValue = Math.min(discountPercentValue, 100);
      discountValue = subValue > 0 ? (discountPercentValue / 100) * subValue : 0;
    }
  
    const totalValue = Math.max(subValue - discountValue, 0);
  
    leadState.setters.setDiscountAmount(discountValue > 0 ? formatNumber(discountValue) : '');
    leadState.setters.setDiscountPercentage(
      discountPercentValue > 0 ? Number(discountPercentValue.toFixed(2)).toString() : ''
    );
    leadState.setters.setTotalContractAmount(totalValue > 0 ? formatNumber(totalValue) : '0');
  };

  const handleSubTotalChange = (e) => {
    // Sub-total is now calculated from jobs, so manual changes are not allowed
    // This function is kept for compatibility but doesn't change the sub-total
    const { value } = e.target;
    if (!value) {
      leadState.setters.setDiscountAmount('');
      leadState.setters.setDiscountPercentage('');
      leadState.setters.setTotalContractAmount(leadState.state.subTotalAmount); // Reset total to sub-total
      return;
    }
    // Recalculate discount based on new sub-total
    updateTotals({ changed: 'amount' });
  };

  const handleDiscountAmountChange = (e) => {
    const { value } = e.target;
    if (!value) {
      updateTotals({ nextDiscountAmount: '', nextDiscountPercent: '', changed: 'amount' });
      return;
    }
    const formatted = formatCurrencyInput(value);
    updateTotals({ nextDiscountAmount: formatted, changed: 'amount' });
  };

  const handleDiscountPercentChange = (e) => {
    let { value } = e.target;
    if (!value) {
      updateTotals({ nextDiscountPercent: '', changed: 'percent' });
      return;
    }
    value = value.replace(/[^\d.]/g, '');
    const [whole, decimal] = value.split('.');
    if (decimal) {
      value = `${whole}.${decimal.slice(0, 2)}`;
    }
    updateTotals({ nextDiscountPercent: value, changed: 'percent' });
  };

  // Derived mobilization amount (always auto-calculated as 50% of total contract)
  const mobilizationAmountDisplay = useMemo(() => {
    // Calculate as 50% of total contract (default value, but user can edit)
    const total = toNumericValue(leadState.state.totalContractAmount);
    if (!total) return '';
    const mobilization = total / 2;
    return formatNumber(mobilization);
  }, [leadState.state.totalContractAmount]);
  
  // Auto-update mobilization amount when total contract changes (only if not manually edited)
  useEffect(() => {
    leadState.setters.setJobCount(summaryTotals.jobCount);
    leadState.setters.setVacancies(summaryTotals.vacancies);

    // Always auto-update contract amounts from job totals
    if (summaryTotals.subtotal > 0) {
      // The subtotal after job-level discounts (jobs total)
      const jobsTotal = summaryTotals.total;

      // Set sub-total amount to the jobs total (this is what contract discount applies to)
      leadState.setters.setSubTotalAmount(formatNumber(jobsTotal));
  
      // Calculate contract-level discount based on current settings
      let contractDiscountAmount = 0;
      let contractDiscountPercent = 0;

      // Calculate job-level discount total (sum of all selected job discounts)
      const jobLevelDiscountTotal = summaryTotals.discount;
  
      // Priority: if discount percentage is set, use it to calculate amount
      const currentDiscountPercent = parseFloat(leadState.state.discountPercentage) || 0;
      const currentDiscountAmount = toNumericValue(leadState.state.discountAmount);

      if (leadState.state.discountPercentage !== undefined && leadState.state.discountPercentage !== null && leadState.state.discountPercentage !== '') {
        contractDiscountPercent = currentDiscountPercent;
        contractDiscountAmount = (jobsTotal * contractDiscountPercent) / 100;
      }
      // If no percentage but amount is set, use amount to calculate percentage
      else if (currentDiscountAmount > 0) {
        contractDiscountAmount = currentDiscountAmount;
        contractDiscountPercent = jobsTotal > 0 ? (contractDiscountAmount / jobsTotal) * 100 : 0;
      }
      // If no manual discount is set, use the job-level discount total as contract discount
      else if (jobLevelDiscountTotal > 0) {
        contractDiscountAmount = jobLevelDiscountTotal;
        contractDiscountPercent = jobsTotal > 0 ? (jobLevelDiscountTotal / jobsTotal) * 100 : 0;
       
      }
  
      // Ensure discount doesn't exceed subtotal
      if (contractDiscountAmount > jobsTotal) {
        contractDiscountAmount = jobsTotal;
        contractDiscountPercent = 100;
      }
  
      // Final total = subtotal - contract discount
      const finalTotal = Math.max(jobsTotal - contractDiscountAmount, 0);
  
      // Update all contract fields
      leadState.setters.setDiscountAmount(contractDiscountAmount > 0 ? formatNumber(contractDiscountAmount) : '');
      leadState.setters.setDiscountPercentage(contractDiscountPercent > 0 ? contractDiscountPercent.toFixed(2) : '');

      leadState.setters.setTotalContractAmount(formatNumber(finalTotal));
    } else if (jobManagement.state.selectedJobIds.length === 0) {
      // Clear amounts if no jobs selected
      if (!proposalData) {
        leadState.setters.setSubTotalAmount('');
        leadState.setters.setDiscountAmount('');
        leadState.setters.setTotalContractAmount('');
        leadState.setters.setDiscountPercentage('');
      }
    }
  }, [summaryTotals, jobManagement.state.selectedJobIds.length, proposalData, leadState.state.discountPercentage, leadState.state.discountAmount]);
  

  useEffect(() => {
    if (!showContractFields) return;

    leadState.setters.setJobCount(
      lead?.job_count !== undefined && lead?.job_count !== null ? lead.job_count : ''
    );
    leadState.setters.setVacancies(
      lead?.total_vacancies !== undefined && lead?.total_vacancies !== null
        ? lead.total_vacancies
        : ''
    );
    leadState.setters.setSubTotalAmount(
      lead?.contract_subtotal_amount
        ? formatNumber(lead.contract_subtotal_amount)
        : ''
    );
    leadState.setters.setDiscountAmount(
      lead?.discount_amount ? formatNumber(lead.discount_amount) : ''
    );
    leadState.setters.setDiscountPercentage(
      lead?.discount_percentage !== undefined && lead?.discount_percentage !== null
        ? lead.discount_percentage.toString()
        : ''
    );
    leadState.setters.setTotalContractAmount(
      lead?.total_contract_amount
        ? formatNumber(lead.total_contract_amount)
        : ''
    );
  }, [showContractFields, lead]);

  useEffect(() => {
    if (!visible || !showContractFields || !lead?.id) {
      jobManagement.setters.setJobsLoading(false);
      return;
    }

     const hasExistingProposal = !!lead?.proposal_id;
    const isConvertingToPotential = showContractFields && saveButtonText === 'Convert' && !hasExistingProposal;
    const hasConversionJobs = proposalData?.jobs && Array.isArray(proposalData.jobs) && proposalData.jobs.length > 0;

 

    // For conversion scenarios: ONLY use jobs from conversion API - don't fetch from other sources
    if (isConvertingToPotential) {
      // Jobs may arrive via proposalData OR directly into availableJobs state
      const hasAvailableJobs = jobManagement.state.availableJobs && jobManagement.state.availableJobs.length > 0;
      if (hasConversionJobs || hasAvailableJobs) {
        jobManagement.setters.setJobsLoading(false);
        return;
      } else {
        // Wait for conversionData to arrive — loadingProposal handles the loading state
        jobManagement.setters.setJobsLoading(false);
        return;
      }
    }

    // For existing proposals: use proposal jobs if available
    if (hasExistingProposal && hasConversionJobs) {
            jobManagement.setters.setJobsLoading(false);
      return;
    }

    // Don't fetch jobs if we already have jobs from lead.jobs or lead.available_jobs (e.g., from proposal data)
    if ((lead?.jobs && Array.isArray(lead.jobs) && lead.jobs.length > 0) ||
        (lead?.available_jobs && Array.isArray(lead.available_jobs) && lead.available_jobs.length > 0)) {
      jobManagement.setters.setJobsLoading(false);
      return;
    }

    let isMounted = true;

    // Jobs should only come from conversion/proposal data - never fetch jobs separately
  
          jobManagement.setters.setJobsLoading(false);

    return () => {
      isMounted = false;
    };
  }, [visible, showContractFields, lead?.id, lead?.selected_jobs, proposalData, jobManagement.state.availableJobs]);

  // Determine if we're converting to potential client (show checkboxes) or updating proposal (hide checkboxes)
  // hasExistingProposal is true only for actual proposal updates, not conversion data
  const hasExistingProposal = !!lead?.proposal_id;
  const isConvertingToPotential = showContractFields && saveButtonText === 'Convert' && !hasExistingProposal;

  // Handler for job row data changes from JobsSelectionTable
  const handleJobRowDataChange = (jobId, updatedRowData) => {
    jobManagement.setters.setJobRowData((prev) => ({
      ...prev,
      [jobId]: updatedRowData,
    }));
  };

  // Handler for job selection changes from JobsSelectionTable
  const handleJobSelectionChange = (values) => {
    jobManagement.setters.setSelectedJobIds(values);
    jobManagement.setters.setHasUserSelectedJobs(true);

    // Clear row data for unchecked jobs
    const uncheckedJobIds = jobManagement.state.availableJobs
      .map((j) => normalizeJobId(j))
      .filter((id) => id && !values.includes(id));

    jobManagement.setters.setJobRowData((prev) => {
      const updated = { ...prev };
      uncheckedJobIds.forEach((jobId) => {
        if (updated[jobId]) {
          updated[jobId] = {
            ...updated[jobId],
            discount: '',
          };
        }
      });
      return updated;
    });
  };


  return (
    <>
      <style>
        {`
          .custom-input.ant-input:focus,
          .custom-input.ant-input-focused {
            border-color: #40a9ff !important;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
          }
          .custom-input.ant-input:hover {
            border-color: #40a9ff !important;
          }
          .custom-textarea.ant-input:focus,
          .custom-textarea.ant-input-focused {
            border-color: #40a9ff !important;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
          }
          .custom-textarea.ant-input:hover {
            border-color: #40a9ff !important;
          }
          .custom-input.ant-input[disabled],
          .custom-input.ant-input-disabled,
          .custom-textarea.ant-input[disabled],
          .custom-textarea.ant-input-disabled {
            color: #1f2a37 !important;
            -webkit-text-fill-color: #1f2a37;
            background-color: #eef2f7 !important;
          }
        `}
      </style>
      <Modal
        width={showContractFields ? 1200 : 520}
        styles={{
          body: { padding: showContractFields ? '24px 32px' : '12px 16px' },
        }}
        centered
        title={
          modalTitle || (
            showContractFields
              ? 'Convert Lead into Potential Client'
              : `Remarks for ${lead?.contact_person_name || 'Lead'}`
          )
        }
        open={visible}
        onCancel={onClose}
        footer={
          viewOnlyMode
            ? [
                // Only show Close button when in view-only mode (Meta Leads table button click)
                <Button key="cancel" onClick={onClose} disabled={loading || convertingLead || savingData || loadingProposal || jobManagement.state.jobsLoading}>
                  Close
                </Button>,
              ]
            : [
                // Show Cancel and Save/Convert/Update buttons for status changes
                <Button key="cancel" onClick={onClose} disabled={loading || convertingLead || savingData || loadingProposal || jobManagement.state.jobsLoading}>
                  Cancel
                </Button>,
                <Button
                  key="save"
                  type="primary"
                  onClick={handleSave}
                  className="custom-button"
                  loading={loading || convertingLead || savingData || loadingProposal || jobManagement.state.jobsLoading}
                >
                  {saveButtonText}
                </Button>,
              ]
        }
      >
        {showContractFields ? (
          <div>
            {/* Contract Currency (left) and Proposal Date (top right) - same row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, gap: 16 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    fontWeight: 500,
                    color: '#111827',
                  }}
                >
                  Contract Currency<span style={{ color: 'red' }}>*</span>
                </label>
                <Select
                  value={leadState.state.contractCurrency || undefined}
                  onChange={(value) => {
                    leadState.setters.setContractCurrency(value);
                  }}
                  options={currencyOptions}
                  style={{ width: '280px', height: 40 }}
                  disabled={loading}
                  placeholder="Select contract currency"
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    fontWeight: 500,
                    color: '#111827',
                  }}
                >
                  Proposal Date
                </label>
                <DatePicker
                  value={leadState.state.proposalDate && dayjs(leadState.state.proposalDate).isValid() ? dayjs(leadState.state.proposalDate) : null}
                  onChange={(date) => leadState.setters.setProposalDate(date ? dayjs(date).toISOString() : '')}
                  style={{ width: '200px', height: 40 }}
                  disabled={loading || convertingLead}
                  allowClear
                />
              </div>
            </div>

            {/* Jobs table */}
            <JobsSelectionTable
              availableJobs={jobManagement.state.availableJobs}
              selectedJobIds={jobManagement.state.selectedJobIds}
              jobRowData={jobManagement.state.jobRowData}
              contractCurrency={leadState.state.contractCurrency}
              loading={loading || convertingLead}
              jobsLoading={jobManagement.state.jobsLoading}
              jobsError={jobManagement.state.jobsError}
              loadingProposal={loadingProposal}
              onJobSelectionChange={handleJobSelectionChange}
              onJobRowDataChange={handleJobRowDataChange}
              showCheckboxes={isConvertingToPotential}
            />
            {/* Contract Summary Form */}
            <ContractSummaryForm
              showContractFields={showContractFields}
              jobCount={leadState.state.jobCount}
              vacancies={leadState.state.vacancies}
              pricingType={leadState.state.pricingType}
              remarks={leadState.state.remarks}
              contractCurrency={leadState.state.contractCurrency}
              pricingTypeOptions={pricingTypeOptions}
              remarksLabel={remarksLabel}
              remarksRequired={remarksRequired}
              loading={loading || convertingLead}
              viewOnlyMode={viewOnlyMode}
              jobCountError={validationState.errors.jobCountError}
              vacanciesError={validationState.errors.vacanciesError}
              pricingTypeError={validationState.errors.pricingTypeError}
              remarksError={validationState.errors.remarksError}
              totalContractError={validationState.errors.totalContractError}
              mobilizationError={validationState.errors.mobilizationError}
              selectedJobIds={jobManagement.state.selectedJobIds}
              availableJobs={jobManagement.state.availableJobs}
              jobRowData={jobManagement.state.jobRowData}
              mobilizationAmount={leadState.state.mobilizationAmount}
              onPricingTypeChange={(value) => {
                leadState.setters.setPricingType(value);
                validationState.setters.setPricingTypeError('');
              }}
              onRemarksChange={(value) => leadState.setters.setRemarks(value)}
              onMobilizationChange={(value) => {
                leadState.setters.setMobilizationAmount(value);
                setIsMobilizationManuallyEdited(true);
              }}
              onMobilizationFocus={() => {
                if (!isMobilizationManuallyEdited && !leadState.state.mobilizationAmount && mobilizationAmountDisplay) {
                  leadState.setters.setMobilizationAmount(mobilizationAmountDisplay);
                  setIsMobilizationManuallyEdited(true);
                }
              }}
              proposalDate={leadState.state.proposalDate}
              proposalCity={leadState.state.proposalCity}
              replacementGuaranteeDuration={leadState.state.replacementGuaranteeDuration}
              turnaroundTime={leadState.state.turnaroundTime}
              onProposalDateChange={(value) => leadState.setters.setProposalDate(value || '')}
              onProposalCityChange={(value) => leadState.setters.setProposalCity(value || '')}
              onReplacementGuaranteeDurationChange={(value) => leadState.setters.setReplacementGuaranteeDuration(value || '')}
              onTurnaroundTimeChange={(value) => leadState.setters.setTurnaroundTime(value || '')}
            />
          </div>
        ) : (
          <ContractSummaryForm
            showContractFields={false}
            remarks={leadState.state.remarks}
            remarksLabel={remarksLabel}
            remarksRequired={remarksRequired}
            loading={loading}
            viewOnlyMode={viewOnlyMode}
            remarksError={validationState.errors.remarksError}
            selectedJobIds={jobManagement.state.selectedJobIds}
            availableJobs={jobManagement.state.availableJobs}
            jobRowData={jobManagement.state.jobRowData}
            onRemarksChange={(value) => leadState.setters.setRemarks(value)}
          />
        )}
      </Modal>

      <JobValidationErrorsModal
        open={!!jobValidationErrors}
        onClose={() => setJobValidationErrors(null)}
        validationErrors={jobValidationErrors}
        leadId={lead?.id}
        leadType={lead?.leadType || leadType}
      />
    </>
  );
};

export default ShowRemarksLead;
