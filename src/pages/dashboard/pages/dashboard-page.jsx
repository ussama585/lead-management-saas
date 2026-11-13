import React from 'react';
import RoleLeadDashboard from '../../../components/charts/role-lead-dashboard.jsx';
import RoleLeadStatusHealth from '../../../components/charts/role-lead-status-health.jsx';
import '../../../assets/styles/legacy/admin-dashboard-page.css';

export default function DashboardPage() {
  return <>
    <div className="dashboard-container">
      <RoleLeadDashboard />
      <RoleLeadStatusHealth />
    </div>
  </>;
}
