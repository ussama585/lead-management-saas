import React, { useState, useMemo } from 'react';
import Chart from './apex-chart.jsx';
import { Select } from 'antd';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/clients-projects-activated-per-day-chart.component.css';

/**
 * Clients and Projects Activated Per Day
 * Bar chart: two vertical bars per day (activated clients, activated projects)
 * X-axis: dates | Y-axis: count
 * data: [{ date, activated_clients, activated_projects }] or [{ date, clients, projects }]
 */
const ClientsProjectsActivatedPerDayChart = ({
  title = 'Clients and Projects Activated Per Day',
  subtitle = 'Show activated clients and projects as two separate vertical bars per day',
  data = [],
  isLoading = false,
  emptyMessage = 'No data to display',
  dateRange,
  onDateRangeChange,
  executives = [],
  selectedExecutive = 'All',
  onExecutiveChange,
}) => {
  const executiveOptions = [
    { label: 'All Executives', value: 'All' },
    ...executives.map((e) => ({ label: e.name, value: String(e.id) })),
  ];
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [internalDateRange, setInternalDateRange] = useState(dateRange ?? [dayjs().startOf('month'), dayjs().endOf('month')]);
  const activeDateRange = dateRange ?? internalDateRange;
  const handleDateRangeDone = (range) => {
    setInternalDateRange(range);
    onDateRangeChange?.(range);
  };

  const categories = useMemo(
    () =>
      data.map((d) => {
        const raw = d.date ?? d.period ?? d.label ?? '';
        if (!raw) return '';
        if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          const [y, m, day] = raw.split('-');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${day} ${months[parseInt(m, 10) - 1]} ${y}`;
        }
        return String(raw);
      }),
    [data]
  );

  const clientsData = useMemo(
    () => data.map((d) => Number(d.activated_clients ?? d.clients ?? 0) || 0),
    [data]
  );
  const projectsData = useMemo(
    () => data.map((d) => Number(d.activated_projects ?? d.projects ?? 0) || 0),
    [data]
  );

  const series = [
    { name: 'Activated Clients', data: clientsData },
    { name: 'Activated Projects', data: projectsData },
  ];

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
      formatter: (val) => (typeof val === 'number' && val > 0 ? val : ''),
      offsetY: -20,
      style: { fontSize: '11px', colors: ['#000'] },
    },
    colors: ['#3E6A9F', '#52c41a'],
    xaxis: {
      categories,
      labels: {
        style: { colors: '#333', fontSize: '11px' },
        rotate: -45,
        rotateAlways: categories?.length > 6,
      },
      axisBorder: { show: true, color: '#e8e8e8' },
      axisTicks: { show: true },
      title: { text: 'Date', style: { color: '#666', fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { colors: '#333', fontSize: '12px' } },
      title: { text: 'Count', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    grid: { borderColor: '#e8e8e8', padding: { top: 30, right: 10, bottom: 25, left: 10 } },
    tooltip: {
      y: { formatter: (val) => `${val ?? 0}` },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
    },
  };

  const hasData = data && data.length > 0;

  return (
    <div className="clients-projects-activated-per-day-chart-container">
      <div className="clients-projects-activated-per-day-chart-header">
        <div>
          <h2 className="clients-projects-activated-per-day-chart-title">{title}</h2>
          {subtitle && (
            <p className="clients-projects-activated-per-day-chart-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="clients-projects-activated-per-day-chart-dropdown">
          <Select
            value={selectedExecutive}
            style={{ width: 180 }}
            onChange={onExecutiveChange}
            options={executiveOptions}
            placeholder="All Executives"
          />
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
        <div className="clients-projects-activated-per-day-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="clients-projects-activated-per-day-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default ClientsProjectsActivatedPerDayChart;
