import { Spin } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo } from 'react';
import { Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { useQuery } from 'react-query';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import { getMetaCampaignDetail } from '../../../shared/services/metaLeads.js';

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

const toHuman = (val) =>
  val ? String(val).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-';

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
    }}
  >
    <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {title}
    </Typography>
    <Typography variant={prominent ? 'h5' : 'h6'} sx={{ mt: 0.5, fontWeight: prominent ? 700 : 400, color: prominent ? '#1f3a61' : '#2f2f2f' }}>
      {value}
    </Typography>
    <Typography variant="caption" sx={{ color: '#8c8c8c', mt: 0.25, display: 'block' }}>
      {helperText || '—'}
    </Typography>
  </Paper>
);

const MetaSpendingCampaignDetail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUserStore();
  const campaignId = searchParams.get('campaign_id') || '';
  const startDate = searchParams.get('start_date') || undefined;
  const endDate = searchParams.get('end_date') || undefined;

  const { data, isLoading } = useQuery(
    ['metaCampaignDetail', campaignId, startDate, endDate],
    () => getMetaCampaignDetail(campaignId, { start_date: startDate, end_date: endDate }),
    { enabled: !!campaignId, refetchOnWindowFocus: false }
  );

  const secondaryMetrics = useMemo(() => [
    { label: 'Link Clicks', value: formatNumber(data?.total_link_clicks, 0) },
    { label: 'Video Views', value: formatNumber(data?.total_video_views, 0) },
    { label: 'Page Engagement', value: formatNumber(data?.total_page_engagement, 0) },
    { label: 'Landing Page Views', value: formatNumber(data?.total_landing_page_views, 0) },
    { label: 'Impressions', value: formatNumber(data?.total_impressions, 0) },
    { label: 'Reach', value: formatNumber(data?.total_reach, 0) },
    { label: 'Avg Frequency', value: formatNumber(data?.avg_frequency) },
    { label: 'Avg CTR', value: formatPercent(data?.avg_ctr) },
    { label: 'Avg Spend/Ad', value: formatNumber(data?.avg_spend_per_ad) },
    { label: 'Objective', value: toHuman(data?.objective) },
    { label: 'Buying Type', value: toHuman(data?.buying_type) },
    { label: 'Ads', value: formatNumber(data?.total_ads, 0) },
    { label: 'Adsets', value: formatNumber(data?.total_adsets, 0) },
    { label: 'Quality', value: data?.quality_ranking || '-' },
    { label: 'Latest Date', value: data?.latest_date || '-' },
    { label: 'ID', value: data?.id ?? '-' },
  ], [data]);

  const trends = data?.daily_trends_total;

  return (
    <>
      <BreadCrumb
        linkText={data?.campaign_name ? `Campaign — ${data.campaign_name}` : 'Campaign Details'}
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
                        {data?.campaign_name || campaignId}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                        Campaign ID: {data?.campaign_id || '-'}
                      </Typography>
                    </Box>
                    {data?.date && (
                      <Chip
                        label={data.date}
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
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {secondaryMetrics.map((m) => (
                    <Grid item xs={6} sm={4} md={3} key={m.label}>
                      <KpiCard title={m.label} value={m.value} />
                    </Grid>
                  ))}
                </Grid>

                {/* Daily Trends Total */}
                {trends && (
                  <Paper sx={{ p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none' }}>
                    <Typography variant="h6" sx={{ color: '#3E6A9F', fontWeight: 600, mb: 2 }}>
                      Daily Trends Total
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Spend', value: formatNumber(trends.spend) },
                        { label: 'Leads', value: formatNumber(trends.leads, 0) },
                        { label: 'Link Clicks', value: formatNumber(trends.link_clicks, 0) },
                        { label: 'Video Views', value: formatNumber(trends.video_views, 0) },
                        { label: 'Landing Page Views', value: formatNumber(trends.landing_page_views, 0) },
                        { label: 'Conversions', value: formatNumber(trends.conversions, 0) },
                        { label: 'Impressions', value: formatNumber(trends.impressions, 0) },
                        { label: 'Reach', value: formatNumber(trends.reach, 0) },
                      ].map((m) => (
                        <Grid item xs={6} sm={4} md={3} key={m.label}>
                          <KpiCard title={m.label} value={m.value} />
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}
              </>
            )}
          </Box>
        </div>
      </div>
    </>
  );
};

export default MetaSpendingCampaignDetail;
