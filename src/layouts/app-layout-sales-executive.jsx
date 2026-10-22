import React from 'react';
import AppLayout from './app-layout.jsx';

export default function SalesExecutiveLayout({ children }) {
  return <AppLayout role="sales_executive">{children}</AppLayout>;
}
