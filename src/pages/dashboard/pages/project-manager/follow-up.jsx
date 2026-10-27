import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Button, Tooltip } from '../../../../components/ui/app-controls.jsx';
import React, { useState, useMemo, useCallback } from 'react';
import { Tabs } from 'antd';
import { MessageSquare as MessageOutlined, Clock as ClockCircleOutlined, Eye as EyeOutlined } from 'lucide-react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import { getJobsFollowupsList } from '../../../shared/services/project-manager-service.js';
import { formatDateUniversal, formatTimeUniversal } from '../../../shared/utils/formatDate.js';
import JobFollowupsModal from '../../../../components/job-followups-modal.component.jsx';
import JobRemarksModal from '../../../../components/job-remarks-modal.component.jsx';
import '../../../../assets/styles/legacy/admin-dashboard-page.css';

const formatFollowupTimeValue = (raw) => {
  if (!raw) return '-';
  const str = String(raw).trim();

  // API key format: "followup_time": "19:00:00"
  const hhmmss = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  const match = str.match(hhmmss);
  if (match) {
    const hours24 = Number(match[1]);
    const minutes = match[2];
    if (Number.isFinite(hours24) && hours24 >= 0 && hours24 <= 23) {
      const ampm = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    }
  }

  const fallback = formatTimeUniversal(str);
  return fallback || '-';
};

const getFollowupTimeFromRow = (row) => {
  const directTime =
    row?.followup_time ||
    row?.follow_up_time ||
    row?.next_followup_time ||
    row?.current_followup_time ||
    row?.last_followup_time;

  if (directTime) {
    return formatFollowupTimeValue(directTime);
  }

  const dateTimeCandidate =
    row?.followup_date ||
    row?.follow_up_date ||
    row?.next_followup_date ||
    row?.current_followup_date ||
    row?.last_followup_date;

  if (dateTimeCandidate) {
    const formatted = formatTimeUniversal(dateTimeCandidate);
    return formatted || '-';
  }

  return '-';
};

const getRemarksColumns = (onViewRemarks, onOpenFollowups, onOpenRemarks, onViewJob) => [
  { header: 'Follow up date', accessorKey: 'follow_up_date' },
  { header: 'Follow up time', accessorKey: 'follow_up_time' },
  {
    header: 'Remarks',
    accessorKey: 'remarks',
    Cell: ({ cell, row }) => {
      const value = cell.getValue();
      const text = value && String(value).trim() && String(value) !== '-' ? String(value) : null;
      const hasRemarks = !!text;

      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Button
            type="text"
            size="small"
            icon={<MessageOutlined size="1em" className="app-icon" />}
            onClick={() => onViewRemarks(row.original)}
            title="View remarks"
            style={{ padding: '0 4px', minWidth: 28, color: hasRemarks ? '#1890ff' : '#bbb' }}
          />
        </span>
      );
    },
  },
  { header: 'Client', accessorKey: 'client' },
  { header: 'Project Name', accessorKey: 'project_name' },
  { header: 'Job Title', accessorKey: 'job_title' },
  { header: 'Recruiter Name', accessorKey: 'recruiter_name' },
  { header: 'Sales Executive Name', accessorKey: 'sales_executive_name' },
  {
    header: 'Follow Up',
    id: 'follow_up_actions',
    enableSorting: false,
    muiTableHeadCellProps: { align: 'center' },
    muiTableBodyCellProps: { align: 'center', sx: { textAlign: 'center' } },
    Cell: ({ row }) => {
      const jobId = row.original.job_id;
      if (!jobId) return null;
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Tooltip title="View & manage follow-ups">
            <ClockCircleOutlined size="1em" className="app-icon"
              style={{ cursor: 'pointer', fontSize: 18, color: '#3E6A9F' }}
              onClick={() => onOpenFollowups(jobId)}
            />
          </Tooltip>
        </div>
      );
    },
  },
  {
    header: 'Remarks',
    id: 'remarks_actions',
    enableSorting: false,
    muiTableHeadCellProps: { align: 'center' },
    muiTableBodyCellProps: { align: 'center', sx: { textAlign: 'center' } },
    Cell: ({ row }) => {
      const jobId = row.original.job_id;
      if (!jobId) return null;
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Tooltip title="View & manage remarks">
            <MessageOutlined size="1em" className="app-icon"
              style={{ cursor: 'pointer', fontSize: 18, color: '#3E6A9F' }}
              onClick={() => onOpenRemarks(jobId)}
            />
          </Tooltip>
        </div>
      );
    },
  },
  {
    header: 'View Job',
    id: 'view_job',
    enableSorting: false,
    muiTableHeadCellProps: { align: 'center' },
    muiTableBodyCellProps: { align: 'center', sx: { textAlign: 'center' } },
    Cell: ({ row }) => {
      const jobId = row.original.job_id;
      if (!jobId) return null;
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined size="1em" className="app-icon" />}
            onClick={() => onViewJob(jobId)}
            style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
          >
            View Job
          </Button>
        </div>
      );
    },
  },
];

const FollowUp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('future');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [remarksModal, setRemarksModal] = useState({ visible: false, row: null });
  const [followupsModalState, setFollowupsModalState] = useState({ visible: false, jobId: null });
  const [remarksModalState, setRemarksModalState] = useState({ visible: false, jobId: null });

  const handleViewRemarks = useCallback((row) => {
    setRemarksModal({ visible: true, row });
  }, []);

  const closeRemarksModal = useCallback(() => {
    setRemarksModal({ visible: false, row: null });
  }, []);

  const handleOpenFollowups = useCallback((jobId) => {
    setFollowupsModalState({ visible: true, jobId });
  }, []);

  const handleOpenRemarks = useCallback((jobId) => {
    setRemarksModalState({ visible: true, jobId });
  }, []);

  const handleViewJob = useCallback((jobId) => {
    navigate(`/project-manager/job-headhunting/${jobId}`);
  }, [navigate]);

  const type = activeTab === 'past' ? 'past' : 'future';
  const page = pagination.pageIndex + 1;
  const activeSort = sorting && sorting.length > 0 && sorting[0]?.id ? sorting[0] : null;
  const sortBy = activeSort?.id || null;
  const sortOrder = activeSort ? (activeSort.desc ? 'desc' : 'asc') : 'asc';

  const { data, isLoading } = useQuery(
    ['jobsFollowupsList', type, page, pagination.pageSize, sortBy, sortOrder],
    () => getJobsFollowupsList(type, page, pagination.pageSize, null, null, sortBy, sortOrder),
    { keepPreviousData: true, refetchOnWindowFocus: false }
  );

  const rows = useMemo(() => {
    if (!data?.results?.length) return [];
    return data.results.map((row, idx) => ({
      ...row,
      index: idx + 1 + pagination.pageIndex * pagination.pageSize,
      job_id: row.job_id ?? (typeof row.job === 'object' ? row.job?.id : row.job),
      follow_up_date: row.followup_date || row.follow_up_date
        ? formatDateUniversal(row.followup_date || row.follow_up_date)
        : '-',
      follow_up_time: getFollowupTimeFromRow(row),
      remarks: row.job_remark || row.remarks || '-',
      client: row.client_name || row.client || '-',
      project_name: row.project_name || '-',
      job_title: row.job_title || '-',
      recruiter_name: row.recruiter_name || '-',
      sales_executive_name: row.sales_executive_name || '-',
    }));
  }, [data?.results, pagination.pageIndex, pagination.pageSize]);

  const totalCount = data?.count ?? 0;

  const columns = useMemo(
    () => getRemarksColumns(handleViewRemarks, handleOpenFollowups, handleOpenRemarks, handleViewJob),
    [handleViewRemarks, handleOpenFollowups, handleOpenRemarks, handleViewJob]
  );

  const tableContent = (
    <div className="content-wrapper follow-up-content">
      <NewTableComponent
        totalCount={totalCount}
        columns={columns}
        data={rows}
        heading={activeTab === 'past' ? 'Past Follow ups' : 'Follow ups'}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        isLoading={isLoading}
        enableRowSelection={false}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />
    </div>
  );

  const tabItems = [
    {
      key: 'future',
      label: 'Follow ups',
      children: tableContent,
    },
    {
      key: 'past',
      label: 'Past Follow ups',
      children: tableContent,
    },
  ];

  const remarksText = remarksModal.row?.remarks;
  const hasRemarksContent = remarksText && String(remarksText).trim() && String(remarksText) !== '-';

  return (
    <>
      <BreadCrumb linkText="Follow ups" />
      <div className="dashboard-container follow-up-page" style={{ margin: '24px 20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            setSorting([]);
          }}
          type="card"
          items={tabItems}
          style={{ marginBottom: '16px' }}
          tabBarStyle={{
            background: 'white',
            borderBottom: '1px solid #f0f0f0',
          }}
        />
      </div>
      <Modal
        title="Remarks"
        open={remarksModal.visible}
        onCancel={closeRemarksModal}
        footer={null}
        width={480}
      >
        <div style={{ whiteSpace: 'pre-wrap', minHeight: 60 }}>
          {hasRemarksContent ? remarksText : 'No remarks.'}
        </div>
      </Modal>
      <JobRemarksModal
        visible={remarksModalState.visible}
        onClose={() => setRemarksModalState({ visible: false, jobId: null })}
        jobId={remarksModalState.jobId}
      />
      <JobFollowupsModal
        visible={followupsModalState.visible}
        onClose={() => setFollowupsModalState({ visible: false, jobId: null })}
        jobId={followupsModalState.jobId}
      />
    </>
  );
};

export default FollowUp;
