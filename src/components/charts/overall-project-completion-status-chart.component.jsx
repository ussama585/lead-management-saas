import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/overall-project-completion-status-chart.component.css';

/**
 * Overall Project Completion and Status Health
 * Stacked Bar Chart: X-axis: Project Status | Y-axis: Project Count
 */
const OverallProjectCompletionStatusChart = ({
  title = 'Overall Project Completion and Status Health',
  data = [], // [{ status: 'Completed', count: 450 }, { status: 'Active', count: 320 }, ...]
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

  const categories = data.map((d) => d.status || 'Unknown');
  const seriesData = data.map((d) => Number(d.count) || 0);

  const statusColors = {
    Completed: '#32D16D',
    Active: '#2DB1F8',
    Pending: '#faad14',
    Delayed: '#fa8c16',
    Terminated: '#ff4d4f',
    'Completed - Payment Pending': '#52c41a',
    'Completed - Defaulter': '#8c8c8c',
  };

  const colors = categories.map((s) => statusColors[s] || '#1890ff');

  const options = {
    chart: { type: 'bar', toolbar: { show: false }, zoom: { enabled: false } },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (val != null ? val : ''),
      style: { fontSize: '11px', colors: ['#333'] },
    },
    colors,
    xaxis: {
      categories,
      labels: {
        style: { colors: '#333', fontSize: '11px' },
        rotate: -45,
        rotateAlways: categories?.length > 5,
      },
      axisBorder: { show: true, color: '#e8e8e8' },
      axisTicks: { show: true },
      title: { text: 'Project Status', style: { color: '#666', fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { colors: '#333', fontSize: '12px' } },
      title: { text: 'Project Count', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    grid: { borderColor: '#e8e8e8', padding: { top: 15, right: 10, bottom: 25, left: 10 } },
    tooltip: { y: { formatter: (val) => `${val ?? 0} projects` } },
    legend: { show: false },
  };

  const series = [{ name: 'Projects', data: seriesData }];
  const hasData = data && data.length > 0;

  return (
    <div className="overall-project-completion-status-chart-container">
      <div className="overall-project-completion-status-chart-header">
        <div>
          <h2 className="overall-project-completion-status-chart-title">{title}</h2>
          <p className="overall-project-completion-status-chart-subtitle">
            Delivery reliability - Execution vs commitments
          </p>
        </div>
        <div className="overall-project-completion-status-chart-dropdown">
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
        <div className="overall-project-completion-status-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="overall-project-completion-status-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default OverallProjectCompletionStatusChart;
