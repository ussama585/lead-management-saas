import RoleLeadDashboard from '../../../../components/charts/role-lead-dashboard.jsx';
import { Spin } from '../../../../components/ui/app-controls.jsx';
import React from 'react';
import RoleLeadStatusHealth from '../../../../components/charts/role-lead-status-health.jsx';

import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import StatsCard from '../../../../components/stats-card.component.jsx';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { getStats } from '../../../shared/services/executive-service.js';
import { useQuery } from 'react-query';
import ActiveClientsIcon from '../../../../assets/images/stat-card-icons/active-clients.svg';
import ActiveProjectsIcon from '../../../../assets/images/stat-card-icons/active-projects.svg';
import CompletedProjectsIcon from '../../../../assets/images/stat-card-icons/completed-projects.svg';
import DormantClientsIcon from '../../../../assets/images/stat-card-icons/dormant-clients.svg';
import OpportunitiesLostIcon from '../../../../assets/images/stat-card-icons/opportunities-lost.svg';
import PotentialClientsIcon from '../../../../assets/images/stat-card-icons/potential-clients.svg';
import TerminatedProjectsIcon from '../../../../assets/images/stat-card-icons/terminated-projects.svg';
import TargetIcon from '../../../../assets/images/stat-card-icons/target-icon.svg';
import '../../../../assets/styles/legacy/admin-dashboard-page.css';

const STAT_CONFIG = {
  potential_client_stats: { title: 'Potential Clients', icon: PotentialClientsIcon, color: '#06004D' },
  dormant_client_stats: { title: 'Dormant Clients', icon: DormantClientsIcon, color: '#FFD233' },
  active_client_stats: { title: 'Active Clients', icon: ActiveClientsIcon, color: '#32D16D' },
  completed_client_stats: { title: 'Completed Clients', icon: CompletedProjectsIcon, color: '#2DB1F8' },
  lost_client_stats: { title: 'Lost Clients', icon: OpportunitiesLostIcon, color: '#EE0101' },
  opportunity_lost_stats: { title: 'Opportunities Lost', icon: OpportunitiesLostIcon, color: '#EE0101' },
  active_project_stats: { title: 'Active Projects', icon: ActiveProjectsIcon, color: '#008000' },
  completed_project_stats: { title: 'Completed Projects', icon: CompletedProjectsIcon, color: '#2DB1F8' },
  delayed_project_stats: { title: 'Delayed Projects', icon: ActiveProjectsIcon, color: '#FF8C00' },
  terminated_project_stats: { title: 'Terminated Projects', icon: TerminatedProjectsIcon, color: '#FEBAC6' },
  active_job_stats: { title: 'Active Jobs', icon: ActiveProjectsIcon, color: '#008000' },
  completed_job_stats: { title: 'Completed Jobs', icon: CompletedProjectsIcon, color: '#2DB1F8' },
  pending_job_stats: { title: 'Pending Jobs', icon: PotentialClientsIcon, color: '#C7A109' },
  delayed_job_stats: { title: 'Delayed Jobs', icon: ActiveProjectsIcon, color: '#FF8C00' },
  terminated_job_stats: { title: 'Terminated Jobs', icon: TerminatedProjectsIcon, color: '#FEBAC6' },
  website_leads_stats: { title: 'Website Leads', icon: TargetIcon, color: '#C7A109' },
  data_leads_stats: { title: 'Data Leads', icon: TargetIcon, color: '#C7A109' },
  meta_leads_stats: { title: 'Meta Leads', icon: TargetIcon, color: '#C7A109' },
};

const titleFromKey = (key) =>
  key
    .replace(/_stats$/, '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const DashboardPage = () => {
  const { data: metricsData, isLoading: loadingStats } = useQuery({
    queryKey: ['executiveStats'],
    queryFn: () => getStats(undefined),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const metrics = metricsData
    ? Object.entries(metricsData)
        .filter(([, value]) => value && typeof value === 'object')
        .map(([key, value]) => {
          const stat = STAT_CONFIG[key] || {};
          const hasCountTrend = Object.prototype.hasOwnProperty.call(value, 'count');
          const hasTarget = Object.prototype.hasOwnProperty.call(value, 'completed') && Object.prototype.hasOwnProperty.call(value, 'target');

          if (hasCountTrend) {
            return {
              title: stat.title || titleFromKey(key),
              icon: stat.icon || TargetIcon,
              count: value?.count ?? 0,
              color: stat.color || '#C7A109',
              percentage: value?.trend ?? 0,
            };
          }

          if (hasTarget) {
            const completed = value?.completed ?? 0;
            const target = value?.target ?? 0;
            return {
              title: stat.title || titleFromKey(key),
              icon: stat.icon || TargetIcon,
              count: `${completed}/${target}`,
              color: stat.color || '#C7A109',
              completed,
              target,
            };
          }

          return null;
        })
        .filter(Boolean)
    : [];

  return (
    <>
      <BreadCrumb linkText="Dashboard" />
      <div className="dashboard-container">
        <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingStats}>
          <div className="metrics-container">
            <div className="metrics-left-section">
              <div className="metrics-grid">
                {metrics.length > 0 ? (
                  metrics.map((metric, index) => (
                    <div key={index} className="metric-card">
                      <StatsCard
                        title={metric.title}
                        value={metric.count || 0}
                        percentage={metric.percentage || 0}
                        icon={<img src={metric.icon} alt={metric.title} style={{ width: '48px', height: '48px' }} />}
                        borderColor={metric.color}
                        {...(metric.target !== undefined && metric.completed !== undefined && {
                          isTarget: true,
                          completion: (() => {
                            if (metric.target === 0 && metric.completed === 0) return 0;
                            if (metric.target === 0) return 0;
                            if (metric.completed === 0) return 0;
                            return Math.round((metric.completed / metric.target) * 100);
                          })(),
                        })}
                      />
                    </div>
                  ))
                ) : (
                  <p>Nothing to show</p>
                )}
              </div>
            </div>
          </div>
        </Spin>
        <><RoleLeadDashboard /><RoleLeadStatusHealth /></>
      </div>
    </>
  );
};

export default DashboardPage;
