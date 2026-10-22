import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import { Select } from 'antd';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/overall-lead-conversion-rate-chart.component.css';

const LEAD_SOURCE_OPTIONS = [
  { label: 'Meta', value: 'Meta' },
  { label: 'Data', value: 'Data' },
  { label: 'Website', value: 'Website' },
];

const OverallLeadConversionRateChart = ({
  title = 'Overall Lead Conversion Rate',
  convertedCount = 0,
  totalCount = 0,
  selectedSource = 'Meta',
  onSourceChange,
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

  const total = Number(totalCount) || 0;
  const converted = Number(convertedCount) || 0;
  const percentage = total > 0 ? Math.min(100, Math.round((converted / total) * 100)) : 0;

  const options = {
    chart: { type: 'radialBar', toolbar: { show: false } },
    plotOptions: {
      radialBar: {
        hollow: { size: '60%' },
        track: { background: '#f0f0f0' },
        dataLabels: {
          name: { show: true, color: '#888', fontSize: '14px' },
          value: { show: true, fontSize: '28px', fontWeight: 600, formatter: (val) => val + '%' },
        },
      },
    },
    labels: ['Conversion Rate'],
    colors: ['#32D16D'],
    stroke: { lineCap: 'round' },
  };

  const series = [percentage];
  const hasData = total > 0;

  return (
    <div className="overall-lead-conversion-rate-chart-container">
      <div className="overall-lead-conversion-rate-chart-header">
        <div>
          <h2 className="overall-lead-conversion-rate-chart-title">{title}</h2>
          <p className="overall-lead-conversion-rate-chart-subtitle">Converted / Total - Sales efficiency indicator</p>
        </div>
        <div className="overall-lead-conversion-rate-chart-dropdown">
          <BootstrapDateRangeModal
            value={activeDateRange}
            onChange={onDateRangeChange}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={handleDateRangeDone}
          />
          <Select
            value={selectedSource}
            style={{ width: 140 }}
            onChange={onSourceChange}
            options={LEAD_SOURCE_OPTIONS}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="overall-lead-conversion-rate-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="overall-lead-conversion-rate-chart-empty">{emptyMessage}</div>
      ) : (
        <>
          <div className="overall-lead-conversion-rate-summary">
            {converted.toLocaleString()} / {total.toLocaleString()} leads
          </div>
          <Chart options={options} series={series} type="radialBar" height={280} />
        </>
      )}
    </div>
  );
};

export default OverallLeadConversionRateChart;
