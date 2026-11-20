import React from 'react';
import { X } from 'lucide-react';
import { DateRangeFieldContext } from './date-range-field-context.js';
import '../assets/styles/listing-filter-controls.css';

export default function LeadDateRangeField({ children, hasValue, onClear, label = 'Filter by Date Range:' }) {
  return <div className="lead-date-range-field">
    <span className="lead-date-range-field__label">{label}</span>
    <div className="lead-date-range-field__controls">
      <div className="lead-date-range-field__picker"><DateRangeFieldContext.Provider value={true}>{children}</DateRangeFieldContext.Provider></div>
      {hasValue && <button type="button" className="lead-date-range-field__clear" aria-label="Clear date range" title="Clear date range" onClick={onClear}><X size={18} /></button>}
    </div>
  </div>;
}
