import { Select } from '../../../components/ui/app-select.jsx';
import React from 'react';

import { MessageCircle as CommentOutlined, Pencil as EditOutlined, Trash2 as DeleteOutlined, CirclePlus as PlusCircleOutlined } from 'lucide-react';
import { createAssignedToColumn } from '../../shared/utils/assignedToColumn.jsx';
import formatDateUniversal from '../../shared/utils/formatDate.js';
import { statusColors, statusOptions } from '../constants/client-constants.js';
import '../../../assets/styles/legacy/table-remarks-icon.css';
import '../../../assets/styles/legacy/table-client-actions.css';

export const createClientColumns = ({
  user,
  navigate,
  statusMutationLoading,
  recruiterExecutivesList,
  assigningRecruiter,
  isLoadingRecruiters,
  handleRecruiterAssignmentChange,
  handleRemarksModal,
  handleStatusChange,
  handleDelete,
  handleSaasClientCreate,
  showSaasClientColumn = false,
}) => {
  /** is_client_create false = not on SaaS yet → show Create; true = already created */
  const isSaasClientsEnabled = (client) => client?.is_client_create === false;
  return [
    // Status column
    {
      header: 'Status',
      id: 'status',
      accessorKey: 'status',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ row }) => {
        const client = row.original;
        const currentStatus = client.status;
        const statusColor = statusColors[currentStatus] || '#8c8c8c';

        // Conditions
        const isAdmin = user?.user_type === 'admin';
        const isSalesManager = user?.user_type === 'sales_manager';
        const isSalesExecutive = user?.user_type === 'sales_executive';

        // Status editing rules:
        // - Admin can always edit all clients
        // - Sales Manager can edit all clients (their own and executives' clients)
        // - Sales Executive can NEVER edit status (read-only)
        const canEdit = !isSalesExecutive && (isAdmin || isSalesManager);

        if (canEdit) {
          return (
            <Select
              value={currentStatus}
              className="table-client-status-select"
              popupMatchSelectWidth={false}
              options={statusOptions}
              onChange={(value) => handleStatusChange(client, value)}
            />
          );
        }

        // Read-only colored pill
        return (
          <span
            className="client-table-status-pill"
            style={{ '--status-pill-fg': statusColor }}
          >
            {currentStatus || '-'}
          </span>
        );
      },
    },

    // Remarks immediately after Status
    {
      header: 'Remarks',
      id: 'remarks',
      accessorKey: 'remarks',
      size: 70,
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ row }) => (
        <CommentOutlined size="1em"
          className={["app-icon", `table-remarks-icon ${row.original.remarks ? 'table-remarks-icon--filled' : 'table-remarks-icon--empty'}`].filter(Boolean).join(' ')}
          onClick={() => handleRemarksModal(row.original)}
        />
      ),
    },

    // Assigned To column - exclude for sales_executive
    ...(user?.user_type !== 'sales_executive'
      ? [
          createAssignedToColumn({
            userType: user?.user_type,
            user,
            executivesList: recruiterExecutivesList,
            onAssignmentChange: handleRecruiterAssignmentChange,
            isLoading: assigningRecruiter,
            loadingAssigningUsers: isLoadingRecruiters,
            additionalProps: { style: { width: 'fit-content', minWidth: '150px' } },
          }),
        ]
      : []),

    {
      header: 'Company',
      id: 'company_name',
      accessorKey: 'company_name',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell, row }) => (
        <a
          className="link-style"
          href={`/client-head-hunting/${row.original.id}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/client-head-hunting/${row.original.id}`);
          }}
        >
          {cell.getValue() || '-'}
        </a>
      ),
    },

    {
      header: 'Project Count',
      id: 'project_count',
      accessorKey: 'project_count',
      size: 90,
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue() || 0}</span>,
    },
    {
      header: 'Job Count',
      id: 'job_count',
      accessorKey: 'job_count',
      size: 70,
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue() || 0}</span>,
    },
    ...(user?.user_type === 'project_manager' || user?.user_type === 'admin'
      ? [
          {
            header: 'Recruitment Manager',
            id: 'recruitment_manager_name',
            accessorKey: 'recruitment_manager_name',
            sortUndefined: 'last',
            sortDescFirst: false,
            Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
          },
          {
            header: 'Recruiter',
            id: 'recruiter_name',
            accessorKey: 'recruiter_name',
            sortUndefined: 'last',
            sortDescFirst: false,
            Cell: ({ cell, row }) => {
              if (user?.user_type === 'admin' && Array.isArray(recruiterExecutivesList) && recruiterExecutivesList.length > 0) {
                const currentName = cell.getValue();
                return (
                  <Select
                    value={currentName || undefined}
                    placeholder="Select Recruiter"
                    style={{ minWidth: 150 }}
                    popupMatchSelectWidth={false}
                    showSearch
                    optionFilterProp="children"
                    loading={assigningRecruiter}
                    onChange={(value) => handleRecruiterAssignmentChange && handleRecruiterAssignmentChange(row.original, value)}
                  >
                    {recruiterExecutivesList.map((r) => (
                      <Select.Option key={r.id} value={r.name}>
                        {r.name}
                      </Select.Option>
                    ))}
                  </Select>
                );
              }
              return <span>{cell.getValue() || '-'}</span>;
            },
          },
        ]
      : []),

    {
      header: 'Contact Person',
      id: 'contact_person_name',
      accessorKey: 'contact_person_name',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Designation',
      id: 'contact_person_designation',
      accessorKey: 'contact_person_designation',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Email',
      id: 'email',
      accessorKey: 'email',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Phone',
      id: 'phone_number',
      accessorKey: 'phone_number',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Industry',
      id: 'industry',
      accessorKey: 'industry',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Added by',
      id: 'added_by_name',
      accessorKey: 'added_by_name',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Created At',
      id: 'created_at',
      accessorKey: 'created_at',
      sortUndefined: 'last',
      sortDescFirst: false,
      size: 108,
      minSize: 96,
      maxSize: 128,
      Cell: ({ cell }) => (
        <span>
          {cell.getValue() ? formatDateUniversal(cell.getValue(), true) : '-'}
        </span>
      ),
    },

   ...(showSaasClientColumn
  ? [
      {
        header: 'SaaS Clients',
        id: 'saas_clients',
        accessorKey: 'saas_clients',
        enableSorting: false,
        size: 150,
        muiTableHeadCellProps: { align: 'center' },
        muiTableBodyCellProps: {
          align: 'center',
          sx: { textAlign: 'center', justifyContent: 'center', minWidth: 150 },
        },
        Cell: ({ row }) => {
          const enabled = isSaasClientsEnabled(row.original);
          const isAdmin = user?.user_type === 'admin';
          return (
            <div className="table-saas-client-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              {enabled ? (
                isAdmin ? (
                  <span className="table-saas-client-cell__unavailable">Not Created</span>
                ) : (
                  <button
                    type="button"
                    className="table-saas-client-cell__action"
                    onClick={handleSaasClientCreate ? () => handleSaasClientCreate(row.original) : undefined}
                    title="Create SaaS client"
                  >
                    <PlusCircleOutlined size="1em" className={["app-icon", "table-icon-action table-icon-action--create"].filter(Boolean).join(' ')} />
                    <span>Create</span>
                  </button>
                )
              ) : (
                <span className="table-saas-client-cell__unavailable" title="SaaS clients not available">
                  Already Created
                </span>
              )}
            </div>
          );
        },
      },
    ]
  : []),

    // Edit column → hide for recruitment_manager & recruitment_executive
    ...(user?.user_type !== 'recruitment_manager' &&
    user?.user_type !== 'recruitment_executive'
      ? [
          {
            header: 'Edit',
            accessorKey: 'id',
            enableSorting: false,
            size: 70,
            Cell: ({ row }) => {
              const canOpenEditClient =
              user?.user_type === 'admin' ||
              user?.user_type === 'sales_manager' ||
              user?.user_type === 'sales_executive';


              return canOpenEditClient ? (
                <EditOutlined size="1em"
                  className={["app-icon", "table-icon-action table-icon-action--edit"].filter(Boolean).join(' ')}
                  onClick={() =>
                    navigate(`/edit-client-headhunting/${row.original.id}`)
                  }
                />
              ) : (
                <span className="table-icon-cell-placeholder">-</span>
              );
            },
          },
        ]
      : []),
    // Delete column - only for admin and sales_manager 
    ...(user?.user_type === 'admin' || user?.user_type === 'sales_manager'
      ? [
          {
            header: 'Delete',
            accessorKey: 'delete',
            enableSorting: false,
            size: 70,
            Cell: ({ row }) => (
              <DeleteOutlined size="1em"
                className={["app-icon", "table-icon-action table-icon-action--delete"].filter(Boolean).join(' ')}
                onClick={() => handleDelete && handleDelete(row.original)}
              />
            ),
          },
        ]
      : []),
  ].filter(Boolean);
};

