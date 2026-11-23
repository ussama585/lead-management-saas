import React from 'react';
import { Select } from './ui/app-select.jsx';
import CompanySelectOption from './company-select-option.jsx';
import '../assets/styles/listing-filter-controls.css';

export default function CompanySelect({ id, ...props }) {
  return <div className="lead-company-filter">
    <label htmlFor={id}>Company</label>
    <div className="lead-company-filter__control">
      <Select id={id} placeholder="Filter by company" showSearch allowClear optionFilterProp="label"
        style={{ width: '100%', maxWidth: '100%' }}
        optionRender={option => <CompanySelectOption option={option} />}
        labelRender={({ label }) => <span style={{ fontWeight: 600 }}>{label}</span>}
        {...props} />
    </div>
  </div>;
}
