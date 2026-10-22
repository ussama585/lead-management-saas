import React, { useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import Chart from '../../../../components/charts/apex-chart.jsx';
import dayjs from 'dayjs';
import { DatePicker, Select, Tabs, Input, Button } from 'antd';
import { Users as TeamOutlined, User as UserOutlined, Landmark as BankOutlined, ClipboardCheck as CarryOutOutlined, FileCheck as FileDoneOutlined } from 'lucide-react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import StatsCard from '../../../../components/stats-card.component.jsx';
import { getAccountsNewUserCount, getAccountsNewUserGraph } from '../../../shared/services/admin-graphs.js';
import {
  getCandidateSignupStats,
  getCandidateDesignationExperienceList,
  getJobAnalysisList,
  getCompanyAnalysisList,
  getCompanyJobAnalysisList,
  getCompanySignupTypes,
  getCandidateDesignationOptions,
  getCompanyHearAboutUsOptions,
  getCompanyTypeOptions,
  getJobIndustryOptions,
  getJobLocationOptions,
  getJobPositionOptions,
} from '../../../shared/services/manager-service.js';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import useDebouncedCallback from '../../../../components/hooks/useDebouncedCallback.js';
import { formatMonthsToYearsAndMonths } from '../../../shared/utils/formatMonthsToYearsAndMonths.js';
import '../../../../assets/styles/legacy/admin-dashboard-page.css';

/** Public job detail URL on the main Search O Pal website (path segment = API `slug`). */
const SEARCHOPAL_PUBLIC_JOBS_BASE = 'https://www.searchopal.com/jobs';

const MAIN_STATS_TAB_KEYS = new Set([
  'stats',
  'designation_experience',
  'jobs_analysis',
  'company_analysis',
  'company_job_analysis',
]);
const THEME_PRIMARY = '#3E6A9F';

const ROW = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 };
const FILTER_PANEL = {
  border: '1px solid #cdddf0',
  borderRadius: 12,
  padding: 12,
  background: '#fff',
  width: '100%',
  marginBottom: 12,
};
const FILTER_GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
  alignItems: 'center',
};

const PERIOD_OPTIONS = [
  { label: '7 Days', value: '7_days' },
  { label: '30 Days', value: '30_days' },
  { label: '90 Days', value: '90_days' },
  { label: '12 Months', value: '12_months' },
  { label: 'Custom', value: 'date_range' },
];

export default function MainStatsPage() {
  const { user } = useUserStore();
  const isMarketingManager = user?.user_type === 'marketing_manager';

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = MAIN_STATS_TAB_KEYS.has(tabParam) ? tabParam : 'stats';

  const handleMainStatsTabChange = useCallback(
    (key) => {
      const next = new URLSearchParams(searchParams);
      if (key === 'stats') {
        next.delete('tab');
      } else {
        next.set('tab', key);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const [selectedSeries, setSelectedSeries] = useState('job_seekers');
  const [selectedPeriod, setSelectedPeriod] = useState('7_days');
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));
  const [signupStartDate, setSignupStartDate] = useState(dayjs().startOf('month'));
  const [signupEndDate, setSignupEndDate] = useState(dayjs().endOf('month'));

  const [designationFilter, setDesignationFilter] = useState([]);
  const [minExperienceFilter, setMinExperienceFilter] = useState('');
  const [maxExperienceFilter, setMaxExperienceFilter] = useState('');
  const [tableStartDate, setTableStartDate] = useState(dayjs().startOf('month'));
  const [tableEndDate, setTableEndDate] = useState(dayjs().endOf('month'));
  const [designationPagination, setDesignationPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [designationSorting, setDesignationSorting] = useState([]);
  const [jobsPagination, setJobsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [jobsSorting, setJobsSorting] = useState([]);
  const [companyPagination, setCompanyPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [companySorting, setCompanySorting] = useState([]);
  const [jobSearch, setJobSearch] = useState('');
  const [jobIndustries, setJobIndustries] = useState([]);
  const [jobLocations, setJobLocations] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [jobStartDate, setJobStartDate] = useState(dayjs().startOf('month'));
  const [jobEndDate, setJobEndDate] = useState(dayjs().endOf('month'));
  const [companyType, setCompanyType] = useState([]);
  const [companyEmailVerified, setCompanyEmailVerified] = useState('');
  const [companyHearAboutUs, setCompanyHearAboutUs] = useState([]);
  const [companyStartDate, setCompanyStartDate] = useState(dayjs().startOf('month'));
  const [companyEndDate, setCompanyEndDate] = useState(dayjs().endOf('month'));
  const [companySignupStartDate, setCompanySignupStartDate] = useState(dayjs().startOf('month'));
  const [companySignupEndDate, setCompanySignupEndDate] = useState(dayjs().endOf('month'));
  const [companyJobPagination, setCompanyJobPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [companyJobSorting, setCompanyJobSorting] = useState([]);
  const [companyJobSearchInput, setCompanyJobSearchInput] = useState('');
  const [companyJobSearch, setCompanyJobSearch] = useState('');
  const [companyJobHasJobs, setCompanyJobHasJobs] = useState('');
  const [companyJobStartDate, setCompanyJobStartDate] = useState(dayjs().startOf('month'));
  const [companyJobEndDate, setCompanyJobEndDate] = useState(dayjs().endOf('month'));

  /** Debounced so typing in the text filters fires one request, not one per keystroke. */
  const debouncedSetCompanyJobSearch = useDebouncedCallback((value) => {
    setCompanyJobSearch(value);
    setCompanyJobPagination((p) => ({ ...p, pageIndex: 0 }));
  }, 500);

  const { data: countData = {}, isLoading: loadingCounts } = useQuery({
    queryKey: ['accountsNewUserCount'],
    queryFn: () => getAccountsNewUserCount(),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const { data: graphData = {}, isLoading: loadingGraph } = useQuery({
    queryKey: [
      'accountsNewUserGraph',
      selectedPeriod,
      selectedPeriod === 'date_range' ? startDate?.format('YYYY-MM-DD') : null,
      selectedPeriod === 'date_range' ? endDate?.format('YYYY-MM-DD') : null,
    ],
    queryFn: () =>
      getAccountsNewUserGraph({
        period: selectedPeriod,
        startDate: selectedPeriod === 'date_range' ? startDate?.format('YYYY-MM-DD') : undefined,
        endDate: selectedPeriod === 'date_range' ? endDate?.format('YYYY-MM-DD') : undefined,
      }),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const { data: candidateSignupStatsData = [], isLoading: loadingCandidateSignupStats } = useQuery({
    queryKey: [
      'candidateSignupStats',
      signupStartDate?.format('YYYY-MM-DD'),
      signupEndDate?.format('YYYY-MM-DD'),
    ],
    queryFn: () =>
      getCandidateSignupStats({
        start_date: signupStartDate?.format('YYYY-MM-DDTHH:mm:ssZ'),
        end_date: signupEndDate?.format('YYYY-MM-DDTHH:mm:ssZ'),
      }),
    enabled: activeTab === 'stats',
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
  const { data: companySignupTypesData = [], isLoading: loadingCompanySignupTypes } = useQuery({
    queryKey: [
      'companySignupTypes',
      companySignupStartDate?.format('YYYY-MM-DD'),
      companySignupEndDate?.format('YYYY-MM-DD'),
    ],
    queryFn: () =>
      getCompanySignupTypes({
        start_date: companySignupStartDate?.format('YYYY-MM-DDTHH:mm:ssZ'),
        end_date: companySignupEndDate?.format('YYYY-MM-DDTHH:mm:ssZ'),
      }),
    enabled: activeTab === 'stats',
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const {
    data: candidateDesignationData,
    isLoading: loadingCandidateDesignationTable,
    isFetching: fetchingCandidateDesignationTable,
  } = useQuery({
    queryKey: [
      'candidateDesignationExperienceTable',
      designationFilter.join(','),
      minExperienceFilter,
      maxExperienceFilter,
      tableStartDate?.format('YYYY-MM-DD'),
      tableEndDate?.format('YYYY-MM-DD'),
      designationPagination.pageIndex,
      designationPagination.pageSize,
      designationSorting,
    ],
    queryFn: () =>
      getCandidateDesignationExperienceList({
        designation: designationFilter.length ? designationFilter.join(',') : undefined,
        min_experience: minExperienceFilter === '' ? undefined : Number(minExperienceFilter),
        max_experience: maxExperienceFilter === '' ? undefined : Number(maxExperienceFilter),
        start_date: tableStartDate ? tableStartDate.format('YYYY-MM-DD') : undefined,
        end_date: tableEndDate ? tableEndDate.format('YYYY-MM-DD') : undefined,
        page: designationPagination.pageIndex + 1,
        size: designationPagination.pageSize,
        sorting: designationSorting,
      }),
    enabled: !isMarketingManager || activeTab === 'designation_experience',
    keepPreviousData: true,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const {
    data: jobsAnalysisData,
    isLoading: loadingJobsAnalysis,
    isFetching: fetchingJobsAnalysis,
  } = useQuery({
    queryKey: [
      'jobsAnalysisTable',
      jobSearch,
      jobIndustries.join(','),
      jobLocations.join(','),
      jobPositions.join(','),
      jobStartDate?.format('YYYY-MM-DD'),
      jobEndDate?.format('YYYY-MM-DD'),
      jobsPagination.pageIndex,
      jobsPagination.pageSize,
      jobsSorting,
    ],
    queryFn: () =>
      getJobAnalysisList({
        search: jobSearch || undefined,
        industries: jobIndustries.length ? jobIndustries.join(',') : undefined,
        locations: jobLocations.length ? jobLocations.join(',') : undefined,
        positions: jobPositions.length ? jobPositions.join(',') : undefined,
        start_date: jobStartDate ? jobStartDate.format('YYYY-MM-DD') : undefined,
        end_date: jobEndDate ? jobEndDate.format('YYYY-MM-DD') : undefined,
        page: jobsPagination.pageIndex + 1,
        size: jobsPagination.pageSize,
        sorting: jobsSorting,
      }),
    enabled: !isMarketingManager || activeTab === 'jobs_analysis',
    keepPreviousData: true,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const {
    data: companyAnalysisData,
    isLoading: loadingCompanyAnalysis,
    isFetching: fetchingCompanyAnalysis,
  } = useQuery({
    queryKey: [
      'companyAnalysisTable',
      companyType.join(','),
      companyEmailVerified,
      companyHearAboutUs.join(','),
      companyStartDate?.format('YYYY-MM-DD'),
      companyEndDate?.format('YYYY-MM-DD'),
      companyPagination.pageIndex,
      companyPagination.pageSize,
      companySorting,
    ],
    queryFn: () =>
      getCompanyAnalysisList({
        type: companyType.length ? companyType.join(',') : undefined,
        email_verified: companyEmailVerified === '' ? undefined : companyEmailVerified,
        hear_about_us: companyHearAboutUs.length ? companyHearAboutUs.join(',') : undefined,
        start_date: companyStartDate ? companyStartDate.format('YYYY-MM-DD') : undefined,
        end_date: companyEndDate ? companyEndDate.format('YYYY-MM-DD') : undefined,
        page: companyPagination.pageIndex + 1,
        size: companyPagination.pageSize,
        sorting: companySorting,
      }),
    enabled: !isMarketingManager || activeTab === 'company_analysis',
    keepPreviousData: true,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const {
    data: companyJobAnalysisData,
    isLoading: loadingCompanyJobAnalysis,
    isFetching: fetchingCompanyJobAnalysis,
  } = useQuery({
    queryKey: [
      'companyJobAnalysisTable',
      companyJobSearch,
      companyJobHasJobs,
      companyJobStartDate?.format('YYYY-MM-DD'),
      companyJobEndDate?.format('YYYY-MM-DD'),
      companyJobPagination.pageIndex,
      companyJobPagination.pageSize,
      companyJobSorting,
    ],
    queryFn: () =>
      getCompanyJobAnalysisList({
        search: companyJobSearch || undefined,
        has_jobs: companyJobHasJobs === '' ? undefined : companyJobHasJobs,
        start_date: companyJobStartDate ? companyJobStartDate.format('YYYY-MM-DD') : undefined,
        end_date: companyJobEndDate ? companyJobEndDate.format('YYYY-MM-DD') : undefined,
        page: companyJobPagination.pageIndex + 1,
        size: companyJobPagination.pageSize,
        sorting: companyJobSorting,
      }),
    enabled: !isMarketingManager || activeTab === 'company_job_analysis',
    keepPreviousData: true,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const statsCards = useMemo(
    () => [
      { key: 'all_candidates', title: 'All Candidates', value: countData?.all_candidates ?? 0, icon: <TeamOutlined size="1em" className="app-icon" />, color: '#1890ff' },
      { key: 'candidates_today', title: 'Candidates Today', value: countData?.candidates_today ?? 0, icon: <UserOutlined size="1em" className="app-icon" />, color: '#52c41a' },
      { key: 'all_companies', title: 'All Companies', value: countData?.all_companies ?? 0, icon: <BankOutlined size="1em" className="app-icon" />, color: '#722ed1' },
      { key: 'companies_today', title: 'Companies Today', value: countData?.companies_today ?? 0, icon: <BankOutlined size="1em" className="app-icon" />, color: '#fa8c16' },
      { key: 'jobs_today', title: 'Jobs Today', value: countData?.jobs_today ?? 0, icon: <CarryOutOutlined size="1em" className="app-icon" />, color: '#eb2f96' },
      { key: 'applications_today', title: 'Applications Today', value: countData?.applications_today ?? 0, icon: <FileDoneOutlined size="1em" className="app-icon" />, color: '#13c2c2' },
    ],
    [countData]
  );

  const seriesOptions = useMemo(() => {
    const keys = Object.keys(graphData || {}).filter((key) => Array.isArray(graphData?.[key]));
    if (keys.length === 0) return [{ label: 'Job Seekers', value: 'job_seekers' }];
    return keys.map((key) => ({
      value: key,
      label: key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    }));
  }, [graphData]);

  const activeSeriesKey =
    seriesOptions.some((option) => option.value === selectedSeries)
      ? selectedSeries
      : seriesOptions[0]?.value;
  const activeSeriesData = Array.isArray(graphData?.[activeSeriesKey]) ? graphData[activeSeriesKey] : [];

  const chartCategories = activeSeriesData.map((item) => item?.date || '');
  const chartCounts = activeSeriesData.map((item) => Number(item?.count) || 0);
  const totalCount = chartCounts.reduce((sum, value) => sum + value, 0);
  const averageCount = chartCounts.length ? Math.round(totalCount / chartCounts.length) : 0;

  const chartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (val != null ? val : ''),
      offsetY: -22,
      style: { fontSize: '11px', colors: ['#333'] },
    },
    xaxis: {
      categories: chartCategories,
      labels: { rotate: -35, rotateAlways: chartCategories.length > 5, style: { fontSize: '11px' } },
      title: { text: 'Date', style: { fontSize: '12px' } },
    },
    yaxis: {
      title: { text: 'Count', style: { fontSize: '12px' } },
      min: 0,
    },
    colors: ['#3E6A9F'],
    grid: { borderColor: '#f0f0f0' },
    tooltip: { y: { formatter: (val) => `${val} count` } },
    legend: { show: false },
  };

  const chartSeries = [
    {
      name: seriesOptions.find((option) => option.value === activeSeriesKey)?.label || 'Series',
      data: chartCounts,
    },
  ];

  const isCustomPeriod = selectedPeriod === 'date_range';

  const candidateSignupRows = Array.isArray(candidateSignupStatsData)
    ? candidateSignupStatsData
    : Array.isArray(candidateSignupStatsData?.results)
      ? candidateSignupStatsData.results
      : Array.isArray(candidateSignupStatsData?.data)
        ? candidateSignupStatsData.data
        : [];

  const candidateSignupCategories = candidateSignupRows.map((item) => item?.date || '');
  const candidateSignupSeries = [
    {
      name: 'Signup Count',
      data: candidateSignupRows.map((item) => Number(item?.signup_count) || 0),
    },
    {
      name: 'Profile Completed',
      data: candidateSignupRows.map((item) => Number(item?.profile_completed_count) || 0),
    },
  ];

  const candidateSignupChartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        borderRadius: 4,
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (val != null ? val : ''),
      offsetY: -20,
      style: { fontSize: '11px', colors: ['#333'] },
    },
    xaxis: {
      categories: candidateSignupCategories,
      labels: { rotate: -35, rotateAlways: candidateSignupCategories.length > 5, style: { fontSize: '11px' } },
      title: { text: 'Date', style: { fontSize: '12px' } },
    },
    yaxis: {
      min: 0,
      title: { text: 'Count', style: { fontSize: '12px' } },
    },
    colors: ['#3E6A9F', '#52c41a'],
    grid: { borderColor: '#f0f0f0' },
    legend: { position: 'top' },
    tooltip: { shared: true, intersect: false },
  };

  const companySignupRows = Array.isArray(companySignupTypesData)
    ? companySignupTypesData
    : Array.isArray(companySignupTypesData?.results)
      ? companySignupTypesData.results
      : Array.isArray(companySignupTypesData?.data)
        ? companySignupTypesData.data
        : [];

  const companySignupCategories = companySignupRows.map((item) => item?.date || '');
  const companySignupSeries = [
    {
      name: 'Company Count',
      data: companySignupRows.map((item) => Number(item?.company_count) || 0),
    },
    {
      name: 'Recruiter Count',
      data: companySignupRows.map((item) => Number(item?.recruiter_count) || 0),
    },
  ];

  const companySignupChartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        borderRadius: 4,
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (val != null ? val : ''),
      offsetY: -20,
      style: { fontSize: '11px', colors: ['#333'] },
    },
    xaxis: {
      categories: companySignupCategories,
      labels: { rotate: -35, rotateAlways: companySignupCategories.length > 5, style: { fontSize: '11px' } },
      title: { text: 'Date', style: { fontSize: '12px' } },
    },
    yaxis: { min: 0, title: { text: 'Count', style: { fontSize: '12px' } } },
    colors: ['#722ed1', '#fa8c16'],
    grid: { borderColor: '#f0f0f0' },
    legend: { position: 'top' },
    tooltip: { shared: true, intersect: false },
  };

  const designationTableColumns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID', size: 80 },
      { accessorKey: 'name', header: 'Name', size: 180 },
      { accessorKey: 'designation', header: 'Designation', size: 180 },
      { accessorKey: 'experience', header: 'Experience', size: 180 },
      { accessorKey: 'hear_about_us', header: 'Hear About Us', size: 170 },
      { accessorKey: 'source', header: 'Source', size: 140 },
      { accessorKey: 'date', header: 'Date', size: 140 },
    ],
    []
  );

  const designationResults = Array.isArray(candidateDesignationData?.results)
    ? candidateDesignationData.results
    : [];

  const designationTableData = designationResults.map((row) => {
    const rawMonths = row?.experience_months ?? row?.experience ?? row?.total_experience;
    const hearAboutUs = row?.hear_about_us;
    const source = row?.source;
    return {
      id: row?.id ?? '-',
      name: row?.name || row?.candidate_name || '-',
      designation: row?.designation || '-',
      experience: formatMonthsToYearsAndMonths(rawMonths),
      hear_about_us:
        hearAboutUs != null && String(hearAboutUs).trim() !== '' ? String(hearAboutUs).trim() : '-',
      source: source != null && String(source).trim() !== '' ? String(source).trim() : '-',
      date: row?.date || row?.created_at || '-',
    };
  });

  const designationTotalCount = Number(candidateDesignationData?.count) || designationTableData.length;

  const jobsColumns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID', size: 80 },
      { accessorKey: 'date', header: 'Date', size: 120 },
      { accessorKey: 'title', header: 'Title', size: 200 },
      { accessorKey: 'impressions', header: 'Impressions', size: 120 },
      { accessorKey: 'salary', header: 'Salary', size: 120 },
      { accessorKey: 'positions', header: 'Positions', size: 100 },
      { accessorKey: 'jobs_count', header: 'Jobs count', size: 100 },
      { accessorKey: 'location', header: 'Location', size: 140 },
      { accessorKey: 'industry', header: 'Industry', size: 140 },
      {
        id: 'view_job',
        accessorKey: 'view_job',
        header: 'View Job',
        size: 110,
        enableSorting: false,
        Cell: ({ row }) => {
          const raw = row.original?.slug;
          const slug =
            raw != null && String(raw).trim() !== '' && String(raw).trim() !== '-'
              ? String(raw).trim().replace(/^\/+/, '')
              : '';
          if (!slug) {
            return <span style={{ color: '#94a3b8' }}>—</span>;
          }
          const href = `${SEARCHOPAL_PUBLIC_JOBS_BASE}/${encodeURIComponent(slug)}`;
          return (
            <Button
              type="primary"
              size="small"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                background: THEME_PRIMARY,
                borderColor: THEME_PRIMARY,
              }}
            >
              View Job
            </Button>
          );
        },
      },
    ],
    []
  );
  const jobsResults = Array.isArray(jobsAnalysisData?.results) ? jobsAnalysisData.results : [];
  const jobsTableData = jobsResults.map((row) => ({
    id: row?.id ?? '-',
    date: row?.date || '-',
    title: row?.title || '-',
    impressions: row?.impressions ?? 0,
    slug: row?.slug ?? '',
    salary: row?.salary ?? '-',
    positions: row?.positions ?? '-',
    jobs_count: typeof row?.jobs_count === 'number' ? row.jobs_count : 0,
    location: row?.location || '-',
    industry: row?.industry || '-',
    view_job: '',
  }));
  const jobsTotalCount = Number(jobsAnalysisData?.count) || jobsTableData.length;

  const companyColumns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID', size: 80 },
      { accessorKey: 'name', header: 'Name', size: 220 },
      { accessorKey: 'type', header: 'Type', size: 140 },
      { accessorKey: 'date', header: 'Date', size: 120 },
      { accessorKey: 'email_verified', header: 'Email Verified', size: 130 },
      { accessorKey: 'hear_about_us', header: 'Hear About Us', size: 170 },
    ],
    []
  );
  const companyResults = Array.isArray(companyAnalysisData?.results) ? companyAnalysisData.results : [];
  const companyTableData = companyResults.map((row) => ({
    id: row?.id ?? '-',
    name: row?.name || '-',
    type: row?.type || '-',
    date: row?.date || '-',
    email_verified: row?.email_verified ? 'True' : 'False',
    hear_about_us: row?.hear_about_us || '-',
  }));
  const companyTotalCount = Number(companyAnalysisData?.count) || companyTableData.length;

  const companyJobColumns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID', size: 80 },
      { accessorKey: 'name', header: 'Name', size: 200 },
      { accessorKey: 'email', header: 'Email', size: 220 },
      { accessorKey: 'phone', header: 'Phone', size: 150 },
      { accessorKey: 'city', header: 'City', size: 140 },
      { accessorKey: 'date', header: 'Date', size: 120 },
      { accessorKey: 'jobs_count', header: 'Jobs Count', size: 110 },
      { accessorKey: 'jobs_active_count', header: 'Active Jobs', size: 110 },
      { accessorKey: 'last_job_created_at', header: 'Last Job Created', size: 170 },
    ],
    []
  );
  const companyJobResults = Array.isArray(companyJobAnalysisData?.results)
    ? companyJobAnalysisData.results
    : [];
  const companyJobTableData = companyJobResults.map((row) => ({
    id: row?.id ?? '-',
    name: row?.name || '-',
    email: row?.email || '-',
    phone: row?.phone || '-',
    city: row?.city || '-',
    date: row?.date || '-',
    jobs_count: typeof row?.jobs_count === 'number' ? row.jobs_count : 0,
    jobs_active_count: typeof row?.jobs_active_count === 'number' ? row.jobs_active_count : 0,
    last_job_created_at: row?.last_job_created_at
      ? dayjs(row.last_job_created_at).format('DD/MM/YYYY HH:mm')
      : '-',
  }));
  const companyJobTotalCount =
    Number(companyJobAnalysisData?.count) || companyJobTableData.length;

  const { data: designationOptionsData = [] } = useQuery({
    queryKey: ['candidateDesignationOptions'],
    queryFn: getCandidateDesignationOptions,
    enabled: activeTab === 'designation_experience',
    staleTime: 1000 * 60 * 10,
  });

  const { data: companyTypeOptionsData = [] } = useQuery({
    queryKey: ['companyTypeOptions'],
    queryFn: getCompanyTypeOptions,
    enabled: activeTab === 'company_analysis',
    staleTime: 1000 * 60 * 10,
  });

  const { data: companyHearAboutUsOptionsData = [] } = useQuery({
    queryKey: ['companyHearAboutUsOptions'],
    queryFn: getCompanyHearAboutUsOptions,
    enabled: activeTab === 'company_analysis',
    staleTime: 1000 * 60 * 10,
  });

  const { data: jobIndustryOptionsData = [] } = useQuery({
    queryKey: ['jobIndustryOptions'],
    queryFn: getJobIndustryOptions,
    enabled: activeTab === 'jobs_analysis',
    staleTime: 1000 * 60 * 10,
  });

  const { data: jobLocationOptionsData = [] } = useQuery({
    queryKey: ['jobLocationOptions'],
    queryFn: getJobLocationOptions,
    enabled: activeTab === 'jobs_analysis',
    staleTime: 1000 * 60 * 10,
  });

  const { data: jobPositionOptionsData = [] } = useQuery({
    queryKey: ['jobPositionOptions'],
    queryFn: getJobPositionOptions,
    enabled: activeTab === 'jobs_analysis',
    staleTime: 1000 * 60 * 10,
  });

  const toSelectOptions = (list = []) =>
    [...new Set((Array.isArray(list) ? list : []).map((item) => String(item ?? '').trim()).filter(Boolean))]
      .map((value) => ({ label: value, value }));

  const designationOptions = toSelectOptions(designationOptionsData);
  const companyTypeOptions = toSelectOptions(companyTypeOptionsData);
  const companyHearAboutUsOptions = toSelectOptions(companyHearAboutUsOptionsData);
  const jobIndustryOptions = toSelectOptions(jobIndustryOptionsData);
  const jobLocationOptions = toSelectOptions(jobLocationOptionsData);
  const jobPositionOptions = useMemo(() => {
    const apiOptions = toSelectOptions(jobPositionOptionsData);
    const staticOptions = Array.from({ length: 100 }, (_, idx) => {
      const value = String(idx + 1);
      return { label: value, value };
    });
    const merged = [...apiOptions, ...staticOptions];
    return merged.filter((option, index, self) => self.findIndex((x) => x.value === option.value) === index);
  }, [jobPositionOptionsData]);

  const statsBySeries = {
    totalCount,
    averageCount,
  };

  const clearCandidateFilters = () => {
    setDesignationFilter([]);
    setMinExperienceFilter('');
    setMaxExperienceFilter('');
    setTableStartDate(null);
    setTableEndDate(null);
    setDesignationPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const clearJobsFilters = () => {
    setJobSearch('');
    setJobIndustries([]);
    setJobLocations([]);
    setJobPositions([]);
    setJobStartDate(null);
    setJobEndDate(null);
    setJobsPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const clearCompanyFilters = () => {
    setCompanyType([]);
    setCompanyEmailVerified('');
    setCompanyHearAboutUs([]);
    setCompanyStartDate(null);
    setCompanyEndDate(null);
    setCompanyPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const clearCompanyJobFilters = () => {
    debouncedSetCompanyJobSearch.cancel();
    setCompanyJobSearchInput('');
    setCompanyJobSearch('');
    setCompanyJobHasJobs('');
    setCompanyJobStartDate(null);
    setCompanyJobEndDate(null);
    setCompanyJobPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const renderStatsTab = () => (
    <div className="dashboard-container" style={{ width: '100%', maxWidth: '100%' }}>
      <div className="admin-stat-cards-grid mb-2">
        {statsCards.map((card) => (
          <StatsCard
            key={card.key}
            title={card.title}
            value={card.value}
            icon={card.icon}
            borderColor={card.color}
          />
        ))}
      </div>

      <div style={ROW}>
        <div className="chart-container" style={{ width: '100%', maxWidth: '100%', flex: '1 1 100%' }}>
          <div
            style={{
              border: '1px solid #cdddf0',
              borderRadius: 12,
              padding: 12,
              background: '#fff',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ color: '#2b65a0', fontWeight: 700, fontSize: 16 }}>Trends</div>
                <div style={{ display: 'flex', gap: 24, color: '#4d6b8a', fontSize: 12 }}>
                  <div>
                    <div>Total:</div>
                    <div style={{ fontWeight: 700 }}>{statsBySeries.totalCount}</div>
                  </div>
                  <div>
                    <div>Average:</div>
                    <div style={{ fontWeight: 700 }}>{statsBySeries.averageCount}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12 }}>Series:</span>
                <Select
                  value={activeSeriesKey}
                  onChange={setSelectedSeries}
                  options={seriesOptions}
                  style={{ width: 150 }}
                  size="small"
                />
                <span style={{ fontSize: 12 }}>Period:</span>
                <Select
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  options={PERIOD_OPTIONS}
                  style={{ width: 130 }}
                  size="small"
                />
                <span style={{ fontSize: 12 }}>Start:</span>
                <DatePicker
                  value={startDate}
                  onChange={(value) => setStartDate(value)}
                  size="small"
                  format="DD/MM/YYYY"
                  disabled={!isCustomPeriod}
                />
                <span style={{ fontSize: 12 }}>End:</span>
                <DatePicker
                  value={endDate}
                  onChange={(value) => setEndDate(value)}
                  size="small"
                  format="DD/MM/YYYY"
                  disabled={!isCustomPeriod}
                />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Chart options={chartOptions} series={chartSeries} type="bar" height={320} />
            </div>
          </div>
        </div>
      </div>

      <div style={ROW}>
        <div className="chart-container" style={{ width: '100%', maxWidth: '100%', flex: '1 1 100%' }}>
          <div
            style={{
              border: '1px solid #cdddf0',
              borderRadius: 12,
              padding: 12,
              background: '#fff',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <div style={{ color: '#2b65a0', fontWeight: 700, fontSize: 16 }}>
                Candidate Signup vs Profile Completion
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12 }}>Start:</span>
                <DatePicker
                  value={signupStartDate}
                  onChange={(value) => setSignupStartDate(value)}
                  size="small"
                  format="DD/MM/YYYY"
                />
                <span style={{ fontSize: 12 }}>End:</span>
                <DatePicker
                  value={signupEndDate}
                  onChange={(value) => setSignupEndDate(value)}
                  size="small"
                  format="DD/MM/YYYY"
                />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Chart
                options={candidateSignupChartOptions}
                series={candidateSignupSeries}
                type="bar"
                height={320}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={ROW}>
        <div className="chart-container" style={{ width: '100%', maxWidth: '100%', flex: '1 1 100%' }}>
          <div
            style={{
              border: '1px solid #cdddf0',
              borderRadius: 12,
              padding: 12,
              background: '#fff',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <div style={{ color: '#2b65a0', fontWeight: 700, fontSize: 16 }}>
                Company Signups Types
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12 }}>Start:</span>
                <DatePicker
                  value={companySignupStartDate}
                  onChange={(value) => setCompanySignupStartDate(value)}
                  size="small"
                  format="DD/MM/YYYY"
                />
                <span style={{ fontSize: 12 }}>End:</span>
                <DatePicker
                  value={companySignupEndDate}
                  onChange={(value) => setCompanySignupEndDate(value)}
                  size="small"
                  format="DD/MM/YYYY"
                />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Chart options={companySignupChartOptions} series={companySignupSeries} type="bar" height={320} />
            </div>
          </div>
        </div>
      </div>

      {(loadingCounts || loadingGraph || loadingCandidateSignupStats || loadingCompanySignupTypes) && (
        <div style={{ padding: 8, color: '#666' }}>Loading main stats...</div>
      )}
    </div>
  );

  const renderDesignationTab = () => (
    <div className="dashboard-container" style={{ width: '100%', maxWidth: '100%' }}>
      <div style={FILTER_PANEL}>
        <div style={FILTER_GRID}>
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Designations"
          value={designationFilter}
          onChange={(value) => {
            setDesignationFilter(value || []);
            setDesignationPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          options={designationOptions}
          maxTagCount="responsive"
          size="small"
          style={{ width: '100%' }}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
        <Input
          placeholder="Min experience (months)"
          type="number"
          min={0}
          value={minExperienceFilter}
          onChange={(e) => {
            setMinExperienceFilter(e.target.value);
            setDesignationPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          style={{ width: '100%' }}
          size="small"
        />
        <Input
          placeholder="Max experience (months)"
          type="number"
          min={0}
          value={maxExperienceFilter}
          onChange={(e) => {
            setMaxExperienceFilter(e.target.value);
            setDesignationPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          style={{ width: '100%' }}
          size="small"
        />
        <DatePicker
          placeholder="Start date"
          value={tableStartDate}
          onChange={(value) => {
            setTableStartDate(value);
            setDesignationPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          size="small"
          format="DD/MM/YYYY"
          style={{ width: '100%' }}
        />
        <DatePicker
          placeholder="End date"
          value={tableEndDate}
          onChange={(value) => {
            setTableEndDate(value);
            setDesignationPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          size="small"
          format="DD/MM/YYYY"
          style={{ width: '100%' }}
        />
        <Button onClick={clearCandidateFilters} size="small" style={{ width: '100%' }}>
          Clear All
        </Button>
        </div>
      </div>

      <NewTableComponent
        totalCount={designationTotalCount}
        columns={designationTableColumns}
        data={designationTableData}
        heading={`Candidate Analysis (${designationTotalCount})`}
        pagination={designationPagination}
        onPaginationChange={setDesignationPagination}
        onPageSizeChange={() => {}}
        sorting={designationSorting}
        onSortingChange={setDesignationSorting}
        globalFilter=""
        onGlobalFilterChange={() => {}}
        enableGlobalFilter={false}
        isLoading={loadingCandidateDesignationTable || fetchingCandidateDesignationTable}
        enableRowSelection={false}
      />
    </div>
  );

  const renderJobsAnalysisTab = () => (
    <div className="dashboard-container" style={{ width: '100%', maxWidth: '100%' }}>
      <div style={FILTER_PANEL}>
        <div style={FILTER_GRID}>
        <Input placeholder="Search" value={jobSearch} onChange={(e) => { setJobSearch(e.target.value); setJobsPagination((p) => ({ ...p, pageIndex: 0 })); }} style={{ width: '100%' }} size="small" />
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Industries"
          value={jobIndustries}
          onChange={(value) => { setJobIndustries(value || []); setJobsPagination((p) => ({ ...p, pageIndex: 0 })); }}
          options={jobIndustryOptions}
          maxTagCount="responsive"
          size="small"
          style={{ width: '100%' }}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Locations"
          value={jobLocations}
          onChange={(value) => { setJobLocations(value || []); setJobsPagination((p) => ({ ...p, pageIndex: 0 })); }}
          options={jobLocationOptions}
          maxTagCount="responsive"
          size="small"
          style={{ width: '100%' }}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Positions"
          value={jobPositions}
          onChange={(value) => { setJobPositions(value || []); setJobsPagination((p) => ({ ...p, pageIndex: 0 })); }}
          options={jobPositionOptions}
          maxTagCount="responsive"
          size="small"
          style={{ width: '100%' }}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
        <DatePicker placeholder="Start date" value={jobStartDate} onChange={(value) => { setJobStartDate(value); setJobsPagination((p) => ({ ...p, pageIndex: 0 })); }} size="small" format="DD/MM/YYYY" style={{ width: '100%' }} />
        <DatePicker placeholder="End date" value={jobEndDate} onChange={(value) => { setJobEndDate(value); setJobsPagination((p) => ({ ...p, pageIndex: 0 })); }} size="small" format="DD/MM/YYYY" style={{ width: '100%' }} />
          <Button onClick={clearJobsFilters} size="small" style={{ width: '100%' }}>
            Clear All
          </Button>
        </div>
      </div>

      <NewTableComponent
        totalCount={jobsTotalCount}
        columns={jobsColumns}
        data={jobsTableData}
        heading={`Jobs analysis (${jobsTotalCount})`}
        pagination={jobsPagination}
        onPaginationChange={setJobsPagination}
        onPageSizeChange={() => {}}
        sorting={jobsSorting}
        onSortingChange={setJobsSorting}
        globalFilter=""
        onGlobalFilterChange={() => {}}
        enableGlobalFilter={false}
        isLoading={loadingJobsAnalysis || fetchingJobsAnalysis}
        enableRowSelection={false}
      />
    </div>
  );

  const renderCompanyAnalysisTab = () => (
    <div className="dashboard-container" style={{ width: '100%', maxWidth: '100%' }}>
      <div style={FILTER_PANEL}>
        <div style={FILTER_GRID}>
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Type"
          value={companyType}
          onChange={(value) => { setCompanyType(value || []); setCompanyPagination((p) => ({ ...p, pageIndex: 0 })); }}
          options={companyTypeOptions}
          maxTagCount="responsive"
          size="small"
          style={{ width: '100%' }}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
        <Select
          placeholder="Email verified"
          value={companyEmailVerified === '' ? undefined : companyEmailVerified}
          onChange={(value) => { setCompanyEmailVerified(value ?? ''); setCompanyPagination((p) => ({ ...p, pageIndex: 0 })); }}
          options={[
            { label: 'All', value: '' },
            { label: 'True', value: 'true' },
            { label: 'False', value: 'false' },
          ]}
          size="small"
          style={{ width: '100%' }}
        />
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Hear about us"
          value={companyHearAboutUs}
          onChange={(value) => { setCompanyHearAboutUs(value || []); setCompanyPagination((p) => ({ ...p, pageIndex: 0 })); }}
          options={companyHearAboutUsOptions}
          maxTagCount="responsive"
          size="small"
          style={{ width: '100%' }}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
        <DatePicker placeholder="Start date" value={companyStartDate} onChange={(value) => { setCompanyStartDate(value); setCompanyPagination((p) => ({ ...p, pageIndex: 0 })); }} size="small" format="DD/MM/YYYY" style={{ width: '100%' }} />
        <DatePicker placeholder="End date" value={companyEndDate} onChange={(value) => { setCompanyEndDate(value); setCompanyPagination((p) => ({ ...p, pageIndex: 0 })); }} size="small" format="DD/MM/YYYY" style={{ width: '100%' }} />
        <Button onClick={clearCompanyFilters} size="small" style={{ width: '100%' }}>
          Clear All
        </Button>
        </div>
      </div>

      <NewTableComponent
        totalCount={companyTotalCount}
        columns={companyColumns}
        data={companyTableData}
        heading={`Company analysis (${companyTotalCount})`}
        pagination={companyPagination}
        onPaginationChange={setCompanyPagination}
        onPageSizeChange={() => {}}
        sorting={companySorting}
        onSortingChange={setCompanySorting}
        globalFilter=""
        onGlobalFilterChange={() => {}}
        enableGlobalFilter={false}
        isLoading={loadingCompanyAnalysis || fetchingCompanyAnalysis}
        enableRowSelection={false}
      />
    </div>
  );

  const renderCompanyJobAnalysisTab = () => (
    <div className="dashboard-container" style={{ width: '100%', maxWidth: '100%' }}>
      <div style={FILTER_PANEL}>
        <div style={FILTER_GRID}>
          <Input
            placeholder="Search by name"
            value={companyJobSearchInput}
            onChange={(e) => { setCompanyJobSearchInput(e.target.value); debouncedSetCompanyJobSearch(e.target.value); }}
            style={{ width: '100%' }}
            size="small"
          />
          <Select
            placeholder="Has jobs"
            value={companyJobHasJobs === '' ? undefined : companyJobHasJobs}
            onChange={(value) => { setCompanyJobHasJobs(value ?? ''); setCompanyJobPagination((p) => ({ ...p, pageIndex: 0 })); }}
            options={[
              { label: 'All', value: '' },
              { label: 'True', value: 'True' },
              { label: 'False', value: 'False' },
            ]}
            size="small"
            style={{ width: '100%' }}
          />
          <DatePicker placeholder="Start date" value={companyJobStartDate} onChange={(value) => { setCompanyJobStartDate(value); setCompanyJobPagination((p) => ({ ...p, pageIndex: 0 })); }} size="small" format="DD/MM/YYYY" style={{ width: '100%' }} />
          <DatePicker placeholder="End date" value={companyJobEndDate} onChange={(value) => { setCompanyJobEndDate(value); setCompanyJobPagination((p) => ({ ...p, pageIndex: 0 })); }} size="small" format="DD/MM/YYYY" style={{ width: '100%' }} />
          <Button onClick={clearCompanyJobFilters} size="small" style={{ width: '100%' }}>
            Clear All
          </Button>
        </div>
      </div>

      <NewTableComponent
        totalCount={companyJobTotalCount}
        columns={companyJobColumns}
        data={companyJobTableData}
        heading={`Company Job Analysis (${companyJobTotalCount})`}
        pagination={companyJobPagination}
        onPaginationChange={setCompanyJobPagination}
        onPageSizeChange={() => {}}
        sorting={companyJobSorting}
        onSortingChange={setCompanyJobSorting}
        globalFilter=""
        onGlobalFilterChange={() => {}}
        enableGlobalFilter={false}
        isLoading={loadingCompanyJobAnalysis || fetchingCompanyJobAnalysis}
        enableRowSelection={false}
      />
    </div>
  );

  return (
    <>
      <BreadCrumb linkText="Main Stats" />
      {isMarketingManager ? (
        <Tabs
          className="marketing-dashboard-page marketing-main-stats-tabs"
          type="card"
          tabBarGutter={4}
          activeKey={activeTab}
          onChange={handleMainStatsTabChange}
          items={[
            { key: 'stats', label: 'Stats', children: renderStatsTab() },
            { key: 'designation_experience', label: 'Candidate Analysis', children: renderDesignationTab() },
            { key: 'jobs_analysis', label: 'Jobs analysis', children: renderJobsAnalysisTab() },
            { key: 'company_analysis', label: 'Company analysis', children: renderCompanyAnalysisTab() },
            {
              key: 'company_job_analysis',
              label: 'Company Job Analysis',
              children: renderCompanyJobAnalysisTab(),
            },
          ]}
        />
      ) : (
        renderStatsTab()
      )}
    </>
  );
}
