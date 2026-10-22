import React from 'react';
import '../assets/styles/legacy/approval-status-tabs.component.css';

const ApprovalStatusTabs = ({
  options = ['Pending', 'Approved', 'Rejected'],
  activeValue,
  onChange,
  counts = {},
  style,
}) => (
  <div className="approval-status-tabs" style={style}>
    {options.map((val) => {
      const isActive = activeValue === val;
      const count = counts?.[val.toLowerCase()];
      return (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`approval-status-tabs__button${isActive ? ' approval-status-tabs__button--active' : ''}`}
        >
          {val}{typeof count === 'number' ? ` (${count})` : ''}
        </button>
      );
    })}
  </div>
);

export default ApprovalStatusTabs;
