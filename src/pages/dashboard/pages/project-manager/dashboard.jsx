import React from 'react';
import StatsCard from '../../../../components/stats-card.component.jsx';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import '../../../../assets/styles/legacy/admin-dashboard-page.css';
import { Users as TeamOutlined, FolderOpen as FolderOpenOutlined, FileCheck as FileDoneOutlined, Ban as StopOutlined } from 'lucide-react';

const iconMap = {
  potential_client: <TeamOutlined size="1em" className="app-icon" style={{ color: '#3E6A9F' }} />,
  active_client: <TeamOutlined size="1em" className="app-icon" style={{ color: '#27ae60' }} />,
  lost_client: <StopOutlined size="1em" className="app-icon" style={{ color: '#e74c3c' }} />,
  pending_project: <FolderOpenOutlined size="1em" className="app-icon" style={{ color: '#f39c12' }} />,
  active_project: <FolderOpenOutlined size="1em" className="app-icon" style={{ color: '#27ae60' }} />,
  completed_project: <FileDoneOutlined size="1em" className="app-icon" style={{ color: '#3E6A9F' }} />,
  terminated_project: <StopOutlined size="1em" className="app-icon" style={{ color: '#e74c3c' }} />,
  pending_job: <FolderOpenOutlined size="1em" className="app-icon" style={{ color: '#f39c12' }} />,
  active_job: <FolderOpenOutlined size="1em" className="app-icon" style={{ color: '#27ae60' }} />,
  completed_job: <FileDoneOutlined size="1em" className="app-icon" style={{ color: '#3E6A9F' }} />,
  terminated_job: <StopOutlined size="1em" className="app-icon" style={{ color: '#e74c3c' }} />,
};

const colorMap = {
  potential_client: '#3E6A9F',
  active_client: '#27ae60',
  lost_client: '#e74c3c',
  pending_project: '#f39c12',
  active_project: '#27ae60',
  completed_project: '#3E6A9F',
  terminated_project: '#e74c3c',
  pending_job: '#f39c12',
  active_job: '#27ae60',
  completed_job: '#3E6A9F',
  terminated_job: '#e74c3c',
};

const titleMap = {
  potential_client: 'Potential Clients',
  active_client: 'Active Clients',
  lost_client: 'Lost Clients',
  pending_project: 'Pending Projects',
  active_project: 'Active Projects',
  completed_project: 'Completed Projects',
  terminated_project: 'Terminated Projects',
  pending_job: 'Pending Jobs',
  active_job: 'Active Jobs',
  completed_job: 'Completed Jobs',
  terminated_job: 'Terminated Jobs',
};

const ProjectManagerDashboard = () => {
  // Local-only dashboard: no API calls.
  // If you later want real numbers, feed them via props/store instead of fetching here.
  const stats = Object.keys(titleMap).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  const metrics = Object.entries(stats).map(([key, value]) => ({
    title: titleMap[key] || key,
    count: value,
    icon: iconMap[key],
    color: colorMap[key] || '#3E6A9F',
  }));

  return (
    <>
      <BreadCrumb linkText="Dashboard" />
      <div className="dashboard-container">
        <div className="metrics-grid">
          {metrics.length > 0 ? (
            metrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <StatsCard
                  title={metric.title}
                  value={metric.count}
                  icon={metric.icon}
                  borderColor={metric.color}
                />
              </div>
            ))
          ) : (
            <p>Nothing to show</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectManagerDashboard;
