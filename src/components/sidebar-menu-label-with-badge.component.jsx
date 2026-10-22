import React from 'react';
import SidebarUnreadBadge from './sidebar-unread-badge.component.jsx';

const SidebarMenuLabelWithBadge = ({ label, count }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
    <span>{label}</span>
    <SidebarUnreadBadge count={count} />
  </span>
);

export default SidebarMenuLabelWithBadge;
