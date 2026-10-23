import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Modal, Spin } from 'antd';
import { LoaderCircle as LoadingOutlined, User as UserOutlined } from 'lucide-react';
import { useQuery } from 'react-query';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import TableComponent from '../../components/tables/table.component.jsx';
import ProfileImagePlaceholder from '../../assets/images/user-card-icons/user-placeholder.svg'
import DocIcon from '../../assets/images/table-icons/doc icon.png';
import '../../assets/styles/legacy/project-application-page.css';
import { getProjectApplications, getProjectApplicationCount } from '../shared/services/executive-service.js';
import formatDate from '../shared/utils/formatDate.js';

export default function ProjectApplication() {

  const { id } = useParams();

  const [selectedTab, setSelectedTab] = useState('Pending Reviews');
  const [isModalVisible, setIsModalVisible] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState({})

  const [pagination, setPagination] = useState({
    pageIndex: 0, // Start at page 0
    pageSize: 10, // Default rows per page
  });

  const [search, setSearch] = useState("")


  const handlePaginationChange = (newPagination) => {

    // setSorting([]);
    setPagination(newPagination); // Update pagination state
  };


  const [sorting, setSorting] = useState([]);

  const handleSortingChange = (newSorting) => {
    // Reset pagination (pageIndex to 0, pageSize to initial state) when sorting changes
    // setPagination({pageIndex: 0, pageSize: 10});
    setSorting(newSorting);
  };

  const [category, setCategory] = useState("Pending");


  const { data: projectApplications, isLoading: loadingProjectApplications, isError: isProjectApplicationsError } = useQuery({
    queryKey: ['projectApplications', id, category, pagination.pageIndex, pagination.pageSize, sorting, search],
    queryFn: () => getProjectApplications(id, category, pagination.pageIndex + 1, pagination.pageSize, sorting, search),
    onError: (error) => {
      console.error('Error fetching project applications:', error.message);
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });


  const { data: count, isLoading: loadingCount, isError: isCountError } = useQuery({
    queryKey: ['count', id],
    queryFn: () => getProjectApplicationCount(id),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error('Error fetching project application count:', error.message);
    },

  });



  const countMapping = count ? {
    'Pending Reviews': count?.pending || 0,
    'Upcoming Interviews': count?.upcoming || 0,
    'Interviews Conducted': count?.conducted || 0,
    'Interviews Missed': count?.missed || 0,
    'Rejected': count?.rejected || 0,
    'Accepted': count?.accepted || 0,
    'Maybe': count?.maybe || 0,
    'Hired Through CV': count?.hired_through_cv || 0,
  } :
    [];


  // const handlePaginationChange = (newPagination) => {
  //   console.log("Updated pagination:", newPagination);
  //   setPagination(newPagination); // Update pagination state in parent
  // };


  const handleTabClick = (tab) => {

    setSorting([]);
    setPagination({ pageIndex: 0, pageSize: 10 });

    setSelectedTab(tab);

    switch (tab) {
      case 'Pending Reviews':
        setCategory('Pending');
        break;
      case 'Upcoming Interviews':
        setCategory('Upcoming Interviews');
        break;
      case 'Interviews Conducted':
        setCategory('Conducted Interviews');
        break;
      case 'Interviews Missed':
        setCategory('Missed Interviews');
        break;
      case 'Rejected':
        setCategory('Rejected');
        break;
      case 'Accepted':
        setCategory('Accepted');
        break;
      case 'Review Later':
        setCategory('Maybe');
        break;
      case 'Hired Through CV':
        setCategory('Hired Through CV');
        break;
      default:
        setCategory('Pending'); // Default case if no match
        break;
    }

  };

  const projectApplicationColumns = [
    {
      header: '#',
      accessorKey: 'id',
      Cell: ({ row }) => <span>{row.index + 1 + pagination.pageIndex * pagination.pageSize}</span>

    },
    {
      header: 'Name',
      accessorFn: (row) => row,
      Cell: ({ cell }) => {
        const row = cell.getValue();
        return (
          <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }}>
            <img
              src={row.profile_pic || ProfileImagePlaceholder}
              alt="Profile"
              style={{ width: 40, height: 40, flexShrink: 0, objectFit: 'cover', borderRadius: '50%', marginRight: '10px' }}
            />
            <span>{row.candidate}</span>
          </div>
        );
      },
    },
    {
      header: 'Applied On',
      accessorKey: 'created_at',
      Cell: ({ cell }) => <span>{cell.getValue()}</span>,
    },
    {
      header: 'Interview',
      accessorFn: (row) => row,
      Cell: ({ cell }) => {
        const row = cell.getValue();
        return (
          <img
            src={DocIcon}
            alt="Interview"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedApplication(row);
              setIsModalVisible(true);
            }}
          />
        );
      },
    },

    {
      header: 'View Profile',
      accessorFn: (row) => row,
      Cell: ({ cell }) => {
        const row = cell.getValue();
        return (
          <img
            src={DocIcon}
            alt="Interview"
            style={{ cursor: 'pointer' }}
            onClick={() => window.open(`https://www.searchopal.com/job-seeker/${row.slug}`, '_blank')}
          />
        );
      },
    },
  ];


  const transformedData = projectApplications && projectApplications.results
    ? projectApplications.results.map((application) => ({
      ...application,
      id: application.id || "-",
      name: application?.name || "-",
      profile_pic: application.profile_pic,
      applied_on: application.created_at || "-",
    }))
    : [];

  console.log(transformedData, "transformedDatatransformedData")
  function removeQueryParams(fullUrl) {
    try {
      const url = new URL(fullUrl);
      return `${url.origin}${url.pathname}`;
    } catch (error) {
      console.error("Invalid URL:", fullUrl);
      return fullUrl;
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);



  return (
    <>
      <BreadCrumb linkText="Project - Applications" />
      <div className="container">
        <div className="client-tabs-container">
          <div className="client-tabs">
            {['Pending Reviews', 'Upcoming Interviews', 'Interviews Conducted', 'Interviews Missed', 'Rejected', 'Accepted', 'Review Later', 'Hired Through CV'].map((label) => (
              <button
                key={label}
                className={`tab ${selectedTab === label ? 'active' : ''}`}
                onClick={() => handleTabClick(label)}
              >
                {label} ({countMapping[label] || 0})
              </button>
            ))}
          </div>
        </div>

        <div className="tableContainer">

          <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingProjectApplications}>

            <TableComponent
              columns={projectApplicationColumns}
              data={transformedData}
              totalCount={projectApplications?.count || 0}
              heading={projectApplications?.job_name || 'Default Heading'}
              pagination={pagination} // Pass pagination state to child
              onPaginationChange={handlePaginationChange}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              globalFilter={search}
              onGlobalFilterChange={setSearch}
            />

          </Spin>

          <Modal
            title="Interview Details"
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
          >
            <p><strong>Candidate:</strong> {selectedApplication?.candidate}</p>
            <p><strong>Company:</strong> {selectedApplication?.company}</p>
            <p><strong>Job Status:</strong> {selectedApplication?.status}</p>
            <p><strong>Rating:</strong> {selectedApplication?.rating}</p>
            <p><strong>Remarks:</strong> {selectedApplication?.remarks}</p>
            <p><strong>Interview Date:</strong> {selectedApplication?.interview_date && formatDate(selectedApplication?.interview_date)}</p>
            <p><strong>Applied On:</strong> {selectedApplication?.created_at}</p>
            <p><strong>Document:</strong> <a href={removeQueryParams(selectedApplication?.document)} target='_blank'>{removeQueryParams(selectedApplication?.document)}</a></p>
            {/* Add more details if available */}
          </Modal>
        </div>
      </div>
    </>
  );

}
