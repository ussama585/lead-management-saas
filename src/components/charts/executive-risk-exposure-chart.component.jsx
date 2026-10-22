import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/executive-risk-exposure-chart.component.css';

/**
 * Executive Risk Exposure
 * Revenue at Risk: Sum(contract_price where project_status = Pending)
 * Who is blocking cash flow - Immediate intervention
 * Bar Chart with Red highlight
 */
const ExecutiveRiskExposureChart = ({
  title = 'Potential Projects Payment Per Executive',
  subtitle = 'Revenue at Risk',
  data = [], // [{ assigned_to_name, revenue_at_risk, assigned_to_id? }]
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
  const seriesData = data.map((item) => Number(item.revenue_at_risk) || 0);

  const formatPrice = (val) => {
    const num = Math.round(Number(val || 0));
    return `Rs ${num.toLocaleString()}`;
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
      formatter: (val) => formatPrice(val),
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#000'],
      },
    },
    colors: ['#ff4d4f', '#ff7875', '#ffa39e', '#ffccc7', '#ffccc7', '#ffccc7', '#ffccc7', '#ffccc7'],
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
        style: { colors: '#333', fontSize: '12px' },
        formatter: (val) => formatPrice(val),
      },
      title: {
        text: 'Revenue at Risk',
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
        formatter: (val) => {
          const num = Math.round(Number(val ?? 0));
          return `Rs ${num.toLocaleString()}`;
        },
      },
    },
    legend: { show: false },
  };

  const series = [
    {
      name: 'Revenue at Risk',
      data: seriesData,
    },
  ];

  const hasData = data && data.length > 0;

  return (
    <div className="executive-risk-exposure-chart-container">
      <div className="executive-risk-exposure-chart-header">
        <div>
          <h2 className="executive-risk-exposure-chart-title">{title}</h2>
          {subtitle && (
            <p className="executive-risk-exposure-chart-subtitle">{subtitle} — Who is blocking cash flow</p>
          )}
        </div>
        <div className="executive-risk-exposure-chart-dropdown">
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
        <div className="executive-risk-exposure-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="executive-risk-exposure-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default ExecutiveRiskExposureChart;
