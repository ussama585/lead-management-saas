import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import { Select } from 'antd';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/executive-projects-status-overview.component.css';

/**
 * Executive Projects Status Overview
 * Delivery success metric - reliable execution tracking
 * X-axis: statuses | Y-axis: count
 * Dropdowns: Type (Projects/Jobs), Executive
 */
const ExecutiveProjectsStatusOverview = ({
  title = 'Executive Projects Status Overview',
  subtitle = 'Delivery success · Reliable execution tracking',
  data = [], // [{ status, count }]
  selectedType,
  onTypeChange,
  selectedExecutive,
  onExecutiveChange,
  executives = [],
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

  const categories = data.map((item) => item.status);
  const seriesData = data.map((item) => item.count);

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
        distributed: false,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (val != null ? val : ''),
      offsetY: -20,
      style: {
        fontSize: '11px',
        colors: ['#000'],
      },
    },
    colors: ['#2DB1F8'],
    xaxis: {
      categories,
      labels: {
        style: {
          colors: '#333',
          fontSize: '11px',
        },
        rotate: -45,
        rotateAlways: categories?.length > 6,
      },
      axisBorder: { show: true, color: '#e8e8e8' },
      axisTicks: { show: true },
      title: {
        text: 'Status',
        style: { color: '#666', fontSize: '12px' },
      },
    },
    yaxis: {
      labels: {
        style: { colors: '#333', fontSize: '12px' },
      },
      title: {
        text: 'Count',
        style: { color: '#666', fontSize: '12px' },
      },
      min: 0,
      tickAmount: 5,
    },
    grid: {
      borderColor: '#e8e8e8',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
      padding: { top: 30, right: 10, bottom: 20, left: 10 },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val}`,
      },
    },
    legend: { show: false },
  };

  const series = [
    {
      name: 'Count',
      data: seriesData,
    },
  ];

  const hasData = data && data.length > 0;

  return (
    <div className="executive-projects-status-overview-container">
      <div className="executive-projects-status-overview-header">
        <div>
          <h2 className="executive-projects-status-overview-title">{title}</h2>
          {subtitle && (
            <p className="executive-projects-status-overview-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="executive-projects-status-overview-dropdowns">
          <BootstrapDateRangeModal
            value={activeDateRange}
            onChange={onDateRangeChange}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={handleDateRangeDone}
          />
          <Select
            value={selectedType}
            style={{ width: 140 }}
            onChange={onTypeChange}
            options={[
              { label: 'Projects', value: 'Projects' },
              { label: 'Jobs', value: 'Jobs' },
            ]}
          />
          <Select
            value={selectedExecutive ?? ''}
            style={{ width: 180 }}
            onChange={(val) => {
              // Treat empty string as "All"
              onExecutiveChange(val === '' ? null : val);
            }}
            placeholder="All Executives"
            showSearch
            optionFilterProp="label"
            options={[
              { label: 'All Executives', value: '' },
              ...executives.map((e) => ({
                label: e.name,
                value: e.id,
              })),
            ]}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="executive-projects-status-overview-loading">Loading...</div>
      ) : !hasData ? (
        <div className="executive-projects-status-overview-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default ExecutiveProjectsStatusOverview;
