import React from "react";

const SidebarUnreadBadge = ({ count = 0 }) => {
  if (!count || count <= 0) return null;

  const displayCount = count > 99 ? "99+" : String(count);

  return <span className="sidebar-unread-badge">{displayCount}</span>;
};

export default SidebarUnreadBadge;
