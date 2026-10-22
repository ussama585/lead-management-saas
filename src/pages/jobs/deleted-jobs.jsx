import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from 'react-query';
import { Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../components/tables/new-table.jsx';
import '../../assets/styles/legacy/prominent-scrollbar.css';
import { getAllDeletedJobList } from '../shared/services/headhunting.js';
import StatusHistoryModal, { createStatusHistoryColumn } from '../../components/status-history-modal.jsx';
import { getJobStatusHistory } from '../shared/services/status-history.js';

export default function DeletedJobsPage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [reasonModal, setReasonModal] = useState({ open: false, reason: '', job: '' });
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });

  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value ?? '');
  }, []);
  const goBack = useCallback(() => {
    navigate('/admin/jobs');
  }, [navigate]);

  const { data, isLoading, isFetching } = useQuery(
    [
      'allDeletedJobList',
      pagination.pageIndex,
      pagination.pageSize,
      sorting?.[0]?.id,
      sorting?.[0]?.desc,
      globalFilter,
    ],
    () =>
      getAllDeletedJobList(
        pagination.pageIndex + 1,
        pagination.pageSize,
        sorting,
        globalFilter
      ),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnWindowFocus: false,
    }
  );

  const totalCount = data?.count ?? 0;
  const results = Array.isArray(data?.results) ? data.results : [];

  const columns = useMemo(
    () => [
      {
        header: '#',
        id: 'row_number',
        accessorKey: 'row_number',
        size: 60,
        enableSorting: false,
        Cell: ({ row }) => (
          <span>{pagination.pageIndex * pagination.pageSize + row.index + 1}</span>
        ),
      },
      {
        header: 'Job Title',
        id: 'job_title',
        accessorKey: 'job_title',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Vacancies',
        id: 'number_of_vacancies',
        accessorKey: 'number_of_vacancies',
        Cell: ({ cell }) => <span>{cell.getValue() ?? '-'}</span>,
      },
      {
        header: 'Job Type',
        id: 'job_type',
        accessorKey: 'job_type',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Employment Type',
        id: 'employment_type',
        accessorKey: 'employment_type',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Department',
        id: 'department',
        accessorKey: 'department',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Country',
        id: 'location_country',
        accessorKey: 'location_country',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'City',
        id: 'location_city',
        accessorKey: 'location_city',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Min Experience',
        id: 'min_experience',
        accessorKey: 'min_experience',
        Cell: ({ cell }) => {
          const v = cell.getValue();
          return <span>{v != null ? `${v} yrs` : '-'}</span>;
        },
      },
      {
        header: 'Description',
        id: 'job_description',
        accessorKey: 'job_description',
        Cell: ({ cell }) => {
          const desc = cell.getValue();
          if (!desc) return <span>-</span>;
          const truncated = desc.length > 80 ? `${desc.slice(0, 80)}...` : desc;
          return <span title={desc}>{truncated}</span>;
        },
      },
      {
        header: 'Status',
        id: 'status',
        accessorKey: 'status',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Delete Reason',
        id: 'delete_reason',
        accessorKey: 'delete_reason',
        size: 200,
        enableSorting: false,
        Cell: ({ row, cell }) => {
          const reason = cell.getValue();
          if (!reason) return <span>-</span>;
          return (
            <button
              className="custom-button"
              style={{ background: '#6c757d', color: '#fff', padding: '2px 8px' }}
              onClick={() =>
                setReasonModal({
                  open: true,
                  reason: String(reason),
                  job: row.original?.job_title || '',
                })
              }
            >
              View Reason
            </button>
          );
        },
      },
      {
        ...createStatusHistoryColumn({
          onOpenHistory: (entity) => setStatusHistoryModal({ visible: true, entity }),
          header: 'History',
          accessorKey: 'status_history_job_deleted',
        }),
        size: 50,
      },
    ],
    [pagination.pageIndex, pagination.pageSize]
  );

  return (
    <>
      <BreadCrumb goBack={goBack} linkText="Deleted Jobs" />
      <div className="container">
        <NewTableComponent
          totalCount={totalCount}
          columns={columns}
          data={results}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={handleGlobalFilterChange}
          isLoading={isLoading || isFetching}
          enableRowSelection={false}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          heading={`Deleted Jobs (${totalCount})`}
        />
      </div>
      <Modal
        open={reasonModal.open}
        title={`Delete Reason${reasonModal.job ? ` - ${reasonModal.job}` : ''}`}
        onCancel={() => setReasonModal({ open: false, reason: '', job: '' })}
        footer={null}
      >
        <div style={{ whiteSpace: 'pre-wrap' }}>{reasonModal.reason || '-'}</div>
      </Modal>
      <StatusHistoryModal
        open={statusHistoryModal.visible}
        entity={statusHistoryModal.entity}
        getEntityId={(entity) =>
          entity?.job_id ?? entity?.jobId ?? entity?.job?.id ?? entity?.id
        }
        onClose={() => setStatusHistoryModal({ visible: false, entity: null })}
        fetchHistoryApi={getJobStatusHistory}
        historyDateKey="changed_at"
        getTitleFromEntity={(entity) => entity?.job_title || 'Job'}
        queryKeyPrefix="jobAuditHistoryDeleted"
        emptyMessage="No status history available."
      />
    </>
  );
}
