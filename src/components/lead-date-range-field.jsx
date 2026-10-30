import React from 'react';
import { X } from 'lucide-react';

export default function LeadDateRangeField({ children, hasValue, onClear }) {
  return <div className="lead-date-range-field">
    <span className="lead-date-range-field__label">Filter by Date Range:</span>
    <div className="lead-date-range-field__controls">
      <div className="lead-date-range-field__picker">{children}</div>
      {hasValue && <button type="button" className="lead-date-range-field__clear" aria-label="Clear date range" title="Clear date range" onClick={onClear}><X size={18} /></button>}
    </div>
  </div>;
}
