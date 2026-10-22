import React, { useMemo } from 'react';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Copy as CopyOutlined, Eye as EyeOutlined, Globe as GlobalOutlined, Link as LinkOutlined, Minus as MinusOutlined, TrendingUp as RiseOutlined } from 'lucide-react';
import Chart from '../../../../components/charts/apex-chart.jsx';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import { getMetaAdsInsightsDetail } from '../../../shared/services/metaLeads.js';

const formatValue = (value) => {
  if (value == null || value === '') return '-';  
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return `PKR ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatNumber = (value, fractionDigits = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const toTitle = (value = '') =>
  String(value)
    .replace(/[_\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toHumanLabel = (value = '') => {
  if (!value) return '-';
  return String(value)
    .toLowerCase()
    .replace(/[_\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const ACTION_GROUP_ORDER = ['Conversions', 'Engagement', 'Reach & Clicks', 'Other'];

const getActionCategory = (actionType = '') => {
  const key = String(actionType).toLowerCase();

  if (
    key === 'lead' ||
    key.includes('offsite_complete_registration') ||
    key.includes('offsite_search') ||
    key.includes('offsite_content_view') ||
    key.includes('lead_grouped')
  ) {
    return 'Conversions';
  }

  if (
    key.includes('page_engagement') ||
    key.includes('post_engagement') ||
    key.includes('post_reaction') ||
    key.includes('post_interaction') ||
    key.includes('post_save') ||
    key.includes('post_net_save') ||
    key.includes('post_net_like')
  ) {
    return 'Engagement';
  }

  if (
    key.includes('video_view') ||
    key.includes('link_click') ||
    key.includes('messaging_connection') ||
    key.includes('messaging_first_reply') ||
    key.includes('messaging_conversation')
  ) {
    return 'Reach & Clicks';
  }

  return 'Other';
};

const getActionIcon = (actionType = '') => {
  const category = getActionCategory(actionType);
  const colorMap = {
    Conversions: '#3E6A9F',
    Engagement: '#8c8c8c',
    'Reach & Clicks': '#13a8a8',
    Other: '#8c8c8c',
  };

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
      label={
        isUnknown ? (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <MinusOutlined size="1em" className="app-icon" />
            <span>{label}: Unknown</span>
          </Stack>
        ) : (
          `${label}: ${normalized}`
        )
      }
      sx={{
        borderRadius: '6px',
        fontWeight: 500,
        backgroundColor: isUnknown ? '#faf7f0' : '#e6f4ff',
        color: isUnknown ? '#ad8b3a' : '#1677ff',
      }}
    />
  );
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
    }}
  >
    <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {title}
    </Typography>
    <Typography
      variant={prominent ? 'h5' : 'h6'}
      sx={{ mt: 0.5, fontWeight: 700, color: prominent ? '#1f3a61' : '#2f2f2f' }}
    >
      {value}
    </Typography>
    <Typography variant="caption" sx={{ color: '#8c8c8c', mt: 0.25, display: 'block' }}>
      {helperText || '—'}
    </Typography>
  </Paper>
);

const MetaSpendingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useUserStore();

  const routePrefix = user?.user_type === 'admin' ? '/admin' : '/marketing_manager';

  const { data, isLoading, isError, error } = useQuery(
    ['metaSpendingDetail', id, searchParams.toString()],
    () =>
      getMetaAdsInsightsDetail(id, {
        start_date: searchParams.get('start_date') || undefined,
        end_date: searchParams.get('end_date') || undefined,
      }),
    {
      enabled: Boolean(id),
      refetchOnWindowFocus: false,
    }
  );

  const actions = useMemo(() => (Array.isArray(data?.actions) ? data.actions : []), [data?.actions]);
  const costPerAction = useMemo(
    () => (Array.isArray(data?.cost_per_action_type) ? data.cost_per_action_type : []),
    [data?.cost_per_action_type]
  );

  const secondaryMetrics = useMemo(
    () => [
      { label: 'Video Views', value: formatNumber(data?.video_views, 0) },
      { label: 'Landing Page Views', value: formatNumber(data?.landing_page_views, 0) },
      { label: 'Social Spend', value: formatCurrency(data?.social_spend) },
      { label: 'Buying Type', value: toHumanLabel(data?.buying_type) },
      { label: 'Optimization Goal', value: toHumanLabel(data?.optimization_goal) },
    ],
    [data]
  );

  const actionsChartData = useMemo(() => {
    if (!actions.length) return [];

    const normalized = actions
      .map((item) => ({
        key: item?.action_type || 'unknown_action',
        label: toTitle(item?.action_type || 'Unknown Action'),
        value: Number(item?.value) || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    if (!normalized.length) return [];

    const total = normalized.reduce((sum, item) => sum + item.value, 0);
    const minThreshold = Math.max(1, total * 0.01);
    const topRows = normalized.slice(0, 12);
    const overflowRows = normalized.slice(12);

    const tinyRows = topRows.filter((item) => item.value < minThreshold);
    const visibleTopRows = topRows.filter((item) => item.value >= minThreshold);
    const otherRows = [...overflowRows, ...tinyRows];
    const otherValue = otherRows.reduce((sum, item) => sum + item.value, 0);

    const merged = [...visibleTopRows];
    if (otherValue > 0) {
      merged.push({
        key: 'other',
        label: 'Other',
        value: otherValue,
      });
    }
    return merged;
  }, [actions]);

  const actionsChartSeries = useMemo(
    () => [
      {
        name: 'Actions',
        data: actionsChartData.map((item) => item.value),
      },
    ],
    [actionsChartData]
  );

  const actionsChartOptions = useMemo(() => {
    const length = actionsChartData.length;
    const minOpacity = 0.35;
    const maxOpacity = 0.92;
    const step = length > 1 ? (maxOpacity - minOpacity) / (length - 1) : 0;
    const colors = actionsChartData.map((_, index) => {
      const opacity = Math.max(minOpacity, maxOpacity - index * step);
      return `rgba(62, 106, 159, ${opacity.toFixed(3)})`;
    });

    return {
      chart: {
        type: 'bar',
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          distributed: true,
          barHeight: '60%',
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => formatNumber(val, 0),
        style: {
          fontSize: '11px',
          colors: ['#1f3a61'],
        },
      },
      xaxis: {
        categories: actionsChartData.map((item) => item.label),
        labels: {
          style: { colors: '#8c8c8c', fontSize: '11px' },
        },
      },
      yaxis: {
        labels: {
          style: { colors: '#5f5f5f', fontSize: '11px' },
          maxWidth: 320,
        },
      },
      grid: {
        borderColor: '#eee',
      },
      legend: { show: false },
      colors,
      tooltip: {
        y: {
          formatter: (val) => formatNumber(val, 0),
        },
      },
    };
  }, [actionsChartData]);

  const actionsChartHeight = useMemo(
    () => Math.max(400, actionsChartData.length * 30 + 70),
    [actionsChartData.length]
  );

  const highlightCostRow = (actionType) => {
    const normalized = String(actionType || '').toLowerCase();
    return normalized === 'lead' || normalized.includes('offsite_complete_registration');
  };

  const copyText = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
    } catch (_error) {
      // Keep silent to preserve current UX style.
    }
  };

  const groupedActions = useMemo(() => {
    if (!actions.length) return [];
    const rows = actions.map((item) => {
      const value = Number(item?.value) || 0;
      const actionType = item?.action_type || 'unknown_action';
      return {
        ...item,
        actionType,
        numericValue: value,
        category: getActionCategory(actionType),
        isLead: actionType.toLowerCase() === 'lead',
      };
    });

    const byCategory = rows.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = [];
      acc[row.category].push(row);
      return acc;
    }, {});

    ACTION_GROUP_ORDER.forEach((category) => {
      if (byCategory[category]) {
        byCategory[category].sort((a, b) => b.numericValue - a.numericValue);
      }
    });

    return byCategory;
  }, [actions]);

  const maxActionValue = useMemo(() => {
    if (!actions.length) return 0;
    return Math.max(...actions.map((item) => Number(item?.value) || 0), 0);
  }, [actions]);

  return (
    <>
      <BreadCrumb linkText="Meta Spending Detail" goBack={() => navigate(`${routePrefix}/meta-spending`)} />
      <div className="leads">
        <div className="container">
          <Box sx={{ minHeight: 'calc(100vh - 120px)' }}>
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load spending details: {error?.message || 'Unknown error'}
              </Alert>
            )}

            {isLoading ? (
              <Paper sx={{ p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none' }}>
                <Typography>Loading...</Typography>
              </Paper>
            ) : (
              <>
                <Paper sx={{ p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none' }}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    justifyContent="space-between"
                    spacing={1.5}
                  >
                    <Box>
                      <Typography variant="h5" sx={{ color: '#1f3a61', fontWeight: 700 }}>
                        {data?.ad_name || `Ad #${id}`}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                        {data?.campaign_name || '-'} / {data?.adset_name || '-'}
                      </Typography>
                    </Box>
                    <Chip
                      label={formatDate(data?.date)}
                      size="small"
                      sx={{ backgroundColor: '#f5f5f5', color: '#595959', fontWeight: 500 }}
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    <RankingChip label="Quality" value={data?.quality_ranking} />
                    <RankingChip label="Engagement" value={data?.engagement_rate_ranking} />
                    <RankingChip label="Conversion" value={data?.conversion_rate_ranking} />
                  </Stack>
                </Paper>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} md={6}>
                    <KpiCard
                      title="Total Spend"
                      value={formatCurrency(data?.spend)}
                      helperText={`Spent on ${formatDate(data?.date)}`}
                      prominent
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={2}>
                    <KpiCard
                      title="Leads"
                      value={formatNumber(data?.leads, 0)}
                      helperText={`${formatNumber(data?.leads, 0)} leads generated`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={2}>
                    <KpiCard
                      title="Cost Per Lead"
                      value={formatCurrency(data?.cost_per_lead)}
                      helperText={`${formatCurrency(data?.cost_per_lead)} per lead`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={2}>
                    <KpiCard
                      title="Link Clicks"
                      value={formatNumber(data?.link_clicks, 0)}
                      helperText={`${formatNumber(data?.link_clicks, 0)} clicks received`}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  {secondaryMetrics.map((metric) => (
                    <Grid item xs={12} sm={6} md={2.4} key={metric.label}>
                      <KpiCard title={metric.label} value={metric.value} />
                    </Grid>
                  ))}
                </Grid>

                <Paper sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none' }}>
                  <Typography variant="h6" sx={{ color: '#3E6A9F', fontWeight: 600, mb: 1 }}>
                    Actions Overview
                  </Typography>
                  {!actionsChartData.length ? (
                    <Typography variant="body2">No chartable action values available.</Typography>
                  ) : (
                    <Chart options={actionsChartOptions} series={actionsChartSeries} type="bar" height={actionsChartHeight} />
                  )}
                </Paper>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none', height: '100%' }}>
                      <Typography variant="h6" sx={{ color: '#3E6A9F', fontWeight: 600, mb: 1 }}>
                        Actions Breakdown
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Magnitude</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">
                                Value
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {!actions.length ? (
                              <TableRow>
                                <TableCell colSpan={3}>No actions available.</TableCell>
                              </TableRow>
                            ) : (
                              ACTION_GROUP_ORDER.flatMap((category) => {
                                const rows = groupedActions[category] || [];
                                if (!rows.length) return [];

                                const sectionRows = [
                                  <TableRow key={`group-${category}`}>
                                    <TableCell
                                      colSpan={3}
                                      sx={{
                                        fontSize: '11px',
                                        color: '#8c8c8c',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        backgroundColor: '#fafafa',
                                        borderTop: '1px solid #eee',
                                        borderBottom: '1px solid #eee',
                                        py: 0.75,
                                      }}
                                    >
                                      {category}
                                    </TableCell>
                                  </TableRow>,
                                ];

                                rows.forEach((item, index) => {
                                  const percent = maxActionValue > 0 ? (item.numericValue / maxActionValue) * 100 : 0;
                                  sectionRows.push(
                                    <TableRow
                                      key={`${item.actionType}-${index}`}
                                      sx={{ backgroundColor: item.isLead ? '#e8f3ff' : 'transparent' }}
                                    >
                                      <TableCell sx={{ fontWeight: item.isLead ? 700 : 500 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          <span>{getActionIcon(item.actionType)}</span>
                                          <Tooltip title={item.actionType} placement="top" arrow>
                                            <span>{toTitle(item.actionType)}</span>
                                          </Tooltip>
                                        </Stack>
                                      </TableCell>
                                      <TableCell sx={{ minWidth: 220 }}>
                                        <Box
                                          sx={{
                                            width: '100%',
                                            height: 8,
                                            backgroundColor: '#f2f2f2',
                                            borderRadius: 99,
                                            overflow: 'hidden',
                                          }}
                                        >
                                          <Box
                                            sx={{
                                              width: `${Math.max(2, percent)}%`,
                                              height: '100%',
                                              backgroundColor: 'rgba(62, 106, 159, 0.2)',
                                              borderRadius: 99,
                                            }}
                                          />
                                        </Box>
                                      </TableCell>
                                      <TableCell
                                        align="right"
                                        sx={{ fontWeight: item.isLead ? 700 : 600, fontSize: '0.95rem' }}
                                      >
                                        {formatNumber(item.numericValue, 0)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                });

                                return sectionRows;
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none', height: '100%' }}>
                      <Typography variant="h6" sx={{ color: '#3E6A9F', fontWeight: 600, mb: 1 }}>
                        Cost Per Action
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">
                                Cost
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {!costPerAction.length ? (
                              <TableRow>
                                <TableCell colSpan={2}>No cost-per-action values available.</TableCell>
                              </TableRow>
                            ) : (
                              costPerAction.map((item, index) => {
                                const highlighted = highlightCostRow(item?.action_type);
                                return (
                                  <TableRow
                                    key={`${item?.action_type || 'cost-action'}-${index}`}
                                    sx={{
                                      backgroundColor: highlighted ? '#e8f3ff' : 'transparent',
                                      '& td': { borderLeft: highlighted ? '2px solid #9bc6ff' : 'none' },
                                    }}
                                  >
                                    <TableCell sx={{ fontWeight: highlighted ? 700 : 500 }}>
                                      {toTitle(item?.action_type)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: highlighted ? 700 : 500 }}>
                                      {formatCurrency(item?.value)}
                                    </TableCell>
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

                <Paper sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: '8px', boxShadow: 'none' }}>
                  <Typography variant="subtitle1" sx={{ color: '#3E6A9F', fontWeight: 600, mb: 1 }}>
                    Campaign Meta Info
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Grid container spacing={1.25}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: '#8c8c8c' }}>
                        Campaign ID
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" sx={{ fontFamily: 'Inter, sans-serif' }}>
                          {formatValue(data?.campaign_id)}
                        </Typography>
                        <Tooltip title="Copy Campaign ID" arrow>
                          <IconButton size="small" onClick={() => copyText(data?.campaign_id)}>
                            <CopyOutlined size="1em" className="app-icon" style={{ fontSize: 12 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: '#8c8c8c' }}>
                        Adset ID
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" sx={{ fontFamily: 'Inter, sans-serif' }}>
                          {formatValue(data?.adset_id)}
                        </Typography>
                        <Tooltip title="Copy Adset ID" arrow>
                          <IconButton size="small" onClick={() => copyText(data?.adset_id)}>
                            <CopyOutlined size="1em" className="app-icon" style={{ fontSize: 12 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: '#8c8c8c' }}>
                        Ad ID
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" sx={{ fontFamily: 'Inter, sans-serif' }}>
                          {formatValue(data?.ad_id)}
                        </Typography>
                        <Tooltip title="Copy Ad ID" arrow>
                          <IconButton size="small" onClick={() => copyText(data?.ad_id)}>
                            <CopyOutlined size="1em" className="app-icon" style={{ fontSize: 12 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: '#8c8c8c' }}>
                        Objective
                      </Typography>
                      <Typography variant="body2">{formatValue(data?.objective)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: '#8c8c8c' }}>
                        Synced At
                      </Typography>
                      <Typography variant="body2">{formatValue(data?.synced_at)}</Typography>
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

export default MetaSpendingDetail;
