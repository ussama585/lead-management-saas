import React, { useState, useMemo } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/project-status-health-chart.component.css';

/**
 * Project Status Health
 * API: { data: [{ status, count }] } – client/lead status counts
 * Same layout and options as Executive Projects Status Overview
 */
const ProjectStatusHealthChart = ({
  title = 'Project Status Health',
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

  const wrapLabel = (value, maxLen = 26) => {
    const s = normalizeLabel(value);
    if (!s || s.length <= maxLen) return s;
    const dashIdx = s.indexOf(' - ');
    if (dashIdx > 0 && dashIdx < maxLen + 8) {
      return `${s.slice(0, dashIdx)}\n${s.slice(dashIdx + 3)}`;
    }
    const spaceIdx = s.lastIndexOf(' ', maxLen);
    if (spaceIdx > 0) {
      return `${s.slice(0, spaceIdx)}\n${s.slice(spaceIdx + 1)}`;
    }
    return `${s.slice(0, maxLen)}\n${s.slice(maxLen)}`;
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
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 6,
        distributed: true,
      },
    },
    xaxis: {
      categories,
      labels: {
        show: true,
        rotate: -45,
        rotateAlways: true,
        hideOverlappingLabels: false,
        trim: false,
        style: {
          colors: '#B0B0B0',
          fontSize: '11px',
        },
        formatter: (val) => wrapLabel(val),
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#B0B0B0',
          fontSize: '12px',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (typeof val === 'number' ? val.toFixed(0) : val),
    },
    legend: {
      show: false,
    },
    colors: ['#3E6A9F', '#52c41a', '#faad14', '#ff4d4f', '#13c2c2', '#722ed1'],
    grid: {
      borderColor: '#e0e0e0',
      padding: {
        top: 40,
        bottom: 200,
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
            height={710}
          />
        
      )}
    </div>
  );
};

export default ProjectStatusHealthChart;
