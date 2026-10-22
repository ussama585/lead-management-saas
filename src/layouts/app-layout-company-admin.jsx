import React from 'react';
import AppLayout from './app-layout.jsx';

export default function CompanyAdminLayout({ children }) {
  return <AppLayout role="company_admin">{children}</AppLayout>;
}
