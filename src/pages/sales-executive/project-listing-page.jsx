import { Modal } from '../../components/ui/app-modal.jsx';
import { Input } from '../../components/ui/app-controls.jsx';
import { Spin, Button } from '../../components/ui/app-controls.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { Form, Row, Col, Table, Avatar, DatePicker } from 'antd';
import { LoaderCircle as LoadingOutlined, User as UserOutlined, CircleHelp as QuestionCircleOutlined, DollarSign as DollarOutlined } from 'lucide-react';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import StatsCard from '../../components/stats-card.component.jsx';
import LineChart from '../../components/charts/line-chart.component.jsx';
import TableComponent from '../../components/tables/table.component.jsx';
import ActiveProjectsIcon from '../../assets/images/stat-card-icons/active-projects.svg';
import CompletedProjectsIcon from '../../assets/images/stat-card-icons/completed-projects.svg';
import TerminatedProjectsIcon from '../../assets/images/stat-card-icons/terminated-projects.svg';
import AntiClockIcon from '../../assets/images/table-icons/anti-clock-icon.svg';
import { getProjectsList, getProjectCount, getStats, getProjectStats } from '../shared/services/executive-service.js';
import useUserStore from '../shared/store/user-store.js';

import '../../assets/styles/legacy/client-listing-page.css'
import { refetchProjectsData } from '../shared/services/stats-service.js';

export default function ProjectListing() {


  const navigate = useNavigate();

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const handlePaginationChange = (newPagination) => {

    // setSorting([]);
    setPagination(newPagination); // Update pagination state in parent
  };


  const [sorting, setSorting] = useState([]);

  const handleSortingChange = (newSorting) => {
    // Reset pagination (pageIndex to 0, pageSize to initial state) when sorting changes
    // setPagination({pageIndex: 0, pageSize: 10});
    setSorting(newSorting);
  };


  const [trackRecordModalVisible, setTrackRecordModalVisible] = useState(false);
  const [newRecordModalVisible, setNewRecordModalVisible] = useState(false);

  const [isTerminatedProjectDetailModalVisible, setIsTerminatedProjectDetailModalVisible] = useState(false);
  const [selectedTerminatedProjectDetail, setSelectedTerminatedProjectDetail] = useState({
    id: undefined,
    name: undefined,
    reason: undefined
  })

  const [selectedTab, setSelectedTab] = useState('active_projects');

  const [selectedTimeFrameForProjectsData, setSelectedTimeFrameForProjectsData] = useState('week');

  const [projectListType, setProjectListType] = useState("Active");

  const [selectedProjectForTrackRecord, setSelectedProjectForTrackRecord] = useState({
    id: null,
    company_name: null,
  })

  const [globalFilter, setGlobalFilter] = useState('')

  const [form] = Form.useForm();

  const { user } = useUserStore();




  const { data: projectCount = {}, isLoading: loadingProjectCount } = useQuery({
    queryKey: ['projectCount', user?.slug],
    queryFn: async () => {
      const result = await getProjectCount(user?.slug); // Await the Promise
      return result; // Ensure this is returned
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const metrics = projectCount
    ? [
      { title: 'Active Projects', icon: ActiveProjectsIcon, count: projectCount?.active || 0, color: '#008000' },
      { title: 'Completed Projects', icon: CompletedProjectsIcon, count: projectCount?.completed || 0, color: '#2DB1F8', },
      { title: 'Terminated Projects', icon: TerminatedProjectsIcon, count: projectCount?.terminated || 0, color: '#FEBAC6', },
    ]
    : [];


  const {
    data: projectData,
    isLoading: loadingProjectStats,
  } = useQuery({
    queryKey: ['projectStats', selectedTimeFrameForProjectsData, user?.id],
    queryFn: () => getProjectStats(selectedTimeFrameForProjectsData, user?.id),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });


  const handleTimeFrameFromProjectStats = (value) => setSelectedTimeFrameForProjectsData(value);


  const { data: projectsList, isLoading: loadingProjectsList, refetch: refetchProjectsList } = useQuery({
    queryKey: ['projectsList', user?.slug, projectListType, pagination.pageIndex, pagination.pageSize, sorting, globalFilter],
    queryFn: () => getProjectsList(user?.slug, projectListType, pagination.pageIndex + 1, pagination.pageSize, sorting, globalFilter),
    enabled: projectListType !== null,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,

  })

  const { mutate: refetchProjectsRecord, isPending: loadingprojectData } = useMutation({
    mutationFn: refetchProjectsData,
    onSuccess: () => {
      refetchProjectsList();
    },
  });

  const handleTabClick = (tabValue) => {
    console.log("Selected Tab: ", tabValue);
    setSorting([]);
    setPagination({ pageIndex: 0, pageSize: 10 });

    // Set projectListType based on the selected tabValue

    switch (tabValue) {
      case 'all':
        setProjectListType(undefined);
        console.log("Project Listing Type: All");
        break;

      case 'active_projects':
        setProjectListType("Active");
        console.log("Project Listing Type: Active");
        break;
      case 'completed_projects':
        setProjectListType("Completed");
        console.log("Project Listing Type: Completed");
        break;

      case 'terminated_projects':
        setProjectListType("Terminated");
        console.log("Project Listing Type: Terminated");
        break;


      default:

        break;
    }



    setSelectedTab(tabValue);

  };



  // Columns and data for Active Projects
  const activeProjectsColumns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + pagination.pageIndex * pagination.pageSize}</span>,
      },
      {
        header: 'Title',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div onClick={() => navigate(`/sales-executive/project-detail/${row.id}/${row.job_slug}`)}>
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
        header: 'Pending Interviews',
        accessorKey: 'pending_interviews',
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
        header: 'Track Record',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <img
              src={AntiClockIcon}
              alt="Track Record"
              onClick={() => {

                setSelectedProjectForTrackRecord({
                  id: row.id,
                  company_name: row.company_name
                })
                setTrackRecordModalVisible(true);
              }}
              style={{ cursor: 'pointer', width: '25px', height: '25px' }}
            />
          );
        },
      },
      {
        header: 'Payments',
        accessorKey: 'payments',
        id: 'payments_action',
        enableSorting: false,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <DollarOutlined size="1em" className="app-icon"
              style={{ cursor: 'pointer', fontSize: '18px', color: '#3E6A9F' }}
              onClick={() => navigate(`/project-payments/${row.original.id}`)}
            />
          </div>
        ),
      },
    ],
    [navigate]
  );


  const transformedActiveProjectsData = projectsList && projectsList.results
    ? projectsList.results.map((project) => {
      return {
        id: project.id ?? "-",
        job_slug: project.job_slug ?? "-",
        title: project.title ?? "-",
        company_name: project.client_name ?? "-",
        assigned_to: project.assigned_to_name ?? "-",
        pending_interviews: project.pending_interviews ?? "-",
        upcoming_interviews: project.upcoming_interviews ?? "-",
        interviews_conducted: project.interview_conducted ?? "-",
        interviews_missed: project.interview_missed ?? "-",
        hired: project.hired ?? "-",
        rejected: project.rejected ?? "-",
        may_be: project.may_be ?? "-",
        hired_through_cv: project.hired_through_cv ?? "-",
        posted_on: project.created_at
          ? new Date(project.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          : "-",
      };
    })
    : [];



  // Columns and data for Completed Projects
  const completedProjectsColumns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + pagination.pageIndex * pagination.pageSize}</span>,
      },
      {
        header: 'Title',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div onClick={() => navigate(`/sales-executive/project-detail/${row.id}/${row.job_slug}`)}>
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
        header: 'Pending Interviews',
        accessorKey: 'pending_interviews',
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
      {
        header: 'Payments',
        accessorKey: 'payments',
        id: 'payments_action',
        enableSorting: false,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <DollarOutlined size="1em" className="app-icon"
              style={{ cursor: 'pointer', fontSize: '18px', color: '#3E6A9F' }}
              onClick={() => navigate(`/project-payments/${row.original.id}`)}
            />
          </div>
        ),
      },
    ],
    [navigate]
  );


  const transformedCompletedProjectsData = projectsList && projectsList.results
    ? projectsList.results.map((project) => ({
      id: project.id ?? "-",
      title: project.title ?? "-",
      job_slug: project.job_slug ?? "-",
      company_name: project.client_name ?? "-",
      assigned_to: project.assigned_to_name ?? "-",
      pending_interviews: project.pending_interviews ?? "-",
      upcoming_interviews: project.upcoming_interviews ?? "-",
      interviews_conducted: project.interview_conducted ?? "-",
      interviews_missed: project.interview_missed ?? "-",
      hired: project.hired ?? "-",
      rejected: project.rejected ?? "-",
      may_be: project.may_be ?? "-",
      hired_through_cv: project.hired_through_cv ?? "-",
      posted_on: project.created_at
        ? new Date(project.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        : "-",
      completed_on: project?.completed_on
        ? new Date(project.completed_on).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        : "-",
    }))
    : [];



  // Columns and data for Completed Projects

  const terminatedProjectsColumns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + pagination.pageIndex * pagination.pageSize}</span>,
      },
      {
        header: 'Title',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div onClick={() => navigate(`/sales-executive/project-detail/${row.id}/${row.job_slug}`)}>
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
        header: 'Pending Interviews',
        accessorKey: 'pending_interviews',
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
      {
        header: 'Payments',
        accessorKey: 'payments',
        id: 'payments_action',
        enableSorting: false,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <DollarOutlined size="1em" className="app-icon"
              style={{ cursor: 'pointer', fontSize: '18px', color: '#3E6A9F' }}
              onClick={() => navigate(`/project-payments/${row.original.id}`)}
            />
          </div>
        ),
      },
    ],
    [navigate]
  );


  const transformedTerminatedProjectsData = projectsList && projectsList.results
    ? projectsList.results.map((project) => ({
      id: project.id ?? "-",
      title: project.title ?? "-",
      job_slug: project.job_slug ?? "-",
      company_name: project.client_name ?? "-",
      assigned_to: project.assigned_to_name ?? "-",
      pending_interviews: project.pending_interviews ?? "-",
      upcoming_interviews: project.upcoming_interviews ?? "-",
      interviews_conducted: project.interview_conducted ?? "-",
      interviews_missed: project.interview_missed ?? "-",
      hired: project.hired ?? "-",
      rejected: project.rejected ?? "-",
      may_be: project.may_be ?? "-",
      hired_through_cv: project.hired_through_cv ?? "-",
      reason: project.reason ?? "-",
      posted_on: project.created_at
        ? new Date(project.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        : "-",
      terminated_on: project?.terminated_at
        ? new Date(project.terminated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        : "-",
    }))
    : [];




  const renderTable = () => {
    switch (selectedTab) {

      case 'active_projects':

        return (

          <div>
            <TableComponent
              columns={activeProjectsColumns}
              data={transformedActiveProjectsData}
              totalCount={projectsList?.count || 0} // Update as necessary
              heading={"Active Projects"}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
            />
          </div>

        )



      case 'completed_projects':

        return (

          <div>
            <TableComponent
              columns={completedProjectsColumns}
              data={transformedCompletedProjectsData}
              totalCount={projectsList?.count || 0} // Update as necessary
              heading={"Completed Projects"}
              pagination={pagination}
              onPaginationChange={handlePaginationChange} sorting={sorting}
              onSortingChange={handleSortingChange}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
            />
          </div>

        )


      case 'terminated_projects':

        return (

          <div>
            <TableComponent
              columns={terminatedProjectsColumns}
              data={transformedTerminatedProjectsData}
              totalCount={projectsList?.count || 0} // Update as necessary
              heading={"Terminated Projects"}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
            />
          </div>

        )


      // Add more cases for other cards...
      default:
        return null;
    }
  };


  const dataSource = Array(8).fill({
    description: 'Description is the description that lorem ipsum contern',
    date: '05 October, 2024',
  });

  const recordColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      align: 'right',
    },
  ];


  const countMapping = projectCount ? {
    all: projectCount?.all ?? 0,
    active_projects: projectCount?.active ?? 0,
    completed_projects: projectCount?.completed ?? 0,
    terminated_projects: projectCount?.terminated ?? 0,
  } : {
    all: 0,
    active_projects: 0,
    completed_projects: 0,
    terminated_projects: 0,
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => clearTimeout(handler);
  }, [globalFilter]);


  return (
    <>
      <BreadCrumb linkText="Projects" />
      <div className='container'>
        <div className='refetch-wrapper'>
          <Button className='refetch-button' type='primary' variant='filled' onClick={() => refetchProjectsRecord()}>Refetch Projects Data {loadingprojectData ? <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} /> : null}</Button>
        </div>
        {/* Metrics Cards Section with CSS Grid */}
        <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingProjectCount}>
          <div className="metrics-grid">
            {metrics.length > 0 ? (
              metrics.map((metric, index) => (
                <div key={index} className="metric-card">
                  <StatsCard
                    title={metric.title}
                    value={metric.count}

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


        {/* Project Chart Section */}
        <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingProjectStats}>
          <div className="chart-container">
            <LineChart
              title="Stats"
              data={projectData?.stats || {}}
              categories={projectData?.dates || []}
              legendNames={['Completed', 'Active', 'Terminated']}
              colors={['#1E90FF', '#28a745', '#6c757d']}
              selectedTimeframe={selectedTimeFrameForProjectsData}
              onTimeFrameChange={handleTimeFrameFromProjectStats}
            />
          </div>
        </Spin>

        {/* Tabs Section */}

        <div className="client-tabs-container">
          <div className="client-tabs">
            {['Active Projects', 'Completed Projects', 'Terminated Projects'].map((label) => {
              const tabValue = label.toLowerCase().replace(' ', '_');
              const count = countMapping[tabValue];
              return (
                <button
                  key={tabValue}
                  className={`tab ${selectedTab === tabValue ? 'active' : ''}`}
                  onClick={() => handleTabClick(tabValue)}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>


        </div>


        <div className="table-container">
          {renderTable()}
        </div>


      </div>



      {/* Records List Modal */}

      <Modal
        title={

          <>

            <div style={{ padding: '16px', paddingTop: '30px', paddingBottom: '30px', marginTop: "25px", marginBottom: "15px", borderRadius: '10px', backgroundColor: '#f0f0f0' }}>


              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', }}>

                <Avatar icon={<UserOutlined size="1em" className="app-icon" />} />
                <span style={{ marginLeft: '8px', flex: 1 }}>{selectedProjectForTrackRecord.company_name}</span>


                <Button type="primary" className='custom-ok-button' onClick={() => setNewRecordModalVisible(true)} style={{ marginTop: '16px' }}>Add New Record</Button>

              </div>

              <div style={{ marginLeft: '8px', marginTop: '5px', fontWeight: '500', fontSize: '13px' }}>Deadline: 25th December, 2024</div>

            </div>


          </>

        }
        visible={trackRecordModalVisible}
        // onOk={handleOk}
        onCancel={() => setTrackRecordModalVisible(false)}
        footer={null}
        width={850}
      >

        <Table
          dataSource={dataSource}
          columns={recordColumns}
          pagination={false}
          rowKey={(record, index) => index}
          showHeader={false}
        />
      </Modal>


      {/* Add Record*/}


      <Modal
        title={<span className="custom-modal-title">Add Record</span>}
        visible={newRecordModalVisible}
        onOk={() => { console.log("Add New Record OK"); }}
        onCancel={() => { setNewRecordModalVisible(false); }}
        centered
        okText="Add"
        cancelText="Cancel"
        className="rounded-modal"
        okButtonProps={{ className: 'custom-ok-button' }}
        cancelButtonProps={{ className: 'custom-cancel-button' }}

      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="form-label">Follow Up Date</span>}
                name="followUpDate"
                rules={[{ required: true, message: 'Please select the follow-up date' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="Select the follow-up date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={<span className="form-label">Description</span>}
                name="description"
                rules={[{ required: true, message: 'Please enter the description' }]}
              >
                <Input.TextArea placeholder="Enter the description" rows={4} />
              </Form.Item>
            </Col>
          </Row>
        </Form>

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


    </>
  );
}
