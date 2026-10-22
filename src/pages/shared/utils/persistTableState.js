/**
 * Utility to persist table state using URL params + sessionStorage
 * This ensures state persists on reload AND when navigating back to the page
 */

/**
 * Save table state to both URL params and sessionStorage
 */
export const saveTableState = (routeKey, state, setSearchParams) => {
  const params = {};

  // Build URL params
  if (state.tab && state.tab !== state.defaultTab) {
    params.tab = state.tab;
  }
  if (state.status !== undefined && state.status !== state.defaultStatus) {
    params.status = state.status;
  }
  if (state.search && state.search.trim()) {
    params.search = state.search.trim();
  }
  if (state.pageIndex !== 0) {
    params.page = state.pageIndex.toString();
  }
  if (state.pageSize !== 10) {
    params.pageSize = state.pageSize.toString();
  }
  if (state.sorting && state.sorting.length > 0 && state.sorting[0]?.id) {
    params.sortBy = state.sorting[0].id;
    params.sortOrder = state.sorting[0].desc ? 'desc' : 'asc';
  }
  if (state.selectedManagerId) {
    params.manager = state.selectedManagerId;
  }
  if (state.selectedExecutiveId) {
    params.executive = state.selectedExecutiveId;
  }
  if (state.selectedRecruitmentManagerId) {
    params.recruitmentManager = state.selectedRecruitmentManagerId;
  }
  if (state.selectedRecruitmentExecutiveId) {
    params.recruitmentExecutive = state.selectedRecruitmentExecutiveId;
  }
  if (state.selectedClientRecruiterId) {
    params.clientRecruiter = state.selectedClientRecruiterId;
  }
  if (state.statusHistoryLeadId) {
    params.statusHistory = state.statusHistoryLeadId;
  }

  // Update URL params (with replace to avoid history clutter)
  setSearchParams(params, { replace: true });

  // Prepare state for sessionStorage (serialize date ranges if present)
  const stateToSave = { ...state };
  
  // Serialize date range to ISO strings for storage
  if (state.dateRange && Array.isArray(state.dateRange) && state.dateRange.length === 2) {
    stateToSave.dateRange = [
      state.dateRange[0] ? state.dateRange[0].toISOString() : null,
      state.dateRange[1] ? state.dateRange[1].toISOString() : null,
    ];
  }

  // Also save to sessionStorage for navigation persistence
  try {
    sessionStorage.setItem(
      `tableState_${routeKey}`,
      JSON.stringify({
        ...stateToSave,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.warn('Failed to save table state to sessionStorage:', e);
  }
};

/**
 * Load table state from URL params OR sessionStorage (URL takes priority)
 */
export const loadTableState = (routeKey, searchParams, defaults = {}) => {
  // Start with default state
  let state = {
    ...defaults,
    search: '',
    pageIndex: 0,
    pageSize: 10,
    sorting: [],
    dateRange: null,
  };

  // Try to load from sessionStorage first
  try {
    const stored = sessionStorage.getItem(`tableState_${routeKey}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Check if stored data is not too old (optional: expire after 1 hour)
      const isExpired = Date.now() - parsed.timestamp > 60 * 60 * 1000;
      
      if (!isExpired) {
        // Deserialize date range if present (convert ISO strings back to Date objects)
        let dateRange = parsed.dateRange || null;
        if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
          // Keep as strings - let the component handle conversion to dayjs/moment
          dateRange = [
            dateRange[0] ? dateRange[0] : null,
            dateRange[1] ? dateRange[1] : null,
          ];
        }

        // Merge sessionStorage state
        state = {
          ...state,
          tab: parsed.tab !== undefined ? parsed.tab : state.tab,
          status: parsed.status !== undefined ? parsed.status : state.status,
          search: parsed.search || '',
          pageIndex: parsed.pageIndex ?? 0,
          pageSize: parsed.pageSize ?? 10,
          sorting: parsed.sorting || [],
          dateRange: dateRange,
          selectedExecutive: parsed.selectedExecutive || null,
          statusFilter: parsed.statusFilter !== undefined ? parsed.statusFilter : state.statusFilter,
          projectSizeFilter: parsed.projectSizeFilter || null,
          executiveFilter: parsed.executiveFilter || null,
          selectedCampaign: parsed.selectedCampaign || null,
          selectedAdset: parsed.selectedAdset || null,
          selectedAd: parsed.selectedAd || null,
          selectedHistoryStatus: parsed.selectedHistoryStatus || null,
          selectedHistoryStatuses: Array.isArray(parsed.selectedHistoryStatuses)
            ? parsed.selectedHistoryStatuses
            : parsed.selectedHistoryStatus
              ? (Array.isArray(parsed.selectedHistoryStatus)
                ? parsed.selectedHistoryStatus
                : [parsed.selectedHistoryStatus])
              : null,
          historyStartDate: parsed.historyStartDate || null,
          historyEndDate: parsed.historyEndDate || null,
          formNamesFilter: Array.isArray(parsed.formNamesFilter) ? parsed.formNamesFilter : state.formNamesFilter,
          excludeKeywords: Array.isArray(parsed.excludeKeywords) ? parsed.excludeKeywords : state.excludeKeywords,
          duplicateCheck: parsed.duplicateCheck !== undefined ? parsed.duplicateCheck : state.duplicateCheck,
          selectedManagerId: parsed.selectedManagerId !== undefined ? parsed.selectedManagerId : state.selectedManagerId,
          selectedExecutiveId: parsed.selectedExecutiveId !== undefined ? parsed.selectedExecutiveId : state.selectedExecutiveId,
          selectedRecruitmentManagerId: parsed.selectedRecruitmentManagerId !== undefined ? parsed.selectedRecruitmentManagerId : state.selectedRecruitmentManagerId,
          selectedRecruitmentExecutiveId: parsed.selectedRecruitmentExecutiveId !== undefined ? parsed.selectedRecruitmentExecutiveId : state.selectedRecruitmentExecutiveId,
          selectedClientRecruiterId: parsed.selectedClientRecruiterId !== undefined ? parsed.selectedClientRecruiterId : state.selectedClientRecruiterId,
          selectedRecruiterId2: parsed.selectedRecruiterId2 !== undefined ? parsed.selectedRecruiterId2 : state.selectedRecruiterId2,
          selectedExecId: parsed.selectedExecId !== undefined ? parsed.selectedExecId : state.selectedExecId,
          statusHistoryLeadId: parsed.statusHistoryLeadId !== undefined ? parsed.statusHistoryLeadId : state.statusHistoryLeadId,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load table state from sessionStorage:', e);
  }

  // Now override with URL params (they have highest priority)
  // Only override if the param is explicitly set in the URL
  if (searchParams.get('tab') !== null) {
    state.tab = searchParams.get('tab');
  }
  if (searchParams.get('status') !== null) {
    state.status = searchParams.get('status');
    state.statusFilter = searchParams.get('status');
  }
  if (searchParams.get('executive') !== null) {
    state.selectedExecutive = searchParams.get('executive');
    state.executiveFilter = searchParams.get('executive');
    state.selectedExecutiveId = searchParams.get('executive');
  }
  if (searchParams.get('manager') !== null) {
    state.selectedManagerId = searchParams.get('manager');
  }
  if (searchParams.get('recruitmentManager') !== null) {
    state.selectedRecruitmentManagerId = searchParams.get('recruitmentManager');
  }
  if (searchParams.get('recruitmentExecutive') !== null) {
    state.selectedRecruitmentExecutiveId = searchParams.get('recruitmentExecutive');
  }
  if (searchParams.get('clientRecruiter') !== null) {
    state.selectedClientRecruiterId = searchParams.get('clientRecruiter');
  }
  if (searchParams.get('recruiter') !== null) {
    state.selectedRecruiterId2 = searchParams.get('recruiter');
  }
  if (searchParams.get('execId') !== null) {
    state.selectedExecId = searchParams.get('execId');
  }
  if (searchParams.get('search') !== null) {
    state.search = searchParams.get('search');
  }
  if (searchParams.get('page') !== null) {
    state.pageIndex = parseInt(searchParams.get('page')) || 0;
  }
  if (searchParams.get('pageSize') !== null) {
    state.pageSize = parseInt(searchParams.get('pageSize')) || 10;
  }
  
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');
  if (sortBy !== null) {
    state.sorting = [{ id: sortBy, desc: sortOrder === 'desc' }];
  }

  return state;
};

/**
 * Clear stored table state (useful for logout or reset)
 */
export const clearTableState = (routeKey) => {
  try {
    sessionStorage.removeItem(`tableState_${routeKey}`);
  } catch (e) {
    console.warn('Failed to clear table state:', e);
  }
};

