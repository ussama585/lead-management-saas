import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/cv-pool-source-hired-chart.component.css';

const COLORS = ['#3E6A9F', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2'];

const CvPoolSourceHiredChart = ({
  title = 'Job Resume Source Stats',
  subtitle = 'Hired candidates by CV source',
  totalJoined = 0,
  stats = [],
  isLoading = false,
  emptyMessage = 'No hired candidates to display',
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

  const rows = (Array.isArray(stats) ? stats : [])
    .map((s) => ({ source: s.source || 'Unknown', count: Number(s.joined_count) || 0 }))
    .filter((s) => s.count > 0);
  const labels = rows.map((s) => s.source);
  const series = rows.map((s) => s.count);
  const hasData = series.length > 0;

  const options = {
    chart: {
      type: 'pie',
      toolbar: { show: false },
    },
    labels,
    colors: COLORS,
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => {
        const label = opts.w.globals.labels[opts.seriesIndex];
        const count = opts.w.globals.series[opts.seriesIndex];
        return [label, `${count}`];
      },
      style: {
        fontSize: '12px',
        fontWeight: 600,
      },
      dropShadow: {
        enabled: false,
      },
      offsetX: 0,
      offsetY: 0,
    },
    plotOptions: {
      pie: {
        dataLabels: {
          offset: -40,
        },
      },
    },
    legend: {
      show: true,
      position: 'bottom',
    },
    tooltip: {
      y: {
        formatter: (value) => `${value}`,
        title: {
          formatter: (seriesName) => `${seriesName}: `,
        },
      },
    },
    stroke: {
      width: 1,
      colors: ['#fff'],
    },
  };

  return (
    <div className="cv-pool-source-hired-chart-container">
      <div className="cv-pool-source-hired-chart-header">
        <div>
          <h2 className="cv-pool-source-hired-chart-title">{title}</h2>
          <p className="cv-pool-source-hired-chart-subtitle">{subtitle}</p>
        </div>
        <div className="cv-pool-source-hired-chart-dropdowns">
          <div className="cv-pool-source-hired-chart-dropdown">
            <BootstrapDateRangeModal
              value={activeDateRange}
              onChange={onDateRangeChange}
              showModal={showDateRangeModal}
              setShowModal={setShowDateRangeModal}
              onDone={handleDateRangeDone}
            />
          </div>
          <div className="cv-pool-source-hired-chart-total">
            Total Joined: <strong>{Number(totalJoined) || 0}</strong>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="cv-pool-source-hired-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="cv-pool-source-hired-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="pie" height={320} />
      )}
    </div>
  );
};

export default CvPoolSourceHiredChart;
