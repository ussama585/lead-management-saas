import React, { useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import { LeadDateFilterSlot } from './lead-date-filter-slot.jsx';

export default function LeadTopFiltersAccordion({ children, portalAware = false, enabled = true }) {
  const slot = useContext(LeadDateFilterSlot);
  if (!enabled || (portalAware && slot)) return children;
  return <details open className="data-leads-ui leads-top-filters-accordion">
    <summary><span>Filters</span><span className="leads-top-filters-summary">
      <ChevronDown size={16} aria-hidden="true" />
    </span></summary>
    {children}
  </details>;
}
