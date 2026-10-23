import React from 'react';
import { Tooltip, Button } from 'antd';
import { FileText as FilePdfOutlined, FileText as FileTextOutlined, Pencil as EditOutlined, Trash2 as DeleteOutlined, ClipboardPen as FormOutlined, Info as InfoCircleOutlined, DollarSign as DollarOutlined } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import '../../../assets/styles/legacy/table-client-actions.css';

export const ApprovalPill = ({ value, label, reason }) => {
  const color = value === 'Approved' ? '#52c41a' : value === 'Rejected' ? '#ff4d4f' : '#faad14';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ background: `${color}22`, color, border: `1px solid ${color}`, borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {label ? `${label}: ` : ''}{value ?? 'Pending'}
      </span>
      {value === 'Rejected' && (
        <Tooltip title={reason || 'No reason provided'}>
          <InfoCircleOutlined size="1em" className="app-icon" style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 13 }} />
        </Tooltip>
      )}
    </span>
  );
};

/**
 * Creates project table columns configuration
 * Reusable across different project listing pages
 */
export const createProjectColumns = ({
  clientName,
  userType,
  statusColors,
  navigate,
  canEditProject,
  handleStatusChange,
  handleProposalClick,
  handleGenerateProposal,
  handleCustomizeProposal,
  setContractModal,
  getFilteredStatusOptions,
   isApprovalDecided,
  handleDelete,
}) => {
  return [
    {
      header: 'Client',
      accessorKey: 'client',
      Cell: () => <span>{clientName}</span>,
    },
    {
      header: 'Project Name',
      accessorKey: 'project_name',
      Cell: ({ row, cell }) => (
        <a
          className="sop-brand-table-link"
          href={`/project-listing-page/${row.original.id}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/project-listing-page/${row.original.id}`);
          }}
        >
          {cell.getValue()}
        </a>
      ),
    },
    {
      header: 'Job Count',
      accessorKey: 'job_count',
      Cell: ({ cell }) => <span>{cell.getValue() || 0}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      Cell: ({ row, cell }) => {
        const canEdit =
          userType !== 'sales_executive' &&
          userType !== 'project_manager' &&
          canEditProject(row.original);
        const currentStatus = cell.getValue();

        return canEdit ? (
          <StatusSelect
            className="table-client-status-select"
            value={currentStatus}
            options={getFilteredStatusOptions(currentStatus, userType)}
            onChange={(value) => handleStatusChange(row.original.id, value)}
          />
        ) : (
          <StatusBadge status={currentStatus} statusColors={statusColors} />
        );
      },
    },
    ...(['admin', 'project_manager', 'sales_manager', 'sales_executive'].includes(userType) ? [
      {
        id: 'recruitment_manager_approval',
        header: 'RM Approval',
        enableSorting: false,
        size: 130,
        Cell: ({ row }) => (
          <ApprovalPill value={row.original.recruitment_manager_approval ?? 'Pending'} reason={row.original.recruitment_manager_reason} />
        ),
      },
      {
        id: 'recruiter_approval',
        header: 'Recruiter Approval',
        enableSorting: false,
        size: 130,
        Cell: ({ row }) => (
          <ApprovalPill value={row.original.recruiter_approval ?? 'Pending'} reason={row.original.recruiter_reason} />
        ),
      },
    ] : []),
    {
      header: 'Proposal',
      accessorKey: 'proposal',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => {
        const proposalFileName = cell.getValue();
        return proposalFileName ? (
          <Tooltip title="View Proposal">
            <FilePdfOutlined size="1em" className="app-icon"
              style={{ fontSize: 20, color: '#d4380d', cursor: 'pointer' }}
              onClick={() => handleProposalClick(proposalFileName)}
            />
          </Tooltip>
        ) : null;
      },
    },
    {
      header: 'Contract Currency',
      accessorKey: 'contract_currency',
      Cell: ({ cell }) => <span>{cell.getValue()}</span>,
    },
    {
      header: 'Contract Price',
      accessorKey: 'contract_price',
      Cell: ({ cell }) => {
        const val = cell.getValue();
        if (val === null || val === undefined || val === '-') return '-';
        // Ensure it's treated as a number for formatting
        const num = Number(String(val).replace(/,/g, ''));
        return <span>{isNaN(num) ? val : num.toLocaleString()}</span>;
      },
    },
    // Update Proposal column (hidden for sales_executive)
    ...(['admin', 'sales_manager', 'sales_executive'].includes(userType) ? [{
      header: 'Update Proposal',
      accessorKey: 'id',
      id: 'update_proposal_action',
      enableSorting: false,
      size: 92,
      minSize: 92,
      maxSize: 130,
      Cell: ({ row }) => {
        const canEdit = canEditProject(row.original);
        return canEdit ? (
          <Tooltip title="Update Proposal">
            <Button
              type="primary"
              size="small"
              onClick={() => setContractModal({ visible: true, project: row.original })}
              style={{
                background: '#3E6A9F',
                borderColor: '#3E6A9F',
                fontSize: 12,
                fontWeight: 500,
                height: 26,
                padding: '0 10px',
              }}
            >
              Update
            </Button>
          </Tooltip>
        ) : (
          <span className="table-icon-cell-placeholder" style={{ fontSize: '12px' }}>-</span>
        );
      },
    }] : []),
    // Download Proposal column (visible only to admin, sales_manager, sales_executive)
    ...(['admin', 'sales_manager', 'sales_executive'].includes(userType) ? [{
      header: 'Download Proposal',
      accessorKey: 'generate_proposal',
      id: 'download_proposal_action',
      enableSorting: false,
      size: 52,
      minSize: 48,
      maxSize: 72,
      Cell: ({ row }) => {
        const canEdit = canEditProject(row.original);
        return canEdit ? (
          <Tooltip title="Download Proposal">
            <FileTextOutlined size="1em"
              className={["app-icon", "table-icon-action table-icon-action--edit"].filter(Boolean).join(' ')}
              onClick={() => handleGenerateProposal(row.original)}
            />
          </Tooltip>
        ) : (
          <span className="table-icon-cell-placeholder">-</span>
        );
      },
    }] : []),
    ...(['admin', 'sales_manager', 'sales_executive'].includes(userType) && typeof handleCustomizeProposal === 'function' ? [{
      header: 'Customize Proposal',
      accessorKey: 'customize_proposal',
      id: 'customize_proposal_action',
      enableSorting: false,
      size: 152,
      minSize: 132,
      maxSize: 200,
      Cell: ({ row }) => {
        const canEdit = canEditProject(row.original);
        return canEdit ? (
          <Tooltip title="Open proposal in customize mode">
            <Button
              type="default"
              size="small"
              icon={<FormOutlined size="1em" className="app-icon" style={{ color: '#3E6A9F' }} />}
              onClick={() => handleCustomizeProposal(row.original)}
              style={{
                borderColor: '#3E6A9F',
                color: '#3E6A9F',
                fontSize: 12,
                height: 28,
              }}
            >
              Customize Proposal
            </Button>
          </Tooltip>
        ) : (
          <span className="table-icon-cell-placeholder" style={{ fontSize: '12px' }}>-</span>
        );
      },
    }] : []),
    {
      header: 'Created At',
      accessorKey: 'created_at',
      Cell: ({ cell }) => <span>{cell.getValue()}</span>,
    },
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
    {
      header: 'Actions',
      accessorKey: 'edit',
      enableSorting: false,
      size: 52,
      minSize: 44,
      maxSize: 64,
      Cell: ({ row }) => {
        const canEdit = canEditProject(row.original);
        return userType !== 'project_manager' && canEdit ? (
          <Tooltip title="Edit Project">
            <EditOutlined size="1em"
              className={["app-icon", "table-icon-action table-icon-action--edit"].filter(Boolean).join(' ')}
              onClick={() => navigate(`/edit-project-headhunting/${row.original.id}`)}
            />
          </Tooltip>
        ) : (
          <span className="table-icon-cell-placeholder">-</span>
        );
      },
    },
    // Delete column - only for admin and sales_manager
    ...(userType === 'super_admin' || userType === 'sales_manager'
      ? [
        {
          header: 'Delete',
          accessorKey: 'delete',
          enableSorting: false,
          size: 52,
          minSize: 44,
          maxSize: 64,
          Cell: ({ row }) => (
            <Tooltip title="Delete project">
              <DeleteOutlined size="1em"
                className={["app-icon", "table-icon-action table-icon-action--delete"].filter(Boolean).join(' ')}
                onClick={() => handleDelete && handleDelete(row.original)}
              />
            </Tooltip>
          ),
        },
      ]
      : []),
  ];
};

