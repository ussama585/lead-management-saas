export function changeSalesDataStatus(currentStatus, valueOrUpdater) {
  const value = typeof valueOrUpdater === 'function' ? valueOrUpdater(currentStatus) : valueOrUpdater;
  const status = !value || value === 'All' ? '' : value;
  return { status, tab: ['assigned', 'unassigned'].includes(status) ? status : 'all' };
}

export function salesDataFilterParams(status, assigneeId, tab) {
  return {
    ...(status && !['assigned', 'unassigned'].includes(status) ? { status } : {}),
    ...(assigneeId != null && assigneeId !== '' ? { assigned_to: assigneeId } : {}),
    ...(tab === 'unassigned' ? { assigned: false } : {}),
  };
}
