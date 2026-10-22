import React, { useState, useMemo } from 'react';
import Chart from './apex-chart.jsx';
import { Box, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import '../../assets/styles/legacy/donut-chart.component.css';
import { getAssignedUsers } from '../../pages/shared/services/leads.js';
import { getLeadGenerationListCount } from '../../pages/shared/services/leads.js';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';

const ExecutiveConversionChart = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [showDateModal, setShowDateModal] = useState(false);

  const { data: executives, isLoading: loadingUsers } = useQuery(
    ['lead-generation-assigned-users'],
    () => getAssignedUsers(),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const list = executives?.users ?? (Array.isArray(executives) ? executives : executives?.results ?? executives?.data ?? []);
  const userIds = list.map((u) => u.id ?? u.user_id).filter(Boolean);

  const { data: conversionData, isLoading: loadingCounts } = useQuery(
    ['executive-conversion-potential', userIds, dateRange],
    async () => {
      if (userIds.length === 0) return [];
      const queryParams = { status: 'Potential Client' };
      if (dateRange?.[0] && dateRange?.[1]) {
        queryParams.start_date = dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
        queryParams.end_date = dateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
      }

      const counts = await Promise.all(
        userIds.map((id) =>
          getLeadGenerationListCount({ ...queryParams, assigned_to: id }).then((r) => ({
            id,
            count: r?.total_count ?? r?.count ?? 0,
          }))
        )
      );
      return list.map((u) => ({
        name: u.name ?? u.full_name ?? u.email ?? `User ${u.id ?? u.user_id}`,
        count: counts.find((c) => String(c.id) === String(u.id ?? u.user_id))?.count ?? 0,
      })).filter((d) => d.name);
    },
    { enabled: userIds.length > 0, staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const categories = (conversionData ?? []).map((d) => d.name);
  const series = [{ name: 'Potential Clients', data: (conversionData ?? []).map((d) => d.count) }];
  const options = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, borderRadius: 4, dataLabels: { position: 'top' }, columnWidth: '60%' } },
    dataLabels: { enabled: true, formatter: (val) => (Number(val) ? val : '') },
    xaxis: { categories, labels: { style: { colors: '#B0B0B0' } } },
    yaxis: { labels: { style: { colors: '#B0B0B0', fontSize: '12px' } } },
    colors: ['#3E6A9F'],
    tooltip: { y: { formatter: (val) => val } },
  };

  const isLoading = loadingUsers || loadingCounts;
  return (
    <div className="donut-chart-card">
      <div className="donut-chart-header">
        <h2 className="donut-chart-title">Executive Conversion (Potential Client)</h2>
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
        <Box sx={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={44} sx={{ color: '#3E6A9F' }} />
        </Box>
      ) : categories.length === 0 ? (
        <div style={{ padding: 16 }}>No executive data.</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={Math.max(360, categories.length * 36)} />
      )}
    </div>
  );
};

export default ExecutiveConversionChart;
