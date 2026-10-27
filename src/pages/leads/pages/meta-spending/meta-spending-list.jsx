import { message } from '../../../../components/ui/notifications.jsx';
import { Button } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import { Box, Button as MuiButton } from '@mui/material';
import { Space } from 'antd';
import { Download as DownloadOutlined } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import BootstrapDateRangeModal from '../../../../components/bootstrap-date-range-modal.component.jsx';
import { getMetaAdsInsightsList, getMetaCampaignsList } from '../../../shared/services/metaLeads.js';

const TAB_DAILY = 'daily';
const TAB_CAMPAIGNS = 'campaigns';

const formatNumber = (value, fractionDigits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const formatPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  const pct = num > 0 && num <= 1 ? num * 100 : num;
  return `${pct.toFixed(2)}%`;
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

const arrayToCSV = (data, columns) => {
  if (!Array.isArray(data) || data.length === 0) return '';
  const headers = columns.map((col) => col.header);
  const keys = columns.map((col) => col.accessorKey);
  const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
  const csvRows = [headers.map(escape).join(',')];
  data.forEach((row) => {
    csvRows.push(keys.map((key) => escape(row[key] ?? '')).join(','));
  });
  return csvRows.join('\r\n');
};

const downloadCSVFile = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

const countSelectedRows = (rowSelection) =>
  Object.keys(rowSelection).filter((key) => rowSelection[key]).length;

const MetaSpendingList = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState(TAB_CAMPAIGNS);

  const [dailyPagination, setDailyPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [dailySorting, setDailySorting] = useState([]);
  const [dailyFilter, setDailyFilter] = useState('');

  const [campaignPagination, setCampaignPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [campaignSorting, setCampaignSorting] = useState([]);
  const [campaignFilter, setCampaignFilter] = useState('');

  const [dailyRowSelection, setDailyRowSelection] = useState({});
  const [campaignRowSelection, setCampaignRowSelection] = useState({});

  const [dailyDateRange, setDailyDateRange] = useState(null);
  const [dailyDateModalOpen, setDailyDateModalOpen] = useState(false);
  const [campaignDateRange, setCampaignDateRange] = useState(null);
  const [campaignDateModalOpen, setCampaignDateModalOpen] = useState(false);

  const canExportRows =
    user?.user_type === 'marketing_manager' || user?.user_type === 'admin';

  const routePrefix = useMemo(() => {
    if (user?.user_type === 'admin') return '/admin';
    return '/marketing_manager';
  }, [user?.user_type]);

  const { data: dailyData, isLoading: dailyLoading, isFetching: dailyFetching } = useQuery(
    ['metaSpendingDailyList', dailyPagination.pageIndex, dailyPagination.pageSize, dailySorting, dailyFilter, dailyDateRange],
    async () => {
      const sortBy = dailySorting?.[0]?.id;
      const order = dailySorting?.[0]?.desc ? 'desc' : 'asc';
      return getMetaAdsInsightsList({
        page: dailyPagination.pageIndex + 1,
        size: dailyPagination.pageSize,
        search: dailyFilter || undefined,
        sort_by: sortBy || undefined,
        order: sortBy ? order : undefined,
        start_date: dailyDateRange?.[0] ? dailyDateRange[0].format('YYYY-MM-DD') : undefined,
        end_date: dailyDateRange?.[1] ? dailyDateRange[1].format('YYYY-MM-DD') : undefined,
      });
    },
    {
      enabled: activeTab === TAB_DAILY,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );

  const { data: campaignData, isLoading: campaignLoading, isFetching: campaignFetching } = useQuery(
    [
      'metaSpendingCampaignsList',
      campaignPagination.pageIndex,
      campaignPagination.pageSize,
      campaignSorting,
      campaignFilter,
      campaignDateRange,
    ],
    async () => {
      const sortBy = campaignSorting?.[0]?.id;
      const order = campaignSorting?.[0]?.desc ? 'desc' : 'asc';
      return getMetaCampaignsList({
        page: campaignPagination.pageIndex + 1,
        size: campaignPagination.pageSize,
        search: campaignFilter || undefined,
        sort_by: sortBy || undefined,
        order: sortBy ? order : undefined,
        start_date: campaignDateRange?.[0] ? campaignDateRange[0].format('YYYY-MM-DD') : undefined,
        end_date: campaignDateRange?.[1] ? campaignDateRange[1].format('YYYY-MM-DD') : undefined,
      });
    },
    {
      enabled: activeTab === TAB_CAMPAIGNS,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );

  const dailyRows = Array.isArray(dailyData?.results) ? dailyData.results : [];
  const dailyTotalCount = dailyData?.count ?? 0;

  const campaignRows = Array.isArray(campaignData?.results) ? campaignData.results : [];
  const campaignTotalCount = campaignData?.count ?? 0;

  const handleViewDailyDetails = useCallback(
    (row) => {
      if (row?.id == null) return;
      navigate(`${routePrefix}/meta-spending/${row.id}`);
    },
    [navigate, routePrefix]
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setDailyRowSelection({});
    setCampaignRowSelection({});
  };

  useEffect(() => {
    if (!canExportRows) return;
    setDailyRowSelection({});
  }, [
    canExportRows,
    dailyPagination.pageIndex,
    dailyPagination.pageSize,
    dailyFilter,
    dailySorting,
  ]);

  useEffect(() => {
    if (!canExportRows) return;
    setCampaignRowSelection({});
  }, [
    canExportRows,
    campaignPagination.pageIndex,
    campaignPagination.pageSize,
    campaignFilter,
    campaignSorting,
  ]);

  const dailyColumns = useMemo(
    () => [
      { header: 'Date', accessorKey: 'date', size: 120, Cell: ({ cell }) => { const v = cell.getValue(); return v && dayjs(v).isValid() ? dayjs(v).format('MMM DD, YYYY') : '-'; } },
      {
        header: 'ID',
        accessorKey: 'id',
        size: 90,
        Cell: ({ cell }) => cell.getValue() ?? '-',
      },
      {
        header: 'Spend',
        accessorKey: 'spend',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue()),
      },
      {
        header: 'Cost per lead',
        accessorKey: 'cost_per_lead',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue()),
      },
      {
        header: 'Reach',
        accessorKey: 'reach',
        size: 110,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Clicks',
        accessorKey: 'clicks',
        size: 100,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Impression',
        accessorKey: 'impressions',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'CTR',
        accessorKey: 'ctr',
        size: 90,
        Cell: ({ cell }) => formatPercent(cell.getValue()),
      },
      {
        header: 'Link Clicks',
        accessorKey: 'link_clicks',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      { header: 'Campaign', accessorKey: 'campaign_name', size: 220, Cell: ({ cell, row }) => {
        const name = cell.getValue();
        if (!name) return '-';
        const campaignId = row.original.campaign_id;
        const url = campaignId
          ? `${routePrefix}/meta-spending-adsets?campaign_id=${encodeURIComponent(campaignId)}`
          : null;
        return (
          <span
            style={{ color: '#3e6a9f', cursor: url ? 'pointer' : 'default', textDecoration: url ? 'underline' : 'none', fontWeight: 500 }}
            onClick={() => url && navigate(url)}
          >
            {name}
          </span>
        );
      }},
      {
        header: 'Social Spend',
        accessorKey: 'social_spend',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue()),
      },
      {
        header: 'Leads',
        accessorKey: 'leads',
        size: 100,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Video Views',
        accessorKey: 'video_views',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Landing Views',
        accessorKey: 'landing_page_views',
        size: 130,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        id: 'view_details',
        header: 'View Details',
        size: 110,
        enableSorting: false,
        Cell: ({ row }) => (
          <MuiButton
            size="small"
            variant="outlined"
            onClick={() => handleViewDailyDetails(row.original)}
            sx={detailsButtonSx}
          >
            Details
          </MuiButton>
        ),
      },
    ],
    [handleViewDailyDetails, navigate, routePrefix]
  );

  const campaignColumns = useMemo(
    () => [
      {
        header: 'Campaign',
        accessorKey: 'campaign_name',
        size: 260,
        Cell: ({ cell, row }) => {
          const name = cell.getValue();
          if (!name) return '-';
          return (
            <span
              style={{ color: '#3e6a9f', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
              onClick={() => navigate(`${routePrefix}/meta-spending-adsets?campaign_id=${encodeURIComponent(row.original.campaign_id)}`)}
            >
              {name}
            </span>
          );
        },
      },
      {
        header: 'Campaign ID',
        accessorKey: 'campaign_id',
        size: 160,
        Cell: ({ cell }) => cell.getValue() || '-',
      },
      {
        header: 'Objective',
        accessorKey: 'objective',
        size: 150,
        Cell: ({ cell }) => {
          const val = cell.getValue();
          if (!val) return '-';
          return String(val).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        },
      },
      {
        header: 'Buying Type',
        accessorKey: 'buying_type',
        size: 110,
        Cell: ({ cell }) => cell.getValue() || '-',
      },
      {
        header: 'Total Spend',
        accessorKey: 'total_spend',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue()),
      },
      {
        header: 'Social Spend',
        accessorKey: 'total_social_spend',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue()),
      },
      {
        header: 'Leads',
        accessorKey: 'total_leads',
        size: 90,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Conversions',
        accessorKey: 'total_conversions',
        size: 110,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Avg Cost/Lead',
        accessorKey: 'avg_cost_per_lead',
        size: 130,
        Cell: ({ cell }) => formatNumber(cell.getValue()),
      },
      {
        header: 'Avg Spend/Ad',
        accessorKey: 'avg_spend_per_ad',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue()),
      },
      {
        header: 'Link Clicks',
        accessorKey: 'total_link_clicks',
        size: 110,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Video Views',
        accessorKey: 'total_video_views',
        size: 110,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Page Engagement',
        accessorKey: 'total_page_engagement',
        size: 140,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Impressions',
        accessorKey: 'total_impressions',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Reach',
        accessorKey: 'total_reach',
        size: 100,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Landing Page Views',
        accessorKey: 'total_landing_page_views',
        size: 150,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Avg Frequency',
        accessorKey: 'avg_frequency',
        size: 120,
        Cell: ({ cell }) => formatNumber(cell.getValue()),
      },
      {
        header: 'Avg CTR',
        accessorKey: 'avg_ctr',
        size: 100,
        Cell: ({ cell }) => formatPercent(cell.getValue()),
      },
      {
        header: 'Ads',
        accessorKey: 'total_ads',
        size: 80,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Adsets',
        accessorKey: 'total_adsets',
        size: 80,
        Cell: ({ cell }) => formatNumber(cell.getValue(), 0),
      },
      {
        header: 'Quality',
        accessorKey: 'quality_ranking',
        size: 100,
        Cell: ({ cell }) => cell.getValue() || '-',
      },
      {
        header: 'Date',
        accessorKey: 'date',
        size: 120,
        Cell: ({ cell }) => { const v = cell.getValue(); return v && dayjs(v).isValid() ? dayjs(v).format('MMM DD, YYYY') : '-'; },
      },
      {
        header: 'Details',
        id: 'details',
        size: 90,
        enableSorting: false,
        Cell: ({ row }) => (
          <MuiButton
            size="small"
            variant="outlined"
            onClick={() => {
              const params = new URLSearchParams({ campaign_id: row.original.campaign_id });
              if (campaignDateRange?.[0]) params.set('start_date', campaignDateRange[0].format('YYYY-MM-DD'));
              if (campaignDateRange?.[1]) params.set('end_date', campaignDateRange[1].format('YYYY-MM-DD'));
              navigate(`${routePrefix}/meta-spending-campaign-detail?${params.toString()}`);
            }}
            sx={detailsButtonSx}
          >
            Details
          </MuiButton>
        ),
      },
    ],
    [navigate, routePrefix]
  );

  const getDailyRowId = useCallback((row) => String(row.id), []);
  const getCampaignRowId = useCallback(
    (row, index) => row.campaign_id?.toString() || `campaign-${index}`,
    []
  );

  const exportSelectedRows = useCallback((selectedRows, columns, filenamePrefix) => {
    try {
      if (!selectedRows.length) {
        message.info('No rows selected for export.');
        return;
      }

      const csvColumns = columns.filter((col) => col.accessorKey);
      const csv = arrayToCSV(selectedRows, csvColumns);
      downloadCSVFile(csv, `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.csv`);
      message.success(`${selectedRows.length} row(s) exported successfully!`);
    } catch {
      message.error('Failed to export selected rows.');
    }
  }, []);

  const handleExportDailySelected = useCallback(() => {
    const selectedIds = Object.keys(dailyRowSelection).filter((key) => dailyRowSelection[key]);
    const selectedRows = dailyRows.filter((row) => selectedIds.includes(String(row.id)));
    exportSelectedRows(selectedRows, dailyColumns, 'meta-spending-daily-selected');
  }, [dailyRowSelection, dailyRows, dailyColumns, exportSelectedRows]);

  const handleExportCampaignSelected = useCallback(() => {
    const selectedIds = Object.keys(campaignRowSelection).filter((key) => campaignRowSelection[key]);
    const selectedRows = campaignRows.filter((row) =>
      selectedIds.includes(row.campaign_id?.toString() ?? '')
    );
    exportSelectedRows(selectedRows, campaignColumns, 'meta-spending-campaigns-selected');
  }, [campaignRowSelection, campaignRows, campaignColumns, exportSelectedRows]);

  const dailySelectedCount = countSelectedRows(dailyRowSelection);
  const campaignSelectedCount = countSelectedRows(campaignRowSelection);

  const tabButtonStyle = (isActive) => ({
    border: isActive ? '1px solid #3e6a9f' : '1px solid #3e6a9f30',
    borderRadius: '4px',
    margin: '2px',
    padding: '6px 14px',
    minWidth: 'min-content',
    whiteSpace: 'nowrap',
    backgroundColor: isActive ? '#3e6a9f' : '#3e6a9f15',
    color: isActive ? '#ffffff' : '#3e6a9f',
    fontWeight: 500,
    cursor: 'pointer',
  });

  return (
    <>
      <BreadCrumb linkText="Meta Spending" />
      <div className="leads">
        <div className="container">
          <Box sx={{ minHeight: 'calc(100vh - 120px)' }}>
            <div className="client-tabs-container" style={{ marginBottom: 16, borderRadius: '6px', padding: '8px' }}>
              <div className="client-tabs">
                <button
                  type="button"
                  className={`tab ${activeTab === TAB_DAILY ? 'active' : ''}`}
                  style={tabButtonStyle(activeTab === TAB_DAILY)}
                  onClick={() => handleTabChange(TAB_DAILY)}
                >
                  Daily Insights
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === TAB_CAMPAIGNS ? 'active' : ''}`}
                  style={tabButtonStyle(activeTab === TAB_CAMPAIGNS)}
                  onClick={() => handleTabChange(TAB_CAMPAIGNS)}
                >
                  Campaigns Insights
                </button>
              </div>
            </div>

            {activeTab === TAB_DAILY && (
              <div style={{ marginBottom: 12 }}>
                <Space align="center">
                  <span style={{ fontWeight: 500, fontSize: 14, padding: '8px 12px', borderRadius: 6 }}>Filter by Date Range:</span>
                  <BootstrapDateRangeModal
                    value={dailyDateRange}
                    onChange={setDailyDateRange}
                    showModal={dailyDateModalOpen}
                    setShowModal={setDailyDateModalOpen}
                    onDone={(range) => { setDailyDateRange(range); setDailyPagination((p) => ({ ...p, pageIndex: 0 })); }}
                    triggerStyle={{ border: '1px solid #d9d9d9' }}
                  />
                  {dailyDateRange && (
                    <Button size="small" danger onClick={() => { setDailyDateRange(null); setDailyDateModalOpen(false); }}>
                      Clear
                    </Button>
                  )}
                </Space>
              </div>
            )}

            {activeTab === TAB_DAILY && dailySelectedCount > 0 && canExportRows && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Button
                  icon={<DownloadOutlined size="1em" className="app-icon" />}
                  onClick={handleExportDailySelected}
                  style={{
                    background: '#3E6A9F',
                    color: 'white',
                    borderColor: '#3E6A9F',
                  }}
                >
                  Export Selected ({dailySelectedCount})
                </Button>
              </div>
            )}

            {activeTab === TAB_DAILY && (
              <NewTableComponent
                heading={`Daily Insights (${dailyTotalCount})`}
                totalCount={dailyTotalCount}
                columns={dailyColumns}
                data={dailyRows}
                pagination={dailyPagination}
                onPaginationChange={setDailyPagination}
                sorting={dailySorting}
                onSortingChange={setDailySorting}
                globalFilter={dailyFilter}
                onGlobalFilterChange={setDailyFilter}
                isLoading={dailyLoading || dailyFetching}
                enableRowSelection={canExportRows}
                rowSelection={canExportRows ? dailyRowSelection : {}}
                onRowSelectionChange={canExportRows ? setDailyRowSelection : undefined}
                getRowId={getDailyRowId}
              />
            )}

            {activeTab === TAB_CAMPAIGNS && (
              <div style={{ marginBottom: 12 }}>
                <Space align="center">
                  <span style={{ fontWeight: 500, fontSize: 14, padding: '8px 12px', borderRadius: 6 }}>Filter by Date Range:</span>
                  <BootstrapDateRangeModal
                    value={campaignDateRange}
                    onChange={setCampaignDateRange}
                    showModal={campaignDateModalOpen}
                    setShowModal={setCampaignDateModalOpen}
                    onDone={(range) => { setCampaignDateRange(range); setCampaignPagination((p) => ({ ...p, pageIndex: 0 })); }}
                    triggerStyle={{ border: '1px solid #d9d9d9' }}
                  />
                  {campaignDateRange && (
                    <Button size="small" danger onClick={() => { setCampaignDateRange(null); setCampaignDateModalOpen(false); }}>
                      Clear
                    </Button>
                  )}
                </Space>
              </div>
            )}

            {activeTab === TAB_CAMPAIGNS && campaignSelectedCount > 0 && canExportRows && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Button
                  icon={<DownloadOutlined size="1em" className="app-icon" />}
                  onClick={handleExportCampaignSelected}
                  style={{
                    background: '#3E6A9F',
                    color: 'white',
                    borderColor: '#3E6A9F',
                  }}
                >
                  Export Selected ({campaignSelectedCount})
                </Button>
              </div>
            )}

            {activeTab === TAB_CAMPAIGNS && (
              <NewTableComponent
                heading={`Campaigns Insights (${campaignTotalCount})`}
                totalCount={campaignTotalCount}
                columns={campaignColumns}
                data={campaignRows}
                pagination={campaignPagination}
                onPaginationChange={setCampaignPagination}
                sorting={campaignSorting}
                onSortingChange={setCampaignSorting}
                globalFilter={campaignFilter}
                onGlobalFilterChange={setCampaignFilter}
                isLoading={campaignLoading || campaignFetching}
                enableRowSelection={canExportRows}
                rowSelection={canExportRows ? campaignRowSelection : {}}
                onRowSelectionChange={canExportRows ? setCampaignRowSelection : undefined}
                getRowId={getCampaignRowId}
              />
            )}
          </Box>
        </div>
      </div>
    </>
  );
};

export default MetaSpendingList;
