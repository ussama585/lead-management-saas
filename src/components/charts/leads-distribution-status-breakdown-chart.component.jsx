import { Select } from '../ui/app-select.jsx';
import React, { useState } from 'react';
import Chart from './apex-chart.jsx';

import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import { STATUS_OPTIONS as WEBSITE_LEAD_STATUS_OPTIONS } from '../../pages/leads/pages/website-leads/website-leads-constants.js';
import '../../assets/styles/legacy/leads-distribution-status-breakdown-chart.component.css';

/**
 * Leads Distribution & Status Breakdown
 * Workload and lead status per executive by source (Meta, Data, Website)
 * Stacked Bar Chart: X-axis: Executive Name | Y-axis: Lead Count | Stack: Lead Status
 */
const LEAD_SOURCE_OPTIONS = [
  { label: 'Meta', value: 'Meta' },
  { label: 'Data', value: 'Data' },
  { label: 'Website', value: 'Website' },
];

const LEAD_STATUS_OPTIONS = WEBSITE_LEAD_STATUS_OPTIONS.map((label) => ({ label, value: label }));

const STATUS_COLORS = {
  Potential: '#13c2c2',
  Lost: '#ff7875',
  Active: '#73d13d',
  'Opportunities Lost': '#ffa940',
  Dormant: '#bfbfbf',
};

// Fallback palette so every stack gets a distinct color (used when status not in STATUS_COLORS)
const STACK_COLOR_PALETTE = [
  '#3e6a9f', '#13c2c2', '#ff7875', '#73d13d', '#ffa940', '#bfbfbf',
  '#722ed1', '#eb2f96', '#fa8c16', '#52c41a', '#1890ff', '#f5222d',
  '#2db1f8', '#32d16d', '#faad14', '#8c8c8c',
];

const LeadsDistributionStatusBreakdownChart = ({
  title = 'Leads Distribution & Status Breakdown',
  data = {},
  selectedSource = 'Meta',
  onSourceChange,
  selectedStatus = 'Pending Contact',
  onStatusChange,
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

  const chartData = (() => {
    if (Array.isArray(data)) return data;
    if (data == null || typeof data !== 'object') return [];
    const slice = data[selectedSource];
    return Array.isArray(slice) ? slice : [];
  })();
  const categories = chartData.map((item) => item.executive_name || item.assigned_to_name || 'Unassigned');

  const firstRow = chartData[0];
  const allStatusKeys =
    firstRow && typeof firstRow === 'object' && !Array.isArray(firstRow)
      ? Object.keys(firstRow).filter(
          (k) => !['executive_name', 'assigned_to_name', 'executive_id', 'assigned_to_id'].includes(k)
        )
      : chartData.length === 0
        ? ['Potential', 'Lost']
        : [];

  const statusKeys = allStatusKeys.includes(selectedStatus)
    ? [selectedStatus]
    : allStatusKeys.length
      ? [allStatusKeys[0]]
      : allStatusKeys;

  const series = statusKeys.map((key) => ({
    name: key.replace(/_/g, ' '),
    data: chartData.map((d) => Number(d[key]) || 0),
  }));

  const colors = statusKeys.map((k, i) =>
    STATUS_COLORS[k] ?? STACK_COLOR_PALETTE[i % STACK_COLOR_PALETTE.length]
  );

  const barTotals = chartData.map((row) =>
    statusKeys.reduce((sum, key) => sum + (Number(row[key]) || 0), 0)
  );

  const options = {
    chart: {
      type: 'bar',
      stacked: statusKeys.length > 1,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 2,
        dataLabels: {
          position: 'top',
          hideOverflowingLabels: false,
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => {
        const dataPointIndex = opts?.dataPointIndex ?? 0;
        const seriesIndex = opts?.seriesIndex ?? 0;
        const totalSeries = opts?.w?.globals?.series?.length ?? 1;
        if (seriesIndex === totalSeries - 1) {
          const total = barTotals[dataPointIndex];
          return total != null && total !== '' ? total : '';
        }
        return '';
      },
      offsetY: -20,
      style: { fontSize: '12px', fontWeight: 600, colors: ['#000'] },
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
      title: { text: 'Executive', style: { color: '#666', fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { colors: '#333', fontSize: '12px' } },
      title: { text: 'Lead Count', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
    },
    grid: {
      borderColor: '#e8e8e8',
      padding: { top: 15, right: 10, bottom: 25, left: 10 },
    },
    tooltip: {
      y: { formatter: (val) => `${val} leads` },
    },
  };

  const hasData =
    chartData.length > 0 && statusKeys.length > 0 && series.length > 0;

  return (
    <div className="leads-distribution-status-breakdown-chart-container">
      <div className="leads-distribution-status-breakdown-chart-header">
        <div>
          <h2 className="leads-distribution-status-breakdown-chart-title">{title}</h2>
          <p className="leads-distribution-status-breakdown-chart-subtitle">
            Workload and lead status per executive - Identifies bottlenecks
          </p>
        </div>
        <div className="leads-distribution-status-breakdown-chart-dropdowns">
          <BootstrapDateRangeModal
            value={activeDateRange}
            onChange={onDateRangeChange}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={handleDateRangeDone}
          />
          <Select
            value={selectedSource}
            style={{ width: 120 }}
            onChange={onSourceChange}
            options={LEAD_SOURCE_OPTIONS}
          />
          <Select
            value={selectedStatus}
            style={{ width: 'fit-content' }}
            dropdownMatchSelectWidth={false}
            onChange={onStatusChange}
            options={LEAD_STATUS_OPTIONS}
            placeholder="Status"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="leads-distribution-status-breakdown-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="leads-distribution-status-breakdown-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default LeadsDistributionStatusBreakdownChart;
