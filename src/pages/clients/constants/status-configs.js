/**
 * Centralized status configurations for all entity types
 * This keeps status-related data consistent across the application
 */

// Common status colors
export const STATUS_COLORS = {
  // Client statuses
  'All': '#1890ff',
  'Potential Client': '#faad14',
  'Active': '#52c41a',
  'Completed': '#1890ff',
  'Completed - Payment Pending': '#fa8c16',
  'Completed - Defaulter': '#ff4d4f',
  'Terminated By Client': '#13c2c2',
  'Terminated By Client + Refunded': '#722ed1',
  'Terminated By Search O Pal': '#2f54eb',
  'Terminated By Search O Pal + Refunded': '#531dab',
  'Unassigned': '#6B7C96',
  'Lost': '#ff4d4f',
  'Inactive': '#8c8c8c',
  'In Pipeline': '#1890ff',
  
  // Project/Job statuses
  'Pending': '#faad14',
  'Delayed': '#ff7a45',
  
  // Resume statuses
  'Shortlisted': '#1890ff',
  'Interview Scheduled': '#1890ff',
  'Interview Conducted': '#1890ff',
  'Interview Not Conducted By Client': '#ff4d4f',
  'Candidate Did Not Appear In Interview': '#ff4d4f',
  'On Hold': '#faad14',
  'Offer Made': '#52c41a',
  'Offer Rejected': '#ff4d4f',
  'Joined': '#52c41a',
  'Rejected After CV Review With Valid Reason': '#ff4d4f',
  'Rejected After CV Review With Invalid Reason': '#ff4d4f',
  'Rejected After CV Review Without Reason': '#ff4d4f',
  'Rejected After Interview With Valid Reason': '#ff4d4f',
  'Rejected After Interview With Invalid Reason': '#ff4d4f',
  'Rejected After Interview Without Reason': '#ff4d4f',
  'Candidate Resigned': '#ff4d4f',
  'Terminated By Company': '#ff4d4f',
};

// Project/Job status tabs configuration
export const PROJECT_STATUS_TABS = [
  { label: 'Active', value: 'Active', countKey: 'active' },
  { label: 'Delayed', value: 'Delayed', countKey: 'delayed' },
  {label:'Pending', value: 'Pending', countKey: 'pending'},
  { label: 'Completed', value: 'Completed', countKey: 'completed' },
  { label: 'Completed - Payment Pending', value: 'Completed - Payment Pending', countKey: 'completed_payment_pending' },
  { label: 'Completed - Defaulter', value: 'Completed - Defaulter', countKey: 'completed_defaulter' },
  { label: 'Terminated By Client', value: 'Terminated By Client', countKey: 'terminated_by_client' },
  { label: 'Terminated By Client + Refunded', value: 'Terminated By Client + Refunded', countKey: 'terminated_by_client_refunded' },
  { label: 'Terminated By Search O Pal', value: 'Terminated By Search O Pal', countKey: 'terminated_by_search_o_pal' },
  { label: 'Terminated By Search O Pal + Refunded', value: 'Terminated By Search O Pal + Refunded', countKey: 'terminated_by_search_o_pal_refunded' },
];

// Helper function to get status tabs with counts
export const getStatusTabsWithCounts = (counts, tabsConfig) => {
  return tabsConfig.map(tab => ({
    ...tab,
    count: counts?.[tab.countKey] || 0
  }));
};

