import React, { useId } from 'react';
import { Select } from './ui/app-select.jsx';

export default function LeadListingDropdownFilters({ executives = [], selectedExecutive, onExecutiveChange, getExecutiveCount,
  assigneeTotal = 0, showExecutives = true, status, onStatusChange, statuses = [], getStatusCount, total = 0, disabled = false }) {
  const id = useId();
  return <div className="lead-listing-filter-dropdowns">
    {showExecutives && <div className="lead-listing-filter-dropdown">
      <label htmlFor={`${id}-assignee`} className="sr-only">Assignee</label>
      <Select id={`${id}-assignee`} className="lead-listing-assignee-filter" style={{ width: '100%' }} placeholder="Filter by assignee"
        showSearch optionFilterProp="label" disabled={disabled} value={selectedExecutive ? String(selectedExecutive) : 'all'}
        onChange={value => onExecutiveChange(value === 'all' || value == null ? '' : String(value))}
        options={[{ value: 'all', label: `All Assignees (${assigneeTotal})` }, ...executives.map(executive => ({
          value: String(executive.id), label: `${executive.name}${executive.user_type ? ` - ${executive.user_type === 'sales_manager' ? 'Manager' : 'Executive'}` : ''} (${getExecutiveCount?.(executive.id) || 0})`,
        }))]} />
    </div>}
    <div className="lead-listing-filter-dropdown">
      <label htmlFor={`${id}-status`} className="sr-only">Status</label>
      <Select id={`${id}-status`} style={{ width: '100%' }} placeholder="Filter by status" showSearch optionFilterProp="label"
        disabled={disabled} value={status || 'all'} onChange={value => onStatusChange(value === 'all' || value == null ? '' : value)}
        options={[{ value: 'all', label: `All Statuses (${total})` }, ...statuses.filter(option => option.value && !['All', 'all'].includes(option.value))
          .map(option => ({ value: option.value, label: `${option.label} (${getStatusCount?.(option.apiKey ?? option.value) || 0})` }))]} />
    </div>
  </div>;
}
