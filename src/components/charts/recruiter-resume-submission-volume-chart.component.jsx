import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/recruiter-resume-submission-volume-chart.component.css';

/**
 * Recruiter Resume Submission Volume
 * Count resumes linked via job_resume_batch, Group by recruiter
 * Measures sourcing effort - Identifies recruiters actively feeding the pipeline
 * Bar Chart: X-axis: Recruiter Name | Y-axis: Resume Count
 */
const RecruiterResumeSubmissionVolumeChart = ({
  title = 'CVs Submitted Per Recruiter',
  data = [], // [{ recruiter_name, resume_count, recruiter_id? }]
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
  const seriesData = data.map((item) => item.resume_count || 0);

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
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (val != null ? val : ''),
      offsetY: -20,
      style: { fontSize: '11px', colors: ['#000'] },
    },
    colors: ['#722ed1'],
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
      title: { text: 'Resume Count', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    grid: {
      borderColor: '#e8e8e8',
      padding: { top: 30, right: 10, bottom: 25, left: 10 },
    },
    tooltip: { y: { formatter: (val) => `${val} resumes` } },
    legend: { show: false },
  };

  const series = [{ name: 'Resume Count', data: seriesData }];
  const hasData = data && data.length > 0;

  return (
    <div className="recruiter-resume-submission-volume-chart-container">
      <div className="recruiter-resume-submission-volume-chart-header">
        <div>
          <h2 className="recruiter-resume-submission-volume-chart-title">{title}</h2>
          <p className="recruiter-resume-submission-volume-chart-subtitle">
            Identifies recruiters actively feeding the pipeline
          </p>
        </div>
        <div className="recruiter-resume-submission-volume-chart-dropdown">
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
        <div className="recruiter-resume-submission-volume-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="recruiter-resume-submission-volume-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default RecruiterResumeSubmissionVolumeChart;
