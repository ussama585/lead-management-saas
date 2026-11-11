import React, { useState, useMemo } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/project-status-health-chart.component.css';

/**
 * Project Status Health (Horizontal Bars)
 * Same data as Project Status Health – horizontal bar layout.
 * API: { data: [{ status, count }] }
 */
const ProjectStatusHealthHorizontalChart = ({
  title = 'Project Status Health (Horizontal)',
  subtitle = 'Project pipeline health · Where work is stuck',
  data = [],
  isLoading = false,
  emptyMessage = 'No data to display',
  dateRange,
  onDateRangeChange,
}) => {
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [internalDateRange, setInternalDateRange] = useState(dateRange ?? [dayjs().startOf('month'), dayjs().endOf('month')]);
  const activeDateRange = dateRange ?? internalDateRange;
  const handleDateRangeDone = (range) => {
    setInternalDateRange(range);
    onDateRangeChange?.(range);
  };

  const normalizeLabel = (v) => {
    if (typeof v === 'string') {
      const trimmed = v.trim();
      return trimmed ? trimmed : 'Not Set';
    }
    return v == null ? 'Not Set' : String(v);
  };

  const normalizedData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((d) => ({
        status: normalizeLabel(d.status ?? d.status_name ?? 'Unknown') || 'Unknown',
        count: Number(d.count ?? d.total ?? 0) || 0,
      })),
    [data]
  );

  const categories = useMemo(
    () => normalizedData.map((item) => item.status),
    [normalizedData]
  );

  const series = useMemo(
    () => [
      {
        name: 'Count',
        data: normalizedData.map((item) => item.count),
      },
    ],
    [normalizedData]
  );

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
        borderRadius: 4,
        distributed: true,
        dataLabels: {
          position: 'top',
        },
      },
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: '#B0B0B0',
          fontSize: '11px',
        },
        maxWidth: undefined,
        trim: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#B0B0B0',
          fontSize: '12px',
        },
        maxWidth: undefined,
        trim: false,
      },
      title: {
        text: 'Count',
        style: { color: '#666', fontSize: '12px' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (typeof val === 'number' ? val.toFixed(0) : val),
      offsetX: 45,
      style: {
        fontSize: '12px',
        fontWeight: 600,
        colors: ['#333'],
      },
    },
    legend: {
      show: false,
    },
    colors: ['#3E6A9F', '#52c41a', '#faad14', '#ff4d4f', '#13c2c2', '#722ed1'],
    grid: {
      borderColor: '#f1f1f1',
      padding: {
        top: 20,
        right: 60,
        bottom: 20,
        left: 20,
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} projects`,
      },
    },
  };

  const hasData = normalizedData.length > 0;

  return (
    <div className="project-status-health-chart-container">
      <div className="project-status-health-chart-header">
        <div>
          <h2 className="project-status-health-chart-title">{title}</h2>
          {subtitle && (
            <p className="project-status-health-chart-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="project-status-health-chart-dropdowns">
          <BootstrapDateRangeModal
            value={activeDateRange}
            onChange={onDateRangeChange}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={handleDateRangeDone}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="project-status-health-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="project-status-health-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart
          options={options}
          series={series}
          type="bar"
          height={1000}
        />
      )}
    </div>
  );
};

export default ProjectStatusHealthHorizontalChart;
