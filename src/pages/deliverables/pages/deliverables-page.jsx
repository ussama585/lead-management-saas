import { Button } from '../../../components/ui/app-controls.jsx';
import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';

import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import ExecutiveTabButton from '../../../components/executive-tab-button.component.jsx';
import BootstrapDateRangeModal from '../../../components/bootstrap-date-range-modal.component.jsx';
import ResumeClearAllFiltersButton from '../../resume/components/ResumeClearAllFiltersButton.jsx';
import NewTableComponent from '../../../components/tables/new-table.jsx';
import { getJobDeliverables, getJobDeliverablesCount, getDeliverableAssignCount } from '../../shared/services/headhunting.js';
import { formatDateUniversal } from '../../shared/utils/formatDate.js';
import useUserStore from '../../shared/store/user-store.js';
import { statusColors } from '../../clients/constants/client-constants.js';
import '../../../assets/styles/legacy/admin-dashboard-page.css';
import '../../../assets/styles/legacy/client-listing-page.css';

const StatusPill = ({ value }) => {
  if (!value) return <span>-</span>;
  return (
    <span
      style={{
        color: statusColors[value] || '#666',
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: '#f0f0f0',
      }}
    >
      {value}
    </span>
  );
};

const DeliverablesPage = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const userType = user?.user_type;
  const [activeTab, setActiveTab] = useState('upcoming');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedRecruiterId, setSelectedRecruiterId] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  const toDateString = (d) => (d && d.format ? d.format('YYYY-MM-DD') : null);

  const { data: countsData } = useQuery(
    ['jobDeliverablesCount'],
    () => getJobDeliverablesCount(),
    { staleTime: 60 * 1000 }
  );

  const { data: recruiterCountsData } = useQuery(
    ['deliverableAssignCount', activeTab],
    () => getDeliverableAssignCount(activeTab),
    { staleTime: 60 * 1000, enabled: userType !== 'recruitment_executive' }
  );

  const recruiterTabs = recruiterCountsData?.results ?? [];

  // Reset recruiter filter when switching Upcoming/Previous (list is tab-scoped)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedRecruiterId(null);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const { data, isLoading, isFetching } = useQuery(
    [
      'jobDeliverables',
      activeTab,
      pagination.pageIndex,
      pagination.pageSize,
      sorting?.[0]?.id,
      sorting?.[0]?.desc,
      globalFilter,
      selectedRecruiterId,
      dateRange?.[0],
      dateRange?.[1],
    ],
    () => {
      const [start, end] = dateRange || [];
      return getJobDeliverables(
        activeTab,
        pagination.pageIndex + 1,
        pagination.pageSize,
        sorting,
        globalFilter,
        selectedRecruiterId ?? '',
        toDateString(start),
        toDateString(end)
      );
    },
    { keepPreviousData: true, staleTime: 0 }
  );

  const results = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const upcomingCount = countsData?.upcoming ?? 0;
  const previousCount = countsData?.previous ?? 0;

  const columns = useMemo(
    () => [
      {
        header: '#',
        id: 'row_number',
        accessorKey: 'row_number',
        size: 60,
        enableSorting: false,
        Cell: ({ row }) => <span>{row.index + 1}</span>,
      },
      {
        header: 'CV Submission Deadline',
        id: 'cv_submission_deadline',
        accessorKey: 'cv_submission_deadline',
        size: 200,
        Cell: ({ cell }) => <span>{cell.getValue() ? formatDateUniversal(cell.getValue()) : '-'}</span>,
      },
      {
        header: 'Recruiter Assigning Date',
        id: 'recruiter_assigned_at',
        accessorKey: 'recruiter_assigned_at',
        size: 200,
        Cell: ({ cell }) => <span>{cell.getValue() ? formatDateUniversal(cell.getValue()) : '-'}</span>,
      },
      {
        header: 'Job Title',
        id: 'job_title',
        accessorKey: 'job_title',
        size: 200,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Batch Name',
        id: 'batch_name',
        accessorKey: 'batch_name',
        size: 160,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Project Name',
        id: 'project_name',
        accessorKey: 'project_name',
        size: 200,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Company Name',
        id: 'company_name',
        accessorKey: 'company_name',
        size: 160,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Vacancies',
        id: 'number_of_vacancies',
        accessorKey: 'number_of_vacancies',
        size: 100,
        Cell: ({ cell }) => <span>{cell.getValue() ?? '-'}</span>,
      },
      {
        header: 'Job Status',
        id: 'status',
        accessorKey: 'status',
        size: 120,
        enableSorting: false,
        Cell: ({ cell }) => <StatusPill value={cell.getValue()} />,
      },
      {
        header: 'Project Status',
        id: 'project_status',
        accessorKey: 'project_status',
        size: 130,
        enableSorting: false,
        Cell: ({ cell }) => <StatusPill value={cell.getValue()} />,
      },
      {
        header: 'Client Status',
        id: 'client_status',
        accessorKey: 'client_status',
        size: 120,
        enableSorting: false,
        Cell: ({ cell }) => <StatusPill value={cell.getValue()} />,
      },
      {
        header: 'Recruiter',
        id: 'recruiter_name',
        accessorKey: 'recruiter_name',
        size: 160,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Recruitment Manager',
        id: 'recruitment_manager',
        accessorKey: 'recruitment_manager',
        size: 170,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'View Job',
        id: 'view_job',
        accessorKey: 'id',
        enableSorting: false,
        size: 90,
        Cell: ({ row }) => {
          const jobId = row.original?.job_id;
          if (!jobId) return <span>-</span>;
          return (
            <Button
              type="primary"
              size="small"
              style={{ background: '#3E6A9F', borderColor: '#3E6A9F', height: 26, padding: '0 10px' }}
              onClick={() => navigate(`/recruitment/job-headhunting/${jobId}`)}
            >
              View
            </Button>
          );
        },
      },
    ],
    [navigate]
  );

  return (
    <>
      <BreadCrumb linkText="Deliverables" />

      <div className="listing-page-content">
        <div className="admin-dashboard-section-tabs" style={{ marginBottom: 16 }}>
          <span style={{ marginLeft: 6, marginRight: 6 }}>
            <ExecutiveTabButton
              executive={{ id: 'upcoming' }}
              label="Upcoming"
              count={upcomingCount}
              showRoleSuffix={false}
              isSelected={activeTab === 'upcoming'}
              onClick={() => handleTabChange('upcoming')}
              className="executive-section-tab"
            />
          </span>
          <span style={{ marginLeft: 6, marginRight: 6 }}>
            <ExecutiveTabButton
              executive={{ id: 'previous' }}
              label="Previous"
              count={previousCount}
              showRoleSuffix={false}
              isSelected={activeTab === 'previous'}
              onClick={() => handleTabChange('previous')}
              className="executive-section-tab"
            />
          </span>
        </div>

        {userType !== 'recruitment_executive' && recruiterTabs.length > 0 && (
          <div className="admin-dashboard-section-tabs" style={{ marginBottom: 16 }}>
            <span style={{ marginLeft: 6, marginRight: 6 }}>
              <ExecutiveTabButton
                executive={{ id: 'all' }}
                label="All"
                showRoleSuffix={false}
                showCount={false}
                isSelected={selectedRecruiterId === null}
                onClick={() => {
                  setSelectedRecruiterId(null);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className="executive-section-tab"
              />
            </span>
            {recruiterTabs.map((recruiter) => (
              <span key={recruiter.recruiter_id} style={{ marginLeft: 6, marginRight: 6 }}>
                <ExecutiveTabButton
                  executive={{ id: recruiter.recruiter_id, name: recruiter.recruiter_name }}
                  count={recruiter.deliverable_count}
                  showRoleSuffix={false}
                  isSelected={selectedRecruiterId === String(recruiter.recruiter_id)}
                  onClick={() => {
                    setSelectedRecruiterId(String(recruiter.recruiter_id));
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  className="executive-section-tab"
                />
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {dateRange && (
            <ResumeClearAllFiltersButton
              onClick={() => {
                setDateRange(null);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            />
          )}
          <BootstrapDateRangeModal
            value={dateRange}
            onChange={setDateRange}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={(range) => {
              setDateRange(range);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
        </div>

        <div className="table-container">
          <NewTableComponent
            totalCount={totalCount}
            columns={columns}
            data={results}
            denseCells
            isLoading={isLoading || isFetching}
            enableRowSelection={false}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={(value) => {
              setGlobalFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            enableGlobalFilter
            heading={activeTab === 'upcoming' ? `Upcoming Deliverables (${totalCount})` : `Previous Deliverables (${totalCount})`}
          />
        </div>
      </div>
    </>
  );
};

export default DeliverablesPage;
