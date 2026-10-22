// Import centralized status colors and configs
import { STATUS_COLORS, PROJECT_STATUS_TABS, getStatusTabsWithCounts } from './status-configs.js';

// Re-export for backwards compatibility
export const statusColors = STATUS_COLORS;

// Client status tabs configuration
export const CLIENT_STATUS_TABS = [
  { label: 'All', value: '', key: 'all' },
  { label: 'Potential', value: 'Potential Client', key: 'potential_client' },
  { label: 'Active', value: 'Active', key: 'active' },
  { label: 'Terminated By Client', value: 'Terminated By Client', key: 'terminated_by_client' },
  { label: 'Terminated By Search O Pal', value: 'Terminated By Search O Pal', key: 'terminated_by_search_o_pal' },
  { label: 'Terminated By Search O Pal + Refunded', value: 'Terminated By Search O Pal + Refunded', key: 'terminated_by_search_o_pal_refunded' },
  { label: 'Terminated By Client + Refunded', value: 'Terminated By Client + Refunded', key: 'terminated_by_client_refunded' },
  { label: 'Completed', value: 'Completed', key: 'completed' },
  { label: 'Completed - Defaulter', value: 'Completed - Defaulter', key: 'completed_defaulter' },
  { label: 'Completed - Payment Pending', value: 'Completed - Payment Pending', key: 'completed_payment_pending' },
  { label: 'Unassigned', value: 'Unassigned', key: 'unassigned' },
];

// Backwards compatibility
export const statusTabs = CLIENT_STATUS_TABS;

export const statusOptions = [
  { label: 'Potential Client', value: 'Potential Client' },
  { label: 'Active', value: 'Active' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Completed - Payment Pending', value: 'Completed - Payment Pending' },
  { label: 'Completed - Defaulter', value: 'Completed - Defaulter' },
  { label: 'Terminated By Client', value: 'Terminated By Client' },
  { label: 'Terminated By Client + Refunded', value: 'Terminated By Client + Refunded' },
  { label: 'Terminated By Search O Pal', value: 'Terminated By Search O Pal' },
  { label: 'Terminated By Search O Pal + Refunded', value: 'Terminated By Search O Pal + Refunded' },
];

// Map client counts to tab keys
export const mapClientCounts = (clientCounts) => ({
  'all': clientCounts?.total_count ?? 0,
  'potential_client': clientCounts?.potential_client ?? 0,
  'active': clientCounts?.active ?? 0,
  'terminated_by_client': clientCounts?.terminated_by_client ?? 0,
  'terminated_by_search_o_pal': clientCounts?.terminated_by_search_o_pal ?? 0,
  'terminated_by_search_o_pal_refunded': clientCounts?.terminated_by_search_o_pal_refunded ?? 0,
  'terminated_by_client_refunded': clientCounts?.terminated_by_client_refunded ?? 0,
  'completed': clientCounts?.completed ?? 0,
  'completed_defaulter': clientCounts?.completed_defaulter ?? 0,
  'completed_payment_pending': clientCounts?.completed_payment_pending ?? 0,
  'unassigned': clientCounts?.unassigned ?? 0,
});

// Project/Headhunting Status Options
export const projectStatusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Delayed', value: 'Delayed' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Completed - Payment Pending', value: 'Completed - Payment Pending' },
  { label: 'Completed - Defaulter', value: 'Completed - Defaulter' },
  { label: 'Terminated By Client', value: 'Terminated By Client' },
  { label: 'Terminated By Client + Refunded', value: 'Terminated By Client + Refunded' },
  { label: 'Terminated By Search O Pal', value: 'Terminated By Search O Pal' },
  { label: 'Terminated By Search O Pal + Refunded', value: 'Terminated By Search O Pal + Refunded' },
];

// Single source of truth for job status (used in status tabs, filters, etc.)
export const JOB_STATUS_LIST = [
  'Pending',
  'Active',
  'Delayed',
  'Completed',
  'Completed - Payment Pending',
  'Completed - Defaulter',
  'Terminated By Client',
  'Terminated By Client + Refunded',
  'Terminated By Search O Pal',
  'Terminated By Search O Pal + Refunded',
];

const statusToKey = (value) =>
  value
    .toLowerCase()
    .replace(/\s*-\s*/g, '_')
    .replace(/\s*\+\s*/g, '_')
    .replace(/\s+/g, '_');

// Job Status Options (derived from JOB_STATUS_LIST)
export const jobStatusOptions = JOB_STATUS_LIST.map((value) => ({
  label: value,
  value,
  key: statusToKey(value),
}));

// Job Status Tabs Configuration (derived from JOB_STATUS_LIST; keys match API)
export const JOB_STATUS_TABS = JOB_STATUS_LIST.map((value) => {
  const key = statusToKey(value);
  return { label: value, value, key, countKey: key };
});

// Helper function to get job status tabs with counts
export const getJobStatusTabs = (jobCounts = {}) => {
  return JOB_STATUS_TABS.map(tab => {
    let count = jobCounts?.[tab.countKey] || 0;
    
    // Handle API inconsistency: completed_payment_pending vs completed_pending_payment
    if (tab.countKey === 'completed_payment_pending' && count === 0) {
      count = jobCounts?.['completed_pending_payment'] || 0;
    }
    
    return {
      label: tab.label,
      value: tab.value,
      key: tab.key,
      count: count,
    };
  });
};

// Project/Headhunting Status Tabs (uses centralized configuration)
export const getProjectStatusTabs = (projectCounts = {}) => {
  return getStatusTabsWithCounts(projectCounts, PROJECT_STATUS_TABS);
};
