import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Tooltip } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from 'react-query';

import { FileText as FilePdfOutlined } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import '../../../../assets/styles/legacy/prominent-scrollbar.css';
import { getDeletedAssignedProjectsList } from '../../../shared/services/headhunting.js';
import StatusHistoryModal, { createStatusHistoryColumn } from '../../../../components/status-history-modal.jsx';
import { getProjectStatusHistory } from '../../../shared/services/status-history.js';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import { getProposalUrl } from '../../../shared/services/manager-service.js';

export default function DeletedProjectsPage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [reasonModal, setReasonModal] = useState({ open: false, reason: '', project: '' });
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });

  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value ?? '');
  }, []);
  const goBack = useCallback(() => {
    navigate('/admin/project-listing');
  }, [navigate]);

  const { data, isLoading, isFetching } = useQuery(
    [
      'deletedAssignedProjectsList',
      pagination.pageIndex,
      pagination.pageSize,
      sorting?.[0]?.id,
      sorting?.[0]?.desc,
      globalFilter,
    ],
    () =>
      getDeletedAssignedProjectsList(
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
        header: 'Project Name',
        id: 'project_name',
        accessorKey: 'project_name',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Client',
        id: 'client_name',
        accessorKey: 'client_name',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Job Count',
        id: 'job_count',
        accessorKey: 'job_count',
        Cell: ({ cell }) => <span>{cell.getValue() ?? 0}</span>,
      },
      {
        header: 'Recruitment Manager',
        id: 'recruitment_manager_name',
        accessorKey: 'recruitment_manager_name',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Recruiter',
        id: 'recruiter_name',
        accessorKey: 'recruiter_name',
        size: 120,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Proposal',
        id: 'proposal',
        accessorKey: 'proposal',
        enableSorting: false,
        Cell: ({ cell }) => {
          const proposalFileName = cell.getValue();
          if (!proposalFileName) return <span>-</span>;
          return (
            <Tooltip title="View Proposal">
              <FilePdfOutlined size="1em" className="app-icon"
                style={{ fontSize: 18, color: '#d4380d', cursor: 'pointer' }}
                onClick={async () => {
                  try {
                    const proposalUrl = await getProposalUrl(proposalFileName);
                    if (proposalUrl) {
                      window.open(proposalUrl, '_blank', 'noopener,noreferrer');
                    }
                  } catch (_error) {
                    // Keep read-only table resilient if proposal URL fails.
                  }
                }}
              />
            </Tooltip>
          );
        },
      },
      {
        header: 'Contract Currency',
        id: 'contract_currency',
        accessorKey: 'contract_currency',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Contract Price',
        id: 'contract_price',
        accessorKey: 'contract_price',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Created At',
        id: 'created_at',
        accessorKey: 'created_at',
        Cell: ({ cell }) => (
          <span>{cell.getValue() ? formatDateUniversal(cell.getValue(), true) : '-'}</span>
        ),
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
        size: 70,
        enableSorting: false,
        Cell: ({ row, cell }) => {
          const reason = cell.getValue();
          if (!reason) return <span>-</span>;
          return (
            <button
              className="custom-button"
              style={{ background: '#6c757d', color: '#fff', padding: '2px 10px' }}
              onClick={() =>
                setReasonModal({
                  open: true,
                  reason: String(reason),
                  project: row.original?.project_name || '',
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
          accessorKey: 'status_history_project_deleted',
        }),
        size: 64,
      },
    ],
    [pagination.pageIndex, pagination.pageSize]
  );

  return (
    <>
      <BreadCrumb goBack={goBack} linkText="Deleted Projects" />
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
          heading={`Deleted Projects (${totalCount})`}
        />
      </div>
      <Modal
        open={reasonModal.open}
        title={`Delete Reason${reasonModal.project ? ` - ${reasonModal.project}` : ''}`}
        onCancel={() => setReasonModal({ open: false, reason: '', project: '' })}
        footer={null}
      >
        <div style={{ whiteSpace: 'pre-wrap' }}>{reasonModal.reason || '-'}</div>
      </Modal>
      <StatusHistoryModal
        open={statusHistoryModal.visible}
        entity={statusHistoryModal.entity}
        getEntityId={(entity) =>
          entity?.project_id ?? entity?.projectId ?? entity?.project?.id ?? entity?.id
        }
        onClose={() => setStatusHistoryModal({ visible: false, entity: null })}
        fetchHistoryApi={getProjectStatusHistory}
        historyDateKey="changed_at"
        getTitleFromEntity={(entity) => entity?.project_name || 'Project'}
        queryKeyPrefix="projectAuditHistoryDeleted"
        emptyMessage="No status history available."
      />
    </>
  );
}
