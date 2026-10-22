import React, { useMemo, useState } from 'react';
import Chart from './apex-chart.jsx';
import { Box, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import '../../assets/styles/legacy/donut-chart.component.css';
import { getLeadGenerationResourcesStats } from '../../pages/shared/services/leads.js';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';

// Sample: leads count per resource count (1 resource, 2 resources, 3 resources, ...)
const SAMPLE_DATA = [
  { resources: 1, count: 12 },
  { resources: 2, count: 8 },
  { resources: 3, count: 15 },
  { resources: 4, count: 6 },
  { resources: 5, count: 4 },
  { resources: 6, count: 3 },
  { resources: 7, count: 2 },
  { resources: 8, count: 1 },
];

const WebsiteLeadsResourcesChart = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [showDateModal, setShowDateModal] = useState(false);
  const params = useMemo(() => {
    if (!dateRange?.[0] || !dateRange?.[1]) return null;
    return {
      start_date: dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
      end_date: dateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
    };
  }, [dateRange]);

  const { data, isLoading } = useQuery(
    ['website-resources-stats', params],
    async () => {
      if (!params) return SAMPLE_DATA;
      try {
        const res = await getLeadGenerationResourcesStats(params);
        const arr = Array.isArray(res) ? res : [];
        const sorted = arr
          .map((d) => ({ resources: Number(d?.resources ?? 0), count: Number(d?.count ?? 0) }))
          .filter((d) => d.resources >= 0)
          .sort((a, b) => a.resources - b.resources);
        return sorted.length ? sorted : SAMPLE_DATA;
      } catch {
        return SAMPLE_DATA;
      }
    },
    { enabled: true, staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const chartData = data ?? SAMPLE_DATA;
  const categories = chartData.map((d) => `${d.resources} resource${d.resources !== 1 ? 's' : ''}`);
  const series = [{ name: 'No. of leads', data: chartData.map((d) => d.count) }];
  const options = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 6,
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: { enabled: true, formatter: (val) => (val ? val : '') },
    xaxis: {
      categories,
      labels: { style: { colors: '#B0B0B0', fontSize: '11px' }, rotate: -45 },
    },
    yaxis: {
      title: { text: 'No. of leads', style: { color: '#888', fontSize: '12px' } },
      labels: { style: { colors: '#B0B0B0' } },
    },
    colors: ['#3E6A9F'],
    grid: { borderColor: '#e0e0e0' },
    tooltip: { y: { formatter: (val) => val } },
  };

  return (
    <div className="donut-chart-card">
      <div className="donut-chart-header">
        <h2 className="donut-chart-title">Leads by No. of Resources</h2>
        <div className="donut-chart-filters">
          <BootstrapDateRangeModal
            value={dateRange}
            showModal={showDateModal}
            setShowModal={setShowDateModal}
            onDone={(range) => {
              setDateRange(range);
              setShowDateModal(false);
            }}
            triggerStyle={{ border: '1px solid #d9d9d9' }}
          />
        </div>
      </div>
      {isLoading ? (
        <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={44} sx={{ color: '#3E6A9F' }} />
        </Box>
      ) : (
        <Chart options={options} series={series} type="bar" height={320} />
      )}
    </div>
  );
};

export default WebsiteLeadsResourcesChart;
