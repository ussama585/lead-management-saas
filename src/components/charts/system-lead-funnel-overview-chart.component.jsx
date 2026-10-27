import { Select } from '../ui/app-select.jsx';
import React, { useState } from 'react';
import Chart from './apex-chart.jsx';

import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/system-lead-funnel-overview-chart.component.css';

/**
 * System Lead Funnel Overview
 * Lead quality and movement - Received → Potential → Converted
 * Funnel Chart with dropdown: Meta, Data, Website
 */
const LEAD_SOURCE_OPTIONS = [
  { label: 'Meta', value: 'Meta' },
  { label: 'Data', value: 'Data' },
  { label: 'Website', value: 'Website' },
];

const FUNNEL_STAGES = ['Received', 'Potential', 'Converted'];

const SystemLeadFunnelOverviewChart = ({
  title = 'System Lead Funnel Overview',
  data = {}, // { Meta: { received, potential, converted }, Data: {...}, Website: {...} }
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

  const sourceData = data[selectedSource] || data.Meta || {};
  const funnelData = [
    Number(sourceData.received) || 0,
    Number(sourceData.potential) || 0,
    Number(sourceData.converted) || 0,
  ];

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        columnWidth: '60%',
        distributed: true,
        isFunnel: true,
        dataLabels: {
          hideOverflowingLabels: false,
          position: 'center',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => {
        const label = FUNNEL_STAGES[opts.dataPointIndex] || '';
        const value = funnelData[opts.dataPointIndex] || 0;
        return `${label}: ${value}`;
      },
      style: { fontSize: '12px', colors: ['#fff'] },
    },
    colors: ['#1890ff', '#52c41a', '#32D16D'],
    xaxis: {
      categories: FUNNEL_STAGES,
      labels: {
        show: true,
        style: { colors: '#333', fontSize: '12px' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        show: true,
        style: { colors: '#333', fontSize: '12px' },
      },
      min: 0,
      tickAmount: 5,
    },
    legend: { show: false },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    tooltip: {
      y: { formatter: (val) => `${val} leads` },
    },
  };

  const series = [{ name: 'Leads', data: funnelData }];
  const hasData = funnelData.some((v) => v > 0);

  return (
    <div className="system-lead-funnel-overview-chart-container">
      <div className="system-lead-funnel-overview-chart-header">
        <div>
          <h2 className="system-lead-funnel-overview-chart-title">{title}</h2>
          <p className="system-lead-funnel-overview-chart-subtitle">
            Lead inflow health · Received → Potential → Converted
          </p>
        </div>
        <div className="system-lead-funnel-overview-chart-dropdowns">
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
        <div className="system-lead-funnel-overview-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="system-lead-funnel-overview-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={280} />
      )}
    </div>
  );
};

export default SystemLeadFunnelOverviewChart;
