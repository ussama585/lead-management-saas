import React, { lazy, Suspense, useState, useMemo } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

//components
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import SkeletonLoader from '../../../../components/skeleton-loader.component.jsx';
import ExecutiveTabButton from '../../../../components/executive-tab-button.component.jsx';

//hooks
import { useQueryApi } from '../../../../components/hooks/useQueryApi.js';
import { useQuery } from 'react-query';

//css
import '../../../../assets/styles/legacy/admin-dashboard-page.css';
import '../../../../assets/styles/dashboard-charts.css';

//constants
import { statsConfig } from './dashboard-constants.jsx';

//services
import {
  getExecutiveProjectsStatusOverview,
  getRecruiterStatusBreakdown,
  getOverallExecutivePerformance,
  getExecutiveRiskExposure,
  getExecutiveClientOwnership,
  getExecutiveMostCostlyProjects,
  getLeadsDistributionStatusBreakdown,
  getRecruiterRiskExposure,
  getAverageJobProject,
  getSystemLeadFunnel,
  getLeadStatusDistribution,
  getSuperAdminLeadStatusDistribution,
  getProjectStatusHealth,
  getExecutiveMobilisationAmounts,
  getSuperAdminMobilisationAmounts,
  getRecruiterResumeSubmissionVolume,
  getLeadsStatusHealth,
  getRecruiterStats,
  getRecruiterProjectInvolvement,
  getJobResumeHiredStats,
} from '../../../shared/services/admin-graphs.js';
import {
  getTotalLeadsReceived,
  getSuperAdminTotalLeadsReceived,
  getOverallLeadConversionRate,
  getClientsAndProjectsActivatedPerDay,
} from '../../../shared/services/admin-total-leads.js';
import { getManangersExecutives } from '../../../shared/services/users-service.js';
import { getLeadPotentialConversion } from '../../../shared/services/leads.js';

// Standard chart imports (must stay before lazy const declarations)
import StatsCard from '../../../../components/stats-card.component.jsx';
import SuperAdminStats from './super-admin-stats.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import { isSuperAdmin } from '../../../auth/role-access.js';
import { selectedCompany } from '../../../shared/utils/company-filter.js';
import { Button } from '../../../../components/ui/button.jsx';
import SalesPerformancePreview from '../../../../components/charts/sales-performance-preview.jsx';
import LeadsDistributionStatusBreakdownChart from '../../../../components/charts/leads-distribution-status-breakdown-chart.component.jsx';
import LeadStatusDistributionChart from '../../../../components/charts/lead-status-distribution-chart.component.jsx';
import ProjectStatusHealthHorizontalChart from '../../../../components/charts/project-status-health-horizontal-chart.component.jsx';

// Lazy load heavy chart components
const ExecutiveProjectsStatusOverview = lazy(() => import('../../../../components/charts/executive-projects-status-overview.component.jsx'));
const ExecutiveCostlyProjectsChart = lazy(() => import('../../../../components/charts/executive-costly-projects-chart.component.jsx'));
const ExecutiveClientOwnershipChart = lazy(() => import('../../../../components/charts/executive-client-ownership-chart.component.jsx'));
const ExecutiveRiskExposureChart = lazy(() => import('../../../../components/charts/executive-risk-exposure-chart.component.jsx'));
const ExecutivePerformanceLeaderboardChart = lazy(() => import('../../../../components/charts/executive-performance-leaderboard-chart.component.jsx'));
const RecruiterProjectInvolvementChart = lazy(() => import('../../../../components/charts/recruiter-project-involvement-chart.component.jsx'));
const RecruiterResumeStatusBreakdownChart = lazy(() => import('../../../../components/charts/recruiter-resume-status-breakdown-chart.component.jsx'));
const RecruiterResumeSubmissionVolumeChart = lazy(() => import('../../../../components/charts/recruiter-resume-submission-volume-chart.component.jsx'));
const RecruiterRiskExposureChart = lazy(() => import('../../../../components/charts/recruiter-risk-exposure-chart.component.jsx'));
const RecruiterPerformanceLeaderboardChart = lazy(() => import('../../../../components/charts/recruiter-performance-leaderboard-chart.component.jsx'));
const AverageJobsPerProjectChart = lazy(() => import('../../../../components/charts/average-jobs-per-project-chart.component.jsx'));
const SystemLeadFunnelOverviewChart = lazy(() => import('../../../../components/charts/system-lead-funnel-overview-chart.component.jsx'));
const TotalLeadsReceivedChart = lazy(() => import('../../../../components/charts/total-leads-received-chart.component.jsx'));
const ClientsProjectsActivatedPerDayChart = lazy(() => import('../../../../components/charts/clients-projects-activated-per-day-chart.component.jsx'));
const OverallLeadConversionRateChart = lazy(() => import('../../../../components/charts/overall-lead-conversion-rate-chart.component.jsx'));
const ProjectStatusHealthChart = lazy(() => import('../../../../components/charts/project-status-health-chart.component.jsx'));
const ExecutiveMobilisationAmountsChart = lazy(() => import('../../../../components/charts/executive-mobilisation-amounts-chart.component.jsx'));
const LeadConversionToPotentialChart = lazy(() => import('../../../../components/charts/lead-conversion-to-potential-chart.component.jsx'));
const CvPoolSourceHiredChart = lazy(() => import('../../../../components/charts/cv-pool-source-hired-chart.component.jsx'));

const ROW = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 };
const COL = { flex: '1 1 380px', minWidth: 320, display: 'flex' };

const VALID_TAB_KEYS = ['systemStats', 'salesExecutives', 'systemLeads'];
const DEFAULT_TAB = 'systemStats';
const DEMO_SYSTEM_STATS = {
  user_stats: { count: 248, trend: 12.5 },
  sales_manager_stats: { count: 18, trend: 5.9 },
  sales_executive_stats: { count: 96, trend: 8.4 },
  recruitment_manager_stats: { count: 12, trend: 0 },
  recruitment_executive_stats: { count: 64, trend: -3.2 },
  marketing_manager_stats: { count: 8, trend: 14.3 },
  accountant_stats: { count: 6, trend: 0 },
  data_entry_executive: { count: 44, trend: 10 },
  headhunting_client_stats: { count: 325, trend: 6.8 },
  headhunting_project_stats: { count: 182, trend: -2.1 },
  headhunting_jobs_stats: { count: 746, trend: 15.4 },
  data_leads_stats: { count: 3840, trend: 18.6 },
  meta_leads_stats: { count: 2156, trend: -4.2 },
  lead_generation_request_stats: { count: 1284, trend: 9.7 },
};

// Tabbed section with its own state so that the rest of the
// dashboard does not re-render when switching tabs.
export function DashboardTabsSection() {
  const currentUser = useUserStore(state => state.user);
  const superAdmin = isSuperAdmin(currentUser?.user_type);
  const [showDemoStats, setShowDemoStats] = useState(() => !new URLSearchParams(window.location.search).has('company_id'));
  const [searchParams, setSearchParams] = useSearchParams();
  const mobilisationCompanyId = superAdmin ? selectedCompany(searchParams.toString()) : null;
  const tabFromUrl = searchParams.get('tab') || searchParams.get('selected');
  const activeSection = VALID_TAB_KEYS.includes(tabFromUrl) ? tabFromUrl : DEFAULT_TAB;

  const handleTabChange = (tabKey) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabKey);
    setSearchParams(next, { replace: true });
  };
  const [selectedOverviewType, setSelectedOverviewType] = useState('Projects');
  const [selectedOverviewExecutive, setSelectedOverviewExecutive] = useState(null);
  const [executiveOverviewDateRange, setExecutiveOverviewDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [recruiterInvolvementDateRange, setRecruiterInvolvementDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [recruiterPerformanceDateRange, setRecruiterPerformanceDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [recruiterStatusDateRange, setRecruiterStatusDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [recruiterStatusBreakdownStatuses, setRecruiterStatusBreakdownStatuses] = useState(['Hired']);
  const [recruiterSubmissionDateRange, setRecruiterSubmissionDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executivePerformanceDateRange, setExecutivePerformanceDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executiveRiskDateRange, setExecutiveRiskDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executiveClientOwnershipDateRange, setExecutiveClientOwnershipDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executiveClientOwnershipStatus, setExecutiveClientOwnershipStatus] = useState('All');
  const [executiveCostlyProjectsDateRange, setExecutiveCostlyProjectsDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executiveCostlyProjectsStatus, setExecutiveCostlyProjectsStatus] = useState('All');
  const [executiveCostlyProjectsExecutive, setExecutiveCostlyProjectsExecutive] = useState('All');
  const [leadsDistributionDateRange, setLeadsDistributionDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [selectedLeadStatus, setSelectedLeadStatus] = useState('Pending Contact');
  const [recruiterRiskDateRange, setRecruiterRiskDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [averageJobProjectDateRange, setAverageJobProjectDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [systemLeadFunnelDateRange, setSystemLeadFunnelDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [totalLeadsReceivedDateRange, setTotalLeadsReceivedDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [selectedTotalLeadsPeriod, setSelectedTotalLeadsPeriod] = useState('day');
  const [leadStatusDistributionDateRange, setLeadStatusDistributionDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [clientsProjectsActivatedDateRange, setClientsProjectsActivatedDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [clientsProjectsActivatedExecutive, setClientsProjectsActivatedExecutive] = useState('All');
  const [overallConversionDateRange, setOverallConversionDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [projectStatusHealthDateRange, setProjectStatusHealthDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [leadsStatusHealthDateRange, setLeadsStatusHealthDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [executiveMobilisationDateRange, setExecutiveMobilisationDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [leadConversionToPotentialDateRange, setLeadConversionToPotentialDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [jobResumeHiredStatsDateRange, setJobResumeHiredStatsDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  // System Leads - each card has its own lead type so changing one dropdown only refetches that card's API
  const [totalLeadsReceivedLeadType, setTotalLeadsReceivedLeadType] = useState('meta');
  const [leadStatusDistributionLeadType, setLeadStatusDistributionLeadType] = useState('meta');
  const [overallConversionLeadType, setOverallConversionLeadType] = useState('meta');
  const [systemLeadFunnelLeadType, setSystemLeadFunnelLeadType] = useState('meta');
  const [leadsDistributionLeadType, setLeadsDistributionLeadType] = useState('meta');

  const toLeadTypeLabel = (v) => (v === 'data' ? 'Data' : v === 'website' ? 'Website' : 'Meta');
  const fromLeadTypeLabel = (v) => ((v || '').toLowerCase() === 'data' ? 'data' : (v || '').toLowerCase() === 'website' ? 'website' : 'meta');
  const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);

  // Admin statistics cards (only load when System Stats tab is active)
  const {
    data: metricsData,
    isLoading: loadingStats,
  } = useQueryApi({
    key: ['adminStats'],
    url: '/admin-stats/',
    enabled: activeSection === 'systemStats' && !showDemoStats && !superAdmin,
    options: {
      staleTime: 0,
      cacheTime: 0,
    },
  });

  const displayedStatsData = showDemoStats ? DEMO_SYSTEM_STATS : metricsData;
  const metrics = useMemo(() => {
    if (!displayedStatsData) return [];

    const toNumber = (v) => {
      if (v == null) return undefined;
      if (typeof v === 'number' && !Number.isNaN(v)) return v;
      if (typeof v === 'object' && v !== null && 'count' in v) return toNumber(v.count);
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    };
    const toTrend = (v) => {
      if (v == null) return undefined;
      if (typeof v === 'number' && !Number.isNaN(v)) return v;
      if (typeof v === 'object' && v !== null && 'trend' in v) return toTrend(v.trend);
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    };

    return statsConfig
      .map((statConfig) => {
        const statData = displayedStatsData[statConfig.key];
        if (!statData) return null;

        const count = toNumber(statData.count ?? statData);
        const trend = toTrend(statData.trend);
        if (count === undefined && trend === undefined) return null;

        return {
          key: statConfig.key,
          title: statConfig.title,
          icon: statConfig.icon || statConfig.iconComponent,
          count: count ?? 0,
          color: statConfig.color,
          percentage: trend,
          useSmallCard: statConfig.useSmallCard,
        };
      })
      .filter(Boolean);
  }, [displayedStatsData]);

  // Executives list (sales executives only) used in the Sales Executives Performance tab – do not call on System Stats
  const {
    data: assigningExecutives,
  } = useQuery({
    queryKey: ['assigningSalesExecutives'],
    queryFn: () => getManangersExecutives('sales_manager'),
    enabled: activeSection === 'salesExecutives',
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: leadsDistributionData = {},
    isLoading: loadingLeadsDistribution,
  } = useQuery({
    queryKey: ['leadsDistributionStatusBreakdown', selectedLeadStatus, leadsDistributionDateRange, leadsDistributionLeadType],
    queryFn: () => {
      const [start, end] = leadsDistributionDateRange || [];
      return getLeadsDistributionStatusBreakdown({
        startDate: toDateString(start),
        endDate: toDateString(end),
        status: selectedLeadStatus,
        leadType: toLeadTypeLabel(leadsDistributionLeadType),
      });
    },
    enabled: activeSection === 'systemLeads',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: systemLeadFunnelData = {},
    isLoading: loadingSystemLeadFunnel,
  } = useQuery({
    queryKey: ['systemLeadFunnel', systemLeadFunnelDateRange, systemLeadFunnelLeadType],
    queryFn: () => {
      const [start, end] = systemLeadFunnelDateRange || [];
      return getSystemLeadFunnel({
        startDate: toDateString(start),
        endDate: toDateString(end),
        leadType: toLeadTypeLabel(systemLeadFunnelLeadType),
      });
    },
    enabled: activeSection === 'systemLeads',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: totalLeadsReceivedRaw = { totalCount: 0, timeSeriesData: [] },
    isLoading: loadingTotalLeadsReceived,
    error: totalLeadsReceivedError,
    refetch: refetchTotalLeadsReceived,
  } = useQuery({
    queryKey: ['totalLeadsReceived', currentUser?.id, superAdmin, mobilisationCompanyId, totalLeadsReceivedDateRange, selectedTotalLeadsPeriod, superAdmin ? null : totalLeadsReceivedLeadType],
    queryFn: () => {
      const [start, end] = totalLeadsReceivedDateRange || [];
      if (superAdmin) return getSuperAdminTotalLeadsReceived({
        startDate: start?.format?.('YYYY-MM-DDTHH:mm:ss'),
        endDate: end?.format?.('YYYY-MM-DDTHH:mm:ss'),
        period: selectedTotalLeadsPeriod,
        companyId: mobilisationCompanyId,
      });
      return getTotalLeadsReceived({
        startDate: toDateString(start),
        endDate: toDateString(end),
        period: selectedTotalLeadsPeriod,
        leadType: toLeadTypeLabel(totalLeadsReceivedLeadType),
      });
    },
    enabled: activeSection === 'systemLeads',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const totalLeadsReceivedTotalCount = totalLeadsReceivedRaw?.totalCount ?? 0;
  const totalLeadsReceivedTimeSeries = totalLeadsReceivedRaw?.timeSeriesData ?? [];

  const {
    data: leadStatusDistributionData = [],
    isLoading: loadingLeadStatusDistribution,
    error: leadStatusDistributionError,
    refetch: refetchLeadStatusDistribution,
  } = useQuery({
    queryKey: ['leadStatusDistribution', currentUser?.id, superAdmin, mobilisationCompanyId, leadStatusDistributionDateRange, leadStatusDistributionLeadType],
    queryFn: () => {
      const [start, end] = leadStatusDistributionDateRange || [];
      const fetchDistribution = superAdmin ? getSuperAdminLeadStatusDistribution : getLeadStatusDistribution;
      return fetchDistribution({
        startDate: toDateString(start),
        endDate: toDateString(end),
        leadType: toLeadTypeLabel(leadStatusDistributionLeadType),
        ...(superAdmin && mobilisationCompanyId ? { companyId: mobilisationCompanyId } : {}),
      });
    },
    enabled: activeSection === 'systemLeads',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: clientsProjectsActivatedData = [],
    isLoading: loadingClientsProjectsActivated,
  } = useQuery({
    queryKey: ['clientsProjectsActivatedPerDay', clientsProjectsActivatedDateRange, clientsProjectsActivatedExecutive],
    queryFn: () => {
      const [start, end] = clientsProjectsActivatedDateRange || [];
      return getClientsAndProjectsActivatedPerDay({
        startDate: toDateString(start),
        endDate: toDateString(end),
        executiveId: clientsProjectsActivatedExecutive,
      });
    },
    enabled: activeSection === 'salesExecutives' || activeSection === 'systemLeads',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: overallLeadConversionRaw = { totalLeads: 0, convertedLeads: 0, conversionRate: 0 },
    isLoading: loadingOverallLeadConversion,
  } = useQuery({
    queryKey: ['overallLeadConversionRate', overallConversionDateRange, overallConversionLeadType],
    queryFn: () => {
      const [start, end] = overallConversionDateRange || [];
      return getOverallLeadConversionRate({
        startDate: toDateString(start),
        endDate: toDateString(end),
        leadType: toLeadTypeLabel(overallConversionLeadType),
      });
    },
    enabled: activeSection === 'systemLeads',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const overallConvertedCount = overallLeadConversionRaw?.convertedLeads ?? 0;
  const overallTotalCount = overallLeadConversionRaw?.totalLeads ?? 0;

  const {
    data: projectStatusHealthData = [],
    isLoading: loadingProjectStatusHealth,
  } = useQuery({
    queryKey: ['projectStatusHealth', projectStatusHealthDateRange],
    queryFn: () => {
      const [start, end] = projectStatusHealthDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getProjectStatusHealth({
        startDate: toDateString(start),
        endDate: toDateString(end),
      });
    },
    enabled: activeSection === 'systemClients' || activeSection === 'systemLeads',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: leadsStatusHealthData = [],
    isLoading: loadingLeadsStatusHealth,
  } = useQuery({
    queryKey: ['leadsStatusHealth', leadsStatusHealthDateRange],
    queryFn: () => {
      const [start, end] = leadsStatusHealthDateRange || [];
      return getLeadsStatusHealth({
        startDate: toDateString(start),
        endDate: toDateString(end),
      });
    },
    enabled: activeSection === 'systemLeads' || activeSection === 'systemClients',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const EXECUTIVES_LIST = useMemo(() => {
    const raw = assigningExecutives?.data ?? assigningExecutives;
    const list = Array.isArray(raw) ? raw : [];
    return list
      .filter((user) => user.user_type === 'sales_executive')
      .map((user) => ({
        id: user.id,
        name: user.name || user.full_name || user.username || user.email,
      }));
  }, [assigningExecutives]);

  // Lead Conversion to Potential Clients - api/lead-potential-conversion, stacked by Meta/Data/Website
  const {
    data: leadConversionToPotentialData = {},
    isLoading: loadingLeadConversionToPotential,
  } = useQuery({
    queryKey: ['leadPotentialConversion', leadConversionToPotentialDateRange],
    queryFn: async () => {
      const [start, end] = leadConversionToPotentialDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      const res = await getLeadPotentialConversion({ 
        start_date: toDateString(start), 
        end_date: toDateString(end) 
      });
      
      // Handle the data structure: check for res.data or res directly
      const raw = res?.data || res || {};
      return {
        Meta: Array.isArray(raw.Meta) ? raw.Meta : [],
        Data: Array.isArray(raw.Data) ? raw.Data : [],
        Website: Array.isArray(raw.Website) ? raw.Website : [],
      };
    },
    enabled: activeSection === 'salesExecutives',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: averageJobProjectRaw = {},
    isLoading: loadingAverageJobProject,
  } = useQuery({
    queryKey: ['averageJobProject', averageJobProjectDateRange],
    queryFn: () => {
      const [start, end] = averageJobProjectDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getAverageJobProject({
        startDate: toDateString(start),
        endDate: toDateString(end),
      });
    },
    enabled: activeSection === 'salesExecutives',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: executiveMobilisationRaw = {},
    isLoading: loadingExecutiveMobilisation,
    error: executiveMobilisationError,
    refetch: refetchExecutiveMobilisation,
  } = useQuery({
    queryKey: ['executiveMobilisationAmounts', currentUser?.id, superAdmin, mobilisationCompanyId, executiveMobilisationDateRange],
    queryFn: () => {
      const [start, end] = executiveMobilisationDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      const fetchAmounts = superAdmin ? getSuperAdminMobilisationAmounts : getExecutiveMobilisationAmounts;
      return fetchAmounts({
        startDate: toDateString(start),
        endDate: toDateString(end),
        ...(superAdmin && mobilisationCompanyId ? { companyId: mobilisationCompanyId } : {}),
      });
    },
    enabled: activeSection === 'salesExecutives',
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
      if (!byKey[id]) {
        byKey[id] = {
          assigned_to_id: item.assigned_to_id,
          assigned_to_name: name,
          mobilisation_amount: 0,
        };
      }
      byKey[id].mobilisation_amount += val;
    });
    return Object.values(byKey).sort(
      (a, b) => (b.mobilisation_amount || 0) - (a.mobilisation_amount || 0),
    );
  }, [executiveMobilisationRaw]);

  const {
    data: recruiterRiskExposureData = [],
    isLoading: loadingRecruiterRisk,
  } = useQuery({
    queryKey: ['recruiterRiskExposure', recruiterRiskDateRange],
    queryFn: () => {
      const [start, end] = recruiterRiskDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getRecruiterRiskExposure({
        startDate: toDateString(start),
        endDate: toDateString(end),
      });
    },
    enabled: activeSection === 'recruiters',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  // Executive Projects Status Overview - API (executiveId omitted when "All" selected)
  const {
    data: executiveOverviewData = [],
    isLoading: loadingExecutiveOverview,
  } = useQuery({
    queryKey: [
      'executiveProjectsStatusOverview',
      selectedOverviewType,
      selectedOverviewExecutive,
      executiveOverviewDateRange,
    ],
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
    enabled: activeSection === 'salesExecutives',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: executivePerformanceData = [],
    isLoading: loadingExecutivePerformance,
  } = useQuery({
    queryKey: ['overallExecutivePerformance', executivePerformanceDateRange],
    queryFn: () => {
      const [start, end] = executivePerformanceDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getOverallExecutivePerformance({
        startDate: toDateString(start),
        endDate: toDateString(end),
      });
    },
    enabled: activeSection === 'salesExecutives',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: executiveRiskExposureData = [],
    isLoading: loadingExecutiveRisk,
  } = useQuery({
    queryKey: ['executiveRiskExposure', executiveRiskDateRange],
    queryFn: () => {
      const [start, end] = executiveRiskDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getExecutiveRiskExposure({
        startDate: toDateString(start),
        endDate: toDateString(end),
      });
    },
    enabled: activeSection === 'salesExecutives',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: executiveClientOwnershipData = [],
    isLoading: loadingExecutiveClientOwnership,
  } = useQuery({
    queryKey: ['executiveClientOwnership', executiveClientOwnershipDateRange, executiveClientOwnershipStatus],
    queryFn: () => {
      const [start, end] = executiveClientOwnershipDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getExecutiveClientOwnership({
        startDate: toDateString(start),
        endDate: toDateString(end),
        status:
          executiveClientOwnershipStatus === 'All' ||
            (Array.isArray(executiveClientOwnershipStatus) && executiveClientOwnershipStatus.length === 0)
            ? undefined
            : executiveClientOwnershipStatus,
      });
    },
    enabled: activeSection === 'salesExecutives',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: executiveMostCostlyProjectsData = [],
    isLoading: loadingExecutiveMostCostly,
  } = useQuery({
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
    enabled: activeSection === 'salesExecutives',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: recruiterProjectInvolvementRaw = [],
    isLoading: loadingRecruiterProjectInvolvement,
  } = useQuery({
    queryKey: ['recruiterProjectInvolvement', recruiterInvolvementDateRange],
    queryFn: () => {
      const [start, end] = recruiterInvolvementDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getRecruiterProjectInvolvement({
        startDate: toDateString(start),
        endDate: toDateString(end),
      });
    },
    enabled: activeSection === 'recruiters',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: recruiterStatsRaw = [],
    isLoading: loadingRecruiterStats,
  } = useQuery({
    queryKey: ['recruiterStats', recruiterPerformanceDateRange],
    queryFn: () => {
      const [start, end] = recruiterPerformanceDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getRecruiterStats({
        startDate: toDateString(start),
        endDate: toDateString(end),
      });
    },
    enabled: activeSection === 'recruiters',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  // Keep all-time totals for "Total jobs" aligned with recruiter manager stats cards.
  // Date-filtered query above is still used for activity metrics.
  const { data: recruiterStatsAllTimeRaw = [] } = useQuery({
    queryKey: ['recruiterStatsAllTime'],
    queryFn: () => getRecruiterStats({}),
    enabled: activeSection === 'recruiters',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const recruiterProjectInvolvementData = useMemo(() => {
    return (Array.isArray(recruiterProjectInvolvementRaw) ? recruiterProjectInvolvementRaw : []).map((item) => ({
      recruiter_id: item?.recruiter_id,
      recruiter_name: item?.recruiter_name || 'Unassigned',
      project_count: Number(
        item?.project_count ?? item?.projects_count ?? item?.total_projects ?? 0,
      ),
    }));
  }, [recruiterProjectInvolvementRaw]);

  const recruiterPerformanceData = useMemo(() => {
    const list = Array.isArray(recruiterStatsRaw) ? recruiterStatsRaw : [];
    const allTimeList = Array.isArray(recruiterStatsAllTimeRaw) ? recruiterStatsAllTimeRaw : [];
    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const allTimeByRecruiterId = new Map(
      allTimeList.map((item) => [String(item?.recruiter_id ?? ''), num(item?.total_jobs)]),
    );
    return list.map((item, idx) => ({
      key: item?.recruiter_id ?? idx,
      recruiter_id: item?.recruiter_id,
      recruiter_name: item?.recruiter_name || 'Unassigned',
      total_jobs: allTimeByRecruiterId.get(String(item?.recruiter_id ?? '')) ?? num(item?.total_jobs),
      public_link_shared: num(item?.public_link_shared),
      cv_impressions: num(item?.cv_impressions),
      screening_impressions: num(item?.screening_impressions),
      shared_cv_count: num(item?.shared_cv_count),
      public_cv_received: num(item?.public_cv_received),
      recruiter_cv_received: num(item?.recruiter_cv_received),
      other_cv_received: num(item?.other_cv_received),
      total_form_responses: num(item?.total_form_responses),
    }))
      .sort((a, b) => b.total_jobs - a.total_jobs || b.total_form_responses - a.total_form_responses)
      .map((row, idx) => ({ ...row, rank: idx + 1 }));
  }, [recruiterStatsRaw, recruiterStatsAllTimeRaw]);

  const {
    data: recruiterStatusBreakdownData = [],
    isLoading: loadingRecruiterStatusBreakdown,
  } = useQuery({
    queryKey: ['recruiterStatusBreakdown', recruiterStatusDateRange, recruiterStatusBreakdownStatuses],
    queryFn: () => {
      const [start, end] = recruiterStatusDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getRecruiterStatusBreakdown({
        startDate: toDateString(start),
        endDate: toDateString(end),
        status: Array.isArray(recruiterStatusBreakdownStatuses) && recruiterStatusBreakdownStatuses.length > 0
          ? recruiterStatusBreakdownStatuses
          : undefined,
      });
    },
    enabled: activeSection === 'recruiters' || activeSection === 'cvPool',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: recruiterResumeSubmissionData = [],
    isLoading: loadingRecruiterResumeSubmission,
  } = useQuery({
    queryKey: ['recruiterResumeSubmissionVolume', recruiterSubmissionDateRange],
    queryFn: () => {
      const [start, end] = recruiterSubmissionDateRange || [];
      const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);
      return getRecruiterResumeSubmissionVolume({
        startDate: toDateString(start),
        endDate: toDateString(end),
      });
    },
    enabled: activeSection === 'recruiters' || activeSection === 'cvPool',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const {
    data: jobResumeHiredStats = { totalJoined: 0, stats: [] },
    isLoading: loadingJobResumeHiredStats,
  } = useQuery({
    queryKey: ['jobResumeHiredStats', jobResumeHiredStatsDateRange],
    queryFn: () => {
      const [start, end] = jobResumeHiredStatsDateRange || [];
      return getJobResumeHiredStats({
        startDate: toDateString(start),
        endDate: toDateString(end),
      });
    },
    enabled: activeSection === 'cvPool',
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  return (
    <>
      {/* Section Tabs (ExecutiveTabButton UI) - fixed bar with margin on each tab */}
      <div className="admin-dashboard-section-tabs">
        <span style={{ marginLeft: 6, marginRight: 6 }}>
          <ExecutiveTabButton
            executive={{ id: 'system-stats' }}
            label="System Stats"
            showRoleSuffix={false}
            showCount={false}
            isSelected={activeSection === 'systemStats'}
            onClick={() => handleTabChange('systemStats')}
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
            onClick={() => handleTabChange('salesExecutives')}
            className="executive-section-tab"
          />
        </span>
        
        <span style={{ marginLeft: 6, marginRight: 6 }}>
          <ExecutiveTabButton
            executive={{ id: 'system-leads' }}
            label="System Leads"
            showRoleSuffix={false}
            showCount={false}
            isSelected={activeSection === 'systemLeads'}
            onClick={() => handleTabChange('systemLeads')}
            className="executive-section-tab"
          />
        </span>
      </div>


      {/* SYSTEM STATS SECTION (cards) */}
      {activeSection === 'systemStats' && (
        superAdmin ? <SuperAdminStats userId={currentUser?.id} /> :
        <>
          <SalesPerformancePreview />
          <div className="my-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{showDemoStats ? 'Previewing sample stats — demo data' : 'Showing live stats'}</span>
            <button type="button" className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" onClick={() => setShowDemoStats(value => !value)}>
              {showDemoStats ? 'Show live data' : 'Show demo data'}
            </button>
          </div>
          <h2 className="admin-dashboard-section-heading">HR Management</h2>
          {!showDemoStats && loadingStats ? (
            <SkeletonLoader type="chart" />
          ) : metrics.length > 0 ? (
            <>
              {/* Regular Cards Section - fixed width, no expand */}
              <div className="admin-stat-cards-grid mb-2">
                {metrics
                  .filter((metric) => !metric.useSmallCard)
                  .map((metric, index) => {
                    const iconSize = { width: 48, height: 48 };
                    return (
                      <StatsCard
                        key={`regular-${index}`}
                        title={metric.title}
                        value={metric.count}
                        percentage={metric.percentage}
                        icon={
                          typeof metric.icon === 'string' ? (
                            <img src={metric.icon} alt={metric.title} style={iconSize} />
                          ) : (
                            metric.icon
                          )
                        }
                        borderColor={metric.color}
                      />
                    );
                  })}
              </div>


              <h2 className="admin-dashboard-section-heading">Leads</h2>

              {/* Small Cards Section - fixed width */}
              <div className="admin-stat-cards-grid">
                {metrics
                  .filter((metric) => metric.useSmallCard)
                  .map((metric, index) => {
                    const iconSize = { width: 48, height: 48 };
                    return (
                      <StatsCard
                        key={`small-${index}`}
                        title={metric.title}
                        value={metric.count}
                        percentage={metric.percentage}
                        icon={
                          typeof metric.icon === 'string' ? (
                            <img src={metric.icon} alt={metric.title} style={iconSize} />
                          ) : (
                            metric.icon
                          )
                        }
                        borderColor={metric.color}
                      />
                    );
                  })}
              </div>
            </>
          ) : (
            <p>Nothing to show</p>
          )}


        </>
      )}

      {/* SALES EXECUTIVES PERFORMANCE SECTION */}
      {activeSection === 'salesExecutives' && (
        <>
          {/* 1. Leaderboard */}
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

          {/* 2. Lead conversion to potential client */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <LeadConversionToPotentialChart
              title="Lead Conversion to Potential Clients"
              subtitle="Sum of all leads converted to Potential Client per Executive"
              dataBySource={leadConversionToPotentialData}
              isLoading={loadingLeadConversionToPotential}
              dateRange={leadConversionToPotentialDateRange}
              onDateRangeChange={setLeadConversionToPotentialDateRange}
              emptyMessage="No lead conversion to potential clients data to display"
            />
          </div>

          {/* 3. Potential Projects Payment Per Executive */}
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

          {/* 4. Clients and projects activated per day per executive/all executives */}
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

          {/* 5. Contract Amounts Per Executive */}
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

          {/* 6. Mobilisation Amounts per Executive */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            {executiveMobilisationError ? <div role="alert" className="flex items-center gap-3 rounded-md border p-4 text-destructive">
              <span>{executiveMobilisationError.message || 'Could not load mobilisation amounts.'}</span>
              <Button variant="outline" onClick={() => refetchExecutiveMobilisation()}>Retry</Button>
            </div> : <ExecutiveMobilisationAmountsChart
              title="Mobilisation Amounts per Executive"
              data={executiveMobilisationData}
              isLoading={loadingExecutiveMobilisation}
              dateRange={executiveMobilisationDateRange}
              onDateRangeChange={setExecutiveMobilisationDateRange}
              emptyMessage="No mobilisation data to display"
            />}
          </div>

          {/* 7. Projects/Jobs Per status per executive */}
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

          {/* 8. Projects Per Executive */}
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

          {/* 9. Average Jobs per Project */}
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
        </>
      )}

      {/* RECRUITERS PERFORMANCE SECTION */}
      {activeSection === 'recruiters' && (
        <>
          {/* Recruiter Project Involvement */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <RecruiterProjectInvolvementChart
              title="Project Per Recruiter"
              data={recruiterProjectInvolvementData}
              isLoading={loadingRecruiterProjectInvolvement}
              dateRange={recruiterInvolvementDateRange}
              onDateRangeChange={setRecruiterInvolvementDateRange}
              emptyMessage="No recruiter project data to display"
            />
          </div>

          <div className="chart-container" style={{ marginBottom: 6 }}>
            <RecruiterPerformanceLeaderboardChart
              title="Recruiter Performance"
              subtitle="Leaderboard by recruiter activity"
              data={recruiterPerformanceData}
              isLoading={loadingRecruiterStats}
              dateRange={recruiterPerformanceDateRange}
              onDateRangeChange={setRecruiterPerformanceDateRange}
              emptyMessage="No recruiter performance data to display"
            />
          </div>

          {/* Recruiter Resume Submission Volume */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <RecruiterResumeSubmissionVolumeChart
              title="CVs Submitted Per Recruiter"
              data={recruiterResumeSubmissionData}
              isLoading={loadingRecruiterResumeSubmission}
              dateRange={recruiterSubmissionDateRange}
              onDateRangeChange={setRecruiterSubmissionDateRange}
              emptyMessage="No resume submission data to display"
            />
          </div>

          {/* Recruiter Resume Status Breakdown */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <RecruiterResumeStatusBreakdownChart
              title=" Recruiter CV Status Breakdown"
              data={recruiterStatusBreakdownData}
              selectedStatuses={recruiterStatusBreakdownStatuses}
              onStatusChange={setRecruiterStatusBreakdownStatuses}
              isLoading={loadingRecruiterStatusBreakdown}
              dateRange={recruiterStatusDateRange}
              onDateRangeChange={setRecruiterStatusDateRange}
              emptyMessage="No resume status data to display"
            />
          </div>

          {/* Recruiter Risk Exposure */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <RecruiterRiskExposureChart
              title="Jobs With Late Submission Per Recruiter"
              subtitle="No. Of jobs for which CVs were submitted after deadline"
              data={recruiterRiskExposureData}
              isLoading={loadingRecruiterRisk}
              dateRange={recruiterRiskDateRange}
              onDateRangeChange={setRecruiterRiskDateRange}
              emptyMessage="No risk data to display"
            />
          </div>
        </>
      )}

      {/* SYSTEM LEADS SECTION */}
      {activeSection === 'systemLeads' && (
        <>
          {/* Total Leads Received */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            {totalLeadsReceivedError ? <div role="alert" className="flex items-center gap-3 rounded-md border p-4 text-destructive">
              <span>{totalLeadsReceivedError.message || 'Could not load total leads received.'}</span>
              <Button variant="outline" onClick={() => refetchTotalLeadsReceived()}>Retry</Button>
            </div> : <TotalLeadsReceivedChart
              showSourceFilter={!superAdmin}
              title="Total Leads Received"
              totalCount={totalLeadsReceivedTotalCount}
              timeSeriesData={totalLeadsReceivedTimeSeries}
              selectedPeriod={selectedTotalLeadsPeriod}
              onPeriodChange={setSelectedTotalLeadsPeriod}
              selectedSource={toLeadTypeLabel(totalLeadsReceivedLeadType)}
              onSourceChange={(nextSource) => {
                const lower = fromLeadTypeLabel(nextSource);
                if (lower) setTotalLeadsReceivedLeadType(lower);
              }}
              isLoading={loadingTotalLeadsReceived}
              dateRange={totalLeadsReceivedDateRange}
              onDateRangeChange={setTotalLeadsReceivedDateRange}
              emptyMessage="No leads received in this period"
            />}
          </div>

          {/* Clients and Projects Activated Per Day */}
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

          {/* Overall Lead Conversion Rate & System Lead Funnel Overview (same row) */}
          <div className="dual-chart-row" style={ROW}>
            <div className="dual-chart-col" style={COL}>
              <div className="dual-chart-card-wrap">
                <OverallLeadConversionRateChart
                  title="Overall Lead Conversion Rate"
                  convertedCount={overallConvertedCount}
                  totalCount={overallTotalCount}
                  selectedSource={toLeadTypeLabel(overallConversionLeadType)}
                  onSourceChange={(nextSource) => {
                    const lower = fromLeadTypeLabel(nextSource);
                    if (lower) setOverallConversionLeadType(lower);
                  }}
                  isLoading={loadingOverallLeadConversion}
                  dateRange={overallConversionDateRange}
                  onDateRangeChange={setOverallConversionDateRange}
                  emptyMessage="No conversion data to display"
                />
              </div>
            </div>
            <div className="dual-chart-col" style={COL}>
              <div className="dual-chart-card-wrap">
                <SystemLeadFunnelOverviewChart
                  title="System Lead Funnel Overview"
                  data={systemLeadFunnelData}
                  selectedSource={toLeadTypeLabel(systemLeadFunnelLeadType)}
                  onSourceChange={(nextSource) => {
                    const lower = fromLeadTypeLabel(nextSource);
                    if (lower) setSystemLeadFunnelLeadType(lower);
                  }}
                  isLoading={loadingSystemLeadFunnel}
                  dateRange={systemLeadFunnelDateRange}
                  onDateRangeChange={setSystemLeadFunnelDateRange}
                  emptyMessage="No lead funnel data to display"
                />
              </div>
            </div>
          </div>

          {/* Lead Status Distribution */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            {leadStatusDistributionError ? <div role="alert" className="flex items-center gap-3 rounded-md border p-4 text-destructive">
              <span>{leadStatusDistributionError.message || 'Could not load lead status distribution.'}</span>
              <Button variant="outline" onClick={() => refetchLeadStatusDistribution()}>Retry</Button>
            </div> : <LeadStatusDistributionChart
              title="Lead Status Distribution "
              data={leadStatusDistributionData}
              selectedSource={toLeadTypeLabel(leadStatusDistributionLeadType)}
              onSourceChange={(nextSource) => {
                const lower = fromLeadTypeLabel(nextSource);
                if (lower) setLeadStatusDistributionLeadType(lower);
              }}
              isLoading={loadingLeadStatusDistribution}
              dateRange={leadStatusDistributionDateRange}
              onDateRangeChange={setLeadStatusDistributionDateRange}
              emptyMessage="No lead status data to display"
            />}
          </div>

          {/* Leads Distribution & Status Breakdown */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <LeadsDistributionStatusBreakdownChart
              title="Leads Distribution & Status Breakdown"
              data={leadsDistributionData}
              selectedSource={toLeadTypeLabel(leadsDistributionLeadType)}
              onSourceChange={(nextSource) => {
                const lower = fromLeadTypeLabel(nextSource);
                if (lower) setLeadsDistributionLeadType(lower);
              }}
              selectedStatus={selectedLeadStatus}
              onStatusChange={setSelectedLeadStatus}
              isLoading={loadingLeadsDistribution}
              dateRange={leadsDistributionDateRange}
              onDateRangeChange={setLeadsDistributionDateRange}
              emptyMessage="No lead distribution data to display"
            />
          </div>

          {/* Project Status Health (Horizontal) */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <ProjectStatusHealthHorizontalChart
              title="Leads Status Health"
              subtitle="Sum of all system leads (Meta, Data and Website)"
              data={leadsStatusHealthData}
              isLoading={loadingLeadsStatusHealth}
              dateRange={leadsStatusHealthDateRange}
              onDateRangeChange={setLeadsStatusHealthDateRange}
              emptyMessage="No project status data to display"
            />
          </div>
        </>
      )}

      {/* SYSTEM CLIENTS SECTION */}
      {activeSection === 'systemClients' && (
        <>
          {/* Project Status Health */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <ProjectStatusHealthChart
              title="Project Status Health"
              data={projectStatusHealthData}
              isLoading={loadingProjectStatusHealth}
              dateRange={projectStatusHealthDateRange}
              onDateRangeChange={setProjectStatusHealthDateRange}
              emptyMessage="No project status data to display"
            />
          </div>
        </>
      )}

      {/* CV POOL SECTION */}
      {activeSection === 'cvPool' && (
        <>
          {/* Job Resume Source Stats */}
          <div className="chart-container" style={{ marginBottom: 6 }}>
            <CvPoolSourceHiredChart
              title="Job Resume Source Stats"
              subtitle="Hired candidates by CV source"
              totalJoined={jobResumeHiredStats.totalJoined}
              stats={jobResumeHiredStats.stats}
              isLoading={loadingJobResumeHiredStats}
              dateRange={jobResumeHiredStatsDateRange}
              onDateRangeChange={setJobResumeHiredStatsDateRange}
              emptyMessage="No hired candidates to display"
            />
          </div>
        </>
      )}
    </>
  );
};

// Query configuration is now handled by useQueryApi hook by default

export default function AdminDashboard() {
  return (
    <>
      <BreadCrumb linkText="Dashboard" />
      <Suspense fallback={<SkeletonLoader type="chart" />}>
        <div className="dashboard-container admin-dashboard-page">
          <Outlet />
        </div>
      </Suspense>
    </>
  );
}
