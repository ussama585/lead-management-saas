import React from 'react';

const DEFAULT_STATUS_COLOR = '#666';
const BADGE_STYLE_BASE = {
  fontWeight: 500,
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: '#f0f0f0',
};

const StatusBadge = ({ status, statusColors = {} }) => (
  <span style={{ ...BADGE_STYLE_BASE, color: statusColors[status] ?? DEFAULT_STATUS_COLOR }}>
    {status ?? '-'}
  </span>
);

export default StatusBadge;

