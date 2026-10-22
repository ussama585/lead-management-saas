import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/recruiter-risk-exposure-chart.component.css';

/**
 * Recruiter Risk Exposure
 * Active jobs where cv_submission_deadline passed AND resumes < cvs_to_be_provided
 * Highlights recruiters blocking delivery timelines - Immediate admin intervention
 * Bar Chart with Red highlight
 */
const RecruiterRiskExposureChart = ({
  title = 'Jobs With Late Submission Per Recruiter',
  subtitle = 'No. Of jobs for which CVs were submitted after deadline',
  data = [], // [{ recruiter_name, at_risk_count, recruiter_id? }]
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
  const seriesData = data.map((item) => Number(item.at_risk_count) || 0);

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
      formatter: (val) => (typeof val === 'number' ? val : ''),
      offsetY: -20,
      style: { fontSize: '11px', colors: ['#000'] },
    },
    colors: ['#ff4d4f', '#ff7875', '#ffa39e', '#ffccc7', '#ffccc7', '#ffccc7'],
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
      title: {
        text: 'Jobs at Risk',
        style: { color: '#666', fontSize: '12px' },
      },
      min: 0,
      tickAmount: 5,
    },
    grid: {
      borderColor: '#e8e8e8',
      padding: { top: 30, right: 10, bottom: 25, left: 10 },
    },
    tooltip: { y: { formatter: (val) => `${val} jobs` } },
    legend: { show: false },
  };

  const series = [{ name: 'Jobs at Risk', data: seriesData }];
  const hasData = data && data.length > 0;

  return (
    <div className="recruiter-risk-exposure-chart-container">
      <div className="recruiter-risk-exposure-chart-header">
        <div>
          <h2 className="recruiter-risk-exposure-chart-title">{title}</h2>
          {subtitle && (
            <p className="recruiter-risk-exposure-chart-subtitle">
              {subtitle} — Immediate admin intervention
            </p>
          )}
        </div>
        <div className="recruiter-risk-exposure-chart-dropdown">
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
        <div className="recruiter-risk-exposure-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="recruiter-risk-exposure-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default RecruiterRiskExposureChart;
