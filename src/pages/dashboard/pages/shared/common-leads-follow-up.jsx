import { message } from '../../../../components/ui/notifications.jsx';
import { Tooltip, Button } from '../../../../components/ui/app-controls.jsx';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Tag } from 'antd';
import { MessageCircle as CommentOutlined, Clock as ClockCircleOutlined, FileText as FilePdfOutlined, Info as InfoCircleOutlined, Minus as MinusOutlined } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import ExecutiveTabButton from '../../../../components/executive-tab-button.component.jsx';
import BootstrapDateRangeModal from '../../../../components/bootstrap-date-range-modal.component.jsx';
import FollowUpModal from '../../../../components/follow-up-modal.component.jsx';
import RemarksModal from '../../../clients/components/RemarksModal.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import '../../../../assets/styles/legacy/admin-dashboard-page.css';
import '../../../../assets/styles/legacy/client-listing-page.css';
import '../../../../assets/styles/legacy/table-remarks-icon.css';
import api from '../../../shared/services/api.js';
import { createWebsiteLeadFollowUp } from '../../../shared/services/leads.js';
import { createDataLeadFollowUp } from '../../../shared/services/data-leads-service.js';
import { createMetaLeadFollowUp } from '../../../shared/services/metaLeads.js';
import formatDateUniversal, { getNextFollowUpDateTimeParts } from '../../../shared/utils/formatDate.js';
import useUserStore from '../../../shared/store/user-store.js';
import { statusColors } from '../../../leads/pages/website-leads/website-leads-constants.js';

const sourceColorMap = {
  meta: 'purple',
  data: 'blue',
  website: 'green',
};

export async function listFollowUps(params) {
  const { data } = await api.get('/follow-up/user-list', { params });
  if (data?.status === false || data?.success === false) {
    throw new Error(data.message || 'Could not load follow ups.');
  }
  if (!Array.isArray(data?.results)) throw new Error('Could not read the follow-up list.');
  return data;
}

function resolveFollowUpLeadSource(lead) {
  const sourceRaw = String(lead?.source_type || lead?.model_name || '').toLowerCase();
  if (sourceRaw.includes('meta')) return 'meta';
  if (sourceRaw.includes('data')) return 'data';
  if (sourceRaw.includes('website') || sourceRaw.includes('leadgeneration')) return 'website';
  return null;
}

function isLeadConvertedToClient(lead) {
  return (
    lead?.converted_to_client === true ||
    lead?.converted_to_client === 1 ||
    lead?.converted_to_client === '1' ||
    lead?.converted_to_client === 'true'
  );
}

function getWebsiteLeadStatusColor(status) {
  const rawStatus = String(status || '').trim();
  if (!rawStatus) return '#d9d9d9';

  if (statusColors[rawStatus]) return statusColors[rawStatus];

  const withoutThrough = rawStatus.replaceAll(' Through ', ' ');
  if (statusColors[withoutThrough]) return statusColors[withoutThrough];

  const normalizedRaw = rawStatus.toLowerCase().replace(/\s+/g, ' ').trim();
  const matchedKey = Object.keys(statusColors).find(
    (key) => key.toLowerCase().replace(/\s+/g, ' ').trim() === normalizedRaw,
  );
  return matchedKey ? statusColors[matchedKey] : '#d9d9d9';
}

const CommonLeadsFollowUp = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const userType = user?.user_type;
  const [activeTab, setActiveTab] = useState('future');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [followUpModal, setFollowUpModal] = useState({
    visible: false,
    lead: null,
    leadType: 'website',
  });
  const [remarksModal, setRemarksModal] = useState({
    visible: false,
    remarks: '',
  });

  const followUpSaveMutation = useMutation(
    ({ leadId, payload, leadType: type }) => {
      if (type === 'meta') return createMetaLeadFollowUp(leadId, payload);
      if (type === 'data') return createDataLeadFollowUp(leadId, payload);
      return createWebsiteLeadFollowUp(leadId, payload);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Follow up saved successfully');
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) =>
            Array.isArray(queryKey) && queryKey[0] === 'commonLeadsFollowUp',
        });
      },
      onError: (error) => {
        message.error(
          error?.response?.data?.message || error?.message || 'Failed to save follow up',
        );
      },
    },
  );

  const openFollowUpModal = useCallback((originalRow) => {
    const source = resolveFollowUpLeadSource(originalRow);
    const leadId = originalRow?.object_id ?? originalRow?.lead_id;
    if (leadId === undefined || leadId === null || leadId === '') {
      message.warning('Lead id missing — cannot open follow-up');
      return;
    }
    if (!source) {
      message.warning('Unknown lead source');
      return;
    }
    setFollowUpModal({
      visible: true,
      lead: { ...originalRow, id: leadId },
      leadType: source,
    });
  }, []);

  const type = activeTab === 'past' ? 'past' : 'future';
  const page = pagination.pageIndex + 1;
  const size = pagination.pageSize;
  const search = (globalFilter || '').trim();
  const startDate = dateRangeFilter?.[0]?.format?.('YYYY-MM-DD') ?? '';
  const endDate = dateRangeFilter?.[1]?.format?.('YYYY-MM-DD') ?? '';
  const activeSort = sorting && sorting.length > 0 && sorting[0]?.id ? sorting[0] : null;
  const sortBy = activeSort?.id || '';
  const sortOrder = activeSort ? (activeSort.desc ? 'desc' : 'asc') : 'asc';

  const { data, isLoading, isError, error, refetch } = useQuery(
    ['commonLeadsFollowUp', user?.id, userType, type, page, size, search, sortBy, sortOrder, startDate, endDate],
    async () => {
      const params = {
        page,
        size,
        type,
      };

      if (search) {
        params.search = search;
      }

      if (sortBy) {
        params.sort_by = sortBy;
        params.order = sortOrder;
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }
      return listFollowUps(params);
    },
    { keepPreviousData: true, refetchOnWindowFocus: false },
  );

  const rows = useMemo(() => {
    const list = Array.isArray(data?.results) ? data.results : [];
    const getFirst = (...values) => values.find((v) => v !== undefined && v !== null && v !== '');

    return list.map((row, index) => ({
      ...row,
      row_number: pagination.pageIndex * pagination.pageSize + index + 1,
      id: row.id,
      model_name: row.model_name || '-',
      object_id: row.object_id || '-',
      status: row.status || '-',
      contact_person_name: getFirst(row.contact_person_name, row.full_name, row.name, '-'),
      company_name: getFirst(row.company_name, '-'),
      phone_number: getFirst(row.phone, row.phone_number, '-'),
      email: getFirst(row.email, row.work_email, '-'),
      contact_person_designation: getFirst(row.contact_person_designation, row.designation, '-'),
      total_vacancies: Number(getFirst(row.total_vacancies, row.no_of_resources, 0)),
      proposal: getFirst(row.proposal, row.proposal_url, ''),
      contract_currency: getFirst(row.contract_currency, '-'),
      contract_price: getFirst(row.contract_price, row.contract_amount, '-'),
      industry: getFirst(row.industry, row.industry_sector, '-'),
      assigned_to_name: row.assigned_to_name || '-',
      current_followup_date_raw: row.current_followup_date || null,
      current_followup_date: row.current_followup_date
        ? formatDateUniversal(row.current_followup_date, true)
        : '-',
      next_followup_date_raw: row.next_followup_date || null,
      ...(() => {
        const parts = getNextFollowUpDateTimeParts(row);
        return {
          next_followup_date: parts.dateText,
          next_followup_time_display: parts.timeText,
        };
      })(),
      is_next_followup_required: !!row.is_next_followup_required,
      remarks: row.remarks || '-',
      source_type: row.source_type || '-',
      created_at: row.created_at ? formatDateUniversal(row.created_at, true) : '-',
    }));
  }, [data?.results, pagination.pageIndex, pagination.pageSize]);

  const columns = useMemo(
    () => [
      /* ---- Row index ---- */
      {
        header: '#',
        accessorKey: 'row_number',
        enableSorting: false,
        size: 70,
      },
      /* ---- Follow-up related (first) ---- */
      {
        header: 'Last Follow Ups',
        accessorKey: 'current_followup_date',
        size: 180,
      },
      {
        header: 'Next Follow Ups Date',
        id: 'next_followup_date',
        accessorKey: 'next_followup_date_raw',
        size: 140,
        Cell: ({ row }) => <span>{row.original.next_followup_date}</span>,
      },
      {
        header: 'Next Follow Ups Time',
        id: 'next_followup_time_display',
        size: 130,
        enableSorting: false,
        Cell: ({ row }) => <span>{row.original.next_followup_time_display}</span>,
      },
      {
        header: 'Old Remarks',
        id: 'remarks_action',
        accessorKey: 'remarks',
        size: 90,
        enableSorting: false,
        Cell: ({ row }) => {
          const hasRemarks = row.original.remarks && row.original.remarks !== '-';
          return (
            <CommentOutlined size="1em"
              role="button"
              tabIndex={0}
              aria-label={hasRemarks ? 'View old remarks' : 'No remarks'}
              className={["app-icon", `table-remarks-icon ${hasRemarks ? 'table-remarks-icon--filled' : 'table-remarks-icon--empty'}`].filter(Boolean).join(' ')}
              onClick={() => {
                const nextRemarks = hasRemarks ? row.original.remarks : '';
                setRemarksModal({ visible: true, remarks: nextRemarks });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const nextRemarks = hasRemarks ? row.original.remarks : '';
                  setRemarksModal({ visible: true, remarks: nextRemarks });
                }
              }}
            />
          );
        },
      },
      {
        header: 'Follow Ups and Remarks',
        id: 'follow_up_icon',
        enableSorting: false,
        size: 90,
        Cell: ({ row }) => {
          const canUseFollowUp =
            userType === 'sales_manager' || userType === 'sales_executive' || userType === 'super_admin';
          const isConverted = isLeadConvertedToClient(row.original);

          if (!canUseFollowUp) return <span>-</span>;

          if (isConverted) {
            return (
              <Tooltip title="Follow-up disabled for converted client">
                <ClockCircleOutlined size="1em" className="app-icon"
                  style={{ cursor: 'not-allowed', fontSize: 18, color: '#bfbfbf' }}
                />
              </Tooltip>
            );
          }

          return (
            <Tooltip title="Open follow-up">
              <ClockCircleOutlined size="1em" className="app-icon"
                role="button"
                tabIndex={0}
                onClick={() => openFollowUpModal(row.original)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFollowUpModal(row.original);
                  }
                }}
                style={{ cursor: 'pointer', fontSize: 18, color: '#3E6A9F' }}
              />
            </Tooltip>
          );
        },
      },
      /* ---- Source ---- */
      {
        header: 'Source',
        accessorKey: 'source_type',
        size: 120,
        Cell: ({ cell }) => {
          const source = String(cell.getValue() || '-').toLowerCase();
          const normalized = source === 'website' ? 'website' : source === 'data' ? 'data' : source === 'meta' ? 'meta' : source;
          const label = normalized && normalized !== '-'
            ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
            : '-';
          return <Tag color={sourceColorMap[normalized] || 'default'}>{label}</Tag>;
        },
      },
      /* ---- Lead / contract / meta ---- */
      {
        header: 'Status',
        accessorKey: 'status',
        size: 150,
        Cell: ({ cell }) => {
          const status = cell.getValue();
          if (!status || status === '-') return <span>-</span>;
          const color = getWebsiteLeadStatusColor(status);
          return (
            <span
              style={{
                color,
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: 4,
                backgroundColor: '#f0f0f0',
              }}
            >
              {status}
            </span>
          );
        },
      },
      {
        header: 'Name',
        accessorKey: 'contact_person_name',
        size: 180,
        Cell: ({ cell, row }) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {cell.getValue() || '-'}
            {row.original?.is_duplicate ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                <MinusOutlined size="1em" className="app-icon" style={{ color: '#595959', fontSize: '12px' }} />
                <InfoCircleOutlined size="1em" className="app-icon" style={{ color: '#fa8c16', fontSize: '12px' }} />
              </span>
            ) : null}
          </span>
        ),
      },
      {
        header: 'Phone',
        accessorKey: 'phone_number',
        size: 150,
        Cell: ({ cell }) => (
          <Tooltip title="Click to copy phone">
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (cell.getValue() && cell.getValue() !== '-') {
                  navigator.clipboard.writeText(String(cell.getValue()));
                  message.success('Phone copied to clipboard');
                }
              }}
            >
              {cell.getValue() || '-'}
            </span>
          </Tooltip>
        ),
      },
      {
        header: 'Email',
        accessorKey: 'email',
        size: 200,
        Cell: ({ cell }) => (
          <Tooltip title="Click to copy email">
            <span
              style={{ cursor: 'pointer' }}
              onClick={async () => {
                if (cell.getValue() && cell.getValue() !== '-') {
                  await navigator.clipboard.writeText(String(cell.getValue()));
                  message.success('Email copied to clipboard');
                }
              }}
            >
              {cell.getValue() || '-'}
            </span>
          </Tooltip>
        ),
      },
      {
        header: 'Designation',
        accessorKey: 'contact_person_designation',
        size: 160,
      },
      {
        header: 'Company Name',
        accessorKey: 'company_name',
        size: 180,
      },
      {
        header: 'No. of Resources',
        accessorKey: 'total_vacancies',
        size: 140,
        Cell: ({ cell }) => {
          const value = Number(cell.getValue());
          if (!Number.isFinite(value)) return <span>-</span>;
          return <span>{value > 100 ? '100+' : value}</span>;
        },
      },
      {
        header: 'Proposal',
        accessorKey: 'proposal',
        size: 100,
        Cell: ({ cell }) => (
          cell.getValue()
            ? <FilePdfOutlined size="1em" className="app-icon" style={{ fontSize: 18, color: '#d4380d' }} />
            : <span>-</span>
        ),
      },
      {
        header: 'Contract Currency',
        accessorKey: 'contract_currency',
        size: 150,
      },
      {
        header: 'Contract Price/Amount',
        accessorKey: 'contract_price',
        enableSorting: true,
        // Keep the cycle stable when API rows mix numeric amounts and '-' placeholders.
        sortDescFirst: false,
        size: 180,
      },
      {
        header: 'Industry',
        accessorKey: 'industry',
        size: 150,
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to_name',
        size: 160,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        size: 170,
      },
      {
        header: 'Updated By',
        accessorKey: 'updated_by_name',
        size: 180,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Next Follow-up Required',
        accessorKey: 'is_next_followup_required',
        size: 180,
        Cell: ({ cell }) => <Tag color={cell.getValue() ? 'blue' : 'default'}>{cell.getValue() ? 'Yes' : 'No'}</Tag>,
      },
      /* ---- Last ---- */
      {
        header: 'View Lead',
        id: 'view_lead',
        size: 130,
        enableSorting: false,
        Cell: ({ row }) => {
          const source = resolveFollowUpLeadSource(row.original);
          const leadId = row.original?.object_id;

          const canOpenForRole =
            userType === 'sales_manager' || userType === 'sales_executive' || userType === 'super_admin';

          const handleOpenLead = () => {
            if (!leadId || !source) return;
            if (!canOpenForRole) {
              message.warning('Lead detail route is not available for this role');
              return;
            }

            if (source === 'data') {
              navigate(`/data-lead/${leadId}`);
              return;
            }

            const roleBase =
              userType === 'super_admin'
                ? '/super-admin'
                : userType === 'sales_manager'
                  ? '/sales-manager'
                  : '/sales-executive';

            if (source === 'meta') {
              navigate(`${roleBase}/meta-leads/${leadId}`);
              return;
            }

            navigate(`${roleBase}/leads/${leadId}`);
          };

          const missingTarget = !leadId || !source;
          const tooltipTitle = missingTarget
            ? 'Lead detail unavailable'
            : !canOpenForRole
              ? 'Open lead detail (restricted for this role)'
              : 'Open lead detail';

          return (
            <Tooltip title={tooltipTitle}>
              <button
                type="button"
                className="follow-up-view-lead-btn"
                disabled={missingTarget}
                onClick={handleOpenLead}
              >
                View Lead
              </button>
            </Tooltip>
          );
        },
      },
    ],
    [navigate, userType, openFollowUpModal],
  );

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setSorting([]);
  };

  return (
    <>
      <BreadCrumb linkText="Follow ups" />
      {isError && <Alert type="error" showIcon message={error?.response?.data?.message || error?.message || 'Could not load follow ups.'}
        action={<Button onClick={() => refetch()}>Retry</Button>} />}
      <div className="listing-page-content follow-up-page">
        <div className="listing-toolbar-flex">
         
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            <BootstrapDateRangeModal
              value={dateRangeFilter}
              onChange={() => {}}
              showModal={showDateRangeModal}
              setShowModal={setShowDateRangeModal}
              onDone={(range) => {
                setDateRangeFilter(range);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              triggerStyle={{ border: '1px solid #d9d9d9', height: 32, display: 'inline-flex', alignItems: 'center' }}
            />
            <Button
              onClick={() => {
                setDateRangeFilter(null);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            >
              Clear Date Filter
            </Button>
          </div>
        </div>

        <div className="follow-up-section-tabs">
          <span style={{ marginLeft: 6, marginRight: 6 }}>
            <ExecutiveTabButton
              executive={{ id: 'follow-ups-future' }}
              label="Follow ups"
              showRoleSuffix={false}
              showCount={false}
              isSelected={activeTab === 'future'}
              onClick={() => handleTabChange('future')}
              className="executive-section-tab"
            />
          </span>
          <span style={{ marginLeft: 6, marginRight: 6 }}>
            <ExecutiveTabButton
              executive={{ id: 'follow-ups-past' }}
              label="Past Follow ups"
              showRoleSuffix={false}
              showCount={false}
              isSelected={activeTab === 'past'}
              onClick={() => handleTabChange('past')}
              className="executive-section-tab"
            />
          </span>
        </div>

        <div className="table-container follow-up-content">
          <NewTableComponent
            totalCount={data?.count || 0}
            columns={columns}
            data={rows}
            heading={`${activeTab === 'past' ? 'Past Follow ups' : 'Follow ups'} (${data?.count || 0})`}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            isLoading={isLoading}
            muiTableContainerProps={{ sx: { maxWidth: '100%', overflowX: 'auto' } }}
            enableRowSelection={false}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </div>
      </div>

      <FollowUpModal
        open={followUpModal.visible}
        onClose={() => setFollowUpModal({ visible: false, lead: null, leadType: 'website' })}
        lead={followUpModal.lead}
        leadType={followUpModal.leadType}
        readOnlyMode={isLeadConvertedToClient(followUpModal.lead)}
        onSubmit={async (values, lead) => {
          const leadId = lead?.id ?? lead?.object_id ?? lead?.lead_id;
          if (!leadId || isLeadConvertedToClient(lead)) return false;

          const leadType = resolveFollowUpLeadSource(lead) || followUpModal.leadType;
          if (!leadType) return false;

          const isNextFollowupRequired = !values?.addFollowUp;
          await followUpSaveMutation.mutateAsync({
            leadId,
            leadType,
            payload: {
              current_followup_date: new Date().toISOString(),
              next_followup_date: isNextFollowupRequired && values?.followUpDate
                ? new Date(values.followUpDate).toISOString()
                : null,
              is_next_followup_required: isNextFollowupRequired,
              remarks: values?.remarks?.trim() || '',
            },
          });
        }}
      />

      <RemarksModal
        visible={remarksModal.visible}
        title="Old Remarks"
        remarks={remarksModal.remarks}
        canEdit={false}
        showCount
        placeholder="No remarks"
        onCancel={() => setRemarksModal({ visible: false, remarks: '' })}
      />
    </>
  );
};

export default CommonLeadsFollowUp;
