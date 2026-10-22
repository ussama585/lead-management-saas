import React, { useState, useMemo } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/projects-by-status-per-executive-chart.component.css';

const STATUS_ORDER = [
  'Active',
  'Delayed',
  'Completed',
  'Completed - Payment Pending',
  'Completed - Defaulter',
  'Terminated By Client',
  'Terminated By Client + Refunded',
  'Terminated By Search O Pal',
  'Terminated By Search O Pal + Refunded',
];

/**
 * Projects by Status per Executive
 * Delivery success and execution consistency - filter by executive
 * Stacked Bar Chart: X-axis: Status | Y-axis: Project Count | Stack: Executive (when All)
 */
const ProjectsByStatusPerExecutiveChart = ({
  title = 'Projects by Status per Executive',
  data = {}, // { All: [{ status, exec1, exec2, ... }], ... }
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

  const rawChartData = useMemo(() => data.All || [], [data]);
  const byStatus = useMemo(() => {
    const map = {};
    rawChartData.forEach((row) => {
      const s = row.status || 'Unknown';
      map[s] = row;
    });
    return map;
  }, [rawChartData]);

  const categories = STATUS_ORDER;

  const execKeys = rawChartData.length > 0
    ? Object.keys(rawChartData[0]).filter((k) => k !== 'status')
    : [];
  const execLabels = execKeys.map((id) => {
    const exec = executives.find((e) => String(e.id) === id);
    return exec?.name || id;
  });

  const series = execKeys.length > 0
    ? execKeys.map((key, i) => ({
        name: execLabels[i] || key,
        data: categories.map((status) => Number(byStatus[status]?.[key]) || 0),
      }))
    : [{ name: 'Projects', data: categories.map((status) => Number(byStatus[status]?.count) || 0) }];

  const barTotals = categories.map((status) =>
    execKeys.length > 0
      ? execKeys.reduce((sum, key) => sum + (Number(byStatus[status]?.[key]) || 0), 0)
      : Number(byStatus[status]?.count) || 0
  );

  const colors = ['#2DB1F8', '#32D16D', '#faad14', '#ff4d4f', '#8c8c8c', '#722ed1', '#eb2f96'];

  const options = {
    chart: {
      type: 'bar',
      stacked: execKeys.length > 1,
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
        // Show sum only on the top segment (last series) of each bar
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
      title: { text: 'Status', style: { color: '#666', fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { colors: '#333', fontSize: '12px' } },
      title: { text: 'Project Count', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      show: execKeys.length > 1,
    },
    grid: {
      borderColor: '#e8e8e8',
      padding: { top: 30, right: 10, bottom: 25, left: 10 },
    },
    tooltip: {
      y: { formatter: (val) => `${val} projects` },
    },
  };

  const hasData = rawChartData && rawChartData.length > 0;

  return (
    <div className="projects-by-status-per-executive-chart-container">
      <div className="projects-by-status-per-executive-chart-header">
        <div>
          <h2 className="projects-by-status-per-executive-chart-title">{title}</h2>
          <p className="projects-by-status-per-executive-chart-subtitle">
            Delivery success · Early warning for stalled projects
          </p>
        </div>
        <div className="projects-by-status-per-executive-chart-dropdowns">
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
        <div className="projects-by-status-per-executive-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="projects-by-status-per-executive-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default ProjectsByStatusPerExecutiveChart;
