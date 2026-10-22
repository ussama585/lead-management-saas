const STORAGE_PREFIX = 'conversion-form-draft';

export const getConversionFormDraftKey = (leadId, leadType) =>
  `${STORAGE_PREFIX}:${leadType || 'lead-generation'}:${leadId}`;

export const saveConversionFormDraft = (leadId, leadType, draft) => {
  if (!leadId) return;
  try {
    localStorage.setItem(
      getConversionFormDraftKey(leadId, leadType),
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() })
    );
  } catch (error) {
    console.warn('Failed to save conversion form draft', error);
  }
};

export const loadConversionFormDraft = (leadId, leadType) => {
  if (!leadId) return null;
  try {
    const raw = localStorage.getItem(getConversionFormDraftKey(leadId, leadType));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearConversionFormDraft = (leadId, leadType) => {
  if (!leadId) return;
  try {
    localStorage.removeItem(getConversionFormDraftKey(leadId, leadType));
  } catch (error) {
    console.warn('Failed to clear conversion form draft', error);
  }
};

export const buildConversionFormDraft = ({
  leadState,
  jobManagement,
  isTotalContractManuallyEdited,
  isMobilizationManuallyEdited,
}) => ({
  remarks: leadState.state.remarks,
  contractCurrency: leadState.state.contractCurrency,
  subTotalAmount: leadState.state.subTotalAmount,
  discountAmount: leadState.state.discountAmount,
  discountPercentage: leadState.state.discountPercentage,
  totalContractAmount: leadState.state.totalContractAmount,
  vacancies: leadState.state.vacancies,
  jobCount: leadState.state.jobCount,
  pricingType: leadState.state.pricingType,
  mobilizationAmount: leadState.state.mobilizationAmount,
  proposalDate: leadState.state.proposalDate,
  proposalCity: leadState.state.proposalCity,
  replacementGuaranteeDuration: leadState.state.replacementGuaranteeDuration,
  turnaroundTime: leadState.state.turnaroundTime,
  selectedJobIds: jobManagement.state.selectedJobIds,
  jobRowData: jobManagement.state.jobRowData,
  hasUserSelectedJobs: jobManagement.state.hasUserSelectedJobs,
  isTotalContractManuallyEdited,
  isMobilizationManuallyEdited,
});

export const applyConversionFormDraft = (
  draft,
  { leadState, jobManagement, setIsTotalContractManuallyEdited, setIsMobilizationManuallyEdited }
) => {
  if (!draft) return;

  const {
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
    setProposalDate,
    setProposalCity,
    setReplacementGuaranteeDuration,
    setTurnaroundTime,
  } = leadState.setters;

  if (draft.remarks !== undefined) setRemarks(draft.remarks);
  if (draft.contractCurrency !== undefined) setContractCurrency(draft.contractCurrency);
  if (draft.subTotalAmount !== undefined) setSubTotalAmount(draft.subTotalAmount);
  if (draft.discountAmount !== undefined) setDiscountAmount(draft.discountAmount);
  if (draft.discountPercentage !== undefined) setDiscountPercentage(draft.discountPercentage);
  if (draft.totalContractAmount !== undefined) setTotalContractAmount(draft.totalContractAmount);
  if (draft.vacancies !== undefined) setVacancies(draft.vacancies);
  if (draft.jobCount !== undefined) setJobCount(draft.jobCount);
  if (draft.pricingType !== undefined) setPricingType(draft.pricingType);
  if (draft.mobilizationAmount !== undefined) setMobilizationAmount(draft.mobilizationAmount);
  if (draft.proposalDate !== undefined) setProposalDate(draft.proposalDate);
  if (draft.proposalCity !== undefined) setProposalCity(draft.proposalCity);
  if (draft.replacementGuaranteeDuration !== undefined) {
    setReplacementGuaranteeDuration(draft.replacementGuaranteeDuration);
  }
  if (draft.turnaroundTime !== undefined) setTurnaroundTime(draft.turnaroundTime);

  if (Array.isArray(draft.selectedJobIds)) {
    jobManagement.setters.setSelectedJobIds(draft.selectedJobIds);
  }
  if (draft.jobRowData && typeof draft.jobRowData === 'object') {
    jobManagement.setters.setJobRowData(draft.jobRowData);
  }
  if (draft.hasUserSelectedJobs !== undefined) {
    jobManagement.setters.setHasUserSelectedJobs(draft.hasUserSelectedJobs);
    jobManagement.refs.hasUserSelectedJobsRef.current = draft.hasUserSelectedJobs;
  }
  if (draft.isTotalContractManuallyEdited !== undefined) {
    setIsTotalContractManuallyEdited(draft.isTotalContractManuallyEdited);
  }
  if (draft.isMobilizationManuallyEdited !== undefined) {
    setIsMobilizationManuallyEdited(draft.isMobilizationManuallyEdited);
  }
};
