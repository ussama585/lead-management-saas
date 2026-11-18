import React, { useId, useState } from 'react';
import { UsersRound, UserRound, ListFilter, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button.jsx';
import StatusFilterTabs from './status-filter-tabs.jsx';
import '../assets/styles/lead-listing-filters.css';

export function FilterCard({ title, subtitle, Icon, selectedLabel, collapsedSelections = [], children, collapsible = true }) {
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  return <section className={collapsible ? 'lead-filter-card' : 'lead-filter-section'} aria-label={title}>
    <div className="lead-filter-card__header">
      <span className="lead-filter-card__icon"><Icon size={20} /></span>
      <div className="lead-filter-card__heading"><h2>{title}</h2><p>{subtitle}</p></div>
      {selectedLabel && <span className="lead-filter-card__selected" title={selectedLabel}>{selectedLabel}</span>}
      {!expanded && collapsedSelections.length > 0 && <div className="lead-filter-card__collapsed-selections">
        {collapsedSelections.map(({ label, value, kind }) => <span key={kind}
          className={`lead-filter-card__selected lead-filter-card__selected--${kind}`} title={`${label}: ${value}`}>
          <span className="sr-only">{label}: </span>{value}
        </span>)}
      </div>}
      {collapsible && <Button type="button" variant="ghost" size="icon" className="lead-filter-card__collapse" aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</Button>}
    </div>
    <div id={id} hidden={collapsible && !expanded}>{children}</div>
  </section>;
}

function FilterCards({ statusFirst, children }) {
  const cards = React.Children.toArray(children);
  const collapsedSelections = cards.filter(card => card.props.selectedLabel).map(card => ({
    label: card.props.title === 'Status Filters' ? 'Status' : 'Assignee',
    value: card.props.selectedLabel,
    kind: card.props.title === 'Status Filters' ? 'status' : 'assignee',
  }));
  return <div className="lead-listing-filters">
    <FilterCard title="Filters" subtitle="Filter by assignee and status" Icon={ListFilter} collapsedSelections={collapsedSelections}>
      <div className="lead-filter-sections">
        {(statusFirst ? cards.reverse() : cards).map(card => React.cloneElement(card, { collapsible: false }))}
      </div>
    </FilterCard>
  </div>;
}

export default function LeadListingFilters({ executives = [], selectedExecutive, onExecutiveChange, getExecutiveCount, getAssigneeTotalCount,
  statusFilter, setStatusFilter, statusChoices, getTotalCount, getStatusCount, showExecutives = true, requiresCompany = false, statusFirst = false, hideAllSummary = false, accordion = false }) {
  if (requiresCompany) return <FilterCards statusFirst={statusFirst} accordion={accordion}>
    {showExecutives && <FilterCard title="Assignee Filters" subtitle="Filter leads by assignee and role" Icon={UsersRound}>
      <p className="py-3 text-sm text-muted-foreground">Select company first</p>
    </FilterCard>}
    <FilterCard title="Status Filters" subtitle="Filter leads by current status" Icon={ListFilter}>
      <p className="py-3 text-sm text-muted-foreground">Select company first</p>
    </FilterCard>
  </FilterCards>;
  const isAll = selectedExecutive == null || selectedExecutive === '';
  const selectedAssignee = executives.find(executive => String(executive.id) === String(selectedExecutive));
  const assigneeLabel = isAll ? 'All' : selectedAssignee
    ? `${selectedAssignee.name}${selectedAssignee.user_type ? ` - ${selectedAssignee.user_type === 'sales_manager' ? 'Manager' : 'Executive'}` : ''}`
    : String(selectedExecutive);
  const statusLabel = !statusFilter || statusFilter === 'All' ? 'All'
    : statusChoices.find(choice => choice.value === statusFilter)?.label || statusFilter;
  const buttonClass = 'h-auto min-h-8 max-w-full whitespace-normal text-left';
  return <FilterCards statusFirst={statusFirst} accordion={accordion}>
    {showExecutives && <FilterCard title="Assignee Filters" subtitle="Filter leads by assignee and role" Icon={UsersRound} selectedLabel={hideAllSummary && isAll ? null : assigneeLabel}>
    <div className="flex flex-wrap items-center gap-2 py-2" role="group" aria-label="Filter by assigned user">
      <Button type="button" size="sm" className={buttonClass} variant={isAll ? 'default' : 'outline'} aria-pressed={isAll} onClick={() => onExecutiveChange(null)}>All ({(getAssigneeTotalCount || getTotalCount)()})</Button>
      {executives.map(executive => {
        const selected = !isAll && String(selectedExecutive) === String(executive.id);
        const role = executive.user_type ? ` - ${executive.user_type === 'sales_manager' ? 'Manager' : 'Executive'}` : '';
        const count = getExecutiveCount?.(executive.id);
        return <Button key={executive.id} type="button" size="sm" className={buttonClass} variant={selected ? 'default' : 'outline'} aria-pressed={selected}
          onClick={() => onExecutiveChange(executive.id)}>{hideAllSummary && <UserRound className="size-4 shrink-0 text-blue-600" aria-hidden="true" />}{executive.name}{role}{typeof count === 'number' ? ` (${count})` : ''}</Button>;
      })}
    </div></FilterCard>}
    <FilterCard title="Status Filters" subtitle="Filter leads by current status" Icon={ListFilter} selectedLabel={hideAllSummary && statusLabel === 'All' ? null : statusLabel}>
      <StatusFilterTabs statusFilter={statusFilter} setStatusFilter={setStatusFilter} statusChoices={statusChoices}
        getTotalCount={getTotalCount} getStatusCount={getStatusCount} />
    </FilterCard>
  </FilterCards>;
}
