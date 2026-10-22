import React from 'react';
import { Box, Chip, Grid, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { useQuery } from 'react-query';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { getMetaAdsetDetail } from '../../../shared/services/metaLeads.js';

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

const KpiCard = ({ title, value, helperText, prominent = false }) => (
  <Paper
    sx={{
      p: prominent ? 2.5 : 2,
      border: prominent ? '1px solid #3E6A9F55' : '1px solid #ddd',
      borderLeft: prominent ? '4px solid #3E6A9F' : '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: 'none',
      backgroundColor: prominent ? '#f8fbff' : '#fff',
      height: '100%',
      minWidth: 0,
    }}
  >
    <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {title}
    </Typography>
    <Tooltip title={String(value)} placement="top">
      <Typography
        variant={prominent ? 'h5' : 'body1'}
        sx={{
          mt: 0.5,
          fontWeight: prominent ? 700 : 400,
          color: prominent ? '#1f3a61' : '#2f2f2f',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </Typography>
    </Tooltip>
    <Typography variant="caption" sx={{ color: '#8c8c8c', mt: 0.25, display: 'block' }}>
      {helperText || '—'}
    </Typography>
  </Paper>
);

const MetaSpendingAdsetDetail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const adsetId = searchParams.get('adset_id') || '';

  const { data, isLoading } = useQuery(
    ['metaAdsetDetail', adsetId],
    () => getMetaAdsetDetail(adsetId),
    { enabled: !!adsetId, refetchOnWindowFocus: false }
  );

  const secondaryMetrics = [
    { label: 'Campaign', value: data?.campaign_name || '-' },
    { label: 'Campaign ID', value: data?.campaign_id || '-' },
    { label: 'Adset ID', value: data?.adset_id || '-' },
    { label: 'ID', value: data?.id ?? '-' },
    { label: 'Social Spend', value: formatNumber(data?.total_social_spend) },
    { label: 'Conversions', value: formatNumber(data?.total_conversions, 0) },
    { label: 'Link Clicks', value: formatNumber(data?.total_link_clicks, 0) },
    { label: 'Video Views', value: formatNumber(data?.total_video_views, 0) },
    { label: 'Landing Page Views', value: formatNumber(data?.total_landing_page_views, 0) },
    { label: 'Page Engagement', value: formatNumber(data?.total_page_engagement, 0) },
    { label: 'Impressions', value: formatNumber(data?.total_impressions, 0) },
    { label: 'Reach', value: formatNumber(data?.total_reach, 0) },
    { label: 'Avg Frequency', value: formatNumber(data?.avg_frequency) },
    { label: 'Avg CTR', value: formatPercent(data?.avg_ctr) },
    { label: 'Total Ads', value: formatNumber(data?.total_ads, 0) },
    { label: 'Latest Date', value: data?.latest_date || '-' },
  ];

  return (
    <>
      <BreadCrumb
        linkText={data?.adset_name ? `Adset — ${data.adset_name}` : 'Adset Details'}
        goBack={() => navigate(-1)}
      />
      <div className="leads">
        <div className="container">
          <Box sx={{ minHeight: 'calc(100vh - 120px)' }}>
            {isLoading ? (
              <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none' }}>
                <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" />
              </Paper>
            ) : (
              <>
                {/* Header */}
                <Paper sx={{ p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none', mb: 2 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={1.5}>
                    <Box>
                      <Typography variant="h5" sx={{ color: '#1f3a61', fontWeight: 700 }}>
                        {data?.adset_name || adsetId}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                        {data?.campaign_name || '-'}
                      </Typography>
                    </Box>
                    {data?.latest_date && (
                      <Chip
                        label={data.latest_date}
                        size="small"
                        sx={{ backgroundColor: '#f5f5f5', color: '#595959', fontWeight: 500 }}
                      />
                    )}
                  </Stack>
                </Paper>

                {/* Primary KPIs */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6} md={6}>
                    <KpiCard
                      title="Total Spend"
                      value={formatNumber(data?.total_spend)}
                      helperText={`Social Spend: ${formatNumber(data?.total_social_spend)}`}
                      prominent
                    />
                  </Grid>
                  <Grid item xs={6} sm={6} md={2}>
                    <KpiCard
                      title="Leads"
                      value={formatNumber(data?.total_leads, 0)}
                      helperText={`${formatNumber(data?.total_conversions, 0)} conversions`}
                    />
                  </Grid>
                  <Grid item xs={6} sm={6} md={2}>
                    <KpiCard
                      title="Avg Cost/Lead"
                      value={formatNumber(data?.avg_cost_per_lead)}
                      helperText="per lead"
                    />
                  </Grid>
                  <Grid item xs={6} sm={6} md={2}>
                    <KpiCard
                      title="Conversions"
                      value={formatNumber(data?.total_conversions, 0)}
                      helperText="total conversions"
                    />
                  </Grid>
                </Grid>

                {/* Secondary metrics */}
                <Grid container spacing={2}>
                  {secondaryMetrics.map((m) => (
                    <Grid item xs={6} sm={4} md={3} key={m.label}>
                      <KpiCard title={m.label} value={m.value} />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Box>
        </div>
      </div>
    </>
  );
};

export default MetaSpendingAdsetDetail;
