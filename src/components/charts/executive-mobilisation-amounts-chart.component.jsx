import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/executive-mobilisation-amounts-chart.component.css';

/**
 * Mobilisation Amounts per Executive
 * Immediate cash impact and execution-to-payment efficiency
 * Bar Chart: X-axis: Executive Name | Y-axis: Mobilisation Amount
 */
const ExecutiveMobilisationAmountsChart = ({
  title = 'Mobilisation Amounts per Executive',
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
  const seriesData = data.map((item) => Number(item.mobilisation_amount) || 0);

  const formatPrice = (val) => {
    const num = Math.round(Number(val || 0));
    return `Rs ${num.toLocaleString()}`;
  };

  const formatCompactPrice = (val) => {
    const num = Math.round(Number(val || 0));
    const numStr = num.toLocaleString();
    return `Rs ${numStr}`;
  };

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '90%',
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
    colors: ['#2DB1F8', '#32D16D', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#52c41a', '#f5222d'],
    xaxis: {
      categories,
      labels: {
        style: { colors: '#333', fontSize: '11px' },
        rotate: -45,
        rotateAlways: categories?.length > 5,
      },
      axisBorder: { show: true, color: '#e8e8e8' },
      axisTicks: { show: true },
      title: { text: 'Executive', style: { color: '#666', fontSize: '12px' } },
    },
    yaxis: {
      labels: {
        style: { colors: '#333', fontSize: '12px' },
        formatter: (val) => formatCompactPrice(val),
      },
      title: { text: 'Mobilisation Amount', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    grid: {
      borderColor: '#e8e8e8',
      padding: { top: 30, right: 10, bottom: 25, left: 10 },
    },
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

  const series = [{ name: 'Mobilisation Amount', data: seriesData }];
  const hasData = data && data.length > 0;

  return (
    <div className="executive-mobilisation-amounts-chart-container">
      <div className="executive-mobilisation-amounts-chart-header">
        <div>
          <h2 className="executive-mobilisation-amounts-chart-title">{title}</h2>
          <p className="executive-mobilisation-amounts-chart-subtitle">
            Immediate cash impact · Execution-to-payment efficiency
          </p>
        </div>
        <div className="executive-mobilisation-amounts-chart-dropdown">
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
        <div className="executive-mobilisation-amounts-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="executive-mobilisation-amounts-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default ExecutiveMobilisationAmountsChart;
