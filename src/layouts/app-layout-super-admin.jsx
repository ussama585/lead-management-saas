import React from 'react';
import AppLayout from './app-layout.jsx';

export default function SuperAdminLayout({ children }) {
  return <AppLayout role="super_admin">{children}</AppLayout>;
}
