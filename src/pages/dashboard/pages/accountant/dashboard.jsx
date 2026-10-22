import React from 'react';
import { Spin } from 'antd';
import StatsCard from '../../../../components/stats-card.component.jsx';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import '../../../../assets/styles/legacy/admin-dashboard-page.css';
import InvoiceIcon from '../../../../assets/images/stat-card-icons/total-clients.svg';
import PendingIcon from '../../../../assets/images/stat-card-icons/dormant-clients.svg';
import ApprovedIcon from '../../../../assets/images/stat-card-icons/active-clients.svg';
import RejectedIcon from '../../../../assets/images/stat-card-icons/opportunities-lost.svg';

const metrics = [
  { title: 'Total Invoices', icon: InvoiceIcon, count: 120, color: '#3E6A9F', percentage: 0 },
  { title: 'Pending Invoices', icon: PendingIcon, count: 15, color: '#F4D03F', percentage: 0 },
  { title: 'Approved Invoices', icon: ApprovedIcon, count: 90, color: '#27ae60', percentage: 0 },
  { title: 'Rejected Invoices', icon: RejectedIcon, count: 15, color: '#e74c3c', percentage: 0 },
];

const AccountantDashboard = () => (
  <>
    <BreadCrumb linkText="Dashboard" />
    <div className="dashboard-container">
      <Spin spinning={false}>
        <div className="metrics-grid">
          {metrics.length > 0 ? (
            metrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <StatsCard
                  title={metric.title}
                  value={metric.count}
                  percentage={metric.percentage}
                  icon={<img src={metric.icon} alt={metric.title} style={{ width: '48px', height: '48px' }} />}
                  borderColor={metric.color}
                />
              </div>
            ))
          ) : (
            <p>Nothing to show</p>
          )}
        </div>
      </Spin>
    </div>
  </>
);

export default AccountantDashboard; 
