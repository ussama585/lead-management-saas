import React, { useMemo, useState } from 'react';
import Chart from './apex-chart.jsx';
import { Box, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import '../../assets/styles/legacy/donut-chart.component.css';
import { getLeadGenerationPotentialStats } from '../../pages/shared/services/leads.js';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';

const emptyChartData = () => ({
  categories: [],
  series: [
    { name: 'Total Leads', data: [] },
    { name: 'Potential Client', data: [] },
  ],
});

const WebsiteTotalVsPotentialChart = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [showDateModal, setShowDateModal] = useState(false);
  const params = useMemo(() => {
    if (!dateRange?.[0] || !dateRange?.[1]) return null;
    return {
      start_date: dateRange[0].startOf('day').format('YYYY-MM-DD'),
      end_date: dateRange[1].endOf('day').format('YYYY-MM-DD'),
    };
  }, [dateRange]);

  const { data, isLoading, isError } = useQuery(
    ['website-total-vs-potential', params],
    async () => {
      if (!params) return emptyChartData();
      try {
        const result = await getLeadGenerationPotentialStats(params);
        const categories = result?.categories ?? [];
        const series = result?.series ?? [];
        if (categories.length === 0 || series.length === 0) return emptyChartData();
        return { categories, series };
      } catch {
        return emptyChartData();
      }
    },
    { enabled: !!params, staleTime: 2 * 60 * 1000, cacheTime: 5 * 60 * 1000, refetchOnWindowFocus: false, retry: 1 }
  );

  const categories = data?.categories ?? [];
  const series = data?.series ?? [{ name: 'Total Leads', data: [] }, { name: 'Potential Client', data: [] }];
  const options = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 6 } },
    dataLabels: { enabled: false },
    xaxis: { categories, labels: { style: { colors: '#B0B0B0', fontSize: '11px' }, rotate: -45 } },
    yaxis: { title: { text: 'Count' }, labels: { style: { colors: '#B0B0B0' } } },
    legend: { position: 'top' },
    colors: ['#3E6A9F', '#52c41a'],
    tooltip: {
      intersect: false,
      y: { formatter: (val) => (typeof val === 'number' ? val.toFixed(0) : val) },
    },
  };

  return (
    <div className="donut-chart-card">
      <div className="donut-chart-header">
        <h2 className="donut-chart-title">Total Leads vs Potential Client</h2>
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
      {!params ? (
        <div style={{ padding: 16 }}>Select a date range.</div>
      ) : isLoading ? (
        <Box sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={44} sx={{ color: '#3E6A9F' }} />
        </Box>
      ) : isError ? (
        <div style={{ padding: 16 }}>Failed to load.</div>
      ) : categories.length === 0 ? (
        <div style={{ padding: 16 }}>No data.</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={380} />
      )}
    </div>
  );
};

export default WebsiteTotalVsPotentialChart;
