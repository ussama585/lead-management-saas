import { Select } from '../ui/app-select.jsx';
import React, { useState, useMemo } from 'react';
import Chart from './apex-chart.jsx';

import { Box, CircularProgress } from '@mui/material';
import dayjs from 'dayjs';
import '../../assets/styles/legacy/donut-chart.component.css';
import {
  STATUS_OPTIONS,
  PROJECT_SIZE_OPTIONS,
  toStatusKey,
} from '../../pages/leads/pages/website-leads/website-leads-constants.js';
import { useQuery } from 'react-query';
import { getMetaLeadsPercentage } from '../../pages/shared/services/metaLeads.js';
import { getLeadGenerationListCount } from '../../pages/shared/services/leads.js';
import { getDataLeadsListCount } from '../../pages/shared/services/data-leads-service.js';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';

const { Option } = Select;

const DonutChartWithFilters = ({ leadType = 'meta' }) => {
  const [mode, setMode] = useState('Status');
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [showDateModal, setShowDateModal] = useState(false);

  const queryParams = useMemo(() => {
    const params = {};
    if (mode === 'Status') params.status = 'status';
    else params.project_size = 'project-size';
    if (dateRange?.[0] && dateRange?.[1]) {
      params.start_date = dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
      params.end_date = dateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
    }
    return params;
  }, [mode, dateRange]);

  const fetchData = useMemo(() => {
    if (leadType === 'meta') return () => getMetaLeadsPercentage(queryParams);
    if (leadType === 'website') return () => getLeadGenerationListCount({ start_date: queryParams.start_date, end_date: queryParams.end_date });
    if (leadType === 'data') return () => getDataLeadsListCount({ start_date: queryParams.start_date, end_date: queryParams.end_date });
    return () => Promise.resolve(null);
  }, [leadType, queryParams]);

  const { data: percentageData, isLoading, isError } = useQuery(
    [`donut-${leadType}`, mode, queryParams],
    fetchData,
    { staleTime: 0, cacheTime: 5 * 60 * 1000, refetchOnWindowFocus: false, enabled: leadType === 'meta' ? true : !!(queryParams.start_date && queryParams.end_date) }
  );

  const { labels, values } = useMemo(() => {
    if (leadType === 'website' || leadType === 'data') {
      const res = percentageData || {};
      const labels = STATUS_OPTIONS;
      const values = STATUS_OPTIONS.map((s) => Number(res[toStatusKey(s)] ?? res[s] ?? 0));
      return { labels, values };
    }
    const raw = Array.isArray(percentageData) ? percentageData : [];
    const mapped = raw.map((item) => ({ label: item?.label ?? 'Not Set', count: Number(item?.count ?? 0) })).filter((x) => Number.isFinite(x.count) && x.count > 0);
    if (mapped.length === 0) {
      if (mode === 'Status') return { labels: STATUS_OPTIONS, values: STATUS_OPTIONS.map(() => 0) };
      return { labels: PROJECT_SIZE_OPTIONS.map((o) => o.label), values: PROJECT_SIZE_OPTIONS.map(() => 0) };
    }
    return { labels: mapped.map((x) => x.label), values: mapped.map((x) => x.count) };
  }, [percentageData, mode, leadType]);

  const options = {
    chart: {
      type: 'donut',
      toolbar: { show: false },
    },
    labels,
    // Hide legend so long status/size lists don't appear next to the donut
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(0)}%`,
    },
    tooltip: {
      y: {
        formatter: (value) => `${value}`,
      },
    },
    colors: ['#3E6A9F', '#52c41a', '#faad14', '#ff4d4f', '#13c2c2'],
    stroke: {
      width: 1,
      colors: ['#fff'],
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            // Show value in the center; Apex will switch to hovered slice on hover
            show: true,
            name: {
              show: true,
            },
            value: {
              show: true,
              formatter: (val) => val, // show raw value instead of percentage
            },
            total: {
              show: true,
              label: 'Total',
              formatter: (w) =>
                w.globals.seriesTotals.reduce((acc, curr) => acc + curr, 0),
            },
          },
        },
      },
    },
  };

  const series = values;

  return (
    <div className="donut-chart-card">
      <div className="donut-chart-header">
        <h2 className="donut-chart-title">Projects by Status & Size</h2>
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
          {leadType === 'meta' && (
            <Select value={mode} onChange={setMode} style={{ minWidth: 200 }}>
              <Option value="Status">Status</Option>
              <Option value="Project Size">Project Size</Option>
            </Select>
          )}
        </div>
      </div>

      <div className="donut-chart-body">
        {isLoading ? (
          <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={44} sx={{ color: '#3E6A9F' }} />
          </Box>
        ) : isError ? (
          <div style={{ padding: 16 }}>Failed to load chart data.</div>
        ) : (
          <Chart options={options} series={series} type="donut" height={320} />
        )}
      </div>
    </div>
  );
};

export default DonutChartWithFilters;


