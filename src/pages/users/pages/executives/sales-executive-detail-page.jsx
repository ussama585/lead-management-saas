import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Spin } from '../../../../components/ui/app-controls.jsx';
import React, { useState, useMemo, useEffect } from 'react';
import moment from 'moment';
import { useParams, useNavigate } from 'react-router-dom';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import { Space } from 'antd';
import { Formik, Form, Field } from 'formik';
import { LoaderCircle as LoadingOutlined, Info as InfoCircleOutlined, CircleHelp as QuestionCircleOutlined } from 'lucide-react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import UserDetailCard from '../../../../components/user-detail-card.component.jsx';
import StatsCard from '../../../../components/stats-card.component.jsx';
import LineChart from '../../../../components/charts/line-chart.component.jsx';
import TableComponent from '../../../../components/tables/table.component.jsx';

import SalesExecutivesIcon from '../../../../assets/images/stat-card-icons/sales-executives.svg';
import PotentialClientsIcon from '../../../../assets/images/stat-card-icons/potential-clients.svg';
import ActiveProjectsIcon from '../../../../assets/images/stat-card-icons/active-projects.svg';
import CompletedProjectsIcon from '../../../../assets/images/stat-card-icons/completed-projects.svg';
import OpportunitiesLostIcon from '../../../../assets/images/stat-card-icons/opportunities-lost.svg';
import TerminatedProjectsIcon from '../../../../assets/images/stat-card-icons/terminated-projects.svg';
import TargetIcon from '../../../../assets/images/stat-card-icons/target-icon.svg';
import ProfileImagePlaceholder from '../../../../assets/images/user-card-icons/user-placeholder.svg';
import '../../../../assets/styles/legacy/sales-manager-detail-page.css';
import { useQuery } from 'react-query';
import { getExecutivesList, getExecutiveDetails, getProjectStats, getClientStats, getStatsBySlug } from '../../../shared/services/stats-service.js';
import { getProjectCount, getClientCount, getClientsList, getProjectsList } from '../../../shared/services/executive-service.js';
import { getPotentialClientDetails } from '../../../shared/services/users-service.js';

const { TextArea } = Input;

export default function SalesExecutiveDetail() {

  const [isClientDetailModalVisible, setIsClientDetailModalVisible] = useState(false);
  const [isLostClientDetailModalVisible, setIsLostClientDetailModalVisible] = useState(false);

  const [selectedPotentialClientIdForDetails, setSelectedPotentialClientIdForDetails] = useState(undefined);

  const [isTerminatedProjectDetailModalVisible, setIsTerminatedProjectDetailModalVisible] = useState(false);
  const [selectedTerminatedProjectDetail, setSelectedTerminatedProjectDetail] = useState({
    id: undefined,
    name: undefined,
    reason: undefined
  })

  const [selectedLostClientDetail, setSelectedLostClientDetail] = useState({
    id: undefined,
    name: undefined,
    reason: undefined
  });

  const [paginationForExecutives, setPaginationForExecutives] = useState({
    pageIndex: 0, // Start at page 0
    pageSize: 10, // Default rows per page
  });

  const [sortingForExecutives, setSortingForExecutives] = useState([]);

  const [paginationForClients, setPaginationForClients] = useState({
    pageIndex: 0, // Start at page 0
    pageSize: 10, // Default rows per page
  });
  const [globalFilterForPotentials, setGlobalFilterForPotentials] = useState('');
  const [sortingForClients, setSortingForClients] = useState([]);


  const [paginationForProjects, setPaginationForProjects] = useState({
    pageIndex: 0, // Start at page 0
    pageSize: 10, // Default rows per page
  });
  const [sortingForProjects, setSortingForProjects] = useState([]);
  const [globalFilterForProjects, setGlobalFilterForProjects] = useState('');

  const [selectedProjectsTab, setSelectedProjectsTab] = useState("active_projects");

  const [selectedClientsTab, setSelectedClientsTab] = useState("potential_clients");



  const navigate = useNavigate();

  const { id: userId, slug: slug } = useParams()

  const [selectedCard, setSelectedCard] = useState("potentialClients");

  const [selectedTimeFrameForProjectsData, setSelectedTimeFrameForProjectsData] = useState('week');
  const [selectedTimeFrameForClientsData, setSelectedTimeFrameForClientsData] = useState('week');

  const [projectListType, setProjectListType] = useState("Active")

  const [clientListType, setClientListType] = useState("Potential")

  const [projectCount, setProjectCount] = useState({});
  const [clientCount, setClientCount] = useState({});


  const handleTabClick = (tabValue) => {
    console.log("Selected Tab: ", tabValue);

    // Set projectListType based on the selected tabValue

    switch (tabValue) {
      case 'active_projects':

        setSortingForProjects([]);
        setPaginationForProjects({ pageIndex: 0, pageSize: 10 });

        setSelectedProjectsTab("active_projects");

        setProjectListType("Active");
        console.log("Project Listing Type: Active");
        break;

      case 'completed_projects':

        setSortingForProjects([]);
        setPaginationForProjects({ pageIndex: 0, pageSize: 10 });

        setSelectedProjectsTab("completed_projects");

        setProjectListType("Completed");
        console.log("Project Listing Type: Completed");
        break;

      case 'terminated_projects':

        setSortingForProjects([]);
        setPaginationForProjects({ pageIndex: 0, pageSize: 10 });

        setSelectedProjectsTab("terminated_projects");

        setProjectListType("Terminated");
        console.log("Project Listing Type: Terminated");
        break;


      case 'potential_clients':

        setSortingForClients([]);
        setPaginationForClients({ pageIndex: 0, pageSize: 10 });

        setSelectedClientsTab("potential_clients");

        setClientListType("Potential");
        console.log("Client Listing Type: Potential");
        break;

      case 'opportunities_lost':

        setSortingForClients([]);
        setPaginationForClients({ pageIndex: 0, pageSize: 10 });

        setSelectedClientsTab("opportunities_lost");

        setClientListType("Lost");
        console.log("Client Listing Type: Lost");
        break;



      default:

        break;
    }


  };


  const { data: statsData, isLoading: loadingStatsData } = useQuery({
    queryKey: ['statsData', slug],
    queryFn: () => getStatsBySlug(slug),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: potentialClientDetail, isLoading: loadingPotentialClientDetail } = useQuery({
    queryKey: ['potentialClientDetail', selectedPotentialClientIdForDetails],
    queryFn: () => getPotentialClientDetails(selectedPotentialClientIdForDetails),
    enabled: !!selectedPotentialClientIdForDetails,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });


  const { data: userStats, isLoading: loadingUserStats } = useQuery({
    queryKey: ['userDetails', slug],
    queryFn: () => getExecutiveDetails(slug),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })


  const { data: projectStats, isloading: loadingProjectStats } = useQuery({

    queryKey: ['projectStats', userId, selectedTimeFrameForProjectsData],
    queryFn: () => getProjectStats(selectedTimeFrameForProjectsData, userId),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,

  })


  const {
    data: clientData,
    isLoading: loadingClientStats,
  } = useQuery({
    queryKey: ['clientStats', selectedTimeFrameForClientsData, userId],
    queryFn: () => getClientStats(selectedTimeFrameForClientsData, userId),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const handleTimeFrameFromProjectStats = (value) => setSelectedTimeFrameForProjectsData(value);
  const handleTimeFrameFromClientStats = (value) => setSelectedTimeFrameForClientsData(value);


  const { data: projectCountData } = useQuery({
    queryKey: ['projectCountData', slug],
    queryFn: () => getProjectCount(slug),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });





  useEffect(() => {
    if (projectCountData) {
      setProjectCount({

        active_projects: projectCountData.active,
        completed_projects: projectCountData.completed,
        terminated_projects: projectCountData.terminated,

      });
    }
  }, [projectCountData]);


  const { data: clientCountData } = useQuery({
    queryKey: ['clientCountData', slug],
    queryFn: () => getClientCount(slug),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });


  useEffect(() => {
    if (clientCountData) {
      setClientCount({

        potential_clients: clientCountData.potential,
        opportunities_lost: clientCountData.lost,

      });
    }
  }, [clientCountData]);



  const { data: projectsList, isLoading: loadingProjectsList } = useQuery({
    queryKey: ['projectsList', slug, projectListType, paginationForProjects.pageIndex, paginationForProjects.pageSize, sortingForProjects, globalFilterForProjects],
    queryFn: () => getProjectsList(slug, projectListType, paginationForProjects.pageIndex + 1, paginationForProjects.pageSize, sortingForProjects, globalFilterForProjects),
    enabled: projectListType !== undefined,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });




  const { data: clientsList, isLoading: loadingClientsList } = useQuery({
    queryKey: ['clientsList', slug, clientListType, paginationForClients.pageIndex, paginationForClients.pageSize, sortingForClients, globalFilterForPotentials],
    queryFn: () => getClientsList(slug, clientListType, paginationForClients.pageIndex + 1, paginationForClients.pageSize, sortingForClients, globalFilterForPotentials),
    enabled: clientListType !== undefined,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });



  const metrics = statsData
    ? [
      { id: 'potentialClients', title: 'Potential Clients', icon: PotentialClientsIcon, count: statsData?.potential_client_stats.count || 0, color: '#06004D', percentage: statsData?.potential_client_stats.trend || 0 },
      { id: 'activeProjects', title: 'Active Projects', icon: ActiveProjectsIcon, count: statsData?.active_project_stats.count || 0, color: '#008000', percentage: statsData?.active_project_stats.trend || 0 },
      { id: 'completedProjects', title: 'Completed Projects', icon: CompletedProjectsIcon, count: statsData?.completed_project_stats.count || 0, color: '#2DB1F8', percentage: statsData?.completed_project_stats.trend || 0 },
      { id: 'opportunitiesLost', title: 'Opportunities Lost', icon: OpportunitiesLostIcon, count: statsData?.opportunity_lost_stats.count || 0, color: '#EE0101', percentage: statsData?.opportunity_lost_stats.trend || 0 },
      { id: 'terminatedProjects', title: 'Terminated Projects', icon: TerminatedProjectsIcon, count: statsData?.terminated_project_stats.count || 0, color: '#FEBAC6', percentage: statsData?.terminated_project_stats.trend || 0 },
      { id: 'companiesReached', title: 'Companies Reached', icon: TargetIcon, count: `${statsData?.companies_reached.completed}/${statsData?.companies_reached.target}` || "-", color: '#C7A109', completed: statsData?.companies_reached.completed || 0, target: statsData?.companies_reached.target || 0 },
      { id: 'companiesRegistered', title: 'Companies Registered', icon: TargetIcon, count: `${statsData?.companies_registered.completed}/${statsData?.companies_registered.target}` || "-", color: '#C7A109', completed: statsData?.companies_registered.completed || 0, target: statsData?.companies_registered.target || 0 },
      { id: 'applicationsReceived', title: 'Applications Received', icon: TargetIcon, count: `${statsData?.applications_received.completed}/${statsData?.applications_received.target}` || "-", color: '#C7A109', completed: statsData?.applications_received.completed || 0, target: statsData?.applications_received.target || 0 },
      { id: 'Hired', title: 'Hired', icon: TargetIcon, count: `${statsData?.hired.completed}/${statsData?.hired.target}` || "-", color: '#C7A109', completed: statsData?.hired.completed || 0, target: statsData?.hired.target || 0 },
      { id: 'jobsPosted', title: 'Jobs Posted', icon: TargetIcon, count: `${statsData?.job_posted.completed}/${statsData?.job_posted.target}` || "-", color: '#C7A109', completed: statsData?.job_posted.completed || 0, target: statsData?.job_posted.target || 0 },
      { id: 'candidatesReached', title: 'Candidates Reached', icon: TargetIcon, count: `${statsData?.candidates_reached.completed}/${statsData?.candidates_reached.target}` || "-", color: '#C7A109', completed: statsData?.candidates_reached.completed || 0, target: statsData?.candidates_reached.target || 0 },
      { id: 'candidatesRegistered', title: 'Candidates Registered', icon: TargetIcon, count: `${statsData?.candidate_registered.completed}/${statsData?.candidate_registered.target}` || "-", color: '#C7A109', completed: statsData?.candidate_registered.completed || 0, target: statsData?.candidate_registered.target || 0 }

    ]
    : [];


  // Columns and data for Potential Clients
  const potentialClientsColumns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + paginationForClients.pageIndex * paginationForClients.pageSize}</span>,
      },
      {
        header: 'Name',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div >
              <span style={{ textAlign: 'left', display: 'block', textAlign: 'left' }}>{row.name}</span>

            </div>
          );
        },
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },

      {
        header: 'Added By',
        accessorKey: 'added_by',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Details',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <InfoCircleOutlined size="1em" className="app-icon"
              onClick={() => {
                setSelectedPotentialClientIdForDetails(row.id);
                setIsClientDetailModalVisible(true);
              }}
              style={{ cursor: 'pointer', fontSize: '20px', color: '#3E6A9F' }}
            />
          );
        },
      }

    ],
    [navigate]
  );

  const transformedPotentialClientsData = clientsList?.results
    ? clientsList.results.map((client) => ({
      id: client?.id ?? "-", // Use nullish coalescing to handle null/undefined
      name: client?.name ?? "-",
      profile_pic: client?.profile_pic ?? "-",
      added_by: client.added_by_name || "-",
      assigned_to: client?.assigned_to_name ?? "-",
      total_projects: client?.projects?.total ?? "-",
      active_projects: client?.active_projects ?? "-",
      completed_projects: client?.completed_projects ?? "-",
      terminated_projects: client?.terminated_projects ?? "-",

      opportunities_lost: client?.lost_opportunities || "-",
      created_at: client.created_at
        ? formatDateUniversal(client.created_at, false)
        : "-",
    }))
    : [];


  // Columns and data for Active Projects
  const activeProjectsColumns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + paginationForProjects.pageIndex * paginationForProjects.pageSize}</span>,
      },
      {
        header: 'Title',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div onClick={() => navigate(`/admin/project-detail/${row.id}/${row.job_slug}`)}>
              <span style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }} className="link-style" >{row.title}</span>
            </div>
          );
        },
      },
      {
        header: 'Company Name',
        accessorKey: 'company_name',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },

      {
        header: 'Pending Review',
        accessorKey: 'pending_review',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Upcoming Interviews',
        accessorKey: 'upcoming_interviews',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Interviews Conducted',
        accessorKey: 'interviews_conducted',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Interviews Missed',
        accessorKey: 'interviews_missed',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Hired',
        accessorKey: 'hired',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Rejected',
        accessorKey: 'rejected',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Maybe',
        accessorKey: 'may_be',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Hired Through CV',
        accessorKey: 'hired_through_cv',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Posted On',
        accessorKey: 'posted_on',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
    ],
    [navigate]
  );


  const transformedActiveProjectsData = projectsList?.results
    ? projectsList.results.map((project) => ({
      id: project?.id ?? "-",
      title: project?.title ?? "-",
      job_slug: project?.job_slug ?? "-",
      company_name: project?.client_name ?? "-",
      assigned_to: project?.assigned_to_name ?? "-",
      pending_review: project?.pending_review ?? "-",
      upcoming_interviews: project?.upcoming_interviews ?? "-",
      interviews_conducted: project?.interview_conducted ?? "-",
      interviews_missed: project?.interview_missed ?? "-",
      hired: project?.hired ?? "-",
      rejected: project?.rejected ?? "-",
      may_be: project?.may_be ?? "-",
      hired_through_cv: project?.hired_through_cv ?? "-",
      posted_on: project?.created_at
        ? formatDateUniversal(project.created_at, false)
        : "-",
    }))
    : [];


  // Columns and data for Completed Projects
  const completedProjectsColumns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + paginationForProjects.pageIndex * paginationForProjects.pageSize}</span>,
      },
      {
        header: 'Title',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div onClick={() => navigate(`/admin/project-detail/${row.id}/${row.job_slug}`)}>
              <span style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }} className="link-style" >{row.title}</span>
            </div>
          );
        },
      },

      {
        header: 'Company Name',
        accessorKey: 'company_name',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },

      {
        header: 'Pending Review',
        accessorKey: 'pending_review',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Upcoming Interviews',
        accessorKey: 'upcoming_interviews',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Interviews Conducted',
        accessorKey: 'interviews_conducted',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Interviews Missed',
        accessorKey: 'interviews_missed',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Hired',
        accessorKey: 'hired',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Rejected',
        accessorKey: 'rejected',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Maybe',
        accessorKey: 'may_be',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Hired Through CV',
        accessorKey: 'hired_through_cv',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Posted On',
        accessorKey: 'posted_on',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Completed On',
        accessorKey: 'completed_on',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
    ],
    [navigate]
  );


  const transformedCompletedProjectsData = projectsList?.results
    ? projectsList.results.map((project) => ({
      id: project?.id ?? "-", // Ensures fallback for undefined or null
      title: project?.title ?? "-",
      job_slug: project?.job_slug ?? "-",
      company_name: project?.client_name ?? "-",
      assigned_to: project?.assigned_to_name ?? "-",
      pending_review: project?.pending_review ?? "-",
      upcoming_interviews: project?.upcoming_interviews ?? "-",
      interviews_conducted: project?.interview_conducted ?? "-",
      interviews_missed: project?.interview_missed ?? "-",
      hired: project?.hired ?? "-",
      rejected: project?.rejected ?? "-",
      may_be: project?.may_be ?? "-",
      hired_through_cv: project?.hired_through_cv ?? "-",
      posted_on: project?.created_at
        ? new Date(project.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        : "-",
      completed_on: project?.completed_on
        ? new Date(project.completed_on).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        : "-",
    }))
    : [];



  // Columns and data for Opportunities Lost
  const opportunitiesLostColumns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + paginationForClients.pageIndex * paginationForClients.pageSize}</span>,
      },
      {
        header: 'Name',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div style={{ textAlign: 'left', display: 'block', textAlign: 'left' }}>
              <span>{row.name}</span>
            </div>
          );
        },
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Added By',
        accessorKey: 'added_by',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Details',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <InfoCircleOutlined size="1em" className="app-icon"
              onClick={() => {
                setSelectedPotentialClientIdForDetails(row.id);
                setIsClientDetailModalVisible(true);
              }}
              style={{ cursor: 'pointer', fontSize: '20px', color: '#3E6A9F' }}
            />
          );
        },
      },
      {
        header: 'Reason',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <QuestionCircleOutlined size="1em" className="app-icon"
              onClick={() => {

                setSelectedLostClientDetail({

                  id: row.id,
                  name: row.name,
                  reason: row.reason
                });

                setIsLostClientDetailModalVisible(true);
              }}
              style={{ cursor: 'pointer', fontSize: '20px', color: '#3E6A9F' }}
            />
          );
        },
      }
    ],
    [navigate]
  );

  const transformedOpportunitiesLosData = clientsList?.results
    ? clientsList.results.map((client) => ({
      id: client?.id ?? "-",
      name: client?.name ?? "-",
      profile_pic: client?.profile_pic ?? "-",
      added_by: client.added_by_name || "-",
      assigned_to: client?.assigned_to_name ?? "-",
      total_projects: client?.projects?.total ?? "-",
      active_projects: client?.active_projects ?? "-",
      completed_projects: client?.completed_projects ?? "-",
      terminated_projects: client?.terminated_projects ?? "-",
      potential_clients: client?.potential_clients || "-",
      opportunities_lost: client?.lost_opportunities || "-",
      reason: client.reason ?? '-',
      created_at: client.created_at
        ? new Date(client.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        : "-",
    }))
    : [];


  //   // Columns and data for Completed Projects

  const terminatedProjectsColumns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + paginationForProjects.pageIndex * paginationForProjects.pageSize}</span>,
      },
      {
        header: 'Title',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div onClick={() => navigate(`/admin/project-detail/${row.id}/${row.job_slug}`)}>
              <span style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }} className="link-style" >{row.title}</span>
            </div>
          );
        },
      },
      {
        header: 'Company Name',
        accessorKey: 'company_name',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },

      {
        header: 'Pending Review',
        accessorKey: 'pending_review',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Upcoming Interviews',
        accessorKey: 'upcoming_interviews',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Interviews Conducted',
        accessorKey: 'interviews_conducted',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Interviews Missed',
        accessorKey: 'interviews_missed',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Hired',
        accessorKey: 'hired',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Rejected',
        accessorKey: 'rejected',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Maybe',
        accessorKey: 'may_be',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Hired Through CV',
        accessorKey: 'hired_through_cv',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Posted On',
        accessorKey: 'posted_on',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Terminated On',
        accessorKey: 'terminated_on',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Reason',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <QuestionCircleOutlined size="1em" className="app-icon"
              onClick={() => {

                setSelectedTerminatedProjectDetail({

                  id: row.id,
                  name: row.title,
                  reason: row.reason
                });

                setIsTerminatedProjectDetailModalVisible(true);
              }}
              style={{ cursor: 'pointer', fontSize: '20px', color: '#3E6A9F' }}
            />
          );
        },
      },
    ],
    [navigate]
  );


  const transformedTerminatedProjectsData = projectsList?.results
    ? projectsList.results.map((project) => ({
      id: project?.id ?? "-",
      job_slug: project?.job_slug ?? "-",
      title: project?.title ?? "-",
      company_name: project?.client_name ?? "-",
      assigned_to: project?.assigned_to_name ?? "-",
      pending_review: project?.pending_review ?? "-",
      upcoming_interviews: project?.upcoming_interviews ?? "-",
      interviews_conducted: project?.interview_conducted ?? "-",
      interviews_missed: project?.interview_missed ?? "-",
      hired: project?.hired ?? "-",
      rejected: project?.rejected ?? "-",
      may_be: project?.may_be ?? "-",
      hired_through_cv: project?.hired_through_cv ?? "-",
      reason: project.reason ?? "-",
      posted_on: project?.created_at
        ? new Date(project.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        : "-",
      terminated_on: project?.terminated_on
        ? new Date(project.terminated_on).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        : "-",
    }))
    : [];




  const renderClientTable = () => {
    switch (clientListType) {

      case 'Potential':

        return (

          <div>
            <TableComponent
              columns={potentialClientsColumns}
              data={transformedPotentialClientsData}
              totalCount={clientsList?.count || 0} // Update as necessary
              heading={"Potential Clients"}
              pagination={paginationForClients} // Pass pagination state to child
              onPaginationChange={setPaginationForClients}
              sorting={sortingForClients}
              onSortingChange={setSortingForClients}
              globalFilter={globalFilterForPotentials}
              onGlobalFilterChange={setGlobalFilterForPotentials}
            />
          </div>

        )


      case 'Lost':

        return (

          <div>
            <TableComponent
              columns={opportunitiesLostColumns}
              data={transformedOpportunitiesLosData}
              totalCount={clientsList?.count || 0} // Update as necessary
              heading={"Opportunities Lost"}
              pagination={paginationForClients} // Pass pagination state to child
              onPaginationChange={setPaginationForClients}
              sorting={sortingForClients}
              onSortingChange={setSortingForClients}
              globalFilter={globalFilterForPotentials}
              onGlobalFilterChange={setGlobalFilterForPotentials}
            />
          </div>

        )


      //   // Add more cases for other cards...
      default:
        return null;
    }
  };

  const renderProjectTable = () => {
    switch (projectListType) {


      case 'Active':

        return (

          <div>
            <TableComponent
              columns={activeProjectsColumns}
              data={transformedActiveProjectsData}
              totalCount={projectsList?.count || 0} // Update as necessary
              heading={"Active Projects"}
              pagination={paginationForProjects} // Pass pagination state to child
              onPaginationChange={setPaginationForProjects}
              sorting={sortingForProjects}
              onSortingChange={setSortingForProjects}
              globalFilter={globalFilterForProjects}
              onGlobalFilterChange={setGlobalFilterForProjects}
            />
          </div>

        )



      case 'Completed':

        return (

          <div>
            <TableComponent
              columns={completedProjectsColumns}
              data={transformedCompletedProjectsData}
              totalCount={projectsList?.count || 0} // Update as necessary
              heading={"Completed Projects"}
              pagination={paginationForProjects} // Pass pagination state to child
              onPaginationChange={setPaginationForProjects}
              sorting={sortingForProjects}
              onSortingChange={setSortingForProjects}
              globalFilter={globalFilterForProjects}
              onGlobalFilterChange={setGlobalFilterForProjects}
            />
          </div>

        )



      case 'Terminated':

        return (

          <div>
            <TableComponent
              columns={terminatedProjectsColumns}
              data={transformedTerminatedProjectsData}
              totalCount={projectsList?.count || 0} // Update as necessary
              heading={"Terminated Projects"}
              pagination={paginationForProjects} // Pass pagination state to child
              onPaginationChange={setPaginationForProjects}
              sorting={sortingForProjects}
              onSortingChange={setSortingForProjects}
              globalFilter={globalFilterForProjects}
              onGlobalFilterChange={setGlobalFilterForProjects}
            />
          </div>

        )


      //   // Add more cases for other cards...
      default:
        return null;
    }
  };


  useEffect(() => {
    const handler = setTimeout(() => {
      setPaginationForProjects((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => clearTimeout(handler);
  }, [globalFilterForProjects]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPaginationForClients((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => clearTimeout(handler);
  }, [globalFilterForPotentials]);

  return (
    <>
      <BreadCrumb linkText="Sales Executives" />

      <div className="sales-manager-detail-container">

        <div className="content-container">
          {/* User Profile Section */}

          {loadingUserStats ? (
            <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" />
          ) : (
            <UserDetailCard
              type="user"
              name={userStats?.name || ""}
              profileImg={userStats?.profile_pic || ""}
              phoneNumber={userStats?.phone || ""}
              email={userStats?.email || ""}
              onEditPicture={() => navigate(`/admin/edit-user/${userId}`)}
            />
          )}


          {/* Stats Section */}
          <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingStatsData}>
            <div className="metrics-grid">
              {metrics.length > 0 ? (
                metrics.map((metric, index) => (
                  <div key={index} className="metric-card">
                    <StatsCard
                      title={metric.title || "Default"}
                      value={metric.count || 0}
                      icon={<img src={metric.icon} alt={metric.title} style={{ width: '48px', height: '48px' }} />}
                      borderColor={metric.color}
                      percentage={metric.percentage}
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
          </Spin>


        </div>


        {/* Project Chart Section */}

        <div className="chart-container">
          {loadingProjectStats ? (
            <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" />
          ) : (
            <LineChart
              title="Project Stats"
              data={projectStats?.stats || {}}
              categories={projectStats?.dates || []}
              legendNames={['Completed', 'Active', 'Unassigned', 'Terminated']}
              colors={['#1E90FF', '#28a745', '#f8d7da', '#6c757d']}
              selectedTimeframe={selectedTimeFrameForProjectsData}
              onTimeFrameChange={handleTimeFrameFromProjectStats}
            />
          )}
        </div>


        {/* Client Chart Section */}
        <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingClientStats}>
          <div className="chart-container">
            <LineChart
              title="Clients Stats"
              data={clientData?.stats || {}}
              categories={clientData?.dates || []}
              legendNames={['Active', 'Potential', 'Unassigned', 'Dormant', 'Opportunities Lost']}
              colors={['#ff0000', '#000080', '#808080', '#f6c23e', '#28a745']}
              selectedTimeframe={selectedTimeFrameForClientsData}
              onTimeFrameChange={handleTimeFrameFromClientStats}
            />
          </div>
        </Spin>



        <div className="client-tabs-container">
          <div className="client-tabs">
            {['Active Projects', 'Completed Projects', 'Terminated Projects'].map((label) => {
              const tabValue = label.toLowerCase().replace(' ', '_');
              return (
                <button
                  key={tabValue}
                  className={`tab ${selectedProjectsTab === tabValue ? 'active' : ''}`}
                  onClick={() => handleTabClick(tabValue)}
                >
                  {label} ({projectCount[tabValue]})
                </button>
              );
            })}
          </div>
        </div>


        <div className="table-container">
          {renderProjectTable()}
        </div>


        <div className="client-tabs-container">
          <div className="client-tabs">
            {['Potential Clients', 'Opportunities Lost'].map((label) => {
              const tabValue = label.toLowerCase().replace(' ', '_');
              return (
                <button
                  key={tabValue}
                  className={`tab ${selectedClientsTab === tabValue ? 'active' : ''}`}
                  onClick={() => handleTabClick(tabValue)}
                >
                  {label} ({clientCount[tabValue]})
                </button>
              );
            })}
          </div>
        </div>


        <div className="table-container">
          {renderClientTable()}
        </div>

      </div>


      <Modal
        title={<span className="custom-modal-title">Client Details</span>}
        visible={isClientDetailModalVisible}
        onCancel={() => setIsClientDetailModalVisible(false)}
        footer={null}
        centered
        width={1500}
        className="rounded-modal" // Apply custom styling class for rounded modal
        loading={loadingPotentialClientDetail}
        bodyStyle={{
          overflowX: 'auto', // Enable horizontal scrolling
          maxWidth: '100%',
        }}
      >


        <div className="form-container" style={{ minWidth: '1300px' }}>

          <div className="form-content">
            <Formik
              initialValues={{
                job_title: potentialClientDetail?.data.job_title ?? "-",
                resources_required: potentialClientDetail?.data.resources_required ?? "-",
                posting_date: potentialClientDetail?.data.posting_date
                  ? moment(potentialClientDetail.data.posting_date).format('MMMM D, YYYY')
                  : "-",
                hiring_deadline: potentialClientDetail?.data.hiring_deadline
                  ? moment(potentialClientDetail.data.hiring_deadline).format('MMMM D, YYYY')
                  : "-",
                representative_name: potentialClientDetail?.data.representative_name ?? "-",
                representative_phone: potentialClientDetail?.data.representative_phone ?? "-",
                representative_email: potentialClientDetail?.data.representative_email ?? "-",
                name: potentialClientDetail?.data.name ?? "-",
                designation: potentialClientDetail?.data.designation ?? "-",
                phone: potentialClientDetail?.data.phone ?? "-",
                email: potentialClientDetail?.data.email ?? "-",
                website: potentialClientDetail?.data.website ?? "-",
                linkedin: potentialClientDetail?.data.linkedin ?? "-",
                facebook: potentialClientDetail?.data.facebook ?? "-",
                city: potentialClientDetail?.data.city ?? "-",
                country: potentialClientDetail?.data.country ?? "-",
                state: potentialClientDetail?.data.state ?? "-",
                remarks: potentialClientDetail?.data.remarks ?? "-",
                acquired_through: potentialClientDetail?.data.acquired_through ?? "-",
              }}


            >
              {({ values }) => (

                <Form layout="vertical">

                  <h3 className="section-heading">Company Details</h3>

                  {/* Three-Column Layout */}
                  <div className="form-section">


                    {/* Company Name */}

                    <div className="form-field">
                      <Field name="name">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Company Name</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="email">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Company Email</label>
                            <Input {...field} readOnly />

                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="phone">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Company Phone</label>
                            <Input {...field} readOnly />

                          </div>
                        )}
                      </Field>
                    </div>



                  </div>



                  <h3 className="section-heading">Job Details</h3>

                  {/* Three-Column Layout */}
                  <div className="form-section">

                    {/* Job Title  */}

                    <div className="form-field">
                      <Field name="job_title">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Job Title</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>


                    <div className="form-field">
                      <Field name="resources_required">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Number of Resources Required</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>


                    <div className="form-field">
                      <Field name="posting_date">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Job Posting Date</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>


                    <div className="form-field">
                      <Field name="hiring_deadline">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Hiring Deadline</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>


                  </div>


                  <h3 className="section-heading">Representative Info</h3>

                  <div className="form-section">

                    <div className="form-field">
                      <Field name="representative_name">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Name</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="designation">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Designation</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="representative_phone">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Phone</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field margin-top">
                      <Field name="representative_email">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Email</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field margin-top">
                      <Field name="website">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Website URL</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field margin-top">
                      <Field name="linkedin">
                        {({ field }) => (
                          <div className="form-item">
                            <label>LinkedIn Profile</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field margin-top">
                      <Field name="facebook">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Facebook Profile</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>


                    <div className="form-field">
                      <Field name="country">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Country</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="city">
                        {({ field }) => (
                          <div className="form-item">
                            <label>City</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>


                  </div>


                  <h3 className="section-heading">Additional Info</h3>
                  <div className="single-col">

                    <div className="form-field">
                      <Field name="acquired_through">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Acquired Through</label>
                            <Input {...field} readOnly />
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="remarks">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Remarks</label>
                            <TextArea
                              {...field}
                              rows={4}
                              readOnly
                            />
                          </div>
                        )}
                      </Field>
                    </div>

                  </div>


                </Form>
              )}
            </Formik>

          </div>

        </div>


      </Modal>


      <Modal
        title={<span className='lost-client-modal-title'>Terminated Project Details</span>}
        visible={isTerminatedProjectDetailModalVisible}
        onCancel={() => setIsTerminatedProjectDetailModalVisible(false)} // Wrap the function call in an arrow function
        footer={null}
        centered
        width={700}
        className="rounded-modal"
      >
        <div className="lost-client-modal-content">

          <p className="lost-client-modal-text">
            <strong>Title:</strong> {selectedTerminatedProjectDetail?.name ?? "-"}
          </p>
          <p className="lost-client-modal-text">
            <strong>Reason:</strong> {selectedTerminatedProjectDetail?.reason ?? "-"}
          </p>
        </div>
      </Modal>


      <Modal
        title={<span className='lost-client-modal-title'>Client Lost Details</span>}
        visible={isLostClientDetailModalVisible}
        onCancel={() => setIsLostClientDetailModalVisible(false)} // Wrap the function call in an arrow function
        footer={null}
        centered
        width={700}
        className="rounded-modal"
      >
        <div className="lost-client-modal-content">

          <p className="lost-client-modal-text">
            <strong>Name:</strong> {selectedLostClientDetail?.name ?? "-"}
          </p>
          <p className="lost-client-modal-text">
            <strong>Reason:</strong> {selectedLostClientDetail?.reason ?? "-"}
          </p>
        </div>
      </Modal>


    </>
  );
}
