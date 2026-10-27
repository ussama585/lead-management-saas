import { Select } from '../ui/app-select.jsx';
import React, { useState } from 'react';
import Chart from './apex-chart.jsx';

import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/total-leads-converted-chart.component.css';

/**
 *
 * Bar Chart: X-axis: Time Period | Y-axis: Converted Leads Count
 */

const LEAD_SOURCE_OPTIONS = [
  { label: 'Meta', value: 'Meta' },
  { label: 'Data', value: 'Data' },
  { label: 'Website', value: 'Website' },
];

const TotalLeadsConvertedChart = ({
  title = 'Total Leads Converted',
  data = [], // [{ period: 'Jan 2024', count: 45 }, ...]
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

  const categories = data.map((d) => d.period || d.label || '');
  const seriesData = data.map((d) => Number(d.count) || 0);

  const options = {
    chart: { type: 'bar', toolbar: { show: false }, zoom: { enabled: false } },
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
    colors: ['#32D16D'],
    xaxis: {
      categories,
      labels: { style: { colors: '#333', fontSize: '11px' }, rotate: -45, rotateAlways: categories?.length > 6 },
      axisBorder: { show: true, color: '#e8e8e8' },
      axisTicks: { show: true },
      title: { text: 'Time Period', style: { color: '#666', fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { colors: '#333', fontSize: '12px' } },
      title: { text: 'Converted Leads Count', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    grid: { borderColor: '#e8e8e8', padding: { top: 30, right: 10, bottom: 25, left: 10 } },
    tooltip: { y: { formatter: (val) => `${val ?? 0} converted` } },
    legend: { show: false },
  };

  const series = [{ name: 'Converted', data: seriesData }];
  const hasData = data && data.length > 0;

  return (
    <div className="total-leads-converted-chart-container">
      <div className="total-leads-converted-chart-header">
        <div>
          <h2 className="total-leads-converted-chart-title">{title}</h2>
          <p className="total-leads-converted-chart-subtitle">Leads turned into active clients · True sales output</p>
        </div>
        <div className="total-leads-converted-chart-dropdown">
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
        <div className="total-leads-converted-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="total-leads-converted-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default TotalLeadsConvertedChart;
