import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Select, Spin } from 'antd';
import dayjs from 'dayjs';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import StatsCard from '../../../components/stats-card.component.jsx';
import LineChart from '../../../components/charts/line-chart.component.jsx';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import ExecutiveTabButton from '../../../components/executive-tab-button.component.jsx';
import SkeletonLoader from '../../../components/skeleton-loader.component.jsx';
import { getStats, getClientStats, getProjectStats } from '../../shared/services/manager-service.js';
import { useQuery } from 'react-query';
import {
  getExecutiveProjectsStatusOverview,
  getOverallExecutivePerformance,
  getExecutiveRiskExposure,
  getExecutiveClientOwnership,
  getExecutiveMostCostlyProjects,
  getAverageJobProject,
  getExecutiveMobilisationAmounts,
} from '../../shared/services/admin-graphs.js';
import { getClientsAndProjectsActivatedPerDay } from '../../shared/services/admin-total-leads.js';
import { getManangersExecutives } from '../../shared/services/users-service.js';
import { getLeadPotentialConversion } from '../../shared/services/leads.js';
import ActiveClientsIcon from '../../../assets/images/stat-card-icons/active-clients.svg';
import ActiveProjectsIcon from '../../../assets/images/stat-card-icons/active-projects.svg';
import CompletedProjectsIcon from '../../../assets/images/stat-card-icons/completed-projects.svg';
import DormantClientsIcon from '../../../assets/images/stat-card-icons/dormant-clients.svg';
import OpportunitiesLostIcon from '../../../assets/images/stat-card-icons/opportunities-lost.svg';
import PotentialClientsIcon from '../../../assets/images/stat-card-icons/potential-clients.svg';
import SalesExecutivesIcon from '../../../assets/images/stat-card-icons/sales-executives.svg';
import TerminatedProjectsIcon from '../../../assets/images/stat-card-icons/terminated-projects.svg';
import TargetIcon from '../../../assets/images/stat-card-icons/target-icon.svg';
import '../../../assets/styles/legacy/admin-dashboard-page.css';
import useUserStore from '../../shared/store/user-store.js';

const ExecutivePerformanceLeaderboardChart = lazy(() => import('../../../components/charts/executive-performance-leaderboard-chart.component.jsx'));
const LeadConversionToPotentialChart = lazy(() => import('../../../components/charts/lead-conversion-to-potential-chart.component.jsx'));
const ExecutiveRiskExposureChart = lazy(() => import('../../../components/charts/executive-risk-exposure-chart.component.jsx'));
const ClientsProjectsActivatedPerDayChart = lazy(() => import('../../../components/charts/clients-projects-activated-per-day-chart.component.jsx'));
const ExecutiveCostlyProjectsChart = lazy(() => import('../../../components/charts/executive-costly-projects-chart.component.jsx'));
const ExecutiveMobilisationAmountsChart = lazy(() => import('../../../components/charts/executive-mobilisation-amounts-chart.component.jsx'));
const ExecutiveProjectsStatusOverview = lazy(() => import('../../../components/charts/executive-projects-status-overview.component.jsx'));
const ExecutiveClientOwnershipChart = lazy(() => import('../../../components/charts/executive-client-ownership-chart.component.jsx'));
const AverageJobsPerProjectChart = lazy(() => import('../../../components/charts/average-jobs-per-project-chart.component.jsx'));

const { Option } = Select;

const DASHBOARD_TAB_QUERY = 'tab';

/** URL value → internal section id */
const tabQueryToSection = (tab) => {
  const t = String(tab || '').toLowerCase();
  if (t === 'performance' || t === 'sales-executives' || t === 'executives') return 'salesExecutives';
  return 'overview';
};

/** Internal section id → URL param value (null = omit for default overview) */
const sectionToTabQuery = (section) => (section === 'salesExecutives' ? 'performance' : null);

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get(DASHBOARD_TAB_QUERY);
  const activeSection = useMemo(() => tabQueryToSection(tabFromUrl), [tabFromUrl]);

  const setActiveSection = useCallback(
    (section) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const tabVal = sectionToTabQuery(section);
          if (tabVal) next.set(DASHBOARD_TAB_QUERY, tabVal);
          else next.delete(DASHBOARD_TAB_QUERY);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const [statsFilter, setStatsFilter] = useState("All");
  const [statsFilterForClientChart, setStatsFilterForClientChart] = useState("All");
  const [statsFilterForProjectChart, setStatsFilterForProjectChart] = useState("All");

  const [mostRecentTargetInfo, setMostRecentTargetInfo] = useState(null);

  // Sales Executives Performance section state
  const [selectedOverviewType, setSelectedOverviewType] = useState('Projects');
  const [selectedOverviewExecutive, setSelectedOverviewExecutive] = useState(null);
  const [executiveOverviewDateRange, setExecutiveOverviewDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executivePerformanceDateRange, setExecutivePerformanceDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executiveRiskDateRange, setExecutiveRiskDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executiveClientOwnershipDateRange, setExecutiveClientOwnershipDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executiveClientOwnershipStatus, setExecutiveClientOwnershipStatus] = useState('All');
  const [executiveCostlyProjectsDateRange, setExecutiveCostlyProjectsDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executiveCostlyProjectsStatus, setExecutiveCostlyProjectsStatus] = useState('All');
  const [executiveCostlyProjectsExecutive, setExecutiveCostlyProjectsExecutive] = useState('All');
  const [clientsProjectsActivatedDateRange, setClientsProjectsActivatedDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [clientsProjectsActivatedExecutive, setClientsProjectsActivatedExecutive] = useState('All');
  const [executiveMobilisationDateRange, setExecutiveMobilisationDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [leadConversionToPotentialDateRange, setLeadConversionToPotentialDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [averageJobProjectDateRange, setAverageJobProjectDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);


  const getMostRecentTargetInfo = (data) => {
    if (!data) return null;
  
    // Filter the keys with target info
    const targetInfoKeys = Object.keys(data).filter((key) => {
      const value = data[key];
      return value?.hasOwnProperty('target') && value?.hasOwnProperty('completed');
    });
  
    // If any target info exists, return the last one in the order
    if (targetInfoKeys.length > 0) {
      const mostRecentKey = targetInfoKeys[targetInfoKeys.length - 1];
      return { title: mostRecentKey, ...data[mostRecentKey] };
    }
  
    return null;
  };


  const {user} = useUserStore();
  const {id} = user;
  
  const [selectedTimeFrameForClientsData, setSelectedTimeFrameForClientsData] = useState('week');
  const [selectedTimeFrameForProjectsData, setSelectedTimeFrameForProjectsData] = useState('week');

  // Fetch stats with TanStack Query
  const { data: metricsData, isLoading: loadingStats } = useQuery({
    queryKey: ['managerStats', statsFilter],
    queryFn: () => getStats(undefined, false, statsFilter),  // Pass the `id` as argument to getStats
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30,
  });

  // Fetch client stats with TanStack Query, dependent on selectedTimeFrameForClientsData
  const {
    data: clientData,
    isLoading: loadingClientStats,
  } = useQuery({
    queryKey: ['clientStats', selectedTimeFrameForClientsData, statsFilterForClientChart],
    queryFn: () => getClientStats(selectedTimeFrameForClientsData, undefined, statsFilterForClientChart),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30,
  });

  // Fetch project stats with TanStack Query, dependent on selectedTimeFrameForProjectsData
  const {
    data: projectData,
    isLoading: loadingProjectStats,
  } = useQuery({
    queryKey: ['projectStats', selectedTimeFrameForProjectsData, statsFilterForProjectChart],
    queryFn: () => getProjectStats(selectedTimeFrameForProjectsData, undefined, statsFilterForProjectChart),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30,
  });

  const { unassigned, ...filteredStats } = projectData?.stats || {};

  const transformedProjectStats = filteredStats;

  // Executives list for Sales Executives Performance (sales manager sees their team)
  const { data: assigningExecutives } = useQuery({
    queryKey: ['managerAssigningExecutives'],
    queryFn: () => getManangersExecutives('sales_manager'),
    enabled: activeSection === 'salesExecutives',
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const EXECUTIVES_LIST = useMemo(() => {
    const raw = assigningExecutives?.data || assigningExecutives || [];
    return (Array.isArray(raw) ? raw : [])
      .filter((user) => user.user_type === 'sales_executive')
      .map((user) => ({
        id: user.id,
        name: user.name || user.full_name || user.username || user.email,
      }));
  }, [assigningExecutives]);

  const showSalesExecutives = activeSection === 'salesExecutives';

  const { data: leadConversionToPotentialData = {}, isLoading: loadingLeadConversionToPotential } = useQuery({
    queryKey: ['leadPotentialConversion', leadConversionToPotentialDateRange],
    queryFn: async () => {
      const [start, end] = leadConversionToPotentialDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      const res = await getLeadPotentialConversion({ start_date: toDateString(start), end_date: toDateString(end) });
      const data = res?.data || {};
      return { Meta: data.Meta ?? [], Data: data.Data ?? [], Website: data.Website ?? [] };
    },
    enabled: showSalesExecutives,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const { data: executivePerformanceData = [], isLoading: loadingExecutivePerformance } = useQuery({
    queryKey: ['overallExecutivePerformance', executivePerformanceDateRange],
    queryFn: () => {
      const [start, end] = executivePerformanceDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getOverallExecutivePerformance({ startDate: toDateString(start), endDate: toDateString(end) });
    },
    enabled: showSalesExecutives,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const { data: executiveRiskExposureData = [], isLoading: loadingExecutiveRisk } = useQuery({
    queryKey: ['executiveRiskExposure', executiveRiskDateRange],
    queryFn: () => {
      const [start, end] = executiveRiskDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getExecutiveRiskExposure({ startDate: toDateString(start), endDate: toDateString(end) });
    },
    enabled: showSalesExecutives,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const { data: clientsProjectsActivatedData = [], isLoading: loadingClientsProjectsActivated } = useQuery({
    queryKey: ['clientsProjectsActivatedPerDay', clientsProjectsActivatedDateRange, clientsProjectsActivatedExecutive],
    queryFn: () => {
      const [start, end] = clientsProjectsActivatedDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getClientsAndProjectsActivatedPerDay({
        startDate: toDateString(start),
        endDate: toDateString(end),
        executiveId: clientsProjectsActivatedExecutive,
      });
    },
    enabled: showSalesExecutives,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const { data: executiveMostCostlyProjectsData = [], isLoading: loadingExecutiveMostCostly } = useQuery({
    queryKey: ['executiveMostCostlyProjects', executiveCostlyProjectsDateRange, executiveCostlyProjectsStatus],
    queryFn: () => {
      const [start, end] = executiveCostlyProjectsDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getExecutiveMostCostlyProjects({
        startDate: toDateString(start),
        endDate: toDateString(end),
        status: executiveCostlyProjectsStatus,
      });
    },
    enabled: showSalesExecutives,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const { data: executiveMobilisationRaw = {}, isLoading: loadingExecutiveMobilisation } = useQuery({
    queryKey: ['executiveMobilisationAmounts', executiveMobilisationDateRange],
    queryFn: () => {
      const [start, end] = executiveMobilisationDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getExecutiveMobilisationAmounts({ startDate: toDateString(start), endDate: toDateString(end) });
    },
    enabled: showSalesExecutives,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const executiveMobilisationData = useMemo(() => {
    const raw = executiveMobilisationRaw || {};
    const all = [
      ...(Array.isArray(raw.Meta) ? raw.Meta : []),
      ...(Array.isArray(raw.Data) ? raw.Data : []),
      ...(Array.isArray(raw.Website) ? raw.Website : []),
    ];
    const byKey = {};
    all.forEach((item) => {
      const id = item.assigned_to_id ?? item.assigned_to_name ?? 'unassigned';
      const name = item.assigned_to_name || 'Unassigned';
      const val = Number(item.mobilisation_amount) || 0;
      if (!byKey[id]) byKey[id] = { assigned_to_id: item.assigned_to_id, assigned_to_name: name, mobilisation_amount: 0 };
      byKey[id].mobilisation_amount += val;
    });
    return Object.values(byKey).sort((a, b) => (b.mobilisation_amount || 0) - (a.mobilisation_amount || 0));
  }, [executiveMobilisationRaw]);

  const { data: executiveOverviewData = [], isLoading: loadingExecutiveOverview } = useQuery({
    queryKey: ['executiveProjectsStatusOverview', selectedOverviewType, selectedOverviewExecutive, executiveOverviewDateRange],
    queryFn: () => {
      const [start, end] = executiveOverviewDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getExecutiveProjectsStatusOverview({
        startDate: toDateString(start),
        endDate: toDateString(end),
        executiveId: selectedOverviewExecutive ?? undefined,
        type: selectedOverviewType,
      });
    },
    enabled: showSalesExecutives,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const { data: executiveClientOwnershipData = [], isLoading: loadingExecutiveClientOwnership } = useQuery({
    queryKey: ['executiveClientOwnership', executiveClientOwnershipDateRange, executiveClientOwnershipStatus],
    queryFn: () => {
      const [start, end] = executiveClientOwnershipDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getExecutiveClientOwnership({
        startDate: toDateString(start),
        endDate: toDateString(end),
        status: executiveClientOwnershipStatus === 'All' || (Array.isArray(executiveClientOwnershipStatus) && executiveClientOwnershipStatus.length === 0) ? undefined : executiveClientOwnershipStatus,
      });
    },
    enabled: showSalesExecutives,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const { data: averageJobProjectRaw = {}, isLoading: loadingAverageJobProject } = useQuery({
    queryKey: ['averageJobProject', averageJobProjectDateRange],
    queryFn: () => {
      const [start, end] = averageJobProjectDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getAverageJobProject({ startDate: toDateString(start), endDate: toDateString(end) });
    },
    enabled: showSalesExecutives,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (metricsData) {
      const recentTarget = getMostRecentTargetInfo(metricsData);
      setMostRecentTargetInfo(recentTarget);
    }
  }, [metricsData]);


  // Prepare metrics for display with robust null checking
  const metrics = metricsData
    ? [
        { title: 'Sales Executives', icon: SalesExecutivesIcon, count: metricsData?.sales_executive_stats?.count ?? 0, color: '#3E6A9F', percentage: metricsData?.sales_executive_stats?.trend ?? 0},
        { title: 'Potential Clients', icon: PotentialClientsIcon, count: metricsData?.potential_client_stats?.count ?? 0, color: '#06004D', percentage: metricsData?.potential_client_stats?.trend ?? 0 },
        { title: 'Dormant Clients', icon: DormantClientsIcon, count: metricsData?.dormant_client_stats?.count ?? 0, color: '#FFD233', percentage: metricsData?.dormant_client_stats?.trend ?? 0 },
        { title: 'Active Clients', icon: ActiveClientsIcon, count: metricsData?.active_client_stats?.count ?? 0, color: '#32D16D', percentage: metricsData?.active_client_stats?.trend ?? 0 },
        { title: 'Active Projects', icon: ActiveProjectsIcon, count: metricsData?.active_project_stats?.count ?? 0, color: '#008000', percentage: metricsData?.active_project_stats?.trend ?? 0 },
        { title: 'Completed Projects', icon: CompletedProjectsIcon, count: metricsData?.completed_project_stats?.count ?? 0, color: '#2DB1F8', percentage: metricsData?.completed_project_stats?.trend ?? 0 },
        { title: 'Opportunities Lost', icon: OpportunitiesLostIcon, count: metricsData?.opportunity_lost_stats?.count ?? 0, color: '#EE0101', percentage: metricsData?.opportunity_lost_stats?.trend ?? 0 },
        { title: 'Terminated Projects', icon: TerminatedProjectsIcon, count: metricsData?.terminated_project_stats?.count ?? 0, color: '#FEBAC6', percentage: metricsData?.terminated_project_stats?.trend ?? 0 },
        { title: 'Companies Reached', icon: TargetIcon, count: `${metricsData?.companies_reached?.completed ?? 0}/${metricsData?.companies_reached?.target ?? 0}`, color: '#C7A109', completed: metricsData?.companies_reached?.completed ?? 0, target: metricsData?.companies_reached?.target ?? 0},
        { title: 'Companies Registered', icon: TargetIcon, count: `${metricsData?.companies_registered?.completed ?? 0}/${metricsData?.companies_registered?.target ?? 0}`, color: '#C7A109', completed: metricsData?.companies_registered?.completed ?? 0, target: metricsData?.companies_registered?.target ?? 0},
        { title: 'Applications Received', icon: TargetIcon, count: `${metricsData?.applications_received?.completed ?? 0}/${metricsData?.applications_received?.target ?? 0}`, color: '#C7A109', completed: metricsData?.applications_received?.completed ?? 0, target: metricsData?.applications_received?.target ?? 0},
        { title: 'Hired', icon: TargetIcon, count: `${metricsData?.hired?.completed ?? 0}/${metricsData?.hired?.target ?? 0}`, color: '#C7A109', completed: metricsData?.hired?.completed ?? 0, target: metricsData?.hired?.target ?? 0},
        { title: 'Jobs Posted', icon: TargetIcon, count: `${metricsData?.job_posted?.completed ?? 0}/${metricsData?.job_posted?.target ?? 0}`, color: '#C7A109', completed: metricsData?.job_posted?.completed ?? 0, target: metricsData?.job_posted?.target ?? 0},
        { title: 'Candidates Reached', icon: TargetIcon, count: `${metricsData?.candidates_reached?.completed ?? 0}/${metricsData?.candidates_reached?.target ?? 0}`, color: '#C7A109', completed: metricsData?.candidates_reached?.completed ?? 0, target: metricsData?.candidates_reached?.target ?? 0},
        { title: 'Candidates Registered', icon: TargetIcon, count: `${metricsData?.candidate_registered?.completed ?? 0}/${metricsData?.candidate_registered?.target ?? 0}`, color: '#C7A109', completed: metricsData?.candidate_registered?.completed ?? 0, target: metricsData?.candidate_registered?.target ?? 0}
      ]
    : [];

  const handleTimeFrameFromClientStats = (value) => setSelectedTimeFrameForClientsData(value);
  const handleTimeFrameFromProjectStats = (value) => setSelectedTimeFrameForProjectsData(value);

  return (
    <>
      <BreadCrumb linkText="Dashboard" />
      <div className="dashboard-container">

      <div className="admin-dashboard-section-tabs" style={{ marginBottom: 16 }}>
        <span style={{ marginLeft: 6, marginRight: 6 }}>
          <ExecutiveTabButton
            executive={{ id: 'overview' }}
            label="Overview"
            showRoleSuffix={false}
            showCount={false}
            isSelected={activeSection === 'overview'}
            onClick={() => setActiveSection('overview')}
            className="executive-section-tab"
          />
        </span>
        <span style={{ marginLeft: 6, marginRight: 6 }}>
          <ExecutiveTabButton
            executive={{ id: 'sales-executives' }}
            label="Sales Executives Performance"
            showRoleSuffix={false}
            showCount={false}
            isSelected={activeSection === 'salesExecutives'}
            onClick={() => setActiveSection('salesExecutives')}
            className="executive-section-tab"
          />
        </span>
      </div>

      {activeSection === 'overview' && (
      <>
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
                      // Check for target and completed values
                      if (metric.target === 0 && metric.completed === 0) {
                        return 0; // If both are 0, consider completion as 0%
                      }
                      if (metric.target === 0) {
                        return 0; // If target is 0 but completed > 0, consider completion as 0% (or handle this case however you'd like)
                      }
                      if (metric.completed === 0) {
                        return 0; // If completed is 0 but target > 0, consider completion as 0%
                      }
                      // Otherwise, calculate the percentage
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

        <div className="metrics-right-section">

          {/* <button className="target-listing-page-btn" onClick={() => navigate('/sales-manager/target-listing')}>
            Add New Client
          </button> */}


          <Select defaultValue={statsFilter} style={{ width: 150 }} onChange={(value) => setStatsFilter(value)}>
            <Option value="All">All</Option>
            <Option value="My Stats">My Stats</Option>
            <Option value="Executive Stats">Executive Stats</Option>
          </Select>
        </div>

      </div>

      </Spin>



        {/* Client Chart Section */}
        <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingClientStats}>
          <div className="chart-container">
            <LineChart
              title="Clients Stats"
              data={{
                active: clientData?.stats?.active ?? 0,
                potential: clientData?.stats?.potential ?? 0,
                dormant: clientData?.stats?.dormant ?? 0,
                lost: clientData?.stats?.opportunities_lost ?? 0,
              }}
              categories={clientData?.dates || []}
              legendNames={['Active', 'Potential', 'Dormant', 'Opportunities Lost']}
              colors={['#ff0000', '#000080', '#f6c23e', '#28a745']}
              selectedTimeframe={selectedTimeFrameForClientsData}
              onTimeFrameChange={handleTimeFrameFromClientStats}
              addOrderByFilter = {true}
              statsFilter = {statsFilterForClientChart}
              handleStatsFilterChange = {setStatsFilterForClientChart}
            />
          </div>
        </Spin>

        
        {/* Project Chart Section */}
        <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingProjectStats}>
          <div className="chart-container">
            <LineChart
              title="Project Stats"
              data={transformedProjectStats ?? {}}
              categories={projectData?.dates || []}
              legendNames={['Completed', 'Active', 'Terminated']}
              colors={['#1E90FF', '#28a745','#6c757d']}
              selectedTimeframe={selectedTimeFrameForProjectsData}
              onTimeFrameChange={handleTimeFrameFromProjectStats}
              addOrderByFilter = {true}
              statsFilter = {statsFilterForProjectChart}
              handleStatsFilterChange = {setStatsFilterForProjectChart}
            />
          </div>
        </Spin>
      </>
      )}

      {activeSection === 'salesExecutives' && (
        <Suspense fallback={<SkeletonLoader type="chart" />}>
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <ExecutivePerformanceLeaderboardChart
              title="Overall Executive Performance Leaderboard"
              subtitle="Ranking by highest revenue generated"
              data={executivePerformanceData}
              isLoading={loadingExecutivePerformance}
              dateRange={executivePerformanceDateRange}
              onDateRangeChange={setExecutivePerformanceDateRange}
              emptyMessage="No performance data to display"
            />
          </div>
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <LeadConversionToPotentialChart
              title="Lead Conversion to Potential Clients"
              subtitle="Sum of all leads converted to Potential Client per Executive"
              dataBySource={leadConversionToPotentialData}
              isLoading={loadingLeadConversionToPotential}
              emptyMessage="No lead conversion to potential clients data to display"
            />
          </div>
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <ExecutiveRiskExposureChart
              title="Potential Projects Payment Per Executive"
              subtitle="Sum of contract amounts of all pending projects per Executive"
              data={executiveRiskExposureData}
              isLoading={loadingExecutiveRisk}
              dateRange={executiveRiskDateRange}
              onDateRangeChange={setExecutiveRiskDateRange}
              emptyMessage="No pending projects with contract data"
            />
          </div>
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <ClientsProjectsActivatedPerDayChart
              title="Clients and Projects Activated Per Day"
              subtitle="Show activated clients and projects as two separate vertical bars per day"
              data={clientsProjectsActivatedData}
              isLoading={loadingClientsProjectsActivated}
              dateRange={clientsProjectsActivatedDateRange}
              onDateRangeChange={setClientsProjectsActivatedDateRange}
              executives={EXECUTIVES_LIST}
              selectedExecutive={clientsProjectsActivatedExecutive}
              onExecutiveChange={setClientsProjectsActivatedExecutive}
              emptyMessage="No activated clients or projects in this period"
            />
          </div>
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <ExecutiveCostlyProjectsChart
              title="Contract Amounts Per Executive"
              subtitle="Sum of contract amounts of projects per Executive"
              data={executiveMostCostlyProjectsData}
              selectedStatus={executiveCostlyProjectsStatus}
              onStatusChange={setExecutiveCostlyProjectsStatus}
              executives={EXECUTIVES_LIST}
              selectedExecutive={executiveCostlyProjectsExecutive}
              onExecutiveChange={setExecutiveCostlyProjectsExecutive}
              isLoading={loadingExecutiveMostCostly}
              dateRange={executiveCostlyProjectsDateRange}
              onDateRangeChange={setExecutiveCostlyProjectsDateRange}
              emptyMessage="No completed projects with contract data"
            />
          </div>
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <ExecutiveMobilisationAmountsChart
              title="Mobilisation Amounts per Executive"
              data={executiveMobilisationData}
              isLoading={loadingExecutiveMobilisation}
              dateRange={executiveMobilisationDateRange}
              onDateRangeChange={setExecutiveMobilisationDateRange}
              emptyMessage="No mobilisation data to display"
            />
          </div>
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <ExecutiveProjectsStatusOverview
              title={`Executive ${selectedOverviewType} Status Overview`}
              subtitle={selectedOverviewType === 'Jobs' ? 'Job count by status (Pending, Active, Completed, etc.) per Executive' : 'Project count by status (Pending, Active, Completed, etc.) per Executive'}
              data={executiveOverviewData}
              selectedType={selectedOverviewType}
              onTypeChange={setSelectedOverviewType}
              selectedExecutive={selectedOverviewExecutive}
              onExecutiveChange={setSelectedOverviewExecutive}
              executives={EXECUTIVES_LIST}
              isLoading={loadingExecutiveOverview}
              dateRange={executiveOverviewDateRange}
              onDateRangeChange={setExecutiveOverviewDateRange}
              emptyMessage="Select an executive to view status overview"
            />
          </div>
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <ExecutiveClientOwnershipChart
              title="Projects Per Executive"
              subtitle="Count of projects per executive by selected status"
              data={executiveClientOwnershipData}
              selectedStatus={executiveClientOwnershipStatus}
              onStatusChange={setExecutiveClientOwnershipStatus}
              isLoading={loadingExecutiveClientOwnership}
              dateRange={executiveClientOwnershipDateRange}
              onDateRangeChange={setExecutiveClientOwnershipDateRange}
              emptyMessage="No project data to display"
            />
          </div>
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <AverageJobsPerProjectChart
              title="Average Jobs per Project"
              dataBySource={averageJobProjectRaw}
              isLoading={loadingAverageJobProject}
              dateRange={averageJobProjectDateRange}
              onDateRangeChange={setAverageJobProjectDateRange}
              emptyMessage="No average job project data to display"
            />
          </div>
        </Suspense>
      )}

      </div>
    </>
  );
};

export default DashboardPage;
