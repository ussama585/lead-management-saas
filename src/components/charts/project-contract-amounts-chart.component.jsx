import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/project-contract-amounts-chart.component.css';

/**
 * Project Contract Amounts
 * Total contract value per executive - volume vs value sellers
 * Bar Chart: X-axis: Executive Name | Y-axis: Total Contract Value
 */
const ProjectContractAmountsChart = ({
  title = 'Project Contract Amounts',
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

  const categories = data.map((item) => item.assigned_to_name || 'Unassigned');
  const seriesData = data.map((item) => Number(item.total_contract_value) || 0);

  const formatPrice = (val) => {
    const num = Math.round(Number(val || 0));
    return `Rs ${num.toLocaleString()}`;
  };

  // Compact formatter for axis/data labels so very large values don't overflow
  const formatCompactPrice = (val) => {
    const num = Number(val || 0);
    const abs = Math.abs(num);

    if (abs >= 1e12) {
      return `Rs ${(num / 1e12).toFixed(1)}`;
    }
    if (abs >= 1e9) {
      return `Rs ${(num / 1e9).toFixed(1)}B`;
    }
    if (abs >= 1e6) {
      return `Rs ${(num / 1e6).toFixed(1)}M`;
    }
    if (abs >= 1e3) {
      return `Rs ${(num / 1e3).toFixed(1)}K`;
    }
    return formatPrice(num);
  };

  const options = {
    chart: { type: 'bar', toolbar: { show: false }, zoom: { enabled: false } },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
        distributed: true,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => formatCompactPrice(val ?? 0),
      offsetY: -20,
      style: { fontSize: '11px', colors: ['#000'] },
    },
    colors: ['#2DB1F8', '#32D16D', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#52c41a'],
    xaxis: {
      categories,
      labels: { style: { colors: '#333', fontSize: '11px' }, rotate: -45, rotateAlways: categories?.length > 5 },
      axisBorder: { show: true, color: '#e8e8e8' },
      axisTicks: { show: true },
      title: { text: 'Executive', style: { color: '#666', fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { colors: '#333', fontSize: '12px' }, formatter: (val) => formatCompactPrice(val) },
      title: { text: 'Total Contract Value', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    grid: { borderColor: '#e8e8e8', padding: { top: 30, right: 10, bottom: 25, left: 10 } },
    tooltip: {
      y: {
        formatter: (val) => {
          const num = Math.round(Number(val ?? 0));
          return `Rs ${num.toLocaleString()}`;
        },
      },
    },
    legend: { show: false },
  };

  const series = [{ name: 'Total Contract Value', data: seriesData }];
  const hasData = data && data.length > 0;

  return (
    <div className="project-contract-amounts-chart-container">
      <div className="project-contract-amounts-chart-header">
        <div>
          <h2 className="project-contract-amounts-chart-title">{title}</h2>
          <p className="project-contract-amounts-chart-subtitle">
            High-value deals · Assign premium clients wisely
          </p>
        </div>
        <div className="project-contract-amounts-chart-dropdown">
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
        <div className="project-contract-amounts-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="project-contract-amounts-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default ProjectContractAmountsChart;
