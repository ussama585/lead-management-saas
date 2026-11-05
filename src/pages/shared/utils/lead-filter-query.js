const fields = {
  status: 'status', statusFilter: 'status', selectedExecutive: 'executive', executiveFilter: 'executive',
  selectedExecId: 'execId', projectSizeFilter: 'project_size', duplicateCheck: 'duplicate_check',
  search: 'search', pageIndex: 'page', pageSize: 'pageSize', hearAboutUs: 'hear_about_us',
  selectedCampaign: 'campaign', selectedAdset: 'adset', selectedAd: 'ad',
  selectedHistoryStatuses: 'history_status', historyStartDate: 'history_start', historyEndDate: 'history_end',
  formNamesFilter: 'form_names', excludeKeywords: 'exclude_keywords',
};
const arrays = new Set(['hearAboutUs', 'selectedHistoryStatuses', 'formNamesFilter', 'excludeKeywords']);
const objects = new Set(['selectedAdset', 'selectedAd']);
const managed = new Set([...Object.values(fields), 'sortBy', 'sortOrder', 'date_start', 'date_end', 'filters']);

export function leadFilterParams(current, state) {
  const params = new URLSearchParams(current);
  managed.forEach(key => params.delete(key));
  // Marks a complete snapshot, including cleared filters, so old session state cannot reappear.
  params.set('filters', '1');
  Object.entries(fields).forEach(([field, key]) => {
    const value = state[field];
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) return;
    params.set(key, arrays.has(field) || objects.has(field) ? JSON.stringify(value) : String(value));
  });
  if (state.sorting?.[0]?.id) {
    params.set('sortBy', state.sorting[0].id);
    params.set('sortOrder', state.sorting[0].desc ? 'desc' : 'asc');
  }
  state.dateRange?.forEach((value, index) => {
    if (value) params.set(index ? 'date_end' : 'date_start', typeof value === 'string' ? value : value.toISOString());
  });
  return params;
}

export function readLeadFilterParams(params, defaults) {
  const state = { ...defaults };
  Object.entries(fields).forEach(([field, key]) => {
    if (!params.has(key)) return;
    const value = params.get(key);
    if (arrays.has(field)) {
      try { const parsed = JSON.parse(value); state[field] = Array.isArray(parsed) ? parsed : [value]; }
      catch { state[field] = value.split(',').filter(Boolean); }
    } else if (objects.has(field)) {
      try { const parsed = JSON.parse(value); state[field] = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null; }
      catch { state[field] = null; }
    } else if (field === 'selectedExecId') {
      state[field] = /^\d+$/.test(value) ? Number(value) : value;
    } else if (field === 'pageIndex' || field === 'pageSize') {
      const number = Number(value);
      if (Number.isInteger(number) && number >= (field === 'pageSize' ? 1 : 0)) state[field] = number;
    } else state[field] = value;
  });
  const validDate = key => {
    const value = params.get(key);
    return value && !Number.isNaN(Date.parse(value)) ? value : null;
  };
  if (params.has('date_start') || params.has('date_end')) state.dateRange = [validDate('date_start'), validDate('date_end')];
  for (const [key, field] of [['history_start', 'historyStartDate'], ['history_end', 'historyEndDate']]) {
    if (params.has(key)) state[field] = validDate(key);
  }
  if (params.get('sortBy')) state.sorting = [{ id: params.get('sortBy'), desc: params.get('sortOrder') === 'desc' }];
  return state;
}

export function syncLeadFilterParams(setSearchParams, state) {
  setSearchParams(current => {
    const next = leadFilterParams(current, state);
    return next.toString() === current.toString() ? current : next;
  }, { replace: true });
}
