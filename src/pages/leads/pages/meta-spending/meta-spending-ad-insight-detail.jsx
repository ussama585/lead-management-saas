import React, { useMemo } from 'react';
import {
  Box, Chip, Divider, Grid, IconButton, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Typography,
} from '@mui/material';
import { Copy as CopyOutlined, Eye as EyeOutlined, Globe as GlobalOutlined, Link as LinkOutlined, Minus as MinusOutlined, TrendingUp as RiseOutlined } from 'lucide-react';
import Chart from '../../../../components/charts/apex-chart.jsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { useQuery } from 'react-query';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { getMetaAdInsightDetail } from '../../../shared/services/metaLeads.js';

const formatNumber = (value, fractionDigits = 0) => {
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

const toTitle = (value = '') =>
  String(value).replace(/[_.]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());

const toHuman = (val) =>
  val ? String(val).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-';

const ACTION_GROUP_ORDER = ['Conversions', 'Engagement', 'Reach & Clicks', 'Other'];

const getActionCategory = (actionType = '') => {
  const key = String(actionType).toLowerCase();
  if (key === 'lead' || key.includes('offsite_complete_registration') || key.includes('offsite_search') || key.includes('offsite_content_view') || key.includes('lead_grouped')) return 'Conversions';
  if (key.includes('page_engagement') || key.includes('post_engagement') || key.includes('post_reaction') || key.includes('post_interaction') || key.includes('like')) return 'Engagement';
  if (key.includes('video_view') || key.includes('link_click') || key.includes('messaging_connection') || key.includes('messaging_first_reply') || key.includes('messaging_conversation')) return 'Reach & Clicks';
  return 'Other';
};

const getActionIcon = (actionType = '') => {
  const category = getActionCategory(actionType);
  const colorMap = { Conversions: '#3E6A9F', Engagement: '#8c8c8c', 'Reach & Clicks': '#13a8a8', Other: '#8c8c8c' };
  const key = String(actionType).toLowerCase();
  const color = colorMap[category] || '#8c8c8c';
  if (key.includes('lead') || key.includes('registration')) return <RiseOutlined size="1em" className="app-icon" style={{ color }} />;
  if (key.includes('click')) return <LinkOutlined size="1em" className="app-icon" style={{ color }} />;
  if (key.includes('view') || key.includes('video')) return <EyeOutlined size="1em" className="app-icon" style={{ color }} />;
  return <GlobalOutlined size="1em" className="app-icon" style={{ color }} />;
};

const RankingChip = ({ label, value }) => {
  const normalized = value && String(value).toUpperCase() !== 'UNKNOWN' ? String(value) : 'Unknown';
  const isUnknown = normalized === 'Unknown';
  return (
    <Chip
      size="small"
      label={isUnknown ? <Stack direction="row" spacing={0.75} alignItems="center"><MinusOutlined size="1em" className="app-icon" /><span>{label}: Unknown</span></Stack> : `${label}: ${normalized}`}
      sx={{ borderRadius: '6px', fontWeight: 500, backgroundColor: isUnknown ? '#faf7f0' : '#e6f4ff', color: isUnknown ? '#ad8b3a' : '#1677ff' }}
    />
  );
};

const KpiCard = ({ title, value, helperText, prominent = false }) => (
  <Paper sx={{ p: prominent ? 2.5 : 2, border: prominent ? '1px solid #3E6A9F55' : '1px solid #ddd', borderLeft: prominent ? '4px solid #3E6A9F' : '1px solid #ddd', borderRadius: '8px', boxShadow: 'none', backgroundColor: prominent ? '#f8fbff' : '#fff', height: '100%' }}>
    <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</Typography>
    <Typography variant={prominent ? 'h5' : 'body1'} sx={{ mt: 0.5, fontWeight: prominent ? 700 : 400, color: prominent ? '#1f3a61' : '#2f2f2f' }}>{value}</Typography>
    {helperText && <Typography variant="caption" sx={{ color: '#8c8c8c', mt: 0.25, display: 'block' }}>{helperText}</Typography>}
  </Paper>
);

const MetaSpendingAdInsightDetail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const adId = searchParams.get('ad_id') || '';

  const { data, isLoading } = useQuery(
    ['metaAdInsightDetail', adId],
    () => getMetaAdInsightDetail(adId),
    { enabled: !!adId, refetchOnWindowFocus: false }
  );

  const row = useMemo(() => (Array.isArray(data?.insights) ? data.insights[0] : null) || {}, [data]);
  const actions = useMemo(() => Array.isArray(row.actions) ? row.actions : [], [row]);
  const costPerAction = useMemo(() => Array.isArray(row.cost_per_action_type) ? row.cost_per_action_type : [], [row]);

  const actionsChartData = useMemo(() => {
    if (!actions.length) return [];
    const normalized = actions
      .map((item) => ({ key: item?.action_type || 'unknown', label: toTitle(item?.action_type || 'Unknown'), value: Number(item?.value) || 0 }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
    if (!normalized.length) return [];
    const total = normalized.reduce((s, i) => s + i.value, 0);
    const minThreshold = Math.max(1, total * 0.01);
    const topRows = normalized.slice(0, 12);
    const overflowRows = normalized.slice(12);
    const tinyRows = topRows.filter((i) => i.value < minThreshold);
    const visibleTopRows = topRows.filter((i) => i.value >= minThreshold);
    const otherValue = [...overflowRows, ...tinyRows].reduce((s, i) => s + i.value, 0);
    const merged = [...visibleTopRows];
    if (otherValue > 0) merged.push({ key: 'other', label: 'Other', value: otherValue });
    return merged;
  }, [actions]);

  const actionsChartSeries = useMemo(() => [{ name: 'Actions', data: actionsChartData.map((i) => i.value) }], [actionsChartData]);

  const actionsChartOptions = useMemo(() => {
    const length = actionsChartData.length;
    const minOpacity = 0.35;
    const maxOpacity = 0.92;
    const step = length > 1 ? (maxOpacity - minOpacity) / (length - 1) : 0;
    const colors = actionsChartData.map((_, idx) => `rgba(62, 106, 159, ${Math.max(minOpacity, maxOpacity - idx * step).toFixed(3)})`);
    return {
      chart: { type: 'bar', toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true, barHeight: '60%' } },
      dataLabels: { enabled: true, formatter: (val) => formatNumber(val, 0), style: { fontSize: '11px', colors: ['#1f3a61'] } },
      xaxis: { categories: actionsChartData.map((i) => i.label), labels: { style: { colors: '#8c8c8c', fontSize: '11px' } } },
      yaxis: { labels: { style: { colors: '#5f5f5f', fontSize: '11px' }, maxWidth: 320 } },
      grid: { borderColor: '#eee' },
      legend: { show: false },
      colors,
      tooltip: { y: { formatter: (val) => formatNumber(val, 0) } },
    };
  }, [actionsChartData]);

  const actionsChartHeight = useMemo(() => Math.max(400, actionsChartData.length * 30 + 70), [actionsChartData.length]);

  const groupedActions = useMemo(() => {
    if (!actions.length) return {};
    const rows = actions.map((item) => ({
      ...item,
      actionType: item?.action_type || 'unknown',
      numericValue: Number(item?.value) || 0,
      category: getActionCategory(item?.action_type || ''),
      isLead: (item?.action_type || '').toLowerCase() === 'lead',
    }));
    const byCategory = rows.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = [];
      acc[row.category].push(row);
      return acc;
    }, {});
    ACTION_GROUP_ORDER.forEach((cat) => { if (byCategory[cat]) byCategory[cat].sort((a, b) => b.numericValue - a.numericValue); });
    return byCategory;
  }, [actions]);

  const maxActionValue = useMemo(() => Math.max(...actions.map((i) => Number(i?.value) || 0), 0), [actions]);

  const highlightCostRow = (actionType) => {
    const n = String(actionType || '').toLowerCase();
    return n === 'lead' || n.includes('offsite_complete_registration');
  };

  const copyText = async (text) => {
    if (!text) return;
    try { await navigator.clipboard.writeText(String(text)); } catch (_) {}
  };

  const secondaryMetrics = [
    { label: 'Ad ID', value: data?.ad_id || '-' },
    { label: 'Optimization Goal', value: toHuman(data?.optimization_goal) },
    { label: 'Total Social Spend', value: formatNumber(data?.total_social_spend, 2) },
    { label: 'Total Impressions', value: formatNumber(data?.total_impressions, 0) },
    { label: 'Total Reach', value: formatNumber(data?.total_reach, 0) },
    { label: 'Avg CTR', value: formatPercent(data?.avg_ctr) },
    { label: 'Avg Frequency', value: formatNumber(data?.avg_frequency, 2) },
  ];

  const insightMetrics = [
    { label: 'Date', value: row.date || '-' },
    { label: 'Spend', value: formatNumber(row.spend, 2) },
    { label: 'Social Spend', value: formatNumber(row.social_spend, 2) },
    { label: 'Impressions', value: formatNumber(row.impressions, 0) },
    { label: 'Reach', value: formatNumber(row.reach, 0) },
    { label: 'CTR', value: formatPercent(row.ctr) },
    { label: 'Frequency', value: formatNumber(row.frequency, 2) },
  ];

  return (
    <>
      <BreadCrumb
        linkText={data?.ad_name ? `Ad Insight Detail — ${data.ad_name}` : 'Ad Insight Detail'}
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
                <Paper sx={{ p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={1.5}>
                    <Box>
                      <Typography variant="h5" sx={{ color: '#1f3a61', fontWeight: 700 }}>{data?.ad_name || adId}</Typography>
                      <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>Ad ID: {data?.ad_id || adId}</Typography>
                    </Box>
                    <Chip label={row.date || '-'} size="small" sx={{ backgroundColor: '#f5f5f5', color: '#595959', fontWeight: 500 }} />
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    <RankingChip label="Quality" value={row.quality_ranking} />
                    <RankingChip label="Engagement" value={row.engagement_rate_ranking} />
                    <RankingChip label="Conversion" value={row.conversion_rate_ranking} />
                  </Stack>
                </Paper>

                {/* Summary KPIs */}
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} md={6}>
                    <KpiCard title="Total Spend" value={formatNumber(data?.total_spend, 2)} helperText={`Social Spend: ${formatNumber(data?.total_social_spend, 2)}`} prominent />
                  </Grid>
                  {secondaryMetrics.map((m) => (
                    <Grid item xs={6} sm={4} md={3} key={m.label}>
                      <KpiCard title={m.label} value={m.value} />
                    </Grid>
                  ))}
                </Grid>

                {/* Insight row metrics */}
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  {insightMetrics.map((m) => (
                    <Grid item xs={6} sm={4} md={3} key={m.label}>
                      <KpiCard title={m.label} value={m.value} />
                    </Grid>
                  ))}
                </Grid>

                {/* Actions chart */}
                <Paper sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none' }}>
                  <Typography variant="h6" sx={{ color: '#3E6A9F', fontWeight: 600, mb: 1 }}>Actions Overview</Typography>
                  {!actionsChartData.length ? (
                    <Typography variant="body2">No chartable action values available.</Typography>
                  ) : (
                    <Chart options={actionsChartOptions} series={actionsChartSeries} type="bar" height={actionsChartHeight} />
                  )}
                </Paper>

                {/* Actions breakdown + Cost per action */}
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none', height: '100%' }}>
                      <Typography variant="h6" sx={{ color: '#3E6A9F', fontWeight: 600, mb: 1 }}>Actions Breakdown</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Magnitude</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">Value</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {!actions.length ? (
                              <TableRow><TableCell colSpan={3}>No actions available.</TableCell></TableRow>
                            ) : (
                              ACTION_GROUP_ORDER.flatMap((category) => {
                                const catRows = groupedActions[category] || [];
                                if (!catRows.length) return [];
                                return [
                                  <TableRow key={`group-${category}`}>
                                    <TableCell colSpan={3} sx={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.5, backgroundColor: '#fafafa', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', py: 0.75 }}>
                                      {category}
                                    </TableCell>
                                  </TableRow>,
                                  ...catRows.map((item, idx) => {
                                    const percent = maxActionValue > 0 ? (item.numericValue / maxActionValue) * 100 : 0;
                                    return (
                                      <TableRow key={`${item.actionType}-${idx}`} sx={{ backgroundColor: item.isLead ? '#e8f3ff' : 'transparent' }}>
                                        <TableCell sx={{ fontWeight: item.isLead ? 700 : 500 }}>
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            <span>{getActionIcon(item.actionType)}</span>
                                            <Tooltip title={item.actionType} placement="top" arrow>
                                              <span>{toTitle(item.actionType)}</span>
                                            </Tooltip>
                                          </Stack>
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 160 }}>
                                          <Box sx={{ width: '100%', height: 8, backgroundColor: '#f2f2f2', borderRadius: 99, overflow: 'hidden' }}>
                                            <Box sx={{ width: `${Math.max(2, percent)}%`, height: '100%', backgroundColor: 'rgba(62, 106, 159, 0.2)', borderRadius: 99 }} />
                                          </Box>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: item.isLead ? 700 : 600, fontSize: '0.95rem' }}>
                                          {formatNumber(item.numericValue, 0)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }),
                                ];
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none', height: '100%' }}>
                      <Typography variant="h6" sx={{ color: '#3E6A9F', fontWeight: 600, mb: 1 }}>Cost Per Action</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">Cost</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {!costPerAction.length ? (
                              <TableRow><TableCell colSpan={2}>No cost-per-action values available.</TableCell></TableRow>
                            ) : (
                              costPerAction.map((item, idx) => {
                                const highlighted = highlightCostRow(item?.action_type);
                                return (
                                  <TableRow key={`${item?.action_type}-${idx}`} sx={{ backgroundColor: highlighted ? '#e8f3ff' : 'transparent', '& td': { borderLeft: highlighted ? '2px solid #9bc6ff' : 'none' } }}>
                                    <TableCell sx={{ fontWeight: highlighted ? 700 : 500 }}>{toTitle(item?.action_type)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: highlighted ? 700 : 500 }}>{formatNumber(item?.value, 2)}</TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Meta info */}
                <Paper sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none' }}>
                  <Typography variant="subtitle1" sx={{ color: '#3E6A9F', fontWeight: 600, mb: 1 }}>Ad Meta Info</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Grid container spacing={1.25}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: '#8c8c8c' }}>Ad ID</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" sx={{ fontFamily: 'Inter, sans-serif' }}>{data?.ad_id || '-'}</Typography>
                        <Tooltip title="Copy Ad ID" arrow>
                          <IconButton size="small" onClick={() => copyText(data?.ad_id)}>
                            <CopyOutlined size="1em" className="app-icon" style={{ fontSize: 12 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: '#8c8c8c' }}>Optimization Goal</Typography>
                      <Typography variant="body2">{toHuman(data?.optimization_goal)}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </>
            )}
          </Box>
        </div>
      </div>
    </>
  );
};

export default MetaSpendingAdInsightDetail;
