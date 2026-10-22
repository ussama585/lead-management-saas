import React, { useMemo, useState } from 'react';
import Chart from './apex-chart.jsx';
import { Box, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import '../../assets/styles/legacy/donut-chart.component.css';
import { getMetaLeadsDuplicateUniqueChart, getMetaLeadsListCount } from '../../pages/shared/services/metaLeads.js';
import { getLeadGenerationDuplicateStats, getLeadGenerationListCount } from '../../pages/shared/services/leads.js';
import { getDataLeadsDuplicateStats } from '../../pages/shared/services/data-leads-service.js';
import { getDateBuckets } from './chart-utils.js';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';

const countFrom = (r) => r?.total_count ?? r?.count ?? 0;

const fetchWebsiteDataFallback = async (from, to, groupBy) => {
  const buckets = getDateBuckets(from, to, groupBy);
  if (buckets.length === 0) return { categories: [], series: [] };
  const fetches = buckets.flatMap((b) => [
    getLeadGenerationListCount({ start_date: b.start, end_date: b.end, is_duplicate: true }).then((r) => ({ bucket: b, type: 'duplicate', count: countFrom(r) })),
    getLeadGenerationListCount({ start_date: b.start, end_date: b.end, is_duplicate: false }).then((r) => ({ bucket: b, type: 'unique', count: countFrom(r) })),
  ]);
  const results = await Promise.all(fetches);
  const byBucket = new Map();
  results.forEach(({ bucket, type, count }) => {
    if (!byBucket.has(bucket.label)) byBucket.set(bucket.label, { duplicate: 0, unique: 0 });
    byBucket.get(bucket.label)[type] = count;
  });
  const categories = buckets.map((b) => b.label);
  return { categories, series: [{ name: 'Duplicate', data: categories.map((c) => byBucket.get(c)?.duplicate ?? 0) }, { name: 'Unique', data: categories.map((c) => byBucket.get(c)?.unique ?? 0) }] };
};

const fetchMetaFallback = async (from, to, groupBy) => {
  const buckets = getDateBuckets(from, to, groupBy);
  if (buckets.length === 0) return { categories: [], series: [] };
  const fetches = buckets.flatMap((b) => [
    getMetaLeadsListCount(1, b.start, b.end, null, null, null, null, null, null, null, null, null, true, null).then((r) => ({ bucket: b, type: 'duplicate', count: countFrom(r) })),
    getMetaLeadsListCount(1, b.start, b.end, null, null, null, null, null, null, null, null, null, false, null).then((r) => ({ bucket: b, type: 'unique', count: countFrom(r) })),
  ]);
  const results = await Promise.all(fetches);
  const byBucket = new Map();
  results.forEach(({ bucket, type, count }) => {
    if (!byBucket.has(bucket.label)) byBucket.set(bucket.label, { duplicate: 0, unique: 0 });
    byBucket.get(bucket.label)[type] = count;
  });
  const categories = buckets.map((b) => b.label);
  return { categories, series: [{ name: 'Duplicate', data: categories.map((c) => byBucket.get(c)?.duplicate ?? 0) }, { name: 'Unique', data: categories.map((c) => byBucket.get(c)?.unique ?? 0) }] };
};

const getDefaultDateRange = () => [dayjs().startOf('month'), dayjs().endOf('month')];

const DuplicateUniqueLeadsChart = ({ leadType = 'meta' }) => {
  const [dateRange, setDateRange] = useState(() => getDefaultDateRange());
  const [showDateModal, setShowDateModal] = useState(false);
  /** Bumps when user clears the picker so we refetch even if params match the default month (same query key + staleTime). */
  const [rangeResetKey, setRangeResetKey] = useState(0);

  const params = useMemo(() => {
    const base = { group_by: 'month' };
    if (dateRange?.[0] && dateRange?.[1]) {
      return {
        ...base,
        start_date: dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
        end_date: dateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
      };
    }
    return base;
  }, [dateRange]);

  const { data, isLoading, isError } = useQuery(
    [`duplicate-unique-${leadType}`, params, rangeResetKey],
    async () => {
      const fallbackRange = () =>
        dateRange?.[0] && dateRange?.[1] ? dateRange : getDefaultDateRange();
      const fallbackFromTo = () => {
        const r = fallbackRange();
        return [
          r[0].startOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
          r[1].endOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
        ];
      };

      if (leadType === 'meta') {
        try {
          return await getMetaLeadsDuplicateUniqueChart(params);
        } catch {
          const [from, to] = fallbackFromTo();
          return fetchMetaFallback(from, to, 'month');
        }
      }
      if (leadType === 'website') {
        try {
          return await getLeadGenerationDuplicateStats(params);
        } catch {
          const [from, to] = fallbackFromTo();
          return fetchWebsiteDataFallback(from, to, 'month');
        }
      }
      if (leadType === 'data') {
        try {
          const stats = await getDataLeadsDuplicateStats(params);
          if (stats && Array.isArray(stats.categories) && Array.isArray(stats.series)) {
            return stats;
          }
          return { categories: [], series: [{ name: 'Duplicate', data: [] }, { name: 'Unique', data: [] }] };
        } catch {
          return { categories: [], series: [{ name: 'Duplicate', data: [] }, { name: 'Unique', data: [] }] };
        }
      }
      return { categories: [], series: [] };
    },
    { staleTime: 2 * 60 * 1000, cacheTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const categories = data?.categories ?? [];
  const series = data?.series ?? [
    { name: 'Duplicate', data: [] },
    { name: 'Unique', data: [] },
  ];

  const barTotals = categories.map((_, i) =>
    series.reduce((sum, s) => sum + (Number(s.data?.[i]) || 0), 0)
  );

  const options = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 6,
        dataLabels: {
          position: 'top',
          hideOverflowingLabels: false,
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => {
        const dataPointIndex = opts?.dataPointIndex ?? 0;
        const seriesIndex = opts?.seriesIndex ?? 0;
        const totalSeries = opts?.w?.globals?.series?.length ?? 1;
        if (seriesIndex === totalSeries - 1) {
          const total = barTotals[dataPointIndex];
          return total != null ? total : '';
        }
        return '';
      },
      offsetY: -20,
      style: { fontSize: '12px', fontWeight: 600, colors: ['#333'] },
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: '#B0B0B0',
          fontSize: '11px',
        },
        rotate: -45,
        hideOverlappingLabels: false,
      },
    },
    yaxis: {
      title: {
        text: 'Count',
        style: { color: '#888', fontSize: '12px' },
      },
      labels: {
        style: {
          colors: '#B0B0B0',
          fontSize: '12px',
        },
      },
    },
    legend: {
      position: 'top',
      labels: {
        colors: '#555',
      },
    },
    grid: {
      borderColor: '#e0e0e0',
    },
    colors: ['#ff4d4f', '#52c41a'],
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      followCursor: false,
      y: {
        formatter: (val) => (typeof val === 'number' ? val.toFixed(0) : val),
      },
    },
  };

  return (
    <div className="donut-chart-card duplicate-unique-chart">
      <div className="donut-chart-header">
        <h2 className="donut-chart-title">Duplicate vs Unique Leads</h2>
        <div className="donut-chart-filters" style={{ alignItems: 'center' }}>
          <BootstrapDateRangeModal
            value={dateRange}
            showModal={showDateModal}
            setShowModal={setShowDateModal}
            onDone={(range) => {
              const hasRange = range && range[0] && range[1];
              // Clear: `null` so the trigger shows "Select Date Range"; API still uses default month via `params`.
              if (!hasRange) {
                setDateRange(null);
                setRangeResetKey((k) => k + 1);
              } else {
                setDateRange(range);
              }
              setShowDateModal(false);
            }}
            triggerStyle={{ border: '1px solid #d9d9d9' }}
          />
        </div>
      </div>

      {isLoading ? (
        <Box sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={44} sx={{ color: '#3E6A9F' }} />
        </Box>
      ) : isError ? (
        <div style={{ padding: 16 }}>Failed to load chart data.</div>
      ) : categories.length === 0 ? (
        <div style={{ padding: 16 }}>No data for the selected date range.</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={380} />
      )}
    </div>
  );
};

export default DuplicateUniqueLeadsChart;
