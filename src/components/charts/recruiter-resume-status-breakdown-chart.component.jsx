import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import { Select } from 'antd';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/recruiter-resume-status-breakdown-chart.component.css';

// API status keys in display order (includes all keys from recruiter-status-breakdown API)
const STATUS_ORDER = [
  'Shortlisted',
  'Interview Scheduled',
  'Interview Conducted',
  'Interview Not Conducted By Client',
  'Candidate Did Not Appear In Interview',
  'On Hold',
  'Offer Made',
  'Offer Rejected',
  'Joined',
  'Hired',
  'Rejected',
  'Rejected After CV Review With Valid Reason',
  'Rejected After CV Review With Invalid Reason',
  'Rejected After CV Review Without Reason',
  'Rejected After Interview With Valid Reason',
  'Rejected After Interview With Invalid Reason',
  'Rejected After Interview Without Reason',
  'Candidate Resigned',
  'Terminated By Company',
];

const STATUS_COLORS = [
  '#1890ff', // Shortlisted
  '#722ed1', // Interview Scheduled
  '#13c2c2', // Interview Conducted
  '#597ef7', // Interview Not Conducted By Client
  '#9254de', // Candidate Did Not Appear In Interview
  '#eb2f96', // On Hold
  '#36cfc9', // Offer Made
  '#fa541c', // Offer Rejected
  '#2DB1F8', // Joined
  '#52c41a', // Hired
  '#ff4d4f', // Rejected
  '#cf1322', // Rejected After CV Review With Valid Reason
  '#a8071a', // Rejected After CV Review With Invalid Reason
  '#820014', // Rejected After CV Review Without Reason
  '#ad2102', // Rejected After Interview With Valid Reason
  '#d4380d', // Rejected After Interview With Invalid Reason
  '#d46b08', // Rejected After Interview Without Reason
  '#7c4dff', // Candidate Resigned
  '#4a148c', // Terminated By Company
];

const STATUS_SELECT_OPTIONS = STATUS_ORDER.map((name) => ({ label: name, value: name }));

const DEFAULT_SELECTED_STATUSES = ['Hired'];

/**
 * Recruiter Resume Status Breakdown
 * API: { data: [{ recruiter_id, recruiter_name, ...statusCounts }] }
 * Grouped Bar Chart: X-axis: Recruiter | Y-axis: Resume Count | Bars: selected CV statuses
 */
const RecruiterResumeStatusBreakdownChart = ({
  title = 'Recruiter CV Status Breakdown',
  data = [], // API shape: [{ recruiter_id, recruiter_name, ...statusCounts }]
  selectedStatuses: selectedStatusesProp,
  onStatusChange,
  isLoading = false,
  emptyMessage = 'No data to display',
  dateRange,
  onDateRangeChange,
}) => {
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [internalDateRange, setInternalDateRange] = useState(dateRange ?? [dayjs().startOf('month'), dayjs().endOf('month')]);
  const [internalStatuses, setInternalStatuses] = useState(DEFAULT_SELECTED_STATUSES);
  const selectedStatuses = selectedStatusesProp ?? internalStatuses;
  const setSelectedStatuses = (vals) => {
    if (onStatusChange) onStatusChange(Array.isArray(vals) && vals.length > 0 ? vals : DEFAULT_SELECTED_STATUSES);
    else setInternalStatuses(Array.isArray(vals) && vals.length > 0 ? vals : DEFAULT_SELECTED_STATUSES);
  };
  const activeDateRange = dateRange ?? internalDateRange;
  const handleDateRangeDone = (range) => {
    setInternalDateRange(range);
    onDateRangeChange?.(range);
  };

  const categories = data.map((item) => item.recruiter_name || 'Unassigned');

  const series =
    selectedStatuses.length > 0
      ? selectedStatuses.map((statusName) => ({
          name: statusName,
          data: data.map((d) => Number(d[statusName]) || 0),
        }))
      : [{ name: 'Hired', data: data.map((d) => Number(d['Hired']) || 0) }];

  const seriesColors =
    selectedStatuses.length > 0
      ? selectedStatuses.map((s) => STATUS_COLORS[STATUS_ORDER.indexOf(s)] ?? '#8c8c8c')
      : [STATUS_COLORS[STATUS_ORDER.indexOf('Hired')]];

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
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (val != null && Number(val) > 0 ? String(val) : ''),
      offsetY: -25,
      style: { fontSize: '11px', colors: ['#000'] },
    },
    colors: seriesColors,
    xaxis: {
      categories,
      labels: {
        style: { colors: '#333', fontSize: '11px' },
        rotate: -45,
        rotateAlways: categories?.length > 5,
      },
      axisBorder: { show: true, color: '#e8e8e8' },
      axisTicks: { show: true },
      title: { text: 'Recruiter', style: { color: '#666', fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { colors: '#333', fontSize: '12px' } },
      title: { text: 'CV Count', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
    },
    grid: {
      borderColor: '#e8e8e8',
      padding: { top: 30, right: 10, bottom: 25, left: 10 },
    },
    tooltip: {
      y: { formatter: (val) => `${val} CVs` },
    },
  };

  const hasData = data && data.length > 0;

  return (
    <div className="recruiter-resume-status-breakdown-chart-container">
      <div className="recruiter-resume-status-breakdown-chart-header">
        <div>
          <h2 className="recruiter-resume-status-breakdown-chart-title">{title}</h2>
          <p className="recruiter-resume-status-breakdown-chart-subtitle">
            Early detection of low-quality sourcing
          </p>
        </div>
        <div className="recruiter-resume-status-breakdown-chart-dropdown">
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
            value={selectedStatuses.length > 0 ? selectedStatuses : DEFAULT_SELECTED_STATUSES}
            onChange={(vals) => setSelectedStatuses(Array.isArray(vals) ? vals : [])}
            options={STATUS_SELECT_OPTIONS}
            placeholder="CV statuses"
            style={{ minWidth: 220, maxWidth: 360 }}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="recruiter-resume-status-breakdown-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="recruiter-resume-status-breakdown-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default RecruiterResumeStatusBreakdownChart;
