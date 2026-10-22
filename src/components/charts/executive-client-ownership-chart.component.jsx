import React, { useState, useMemo } from 'react';
import Chart from './apex-chart.jsx';
import { Select } from 'antd';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import { projectStatusOptions } from '../../pages/clients/constants/client-constants.js';
import '../../assets/styles/legacy/executive-client-ownership-chart.component.css';

const DEFAULT_STATUSES = ['Completed', 'Completed - Payment Pending', 'Completed - Defaulter'];
const ALL_STATUS_VALUE = 'All';

const statusSelectOptions = [
  { label: 'All', value: ALL_STATUS_VALUE },
  ...projectStatusOptions,
];

/**
 * Projects Per Executive
 * Multi-select project status; separate bars per executive per selected status.
 * data: [{ assigned_to_name, client_count }] (aggregate) or
 *       [{ assigned_to_name, assigned_to_id, status, count }] (breakdown by status)
 */
const ExecutiveClientOwnershipChart = ({
  title = 'Projects Per Executive',
  subtitle = 'Count of projects per executive by selected status',
  data = [],
  selectedStatus = ALL_STATUS_VALUE, // 'All' | string[]
  onStatusChange,
  isLoading = false,
  emptyMessage = 'No data to display',
  dateRange,
  onDateRangeChange,
}) => {
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [internalDateRange, setInternalDateRange] = useState(dateRange ?? [dayjs().startOf('month'), dayjs().endOf('month')]);

  const activeDateRange = dateRange ?? internalDateRange;

  const hasStatusBreakdown =
    data.length > 0 && data.some((item) => item.status != null);

  const handleDateRangeDone = (range) => {
    setInternalDateRange(range);
    onDateRangeChange?.(range);
  };

  const { categories, series } = useMemo(() => {
    if (!data || data.length === 0) {
      return { categories: [], series: [] };
    }

    const effectiveStatuses =
      selectedStatus === ALL_STATUS_VALUE || !Array.isArray(selectedStatus)
        ? []
        : selectedStatus;

    if (hasStatusBreakdown) {
      const execOrder = [];
      const execIndex = new Map();

      data.forEach((item) => {
        const name = item.assigned_to_name || 'Unassigned';
        if (!execIndex.has(name)) {
          execIndex.set(name, execOrder.length);
          execOrder.push(name);
        }
      });

      const categories = execOrder;

      const statusCounts = new Map();

      data.forEach((item) => {
        const name = item.assigned_to_name || 'Unassigned';
        const status = item.status ?? '';
        const count = Number(item.count ?? item.client_count ?? 0) || 0;
        const key = `${name}|${status}`;
        statusCounts.set(key, (statusCounts.get(key) || 0) + count);
      });

      const statusesForSeries =
        effectiveStatuses?.length > 0
          ? effectiveStatuses
          : [...new Set(data.map((item) => item.status).filter(Boolean))];

      const series = (statusesForSeries.length > 0
        ? statusesForSeries
        : DEFAULT_STATUSES
      ).map((status) => ({
        name: status,
        data: categories.map(
          (exec) => statusCounts.get(`${exec}|${status}`) ?? 0
        ),
      }));

      return { categories, series };
    }

    const categories = data.map(
      (item) => item.assigned_to_name || 'Unassigned'
    );

    const seriesData = data.map(
      (item) => Number(item.client_count ?? item.count ?? 0) || 0
    );

    return {
      categories,
      series: [{ name: 'Count', data: seriesData }],
    };
  }, [data, hasStatusBreakdown, selectedStatus]);

  const options = {
    chart: { type: 'bar', toolbar: { show: false }, zoom: { enabled: false } },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: series.length > 1 ? '70%' : '60%',
        borderRadius: 4,
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (val > 0 ? val : ''),
      offsetY: -20,
      style: { fontSize: '11px', colors: ['#000'] },
    },
    colors: [
      '#2DB1F8',
      '#32D16D',
      '#fa8c16',
      '#722ed1',
      '#eb2f96',
      '#13c2c2',
      '#52c41a',
      '#f5222d',
    ],
    xaxis: {
      categories,
      labels: {
        style: { colors: '#333', fontSize: '12px' },
        rotate: -45,
        rotateAlways: categories?.length > 5,
      },
      title: { text: 'Executive', style: { color: '#666', fontSize: '12px' } },
    },
    yaxis: {
      min: 0,
      tickAmount: 5,
      title: { text: 'Count', style: { color: '#666', fontSize: '12px' } },
    },
    legend: {
      show: series.length > 1,
      position: 'top',
      horizontalAlign: 'right',
    },
    tooltip: {
      y: { formatter: (val) => `${val} projects` },
    },
  };

  const hasData = data && data.length > 0;

  return (
    <div className="executive-client-ownership-chart-container">
      <div className="executive-client-ownership-chart-header">
        <div>
          <h2 className="executive-client-ownership-chart-title">{title}</h2>
          {subtitle && (
            <p className="executive-client-ownership-chart-subtitle">
              {subtitle}
            </p>
          )}
        </div>

        <div className="executive-client-ownership-chart-dropdown">
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
                onStatusChange?.(ALL_STATUS_VALUE);
                return;
              }
              if (
                selectedStatus === ALL_STATUS_VALUE &&
                vals.length > 1
              ) {
                const withoutAll = vals.filter((v) => v !== ALL_STATUS_VALUE);
                onStatusChange?.(withoutAll);
                return;
              }
              if (vals.includes(ALL_STATUS_VALUE)) {
                onStatusChange?.(ALL_STATUS_VALUE);
                return;
              }
              onStatusChange?.(vals);
            }}
            options={statusSelectOptions}
            placeholder="All statuses"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="executive-client-ownership-chart-loading">
          Loading...
        </div>
      ) : !hasData ? (
        <div className="executive-client-ownership-chart-empty">
          {emptyMessage}
        </div>
      ) : (
        <Chart
          options={options}
          series={series}
          type="bar"
          height={Math.max(280, categories.length * 45)}
        />
      )}
    </div>
  );
};

export default ExecutiveClientOwnershipChart;
