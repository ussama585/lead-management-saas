import React from 'react';
import AppLayout from './app-layout.jsx';

export default function SalesManagerLayout({ children }) {
  return <AppLayout role="sales_manager">{children}</AppLayout>;
}
