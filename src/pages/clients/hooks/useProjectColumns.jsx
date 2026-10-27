import { Select } from '../../../components/ui/app-select.jsx';
import { Tooltip } from '../../../components/ui/app-controls.jsx';
import { useMemo } from 'react';
import { Switch } from 'antd';
import { FileText as FilePdfOutlined, Pencil as EditOutlined, Trash2 as DeleteOutlined, MessageSquare as MessageOutlined, ChartBar as AuditOutlined, Info as InfoCircleOutlined, DollarSign as DollarOutlined } from 'lucide-react';
import { createStatusHistoryColumn } from '../../../components/status-history-modal.jsx';
import { ApprovalPill } from '../utils/project-columns.jsx';
import { formatDateUniversal } from '../../shared/utils/formatDate.js';

// Column definitions for the recruitment-executive assigned-projects table.
// Mechanically extracted from project-page.jsx — behavior/deps unchanged.
export function useProjectColumns({
  navigate,
  userType,
  user,
  statusColors,
  selectedProjectIds,
  handleProjectSelect,
  recruiterList,
  assigningRecruiterProjectId,
  recruiterAssignmentMutation,
  isRecruitmentUser,
  showApprovalFilter,
  isReadOnly,
  canEditProject,
  handleStatusChange,
  getFilteredStatusOptions,
  handleDeleteProject,
  setPmJobRemarksMatrix,
  approvalMutation,
  selectedApprovalFilter,
  handleRecruiterChange,
  setProjectRemarksModal,
  setNewPmRemark,
  setEditingPmRemarkId,
  setEditingPmRemarkText,
  handleProposalClick,
  setStatusHistoryModal,
  setRejectionModal,
  setApprovalModal,
  reviewedToggleMutation,
}) {
  return useMemo(
    () => [
      // Only show checkbox column for recruitment_manager, not recruitment_executive, and only on the Approved tab
      ...(userType === 'recruitment_manager' && (!showApprovalFilter || selectedApprovalFilter === 'Approved')
        ? [
          {
            header: '#',
            enableSorting: false,
            accessorKey: 'id',
            Cell: ({ row }) => (
              <input
                type="checkbox"
                checked={selectedProjectIds.includes(row.original.id)}
                onChange={(e) => handleProjectSelect(row.original.id, e.target.checked)}
              />
            ),
          },
        ]
        : []),
      {
        header: 'Client',
        id: 'client_name',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        accessorKey: 'client_name',
        Cell: ({ row, cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Project Name',
        id: 'project_name',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        accessorKey: 'project_name',
        Cell: ({ row, cell }) => {
          return (
            <a
              className="sop-brand-table-link"
              href={
                userType === 'project_manager'
                  ? `/project-manager/project-listing-page/${row.original.id}`
                  : `/recruitment/project-listing-page/${row.original.id}`
              }
              onClick={(e) => {
                e.preventDefault();
                const path = userType === 'project_manager'
                  ? `/project-manager/project-listing-page/${row.original.id}`
                  : `/recruitment/project-listing-page/${row.original.id}`;
                navigate(path);
              }}
            >
              {cell.getValue()}
            </a>
          );
        },
      },

      {
        header: 'Job Count',
        id: 'job_count',
        sortUndefined: 'last',
        sortDescFirst: false,
        accessorKey: 'job_count',
        size: 80,
        minSize: 70,
        maxSize: 100,
        Cell: ({ cell }) => <span>{cell.getValue() || 0}</span>,
      },
      // Status column - exclude for recruitment_manager and recruitment_executive
      ...(!isRecruitmentUser && !isReadOnly
        ? [
          {
            header: 'Status',
            accessorKey: 'status',
            id: 'status',
            sortUndefined: 'last',
            sortDescFirst: false,
            size: 130,
            minSize: 120,
            maxSize: 160,
            Cell: ({ row, cell }) => {
              const canEdit = canEditProject(row.original);
              const currentStatus = cell.getValue();

              return canEdit ? (
                <Select
                  value={currentStatus}
                  className="table-client-status-select"
                  onChange={(value) => {

                    handleStatusChange(row.original.id, value);
                  }}
                  popupMatchSelectWidth={false}
                  placeholder="Select Status"
                >
                  {getFilteredStatusOptions(currentStatus, userType).map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <span
                  className="client-table-status-pill"
                  style={{
                    '--status-pill-fg': statusColors[currentStatus] || '#8c8c8c',
                  }}
                >
                  {currentStatus || '-'}
                </span>
              );
            },
          },
        ]
        : []),
      // Recruitment Manager column - exclude for recruitment_manager
      ...(userType !== 'recruitment_manager'
        ? [
          {
            header: 'Recruitment Manager',
            id: 'recruitment_manager_name',
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            accessorKey: 'recruitment_manager_name',
            Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
          },
        ]
        : []),
      {
        header: 'Recruiter',
        id: 'recruiter_name',
        accessorKey: 'recruiter_name',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ row, cell }) => {
          const currentRecruiterId = row.original.recruiter; // Use 'recruiter' field from API
          const currentRecruiterName = cell.getValue();

          // Show dropdown for recruitment_manager and admin, text for others
          const canEditRecruiter = userType === 'super_admin' || userType === 'recruitment_manager';

          if (canEditRecruiter) {
            // Remove duplicates by value using Map
            const uniqueRecruiters = new Map();
            recruiterList.forEach(recruiter => {
              if (!uniqueRecruiters.has(recruiter.value)) {
                uniqueRecruiters.set(recruiter.value, recruiter);
              }
            });

            // Build options list - filter out current recruiter from dropdown options
            const allRecruiters = Array.from(uniqueRecruiters.values());

            // Ensure current recruiter exists in options for display (even if filtered from dropdown)
            // This allows Select to show the name instead of ID
            const allOptions = currentRecruiterId && currentRecruiterName
              ? [
                ...(allRecruiters.find(r => r.value === currentRecruiterId)
                  ? []
                  : [{ label: currentRecruiterName, value: currentRecruiterId }]),
                ...allRecruiters
              ]
              : allRecruiters;

            // Remove duplicates again after adding current recruiter
            const finalOptionsMap = new Map();
            allOptions.forEach(recruiter => {
              if (!finalOptionsMap.has(recruiter.value)) {
                finalOptionsMap.set(recruiter.value, recruiter);
              }
            });
            const finalOptions = Array.from(finalOptionsMap.values());

            return (
              <>
                <style>
                  {`
                  .hide-current-recruiter-${row.original.id} {
                    display: none !important;
                  }
                `}
                </style>
                <Select
                  value={currentRecruiterId || undefined}
                  className="pp-select-recruiter-min"
                  onChange={(value, option) =>
                    handleRecruiterChange(
                      row.original,
                      value,
                      option?.children || recruiterList.find(r => r.value === value)?.label || 'Recruiter'
                    )
                  }
                  placeholder="Select Recruiter"
                  loading={assigningRecruiterProjectId === row.original.id && recruiterAssignmentMutation.isLoading}
                  showSearch
                  optionFilterProp="children"
                  popupMatchSelectWidth={false}
                  filterOption={(input, option) => {
                    // Filter out current recruiter from search results
                    if (option.value === currentRecruiterId) return false;
                    return option.children?.toLowerCase().includes(input.toLowerCase()) ?? false;
                  }}
                >
                  {finalOptions.map(recruiter => {
                    // Hide current recruiter from dropdown but keep for display
                    if (recruiter.value === currentRecruiterId) {
                      return (
                        <Select.Option
                          key={recruiter.value}
                          value={recruiter.value}
                          className={`hide-current-recruiter-${row.original.id}`}
                        >
                          {recruiter.label}
                        </Select.Option>
                      );
                    }
                    return (
                      <Select.Option key={recruiter.value} value={recruiter.value}>
                        {recruiter.label}
                      </Select.Option>
                    );
                  })}
                </Select>
              </>
            );
          }
          return <span>{currentRecruiterName || '-'}</span>;
        },
      },
      {
        header: 'PM Job Remarks',
        id: 'pm_job_remarks_matrix',
        enableSorting: false,
        size: 110,
        muiTableHeadCellProps: { align: 'center' },
        muiTableBodyCellProps: { align: 'center', sx: { textAlign: 'center' } },
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Tooltip title="View PM job remarks for all jobs in this project">
              <AuditOutlined size="1em" className="app-icon"
                style={{ cursor: 'pointer', fontSize: 18, color: '#3E6A9F' }}
                onClick={() => setPmJobRemarksMatrix({ visible: true, projectId: row.original.id })}
              />
            </Tooltip>
          </div>
        ),
      },
      {
        header: 'PM Remarks',
        id: 'project_remarks',
        enableSorting: false,
        size: 110,
        Cell: ({ row }) => {
          const hasPmRemarks =
            String(row.original?.project_manager_remarks ?? '').trim() !== '' ||
            Number(row.original?.project_manager_remarks_count || 0) > 0 ||
            Number(row.original?.pm_remarks_count || 0) > 0;
          return (
            <div className="pp-pm-remarks-cell" style={{ display: 'flex', justifyContent: 'center' }}>
              <Tooltip title={userType === 'project_manager' ? 'View & update remarks' : 'View remarks'}>
                <MessageOutlined size="1em"
                  className={["app-icon", `table-remarks-icon ${hasPmRemarks ? 'table-remarks-icon--filled' : 'table-remarks-icon--empty'}`].filter(Boolean).join(' ')}
                  onClick={() => {
                    setProjectRemarksModal({
                      visible: true,
                      project: row.original,
                    });
                    setNewPmRemark('');
                    setEditingPmRemarkId(null);
                    setEditingPmRemarkText('');
                  }}
                />
              </Tooltip>
            </div>
          );
        },
      },
      // 👉 Only add Proposal, Contract Currency, and Contract Price columns if not recruitment team
      ...(!isRecruitmentUser && !isReadOnly
        ? [
          {
            header: 'Proposal',
            accessorKey: 'proposal',
            sortUndefined: 'last',
            sortDescFirst: false,
            size: 80,
            minSize: 70,
            maxSize: 100,
            Cell: ({ cell }) => {
              const proposalFileName = cell.getValue();
              return proposalFileName ? (
                <Tooltip title="View Proposal">
                  <FilePdfOutlined size="1em"
                    className={["app-icon", "pp-icon-pdf"].filter(Boolean).join(' ')}
                    onClick={() => handleProposalClick(proposalFileName)}
                  />
                </Tooltip>
              ) : null;
            },
          },
          {
            header: 'Contract Currency',
            id: 'contract_currency',
            sortUndefined: 'last',
            sortDescFirst: false,
            accessorKey: 'contract_currency',
            Cell: ({ cell }) => <span>{cell.getValue()}</span>,
          },
          {
            header: 'Contract Price',
            accessorKey: 'contract_price',
            id: 'contract_price',
            sortUndefined: 'last',
            sortDescFirst: false,
            size: 110,
            minSize: 100,
            maxSize: 140,
            Cell: ({ cell }) => <span>{cell.getValue()}</span>,
          },
        ]
        : []),
      {
        header: 'Created At',
        id: 'created_at',
        sortUndefined: 'last',
        sortDescFirst: false,
        accessorKey: 'created_at',
        size: 108,
        minSize: 96,
        maxSize: 128,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },

      // 👉 Only add Payments column if not recruitment team
      ...(!isRecruitmentUser && !isReadOnly
        ? [
          {
            header: 'Payments',
            accessorKey: 'payments',
            id: 'payments_action',
            enableSorting: false,
            size: 60,
            minSize: 52,
            maxSize: 80,
            Cell: ({ row }) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Tooltip title="View Payments">
                  <DollarOutlined size="1em"
                    className={["app-icon", "table-icon-action table-icon-action--edit"].filter(Boolean).join(' ')}
                    onClick={() => navigate(`/project-payments/${row.original.id}`)}
                  />
                </Tooltip>
              </div>
            ),
          },
        ]
        : []),

      // 👉 Only add Edit column if not recruitment team
      ...(!isRecruitmentUser && !isReadOnly
        ? [
          {
            header: 'Edit',
            enableSorting: false,
            accessorKey: 'id',
            minSize: 44,
            maxSize: 64,
            Cell: ({ row }) => {
              const canEdit = canEditProject(row.original);
              return canEdit ? (
                <Tooltip title="Edit project">
                  <EditOutlined size="1em"
                    className={["app-icon", "table-icon-action table-icon-action--edit"].filter(Boolean).join(' ')}
                    onClick={() =>
                      navigate(`/edit-project-headhunting/${row.original.id}`)
                    }
                    aria-label="Edit project"
                  />
                </Tooltip>
              ) : (
                <span className="table-icon-cell-placeholder">-</span>
              );
            },
          },
        ]
        : []),
      // Delete column - only for admin and sales_manager
      ...(userType === 'super_admin' || userType === 'sales_manager'
        ? [
          {
            header: 'Delete',
            accessorKey: 'delete',
            enableSorting: false,
            minSize: 44,
            maxSize: 64,
            Cell: ({ row }) => (
              <Tooltip title="Delete project">
                <DeleteOutlined size="1em"
                  className={["app-icon", "table-icon-action table-icon-action--delete"].filter(Boolean).join(' ')}
                  onClick={() => handleDeleteProject(row.original)}
                  aria-label="Delete project"
                />
              </Tooltip>
            ),
          },
        ]
        : []),
      ...(userType === 'super_admin'
        ? [
          {
            ...createStatusHistoryColumn({
              onOpenHistory: (entity) => setStatusHistoryModal({ visible: true, entity }),
              header: 'History',
              accessorKey: 'status_history_project',
            }),
            size: 64,
          },
        ]
        : []),
      ...(showApprovalFilter && ['Pending', 'Approved', 'Rejected'].includes(selectedApprovalFilter)
        ? [
          {
            id: 'recruitment_manager_approval',
            header: 'RM Approval',
            accessorKey: 'recruitment_manager_approval',
            enableSorting: false,
            size: 130,
            Cell: ({ row, cell }) => {
              const value = cell.getValue() ?? 'Pending';
              const canEdit = userType === 'super_admin' || userType === 'recruitment_manager';
              if (canEdit) {
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Select
                      size="small"
                      value={value}
                      placeholder="Set approval"
                      style={{ width: 110 }}
                      loading={approvalMutation.isLoading}
                      onChange={(val) => {
                        if (val === value) return;
                        if (val === 'Rejected') {
                          setRejectionModal({ visible: true, projectId: row.original.id, field: 'recruitment_manager', row: row.original, reason: '' });
                        } else if (val === 'Approved') {
                          setApprovalModal({ visible: true, projectId: row.original.id, field: 'recruitment_manager', row: row.original });
                        } else {
                          approvalMutation.mutate({ id: row.original.id, approvalStatus: val, field: 'recruitment_manager', row: row.original });
                        }
                      }}
                    >
                      {userType === 'super_admin' && <Select.Option value="Pending">Pending</Select.Option>}
                      <Select.Option value="Approved">Approved</Select.Option>
                      <Select.Option value="Rejected">Rejected</Select.Option>
                    </Select>
                    {value === 'Rejected' && (
                      <Tooltip title={row.original.recruitment_manager_reason || 'No reason provided'}>
                        <InfoCircleOutlined size="1em" className="app-icon" style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 13 }} />
                      </Tooltip>
                    )}
                  </span>
                );
              }
              return <ApprovalPill value={value} reason={row.original.recruitment_manager_reason} />;
            },
          },
          {
            id: 'recruiter_approval',
            header: 'Recruiter Approval',
            accessorKey: 'recruiter_approval',
            enableSorting: false,
            size: 150,
            Cell: ({ row, cell }) => {
              const value = cell.getValue() ?? 'Pending';
              // Only the recruiter assigned to this specific project (RM or RE) can approve/reject it as the recruiter
              const isAssignedRecruiter =
                (userType === 'recruitment_manager' || userType === 'recruitment_executive') &&
                Number(row.original.recruiter) === Number(user?.id);
              const canEdit = userType === 'super_admin' || isAssignedRecruiter;
              if (canEdit) {
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Select
                      size="small"
                      value={value}
                      placeholder="Set approval"
                      style={{ width: 110 }}
                      loading={approvalMutation.isLoading}
                      onChange={(val) => {
                        if (val === value) return;
                        if (val === 'Rejected') {
                          setRejectionModal({ visible: true, projectId: row.original.id, field: 'recruiter', row: row.original, reason: '' });
                        } else if (val === 'Approved') {
                          setApprovalModal({ visible: true, projectId: row.original.id, field: 'recruiter', row: row.original });
                        } else {
                          approvalMutation.mutate({ id: row.original.id, approvalStatus: val, field: 'recruiter', row: row.original });
                        }
                      }}
                    >
                      {userType === 'super_admin' && <Select.Option value="Pending">Pending</Select.Option>}
                      <Select.Option value="Approved">Approved</Select.Option>
                      <Select.Option value="Rejected">Rejected</Select.Option>
                    </Select>
                    {value === 'Rejected' && (
                      <Tooltip title={row.original.recruiter_reason || 'No reason provided'}>
                        <InfoCircleOutlined size="1em" className="app-icon" style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 13 }} />
                      </Tooltip>
                    )}
                  </span>
                );
              }
              return <ApprovalPill value={value} reason={row.original.recruiter_reason} />;
            },
          },
        ]
        : showApprovalFilter
          ? [
            {
              id: 'approval_status',
              header: 'Approval Status',
              enableSorting: false,
              size: 170,
              accessorFn: (row) => {
                if (userType === 'recruitment_manager') return row.recruitment_manager_approval ?? 'Pending';
                if (userType === 'recruitment_executive') return row.recruiter_approval ?? 'Pending';
                return `${row.recruitment_manager_approval ?? 'Pending'} / ${row.recruiter_approval ?? 'Pending'}`;
              },
              Cell: ({ row }) => {
                if (userType === 'project_manager' || userType === 'super_admin') {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <ApprovalPill label="RM" value={row.original.recruitment_manager_approval ?? 'Pending'} reason={row.original.recruitment_manager_reason} />
                      <ApprovalPill label="RE" value={row.original.recruiter_approval ?? 'Pending'} reason={row.original.recruiter_reason} />
                    </div>
                  );
                }
                const field = userType === 'recruitment_manager' ? 'recruitment_manager_approval' : 'recruiter_approval';
                const reasonField = userType === 'recruitment_manager' ? 'recruitment_manager_reason' : 'recruiter_reason';
                const value = row.original[field] ?? 'Pending';
                return <ApprovalPill value={value} reason={row.original[reasonField]} />;
              },
            },
          ]
          : []),
      // Review column - visible to recruitment_manager, recruitment_executive, and admin;
      // editable only by recruitment_manager and admin
      ...(userType === 'recruitment_manager' || userType === 'recruitment_executive' || userType === 'super_admin'
        ? [
          {
            header: 'Review',
            id: 'is_reviewed',
            accessorKey: 'is_reviewed',
            enableSorting: false,
            size: 220,
            Cell: ({ row, cell }) => {
              const canEditReviewed = userType === 'recruitment_manager' || userType === 'super_admin';
              const reviewedAt = row.original.review_updated_at;
              const reviewedAtLabel = reviewedAt ? formatDateUniversal(reviewedAt, true) : null;
              if (!canEditReviewed) {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{cell.getValue() ? 'Yes' : 'No'}</span>
                    {reviewedAtLabel && <span style={{ fontSize: 11, color: '#8c8c8c' }}>{reviewedAtLabel}</span>}
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Switch
                    size="small"
                    className="sop-brand-switch"
                    checked={!!cell.getValue()}
                    loading={
                      reviewedToggleMutation?.isLoading &&
                      reviewedToggleMutation?.variables?.projectId === row.original.id
                    }
                    onChange={(checked) =>
                      reviewedToggleMutation?.mutate({ projectId: row.original.id, isReviewed: checked })
                    }
                  />
                  {reviewedAtLabel && <span style={{ fontSize: 11, color: '#8c8c8c' }}>{reviewedAtLabel}</span>}
                </div>
              );
            },
          },
        ]
        : []),
    ],
    [
      navigate,
      userType,
      selectedProjectIds,
      handleProjectSelect,
      recruiterList,
      assigningRecruiterProjectId,
      recruiterAssignmentMutation.isLoading,
      isRecruitmentUser,
      showApprovalFilter,
      isReadOnly,
      canEditProject,
      handleStatusChange,
      getFilteredStatusOptions,
      handleDeleteProject,
      setPmJobRemarksMatrix,
      approvalMutation,
      selectedApprovalFilter,
      reviewedToggleMutation,
    ]
  );
}
