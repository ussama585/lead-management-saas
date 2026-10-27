import { Modal } from '../../../../components/ui/app-modal.jsx';
import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from 'react-query';

import { MessageCircle as CommentOutlined } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import '../../../../assets/styles/legacy/prominent-scrollbar.css';
import { getDeletedClientsList } from '../../../shared/services/headhunting.js';
import StatusHistoryModal, { createStatusHistoryColumn } from '../../../../components/status-history-modal.jsx';
import { getClientStatusHistory } from '../../../shared/services/status-history.js';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import '../../../../assets/styles/legacy/table-remarks-icon.css';

export default function DeletedClientsPage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [reasonModal, setReasonModal] = useState({ open: false, reason: '', company: '' });
  const [remarksModal, setRemarksModal] = useState({ open: false, remarks: '', company: '' });
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });

  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value ?? '');
  }, []);
  const goBack = useCallback(() => {
    navigate('/headhunting-client');
  }, [navigate]);

  const { data, isLoading, isFetching } = useQuery(
    [
      'deletedClientsList',
      pagination.pageIndex,
      pagination.pageSize,
      sorting?.[0]?.id,
      sorting?.[0]?.desc,
      globalFilter,
    ],
    () =>
      getDeletedClientsList(
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
        header: 'Status',
        id: 'status',
        accessorKey: 'status',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Remarks',
        id: 'remarks',
        accessorKey: 'remarks',
        enableSorting: false,
        Cell: ({ row, cell }) => {
          const remarks = cell.getValue();
          return (
            <CommentOutlined size="1em"
              className={["app-icon", `table-remarks-icon ${remarks ? 'table-remarks-icon--filled' : 'table-remarks-icon--empty'}`].filter(Boolean).join(' ')}
              onClick={() =>
                setRemarksModal({
                  open: true,
                  remarks: remarks ? String(remarks) : '',
                  company: row.original?.company_name || '',
                })
              }
            />
          );
        },
      },
      {
        header: 'Assigned To',
        id: 'assigned_to_name',
        accessorKey: 'assigned_to_name',
        Cell: ({ row, cell }) => (
          <span>
            {cell.getValue() ||
              row.original?.assigned_to ||
              row.original?.recruiter_name ||
              '-'}
          </span>
        ),
      },
      {
        header: 'Company',
        id: 'company_name',
        accessorKey: 'company_name',
        size: 200,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Project Count',
        id: 'project_count',
        accessorKey: 'project_count',
        Cell: ({ cell }) => <span>{cell.getValue() ?? 0}</span>,
      },
      {
        header: 'Job Count',
        id: 'job_count',
        accessorKey: 'job_count',
        Cell: ({ cell }) => <span>{cell.getValue() ?? 0}</span>,
      },
      {
        header: 'Contact Person',
        id: 'contact_person_name',
        accessorKey: 'contact_person_name',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Designation',
        id: 'contact_person_designation',
        accessorKey: 'contact_person_designation',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Email',
        id: 'email',
        accessorKey: 'email',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Phone',
        id: 'phone_number',
        accessorKey: 'phone_number',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
    
      {
        header: 'Industry',
        id: 'industry',
        accessorKey: 'industry',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Added By',
        id: 'added_by_name',
        accessorKey: 'added_by_name',
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
              style={{ background: '#6c757d', color: '#fff', padding: '2px 6px', fontSize: '12px' }}
              onClick={() =>
                setReasonModal({
                  open: true,
                  reason: String(reason),
                  company: row.original?.company_name || '',
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
          accessorKey: 'status_history_client_deleted',
        }),
        size: 44,
      },
    ],
    [pagination.pageIndex, pagination.pageSize]
  );

  return (
    <>
      <BreadCrumb goBack={goBack} linkText="Deleted Clients" />
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
          heading={`Deleted Clients (${totalCount})`}
        />
      </div>
      <Modal
        open={reasonModal.open}
        title={`Delete Reason${reasonModal.company ? ` - ${reasonModal.company}` : ''}`}
        onCancel={() => setReasonModal({ open: false, reason: '', company: '' })}
        footer={null}
      >
        <div style={{ whiteSpace: 'pre-wrap' }}>{reasonModal.reason || '-'}</div>
      </Modal>
      <Modal
        open={remarksModal.open}
        title={`Remarks${remarksModal.company ? ` - ${remarksModal.company}` : ''}`}
        onCancel={() => setRemarksModal({ open: false, remarks: '', company: '' })}
        footer={null}
      >
        <div style={{ whiteSpace: 'pre-wrap' }}>{remarksModal.remarks || '-'}</div>
      </Modal>
      <StatusHistoryModal
        open={statusHistoryModal.visible}
        entity={statusHistoryModal.entity}
        getEntityId={(entity) =>
          entity?.client_id ?? entity?.clientId ?? entity?.client?.id ?? entity?.id
        }
        onClose={() => setStatusHistoryModal({ visible: false, entity: null })}
        fetchHistoryApi={getClientStatusHistory}
        historyDateKey="changed_at"
        getTitleFromEntity={(entity) => entity?.company_name || 'Client'}
        queryKeyPrefix="clientAuditHistoryDeleted"
        emptyMessage="No status history available."
      />
    </>
  );
}
