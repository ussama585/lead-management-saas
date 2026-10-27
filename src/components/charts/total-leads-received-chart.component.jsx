import { Select } from '../ui/app-select.jsx';
import React, { useState } from 'react';
import Chart from './apex-chart.jsx';

import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/total-leads-received-chart.component.css';

const PERIOD_OPTIONS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const LEAD_SOURCE_OPTIONS = [
  { label: 'Meta', value: 'Meta' },
  { label: 'Data', value: 'Data' },
  { label: 'Website', value: 'Website' },
];

const TotalLeadsReceivedChart = ({
  title = 'Total Leads Received',
  totalCount = 0,
  timeSeriesData = [],
  selectedPeriod = 'day',
  onPeriodChange,
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

  const categories = timeSeriesData.map((d) => d.period || d.label || '');
  const seriesData = timeSeriesData.map((d) => Number(d.count) || 0);

  const options = {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false } },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (val != null ? val : ''),
      offsetY: -20,
      style: { fontSize: '11px', colors: ['#000'] },
    },
    colors: ['#1890ff'],
    xaxis: {
      categories,
      labels: { style: { colors: '#333', fontSize: '11px' }, rotate: -45, rotateAlways: categories?.length > 6 },
      axisBorder: { show: true, color: '#e8e8e8' },
      axisTicks: { show: true },
      title: { text: 'Time Period', style: { color: '#666', fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { colors: '#333', fontSize: '12px' } },
      title: { text: 'Lead Count', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    grid: { borderColor: '#e8e8e8', padding: { top: 30, right: 10, bottom: 25, left: 10 } },
    tooltip: { y: { formatter: (val) => (val ?? 0) + ' leads' } },
    legend: { show: false },
  };

  const series = [{ name: 'Leads', data: seriesData }];
  const hasTimeSeries = timeSeriesData && timeSeriesData.length > 0;

  return (
    <div className="total-leads-received-chart-container">
      <div className="total-leads-received-chart-header">
        <div>
          <h2 className="total-leads-received-chart-title">{title}</h2>
          <p className="total-leads-received-chart-subtitle">No of leads received over time</p>
        </div>
        <div className="total-leads-received-chart-filters">
          <BootstrapDateRangeModal
            value={activeDateRange}
            onChange={onDateRangeChange}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={handleDateRangeDone}
          />
          <Select
            value={selectedPeriod}
            style={{ width: 120 }}
            onChange={onPeriodChange}
            options={PERIOD_OPTIONS}
          />
          <Select
            value={selectedSource}
            style={{ width: 140 }}
            onChange={onSourceChange}
            options={LEAD_SOURCE_OPTIONS}
          />
        </div>
      </div>
      <div className="total-leads-received-kpi">
        <span className="total-leads-received-kpi-value">{totalCount?.toLocaleString?.() ?? totalCount ?? 0}</span>
        <span className="total-leads-received-kpi-label">Total Leads</span>
      </div>
      {isLoading ? (
        <div className="total-leads-received-chart-loading">Loading...</div>
      ) : !hasTimeSeries ? (
        <div className="total-leads-received-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="area" height={280} />
      )}
    </div>
  );
};

export default TotalLeadsReceivedChart;
