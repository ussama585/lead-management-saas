import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/recruiter-project-involvement-chart.component.css';

/**
 * Recruiter Project Involvement
 * Count projects where recruiter != null, Group by recruiter
 * Shows recruiter participation in delivery - Balanced workload distribution
 * Horizontal Bar Chart: X-axis: Project Count | Y-axis: Recruiter Name
 */
const RecruiterProjectInvolvementChart = ({
  title = 'Project Per Recruiter',
  data = [], // [{ recruiter_name, project_count, recruiter_id? }]
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

  const categories = data.map((item) => item.recruiter_name || 'Unassigned');
  const seriesData = data.map((item) => item.project_count || 0);

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
        dataLabels: {
          position: 'top',
        },
        distributed: false,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (typeof val === 'number' ? val : ''),
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#000'],
      },
    },
    colors: ['#722ed1'],
    xaxis: {
      categories,
      labels: {
        style: {
          colors: '#333',
          fontSize: '12px',
        },
        rotate: -45,
        rotateAlways: categories?.length > 5,
      },
      axisBorder: { show: true, color: '#e8e8e8' },
      axisTicks: { show: true },
      title: {
        text: 'Recruiter',
        style: { color: '#666', fontSize: '12px' },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#333',
          fontSize: '12px',
        },
      },
      title: {
        text: 'Project Count',
        style: { color: '#666', fontSize: '12px' },
      },
      min: 0,
      tickAmount: 5,
    },
    grid: {
      borderColor: '#e8e8e8',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
      padding: { top: 30, right: 30, bottom: 0, left: 10 },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} projects`,
      },
    },
    legend: { show: false },
  };

  const series = [
    {
      name: 'Project Count',
      data: seriesData,
    },
  ];

  const hasData = data && data.length > 0;

  return (
    <div className="recruiter-project-involvement-chart-container">
      <div className="recruiter-project-involvement-chart-header">
        <div>
          <h2 className="recruiter-project-involvement-chart-title">{title}</h2>
          <p className="recruiter-project-involvement-chart-subtitle">
            Projects with assigned recruiter — Balanced workload distribution
          </p>
        </div>
        <div className="recruiter-project-involvement-chart-dropdown">
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
        <div className="recruiter-project-involvement-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="recruiter-project-involvement-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart
          options={options}
          series={series}
          type="bar"
          height={Math.max(280, data.length * 45)}
        />
      )}
    </div>
  );
};

export default RecruiterProjectInvolvementChart;
