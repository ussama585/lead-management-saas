import { Select } from '../ui/app-select.jsx';
import React, { useMemo, useState } from 'react';
import Chart from './apex-chart.jsx';

import { Box, CircularProgress } from '@mui/material';
import dayjs from 'dayjs';
import '../../assets/styles/legacy/donut-chart.component.css';
import { STATUS_OPTIONS } from '../../pages/leads/pages/website-leads/website-leads-constants.js';
import { useQuery } from 'react-query';
import { getMetaLeadsProgressChart } from '../../pages/shared/services/metaLeads.js';
import { getLeadGenerationProgressChart } from '../../pages/shared/services/leads.js';
import { getDataLeadsProgressChart } from '../../pages/shared/services/data-leads-service.js';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
const { Option } = Select;

const RadialProgressChart = ({ leadType = 'meta' }) => {
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0] || null);

  const queryParams = useMemo(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (dateRange?.[0] && dateRange?.[1]) {
      params.start_date = dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
      params.end_date = dateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
    }
    return params;
  }, [statusFilter, dateRange]);

  const fetchData = useMemo(() => {
    if (leadType === 'meta') return () => getMetaLeadsProgressChart(queryParams);
    if (leadType === 'website') return () => getLeadGenerationProgressChart(queryParams);
    if (leadType === 'data') return () =>
      getDataLeadsProgressChart({
        status: queryParams.status,
        start_date: queryParams.start_date,
        end_date: queryParams.end_date,
      });
    return () => Promise.resolve(0);
  }, [leadType, queryParams]);

  const { data: progressData, isLoading, isError } = useQuery(
    [`radial-${leadType}`, statusFilter, queryParams],
    fetchData,
    {
      enabled: leadType === 'meta' ? Boolean(statusFilter) : !!(queryParams.start_date && queryParams.end_date),
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const percentage = useMemo(() => {
    if (progressData === undefined || progressData === null) return 0;
    if (typeof progressData === 'number') return Math.max(0, Math.min(100, progressData));
    if (typeof progressData === 'object') {
      const direct = statusFilter ? progressData?.[statusFilter] : undefined;
      const candidate = direct ?? Object.values(progressData)?.[0];
      const num = Number(candidate);
      if (Number.isFinite(num)) return Math.max(0, Math.min(100, num));
    }
    return 0;
  }, [progressData, statusFilter]);

  const options = {
    chart: {
      type: 'radialBar',
      toolbar: { show: false },
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '60%',
        },
        track: {
          background: '#f0f0f0',
        },
        dataLabels: {
          name: {
            show: true,
            color: '#888',
            fontSize: '14px',
          },
          value: {
            show: true,
            fontSize: '24px',
            fontWeight: 600,
            formatter: (val) => `${val}%`,
          },
        },
      },
    },
    labels: ['Leads'],
    colors: ['#3E6A9F'],
    stroke: {
      lineCap: 'round',
    },
  };

  const series = [percentage];

  return (
    <div className="donut-chart-card">
      <div className="donut-chart-header">
        <h2 className="donut-chart-title">Project Progress</h2>
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
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            style={{ minWidth: 200 }}
            placeholder="Select status"
          >
            {STATUS_OPTIONS.map((status) => (
              <Option key={status} value={status}>
                {status}
              </Option>
            ))}
          </Select>
        </div>
      </div>
      <div className="donut-chart-body">
        {isLoading ? (
          <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={44} sx={{ color: '#3E6A9F' }} />
          </Box>
        ) : isError ? (
          <div style={{ padding: 16 }}>Failed to load progress data.</div>
        ) : (
          <Chart options={options} series={series} type="radialBar" height={280} />
        )}
      </div>
    </div>
  );
};

export default RadialProgressChart;


