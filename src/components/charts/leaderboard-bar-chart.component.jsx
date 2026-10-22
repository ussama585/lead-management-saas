import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import { Select } from 'antd';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import { projectStatusOptions } from '../../pages/clients/constants/client-constants.js';
import '../../assets/styles/legacy/leaderboard-bar-chart.component.css';

const { Option } = Select;

/**
 * Executive Closing Maximum Projects - Vertical Bar Chart
 * X-axis: Executive Name | Y-axis: Project Count
 * Displays sales performance ranking by completed projects.
 */
const LeaderboardBarChart = ({
  title = 'Executive Closing Maximum Projects',
  subtitle = 'Completed projects by executive · Sales performance',
  data = [], // [{ assigned_to_name, project_count, assigned_to_id? }]
  selectedStatus,
  onStatusChange,
  completedStatusOptions = projectStatusOptions,
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

  const categories = data.map((item) => item.assigned_to_name || 'Unassigned');
  const seriesData = data.map((item) => item.project_count || 0);

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
        distributed: false,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (typeof val === 'number' ? val : ''),
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#000'],
      },
    },
    colors: ['#2DB1F8'], // Primary blue for main bar
    xaxis: {
      categories,
      labels: {
        style: {
          colors: '#333',
          fontSize: '11px',
        },
        rotate: -45,
        rotateAlways: categories?.length > 5,
      },
      axisBorder: { show: true, color: '#e8e8e8' },
      axisTicks: { show: true },
      title: {
        text: 'Executive',
        style: { color: '#666', fontSize: '12px' },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#333',
          fontSize: '12px',
        },
      },
      title: {
        text: 'Project Count',
        style: { color: '#666', fontSize: '12px' },
      },
      min: 0,
      tickAmount: 5,
    },
    grid: {
      borderColor: '#e8e8e8',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
      padding: { top: 30, right: 10, bottom: 25, left: 10 },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} projects`,
      },
    },
    legend: { show: false },
  };

  const series = [
    {
      name: 'Project Count',
      data: seriesData,
    },
  ];

  const hasData = data && data.length > 0;

  return (
    <div className="leaderboard-bar-chart-container">
      <div className="leaderboard-bar-chart-header">
        <div>
          <h2 className="leaderboard-bar-chart-title">{title}</h2>
          {subtitle && (
            <p className="leaderboard-bar-chart-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="leaderboard-bar-chart-dropdown">
          <BootstrapDateRangeModal
            value={activeDateRange}
            onChange={onDateRangeChange}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={handleDateRangeDone}
          />
          <Select
            value={selectedStatus}
            style={{ width: 'fit-content' }}
            dropdownMatchSelectWidth={false}
            onChange={onStatusChange}
            placeholder="Select completed status"
          >
            {completedStatusOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </div>
      </div>
      {isLoading ? (
        <div className="leaderboard-bar-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="leaderboard-bar-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart
          options={options}
          series={series}
          type="bar"
          height={Math.max(280, data.length * 45)}
        />
      )}
    </div>
  );
};

export default LeaderboardBarChart;
