import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/average-jobs-per-project-chart.component.css';

const SOURCES_LEAD_TYPE = ['Meta', 'Data', 'Website'];
const SOURCE_ALL = 'All';

// Get array for a key from dataBySource (supports both 'All' and 'all', etc.)
const getSourceArray = (dataBySource, key) => {
  const arr = dataBySource[key] ?? dataBySource[key?.toLowerCase()] ?? [];
  return Array.isArray(arr) ? arr : [];
};


const AverageJobsPerProjectChart = ({
  title = 'Average Jobs per Project',
  subtitle = 'Project complexity and multi-role capability per executive',
  dataBySource = {},
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

  const allArray = getSourceArray(dataBySource, SOURCE_ALL);
  const hasAllFormat = allArray.length > 0;

  // Source keys to use: either ["All"] or ["Meta", "Data", "Website"]
  const sourceKeys = hasAllFormat
    ? [SOURCE_ALL]
    : SOURCES_LEAD_TYPE.filter((src) => getSourceArray(dataBySource, src).length > 0).length > 0
      ? SOURCES_LEAD_TYPE
      : [SOURCE_ALL];

  // Build unified executive list from whichever sources we have
  const execOrder = [];
  const execMap = new Map();
  const arraysToScan = hasAllFormat ? [allArray] : sourceKeys.map((k) => getSourceArray(dataBySource, k));
  arraysToScan.forEach((arr) => {
    arr.forEach((item) => {
      const id = item.assigned_to_id ?? item.id ?? item.assigned_to_name ?? 'unassigned';
      const name = item.assigned_to_name ?? item.executive_name ?? item.name ?? 'Unassigned';
      if (!execMap.has(id)) {
        execMap.set(id, name);
        execOrder.push(id);
      }
    });
  });
  const categories = execOrder.map((id) => execMap.get(id));

  // One series per source; data aligned to execOrder
  const series = sourceKeys.map((src) => {
    const arr = getSourceArray(dataBySource, src);
    const byId = new Map(
      arr.map((item) => {
        const id = item.assigned_to_id ?? item.id ?? item.assigned_to_name ?? 'unassigned';
        const avg = Number(item.average_jobs_per_project ?? item.avg_jobs_per_project ?? item.average) || 0;
        return [id, avg];
      }),
    );
    const data = execOrder.map((id) => byId.get(id) ?? 0);
    const seriesName = src === SOURCE_ALL ? 'Average' : src;
    return { name: seriesName, data };
  });

  const colors = ['#2DB1F8', '#32D16D', '#faad14', '#ff4d4f', '#8c8c8c', '#722ed1', '#eb2f96'];

  const options = {
    chart: {
      type: 'bar',
      stacked: false,
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
      formatter: (val) => (val != null && Number(val) > 0 ? Number(val).toFixed(2) : ''),
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
      labels: {
        formatter: (val) => Number(val).toFixed(2),
        style: { colors: '#333', fontSize: '12px' },
      },
      title: { text: 'Average Jobs per Project', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      show: series.length > 1,
    },
    grid: {
      borderColor: '#e8e8e8',
      padding: { top: 30, right: 10, bottom: 25, left: 10 },
    },
    tooltip: {
      y: { formatter: (val) => `${Number(val ?? 0).toFixed(2)} jobs` },
    },
  };

  const hasData = categories.length > 0 && series.some((s) => s.data.some((v) => v > 0));

  return (
    <div className="average-jobs-per-project-chart-container">
      <div className="average-jobs-per-project-chart-header">
        <div>
          <h2 className="average-jobs-per-project-chart-title">{title}</h2>
          <p className="average-jobs-per-project-chart-subtitle">{subtitle}</p>
        </div>
        <div className="average-jobs-per-project-chart-dropdown">
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
        <div className="average-jobs-per-project-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="average-jobs-per-project-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default AverageJobsPerProjectChart;
