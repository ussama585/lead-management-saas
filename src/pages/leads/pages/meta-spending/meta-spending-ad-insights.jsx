import { Button } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useState } from 'react';
import { Box, Button as MuiButton } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Space } from 'antd';
import { useQuery } from 'react-query';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import BootstrapDateRangeModal from '../../../../components/bootstrap-date-range-modal.component.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import { getMetaAdInsightDetail } from '../../../shared/services/metaLeads.js';

const formatNumber = (value, fractionDigits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return num.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
};

const getActionValue = (actions, type) => {
  if (!Array.isArray(actions)) return '-';
  const match = actions.find((a) => a.action_type === type);
  return match ? formatNumber(Number(match.value), 0) : '-';
};

const detailsButtonSx = {
  fontSize: '10px',
  padding: '4px 12px',
  minWidth: 'auto',
  textTransform: 'uppercase',
  borderColor: '#3e6a9f',
  color: '#3e6a9f',
  '&:hover': { borderColor: '#2d5a8a', backgroundColor: 'rgba(62, 106, 159, 0.04)' },
};

const MetaSpendingAdInsights = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUserStore();
  const adId = searchParams.get('ad_id') || '';
  const routePrefix = user?.user_type === 'admin' ? '/admin' : '/marketing_manager';

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);

  const { data, isLoading, isFetching } = useQuery(
    ['metaAdInsightDetail', adId],
    () => getMetaAdInsightDetail(adId),
    {
      enabled: !!adId,
      refetchOnWindowFocus: false,
    }
  );

  const allRows = useMemo(() => {
    if (!Array.isArray(data?.insights)) return [];
    let rows = data.insights;
    if (dateRange?.[0] && dateRange?.[1]) {
      const start = dateRange[0].format('YYYY-MM-DD');
      const end = dateRange[1].format('YYYY-MM-DD');
      rows = rows.filter((r) => r.date >= start && r.date <= end);
    }
    return rows;
  }, [data, dateRange]);

  const sortedRows = useMemo(() => {
    if (!sorting.length) return allRows;
    const { id, desc } = sorting[0];
    return [...allRows].sort((a, b) => {
      const aVal = a[id] ?? '';
      const bVal = b[id] ?? '';
      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
      return 0;
    });
  }, [allRows, sorting]);

  const filteredRows = useMemo(() => {
    if (!globalFilter) return sortedRows;
    const lower = globalFilter.toLowerCase();
    return sortedRows.filter((r) =>
      Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(lower))
    );
  }, [sortedRows, globalFilter]);

  const totalCount = filteredRows.length;
  const start = pagination.pageIndex * pagination.pageSize;
  const rows = filteredRows.slice(start, start + pagination.pageSize);
  const adName = data?.ad_name || adId;

  const columns = useMemo(() => [
    { header: 'Date', accessorKey: 'date', size: 120, Cell: ({ cell }) => cell.getValue() || '-' },
    { header: 'Spend', accessorKey: 'spend', size: 120, Cell: ({ cell }) => formatNumber(cell.getValue()) },
    { header: 'Social Spend', accessorKey: 'social_spend', size: 130, Cell: ({ cell }) => formatNumber(cell.getValue()) },
    {
      header: 'Leads',
      id: 'leads',
      size: 90,
      Cell: ({ row }) => getActionValue(row.original.actions, 'offsite_complete_registration_add_meta_leads'),
    },
    {
      header: 'Link Clicks',
      id: 'link_clicks',
      size: 110,
      Cell: ({ row }) => getActionValue(row.original.actions, 'link_click'),
    },
    { header: 'Ad Name', accessorKey: 'ad_name', size: 120, Cell: ({ cell }) => cell.getValue() || '-' },
    {
      header: 'Details',
      id: 'details',
      size: 90,
      enableSorting: false,
      Cell: ({ row }) => {
        const rowAdId = row.original.ad_id;
        if (!rowAdId) return null;
        return (
          <MuiButton
            size="small"
            variant="outlined"
            onClick={() => navigate(`${routePrefix}/meta-spending-ad-insight-detail?ad_id=${encodeURIComponent(rowAdId)}`)}
            sx={detailsButtonSx}
          >
            Details
          </MuiButton>
        );
      },
    },
  ], [navigate, routePrefix]);

  return (
    <>
      <BreadCrumb
        linkText={adName && adName !== adId ? `Ad Insights — ${adName}` : 'Ad Insights'}
        goBack={() => navigate(-1)}
      />
      <div className="leads">
        <div className="container">
          <Box sx={{ minHeight: 'calc(100vh - 120px)' }}>

            {/* Daily breakdown table */}
            <div style={{ marginBottom: 12 }}>
              <Space align="center">
                <span style={{ fontWeight: 500, fontSize: 14, padding: '8px 12px', borderRadius: 6 }}>Filter by Date Range:</span>
                <BootstrapDateRangeModal
                  value={dateRange}
                  onChange={setDateRange}
                  showModal={dateModalOpen}
                  setShowModal={setDateModalOpen}
                  onDone={(range) => { setDateRange(range); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                  triggerStyle={{ border: '1px solid #d9d9d9' }}
                />
                {dateRange && (
                  <Button size="small" danger onClick={() => { setDateRange(null); setDateModalOpen(false); }}>
                    Clear
                  </Button>
                )}
              </Space>
            </div>

            <NewTableComponent
              heading={`Ads New Insights (${totalCount})`}
              totalCount={totalCount}
              columns={columns}
              data={rows}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={setSorting}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              isLoading={isLoading || isFetching}
            />
          </Box>
        </div>
      </div>
    </>
  );
};

export default MetaSpendingAdInsights;
