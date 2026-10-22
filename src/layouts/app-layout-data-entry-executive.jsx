import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, PlusCircle } from 'lucide-react';
import AdminShell from './admin-shell.jsx';
const menuItems = [
  { key: '1', label: 'Dashboard', group: 'Overview', icon: <LayoutDashboard />, path: '/data-entry-executive' },
  { key: '2', label: 'Sales Data', group: 'Data Entry', icon: <Database />, path: '/data-entry-executive/leads-table' },
  { key: '3', label: 'Add Sales Data', group: 'Data Entry', icon: <PlusCircle />, path: '/data-entry-executive/add-update-lead' },
];
export default function DataEntryLayout({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const selectedKey = pathname === '/settings' ? '21' : pathname.includes('/leads-table') ? '2' : pathname.includes('/add-update-lead') ? '3' : '1';
  return <AdminShell menuItems={menuItems} selectedKey={selectedKey} onSelect={({ key }) => navigate(menuItems.find(item => item.key === key).path)}>{children}</AdminShell>;
}
