import { Spin } from '../../../../components/ui/app-controls.jsx';
import React from 'react';
import { useQuery } from 'react-query';
import { Alert } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { getRecruitmentExecutiveStats } from '../../../shared/services/stats-service.js';
import StatsCard from '../../../../components/stats-card.component.jsx';
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

const RecruitmentExecutiveDashboard = () => {
  const { data, isLoading, isError } = useQuery(
    'recruitmentExecutiveStats',
    getRecruitmentExecutiveStats,
    {
      // Optional: Add query options matching manager dashboard
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
        }}
      >
        <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" />
      </div>
    );
  }

  if (isError) {
    return <Alert type="error" message="Failed to load stats" showIcon />;
  }

  // Handle different data formats from API
  let metrics = [];
  
  if (data) {
    // If data is an array of objects, extract the relevant counts
    if (Array.isArray(data)) {
      // Handle array format (e.g., from executive stats)
      metrics = data.map(item => ({
        title: item.name || 'Executive',
        count: `${item.client_count || 0} Clients, ${item.project_count || 0} Projects, ${item.job_count || 0} Jobs`,
        icon: <TeamOutlined size="1em" className="app-icon" style={{ color: '#3E6A9F' }} />,
        color: '#3E6A9F',
      }));
    } else if (typeof data === 'object') {
      // If it's a single object with these keys, extract them
      if (data.client_count !== undefined || data.project_count !== undefined) {
        metrics = [
          {
            title: 'Clients',
            count: data.client_count || 0,
            icon: <TeamOutlined size="1em" className="app-icon" style={{ color: '#3E6A9F' }} />,
            color: '#3E6A9F',
          },
          {
            title: 'Projects',
            count: data.project_count || 0,
            icon: <FolderOpenOutlined size="1em" className="app-icon" style={{ color: '#27ae60' }} />,
            color: '#27ae60',
          },
          {
            title: 'Jobs',
            count: data.job_count || 0,
            icon: <FileDoneOutlined size="1em" className="app-icon" style={{ color: '#f39c12' }} />,
            color: '#f39c12',
          },
          {
            title: 'Resources',
            count: data.resource_count || 0,
            icon: <TeamOutlined size="1em" className="app-icon" style={{ color: '#e74c3c' }} />,
            color: '#e74c3c',
          },
        ].filter(m => m.count > 0 || data.client_count !== undefined);
      } else {
        // Standard format: map over object entries
        metrics = Object.entries(data).map(([key, value]) => ({
          title: titleMap[key] || key,
          count: typeof value === 'object' ? JSON.stringify(value) : value,
          icon: iconMap[key],
          color: colorMap[key] || '#3E6A9F',
        }));
      }
    }
  }

  return (
    <div className="dashboard-container">
      <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={isLoading}>
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
      </Spin>
    </div>
  );
};

export default RecruitmentExecutiveDashboard;
