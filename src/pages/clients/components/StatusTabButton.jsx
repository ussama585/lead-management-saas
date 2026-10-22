import React from 'react';

const OPACITY_ACTIVE = '80';
const OPACITY_INACTIVE = '10';

const StatusTabButton = ({
  tab,
  isActive,
  statusColor,
  onClick,
  disabled = false,
  count,
}) => {
  const backgroundColor = isActive ? `${statusColor}${OPACITY_ACTIVE}` : `${statusColor}${OPACITY_INACTIVE}`;

  return (
    <button
      type="button"
      className={`status-tab-button tab ${isActive ? 'active' : ''}`}
      style={{ backgroundColor }}
      onClick={onClick}
      disabled={disabled}
    >
      {tab.label}{count !== '' && count != null ? ` (${count})` : ''}
    </button>
  );
};

export default StatusTabButton;

