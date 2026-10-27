import { Select } from '../../../components/ui/app-select.jsx';
import { Button as AntButton, Tooltip } from '../../../components/ui/app-controls.jsx';
import React from 'react';

import { MessageCircle as CommentOutlined, Pencil as EditOutlined, Clock as ClockCircleOutlined, MessageSquare as MessageOutlined, Trash2 as DeleteOutlined, CirclePlus as PlusCircleOutlined, Table as TableOutlined } from 'lucide-react';
import { formatDateUniversal } from '../../shared/utils/formatDate.js';
import { formatSalaryNum } from '../../shared/utils/formatters.js';
import '../../../assets/styles/legacy/table-remarks-icon.css';
import '../../../assets/styles/legacy/table-client-actions.css';
import StatusBadge from '../components/StatusBadge.jsx';

/**
 * Creates job table columns configuration
 * Reusable across different job listing pages
 */
export const createJobColumns = ({
  navigate,
  user,
  statusColors,
  statusOptions,
  canEditJobStatus,
  handleStatusChange,
  setRemarksModal,
  setFollowupsModalState,
  setRemarksModalState,
  setPmRemarksModalState,
  statusMutationLoading = false,
  handleDelete,
  handleSaasJobCreate,
  showSaasJobColumn = false,
  /** Narrower column sizes for dense tables (e.g. project job listing) */
  compactColumns = false,
  onOpenPmJobRemarksMatrix,
}) => {
  /** is_job_create false = not on SaaS yet → show Create; true = already created */
  const isSaasJobsEnabled = (job) => job?.is_job_create === false;
  const isRestricted =
    user?.user_type === 'recruitment_manager' ||
    user?.user_type === 'recruitment_executive' ||
    user?.user_type === 'project_manager' ||
    user?.user_type === 'sales_executive';

  const canEdit = canEditJobStatus();

  const baseColumns = [
    {
      header: 'Job Title',
      accessorKey: 'job_title',
      Cell: ({ row, cell }) => (
        <a
          style={{ color: '#3E6A9F', textDecoration: 'underline', cursor: 'pointer' }}
          href={`/job-headhunting/${row.original.id}?jobId=${row.original.id}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/job-headhunting/${row.original.id}?jobId=${row.original.id}`);
          }}
        >
          {cell.getValue()}
        </a>
      ),
    },
    {
      header: 'Job Type',
      accessorKey: 'job_type',
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Employment Type',
      accessorKey: 'employment_type',
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Department',
      accessorKey: 'department',
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Location',
      accessorKey: 'location_city',
      Cell: ({ cell, row }) => (
        <span>
          {row.original.location_city && row.original.location_country
            ? `${row.original.location_city}, ${row.original.location_country}`
            : row.original.location_city || row.original.location_country || '-'
          }
        </span>
      ),
    },
    {
      header: 'No. of Resources',
      accessorKey: 'number_of_vacancies',
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'CVs to be Provided',
      accessorKey: 'cvs_to_be_provided',
      id: 'cvs_to_be_provided',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'CV Submission Deadline',
      accessorKey: 'cv_submission_deadline',
      id: 'cv_submission_deadline',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue() ? formatDateUniversal(cell.getValue()) : '-'}</span>,
    },
    {
      header: 'Salary Range',
      accessorKey: 'min_salary',
      Cell: ({ cell, row }) => {
        const minSalary = row.original.min_salary;
        const maxSalary = row.original.max_salary;
        const currency = row.original.currency;
        const paymentTerm = row.original.payment_term;

        if (minSalary && maxSalary) {
          return <span>{`${currency || 'PKR'} ${formatSalaryNum(minSalary)} - ${formatSalaryNum(maxSalary)}${paymentTerm ? ` ${paymentTerm}` : ''}`}</span>;
        } else if (minSalary) {
          return <span>{`${formatSalaryNum(minSalary)} ${currency || ''}${paymentTerm ? ` (${paymentTerm})` : ''}`}</span>;
        } else if (maxSalary) {
          return <span>{`${formatSalaryNum(maxSalary)} ${currency || ''}${paymentTerm ? ` (${paymentTerm})` : ''}`}</span>;
        }
        return <span>-</span>;
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      Cell: ({ row, cell }) => {
        return isRestricted || !canEdit ? (
          <StatusBadge status={cell.getValue()} statusColors={statusColors} />
        ) : (
          <Select
            key={`status-${row.original.id}`}
            value={cell.getValue()}
            style={{ width: 'fit-content', minWidth: compactColumns ? 100 : 120 }}
            options={statusOptions}
            popupMatchSelectWidth={false}
            onChange={(value) => handleStatusChange(row.original.id, value)}
            disabled={statusMutationLoading}
          />
        );
      },
    },

    ...(showSaasJobColumn
  ? [
      {
        header: 'SaaS Jobs',
        id: 'saas_jobs',
        accessorKey: 'saas_jobs',
        enableSorting: false,
        size: 150,
        muiTableHeadCellProps: { align: 'center' },
        muiTableBodyCellProps: {
          align: 'center',
          sx: { textAlign: 'center', minWidth: 150 },
        },
        Cell: ({ row }) => {
          const enabled = isSaasJobsEnabled(row.original);
          const isAdmin = user?.user_type === 'admin';
          const jobId = row.original?.id;

          return (
            <div className="table-saas-client-cell">
              {enabled ? (
                isAdmin ? (
                  <span className="table-saas-client-cell__unavailable">
                    Not Created
                  </span>
                ) : (
                  <button
                    type="button"
                    className="table-saas-client-cell__action"
                    onClick={handleSaasJobCreate ? () => handleSaasJobCreate(row.original) : undefined}
                    title="Create SaaS job"
                  >
                    <PlusCircleOutlined size="1em" className={["app-icon", "table-icon-action table-icon-action--create"].filter(Boolean).join(' ')} />
                    <span>Create</span>
                  </button>
                )
              ) : isAdmin && jobId ? (
                <AntButton
                  type="primary"
                  size="small"
                  style={{ background: '#3E6A9F', borderColor: '#3E6A9F', color: '#fff' }}
                  onClick={() => navigate(`/saas-job-headhunting/${jobId}`)}
                >
                  View
                </AntButton>
              ) : (
                <span className="table-saas-client-cell__unavailable" title="SaaS job already created">
                  Already Created
                </span>
              )}
            </div>
          );
        },
      },
    ]
  : []),
    // Project Manager: Show Follow Up & Remarks columns
    ...(user?.user_type === 'project_manager'
      ? [
          {
            header: 'Follow Up',
            id: 'follow_up_actions',
            enableSorting: false,
            Cell: ({ row }) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Tooltip title="View & manage follow-ups">
                  <ClockCircleOutlined size="1em" className="app-icon"
                    style={{
                      cursor: 'pointer',
                      fontSize: 18,
                      color: '#3E6A9F',
                    }}
                    onClick={() =>
                      setFollowupsModalState({
                        visible: true,
                        jobId: row.original.id,
                      })
                    }
                  />
                </Tooltip>
              </div>
            ),
          },
          {
            header: 'Remarks',
            id: 'remarks_actions',
            enableSorting: false,
            Cell: ({ row }) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Tooltip title="View & manage remarks">
                  <MessageOutlined size="1em" className="app-icon"
                    style={{
                      cursor: 'pointer',
                      fontSize: 18,
                      color: '#3E6A9F',
                    }}
                    onClick={() =>
                      setRemarksModalState({
                        visible: true,
                        jobId: row.original.id,
                      })
                    }
                  />
                </Tooltip>
              </div>
            ),
          },
        ]
      : [
          // For other users: Show original Remarks column
          {
            header: 'Remarks',
            accessorKey: 'remarks',
            Cell: ({ row }) => (
              <CommentOutlined size="1em"
                className={["app-icon", `table-remarks-icon ${row.original.remarks ? 'table-remarks-icon--filled' : 'table-remarks-icon--empty'}`].filter(Boolean).join(' ')}
                onClick={() => setRemarksModal({ visible: true, job: row.original })}
              />
            ),
          },
        ]
    ),
    {
      header: 'Posted On',
      accessorKey: 'created_at',
      Cell: ({ cell }) => <span>{cell.getValue() ? formatDateUniversal(cell.getValue()) : '-'}</span>,
    },
    // Show Edit / View columns only if NOT recruitment_manager / recruitment_executive
    ...(
      (user?.user_type !== 'recruitment_manager' &&
        user?.user_type !== 'recruitment_executive' &&
        user?.user_type !== 'project_manager')
        ? [
          {
            header: 'Edit',
            accessorKey: 'edit',
            enableSorting: false,
            Cell: ({ row }) => (
              <EditOutlined size="1em" className="app-icon"
                style={{ cursor: 'pointer', color: '#1890ff', fontSize: '16px' }}
                onClick={() => navigate(`/edit-job-headhunting/${row.original.id}`)}
              />
            ),
          },
          {
            header: 'View Job',
            accessorKey: 'view',
            enableSorting: false,
            Cell: ({ row }) => (
              <AntButton
                type="primary"
                size="small"
                style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
                onClick={() =>
                  navigate(`/job-detail/${row.original.id}`)
                }
              >
                View
              </AntButton>
            ),
          },
        ]
        : []
    ),
    // Delete column - only for admin and sales_manager
    ...(user?.user_type === 'admin' || user?.user_type === 'sales_manager'
      ? [
          {
            header: 'Delete',
            accessorKey: 'delete',
            enableSorting: false,
            Cell: ({ row }) => (
              <DeleteOutlined size="1em" className="app-icon"
                style={{
                  cursor: 'pointer',
                  color: '#ff4d4f',
                  fontSize: '16px',
                }}
                onClick={() => handleDelete && handleDelete(row.original)}
              />
            ),
          },
        ]
      : []),
    // PM Remarks — read-only for all non-PM users
    ...(user?.user_type !== 'project_manager' && setPmRemarksModalState
      ? [
          {
            header: 'PM Remarks',
            id: 'pm_remarks_action',
            accessorKey: 'pm_remarks_action',
            enableSorting: false,
            size: 64,
            minSize: 56,
            maxSize: 80,
            Cell: ({ row }) => {
              const hasPmRemarks =
                Number(row.original?.pm_remarks_count || 0) > 0 ||
                Number(row.original?.project_manager_remarks_count || 0) > 0;
              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Tooltip title="View PM remarks">
                    <MessageOutlined size="1em"
                      className={["app-icon", `table-remarks-icon ${hasPmRemarks ? 'table-remarks-icon--filled' : 'table-remarks-icon--empty'}`].filter(Boolean).join(' ')}
                      onClick={() => setPmRemarksModalState({ visible: true, jobId: row.original.id })}
                    />
                  </Tooltip>
                </div>
              );
            },
          },
        ]
      : []),
    // PM Job Remarks matrix column — shown whenever the handler is provided
    ...(onOpenPmJobRemarksMatrix
      ? [
          {
            header: 'PM Job Remarks',
            id: 'pm_job_remarks_matrix',
            enableSorting: false,
            size: 100,
            minSize: 90,
            maxSize: 120,
            muiTableHeadCellProps: { align: 'center' },
            muiTableBodyCellProps: { align: 'center', sx: { textAlign: 'center' } },
            Cell: () => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Tooltip title="View PM job remarks matrix">
                  <TableOutlined size="1em" className="app-icon"
                    style={{ cursor: 'pointer', fontSize: 18, color: '#3E6A9F' }}
                    onClick={onOpenPmJobRemarksMatrix}
                  />
                </Tooltip>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (!compactColumns) return baseColumns;

  const sizeByKey = {
    job_title: 150,
    job_type: 82,
    employment_type: 92,
    department: 92,
    location_city: 110,
    number_of_vacancies: 68,
    cvs_to_be_provided: 86,
    cv_submission_deadline: 200,
    min_salary: 120,
    status: 108,
    remarks: 48,
    follow_up_actions: 52,
    remarks_actions: 52,
    created_at: 98,
    edit: 46,
    view: 68,
    delete: 48,
    status_history: 72,
    status_history_job: 72,
    pm_job_remarks_matrix: 100,
  };

  return baseColumns.map((col) => {
    const key = col.accessorKey || col.id;
    const size = sizeByKey[key];
    return size != null ? { ...col, size } : col;
  });
};

