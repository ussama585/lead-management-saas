import React from 'react';
import '../assets/styles/company-select-option.css';

export default function CompanySelectOption({ option }) {
  return <div className="min-w-0 py-1">
    <div style={{ fontWeight: 600 }} className="truncate">{option.data.label}</div>
    {option.data.email && <div className="company-select-option-email truncate text-xs text-muted-foreground">{option.data.email}</div>}
  </div>;
}
