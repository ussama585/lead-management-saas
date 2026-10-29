import React from 'react';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import RoleLeadDashboard from '../../../components/charts/role-lead-dashboard.jsx';
import DashboardExecutiveStats from '../../../components/dashboard-executive-stats.jsx';
import RoleLeadStatusHealth from '../../../components/charts/role-lead-status-health.jsx';
import '../../../assets/styles/legacy/admin-dashboard-page.css';

export default function DashboardPage() {
  return <>
    <BreadCrumb linkText="Dashboard" />
    <div className="dashboard-container">
      <RoleLeadDashboard />
      <RoleLeadStatusHealth />
      <DashboardExecutiveStats />
    </div>
  </>;
}
