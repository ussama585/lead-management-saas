import React, { useId, useState } from 'react';
import { UsersRound, ListFilter, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button.jsx';
import StatusFilterTabs from './status-filter-tabs.jsx';
import '../assets/styles/lead-listing-filters.css';

function FilterCard({ title, subtitle, Icon, selectedLabel, children }) {
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  return <section className="lead-filter-card" aria-label={title}>
    <div className="lead-filter-card__header">
      <span className="lead-filter-card__icon"><Icon size={20} /></span>
      <div className="lead-filter-card__heading"><h2>{title}</h2><p>{subtitle}</p></div>
      <span className="lead-filter-card__selected" title={selectedLabel}>{selectedLabel}</span>
      <Button type="button" variant="ghost" size="icon" className="lead-filter-card__collapse" aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</Button>
    </div>
    <div id={id} hidden={!expanded}>{children}</div>
  </section>;
}

export default function LeadListingFilters({ executives = [], selectedExecutive, onExecutiveChange, getExecutiveCount,
  statusFilter, setStatusFilter, statusChoices, getTotalCount, getStatusCount, showExecutives = true }) {
  const isAll = selectedExecutive == null || selectedExecutive === '';
  const selectedAssignee = executives.find(executive => String(executive.id) === String(selectedExecutive));
  const assigneeLabel = isAll ? 'All' : selectedAssignee
    ? `${selectedAssignee.name}${selectedAssignee.user_type ? ` - ${selectedAssignee.user_type === 'sales_manager' ? 'Manager' : 'Executive'}` : ''}`
    : String(selectedExecutive);
  const statusLabel = !statusFilter || statusFilter === 'All' ? 'All'
    : statusChoices.find(choice => choice.value === statusFilter)?.label || statusFilter;
  const buttonClass = 'h-auto min-h-8 max-w-full whitespace-normal text-left';
  return <div className="lead-listing-filters">
    {showExecutives && <FilterCard title="Assignee Filters" subtitle="Filter leads by assignee and role" Icon={UsersRound} selectedLabel={assigneeLabel}>
    <div className="flex flex-wrap items-center gap-2 py-2" role="group" aria-label="Filter by assigned user">
      <Button type="button" size="sm" className={buttonClass} variant={isAll ? 'default' : 'outline'} aria-pressed={isAll} onClick={() => onExecutiveChange(null)}>All ({getTotalCount()})</Button>
      {executives.map(executive => {
        const selected = !isAll && String(selectedExecutive) === String(executive.id);
        const role = executive.user_type ? ` - ${executive.user_type === 'sales_manager' ? 'Manager' : 'Executive'}` : '';
        const count = getExecutiveCount?.(executive.id);
        return <Button key={executive.id} type="button" size="sm" className={buttonClass} variant={selected ? 'default' : 'outline'} aria-pressed={selected}
          onClick={() => onExecutiveChange(executive.id)}>{executive.name}{role}{typeof count === 'number' ? ` (${count})` : ''}</Button>;
      })}
    </div></FilterCard>}
    <FilterCard title="Status Filters" subtitle="Filter leads by current status" Icon={ListFilter} selectedLabel={statusLabel}>
      <StatusFilterTabs statusFilter={statusFilter} setStatusFilter={setStatusFilter} statusChoices={statusChoices}
        getTotalCount={getTotalCount} getStatusCount={getStatusCount} />
    </FilterCard>
  </div>;
}
