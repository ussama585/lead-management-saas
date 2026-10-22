import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import { Select } from 'antd';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/lead-status-distribution-chart.component.css';

const LEAD_SOURCE_OPTIONS = [
  { label: 'Meta', value: 'Meta' },
  { label: 'Data', value: 'Data' },
  { label: 'Website', value: 'Website' },
];

const LeadStatusDistributionChart = ({
  title = 'Lead Status Distribution ',
  data = [],
  selectedSource = 'Meta',
  onSourceChange,
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

  const rows = Array.isArray(data) ? data : [];
  const labels = rows.map((d) => d.status || 'Unknown');
  const seriesData = rows.map((d) => Number(d.count) || 0);

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
        borderRadius: 4,
        distributed: true,
        dataLabels: {
          position: 'top',
        },
      },
    },
    colors: ['#faad14', '#1890ff', '#52c41a', '#ff4d4f', '#8c8c8c', '#722ed1', '#eb2f96'],
    dataLabels: {
      enabled: true,
      formatter: (val) => val,
      offsetY: -22,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#304758'],
      },
    },
    xaxis: {
      categories: labels,
      labels: {
        rotate: -45,
        rotateAlways: labels.length > 5,
        style: {
          fontSize: '11px',
          fontWeight: 500,
        },
      },
      axisBorder: { show: true },
      axisTicks: { show: true },
    },
    yaxis: {
      title: {
        text: 'No. of leads',
        style: {
          fontSize: '12px',
          fontWeight: 600,
          color: '#3E6A9F',
        },
      },
      labels: {
        formatter: (val) => Math.floor(val),
      },
    },
    grid: {
      borderColor: '#f1f1f1',
    },
    legend: {
      show: false,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} leads`,
      },
    },
  };

  const series = [
    {
      name: 'Leads',
      data: seriesData,
    },
  ];
  const hasData = rows.length > 0 && seriesData.some((v) => v > 0);

  return (
    <div className="lead-status-distribution-chart-container">
      <div className="lead-status-distribution-chart-header">
        <div>
          <h2 className="lead-status-distribution-chart-title">{title}</h2>
          <p className="lead-status-distribution-chart-subtitle">Pipeline health - Where leads get stuck</p>
        </div>
        <div className="lead-status-distribution-chart-dropdown">
          <BootstrapDateRangeModal
            value={activeDateRange}
            onChange={onDateRangeChange}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={handleDateRangeDone}
          />
          <Select
            value={selectedSource}
            style={{ width: 140 }}
            onChange={onSourceChange}
            options={LEAD_SOURCE_OPTIONS}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="lead-status-distribution-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="lead-status-distribution-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={320} />
      )}
    </div>
  );
};

export default LeadStatusDistributionChart;
