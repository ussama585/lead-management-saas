import React from 'react';
import { Ruler } from 'lucide-react';
import { Select } from './ui/app-select.jsx';

export default function LeadProjectSizeFilter({ value, options, onChange }) {
  return <div className="lead-project-size-filter lead-company-filter">
    <label htmlFor="lead-project-size-filter">Project size</label>
    <div className="lead-project-size-filter__control lead-company-filter__control">
      <Ruler size={20} aria-hidden="true" className="shrink-0" />
      <Select id="lead-project-size-filter" style={{ width: '100%' }} allowClear placeholder="Filter by project size"
        value={value || undefined} options={options} onChange={onChange} />
    </div>
  </div>;
}
