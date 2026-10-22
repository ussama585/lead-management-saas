import React, { useMemo, useState } from 'react';
import { Box, Button as MuiButton } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Space } from 'antd';
import { useQuery } from 'react-query';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import BootstrapDateRangeModal from '../../../../components/bootstrap-date-range-modal.component.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import { getMetaAdsetAdsList } from '../../../shared/services/metaLeads.js';

const detailsButtonSx = {
  fontSize: '10px',
  padding: '4px 12px',
  minWidth: 'auto',
  textTransform: 'uppercase',
  borderColor: '#3e6a9f',
  color: '#3e6a9f',
  '&:hover': { borderColor: '#2d5a8a', backgroundColor: 'rgba(62, 106, 159, 0.04)' },
};

const formatNumber = (value, fractionDigits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return num.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
};

const formatPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  const pct = num > 0 && num <= 1 ? num * 100 : num;
  return `${pct.toFixed(2)}%`;
};

const MetaSpendingAds = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUserStore();
  const adsetId = searchParams.get('adset_id') || '';
  const routePrefix = user?.user_type === 'admin' ? '/admin' : '/marketing_manager';


  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);

  const { data, isLoading, isFetching } = useQuery(
    ['metaAdsetAds', adsetId, pagination.pageIndex, pagination.pageSize, sorting, globalFilter, dateRange],
    () => {
      const sortBy = sorting?.[0]?.id;
      const order = sorting?.[0]?.desc ? 'desc' : 'asc';
      return getMetaAdsetAdsList(adsetId, {
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        search: globalFilter || undefined,
        sort_by: sortBy || undefined,
        order: sortBy ? order : undefined,
        start_date: dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
        end_date: dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
      });
    },
    {
      enabled: !!adsetId,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );

  const rows = Array.isArray(data?.results) ? data.results : [];
  const totalCount = data?.count ?? 0;
  const adsetName = rows[0]?.adset_name || '';

  const columns = useMemo(() => [
    {
      header: 'Ad Name',
      accessorKey: 'ad_name',
      size: 260,
      Cell: ({ cell, row }) => {
        const name = cell.getValue();
        const adId = row.original.ad_id;
        if (!adId) return <span>{name || '-'}</span>;
        return (
          <span
            style={{ color: '#3e6a9f', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
            onClick={() => navigate(`${routePrefix}/meta-spending-ad-insights?ad_id=${encodeURIComponent(adId)}`)}
          >
            {name || '-'}
          </span>
        );
      },
    },
    {
      header: 'Ad ID',
      accessorKey: 'ad_id',
      size: 160,
      Cell: ({ cell }) => cell.getValue() || '-',
    },
    {
      header: 'Spend',
      accessorKey: 'spend',
      size: 120,
      Cell: ({ cell }) => formatNumber(cell.getValue()),
    },
    {
      header: 'Social Spend',
      accessorKey: 'social_spend',
      size: 120,
      Cell: ({ cell }) => formatNumber(cell.getValue()),
    },
    {
      header: 'Leads',
      accessorKey: 'leads',
      size: 90,
      Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
    },
    {
      header: 'Conversions',
      accessorKey: 'conversions',
      size: 110,
      Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
    },
    {
      header: 'Cost per Lead',
      accessorKey: 'cost_per_lead',
      size: 120,
      Cell: ({ cell }) => formatNumber(cell.getValue()),
    },
    {
      header: 'Link Clicks',
      accessorKey: 'link_clicks',
      size: 110,
      Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
    },
    {
      header: 'Impressions',
      accessorKey: 'impressions',
      size: 120,
      Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
    },
    {
      header: 'Reach',
      accessorKey: 'reach',
      size: 100,
      Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
    },
    {
      header: 'Page Engagement',
      accessorKey: 'page_engagement',
      size: 140,
      Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
    },
    {
      header: 'Video Views',
      accessorKey: 'video_views',
      size: 110,
      Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
    },
    {
      header: 'Landing Page Views',
      accessorKey: 'landing_page_views',
      size: 150,
      Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
    },
    {
      header: 'CTR',
      accessorKey: 'ctr',
      size: 90,
      Cell: ({ cell }) => formatPercent(cell.getValue()),
    },
    {
      header: 'Frequency',
      accessorKey: 'frequency',
      size: 100,
      Cell: ({ cell }) => formatNumber(cell.getValue()),
    },
    {
      header: 'Date',
      accessorKey: 'date',
      size: 120,
      Cell: ({ cell }) => cell.getValue() || '-',
    },
    {
      header: 'Details',
      id: 'details',
      size: 90,
      enableSorting: false,
      Cell: ({ row }) => {
        const adId = row.original.ad_id;
        if (!adId) return null;
        return (
          <MuiButton
            size="small"
            variant="outlined"
            onClick={() => navigate(`${routePrefix}/meta-spending-ad-detail?ad_id=${encodeURIComponent(adId)}`)}
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
      <BreadCrumb linkText={adsetName ? `Ads — ${adsetName}` : 'Ads'} goBack={() => navigate(-1)} />
      <div className="leads">
        <div className="container">
          <Box sx={{ minHeight: 'calc(100vh - 120px)' }}>
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
              heading={`Ads (${totalCount})`}
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

export default MetaSpendingAds;
