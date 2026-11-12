import React, { useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import { LeadDateFilterSlot } from './lead-date-filter-slot.jsx';
import dayjs from 'dayjs';

export default function LeadTopFiltersAccordion({ children, portalAware = false, enabled = true, company, projectSize, dateRange }) {
  const slot = useContext(LeadDateFilterSlot);
  if (!enabled || (portalAware && slot)) return children;
  const dates = dateRange?.map(value => value && dayjs(value).isValid() ? dayjs(value).format('DD MMM YYYY') : '').filter(Boolean) || [];
  const selections = [company && { label: 'Company', value: company }, projectSize && { label: 'Project size', value: projectSize },
    dates.length > 0 && { label: 'Date range', value: dates.join(' – ') }].filter(Boolean);
  return <details open className="data-leads-ui leads-top-filters-accordion">
    <summary><span>Filters</span><span className="leads-top-filters-summary">
      {selections.map(({ label, value }) => <span key={label} className="leads-top-filters-summary__value" title={`${label}: ${value}`}>
        <span className="sr-only">{label}: </span>{value}
      </span>)}
      <ChevronDown size={16} aria-hidden="true" />
    </span></summary>
    {children}
  </details>;
}
