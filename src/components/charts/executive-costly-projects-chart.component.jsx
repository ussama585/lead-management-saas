import { Select } from '../ui/app-select.jsx';
import React, { useState } from 'react';
import Chart from './apex-chart.jsx';

import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import { projectStatusOptions } from '../../pages/clients/constants/client-constants.js';
import '../../assets/styles/legacy/executive-costly-projects-chart.component.css';

const ALL_STATUS_VALUE = 'All';

const statusSelectOptions = [
  { label: 'All', value: ALL_STATUS_VALUE },
  ...projectStatusOptions,
];

/**
 * Executive Handling Most Costly Projects
 * Sum contract_price per executive (filter by status: All or multiple)
 * Trust & responsibility indicator - assign premium clients wisely
 * X-axis: Executive Name | Y-axis: Sum Contract Price
 */
const ExecutiveCostlyProjectsChart = ({
  title = 'Executive Handling Most Costly Projects',
  subtitle = 'Trust & responsibility · Assign premium clients wisely',
  data = [], // [{ assigned_to_name, total_contract_price, assigned_to_id?, currency? }]
  selectedStatus = ALL_STATUS_VALUE, // 'All' | string[]
  onStatusChange,
  executives = [],
  selectedExecutive = 'All',
  onExecutiveChange,
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

  const filteredData =
    selectedExecutive === 'All'
      ? data
      : data.filter(
          (item) => String(item.assigned_to_id ?? item.assigned_to_name) === String(selectedExecutive)
        );

  const categories = filteredData.map((item) => item.assigned_to_name || 'Unassigned');
  const seriesData = filteredData.map((item) => Number(item.total_contract_price) || 0);

  const executiveOptions = [
    { label: 'All Executives', value: 'All' },
    ...executives.map((e) => ({ label: e.name, value: String(e.id) })),
  ];

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
    colors: ['#2DB1F8', '#32D16D', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#52c41a', '#f5222d'],
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
        text: 'Sum Contract Price',
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
      name: 'Total Contract Price',
      data: seriesData,
    },
  ];

  const hasData = filteredData && filteredData.length > 0;

  return (
    <div className="executive-costly-projects-chart-container">
      <div className="executive-costly-projects-chart-header">
        <div>
          <h2 className="executive-costly-projects-chart-title">{title}</h2>
          {subtitle && (
            <p className="executive-costly-projects-chart-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="executive-costly-projects-chart-dropdown">
          <BootstrapDateRangeModal
            value={activeDateRange}
            onChange={onDateRangeChange}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={handleDateRangeDone}
          />
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            maxTagPlaceholder={(omittedValues) => `+ ${omittedValues.length}...`}
            value={
              selectedStatus === ALL_STATUS_VALUE
                ? [ALL_STATUS_VALUE]
                : Array.isArray(selectedStatus)
                  ? selectedStatus
                  : []
            }
            style={{ minWidth: 220, maxWidth: 320 }}
            onChange={(vals) => {
              if (!vals || vals.length === 0) {
                // If user clears everything → default back to All
                onStatusChange?.(ALL_STATUS_VALUE);
                return;
              }
            
              // If All was previously selected and user selects something else
              if (
                selectedStatus === ALL_STATUS_VALUE &&
                vals.length > 1
              ) {
                const withoutAll = vals.filter(v => v !== ALL_STATUS_VALUE);
                onStatusChange?.(withoutAll);
                return;
              }
            
              // If user clicks All directly
              if (vals.includes(ALL_STATUS_VALUE)) {
                onStatusChange?.(ALL_STATUS_VALUE);
                return;
              }
            
              // Normal multi-select case
              onStatusChange?.(vals);
            }}
            
            options={statusSelectOptions}
            placeholder="All statuses"
          />
          <Select
            value={selectedExecutive}
            style={{ width: 180 }}
            onChange={onExecutiveChange}
            options={executiveOptions}
            placeholder="Executive"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="executive-costly-projects-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="executive-costly-projects-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default ExecutiveCostlyProjectsChart;
