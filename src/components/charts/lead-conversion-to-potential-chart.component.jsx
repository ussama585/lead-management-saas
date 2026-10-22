import React, { useState } from 'react';
import Chart from './apex-chart.jsx';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/lead-conversion-to-potential-chart.component.css';

const SOURCES = ['Meta', 'Data', 'Website'];

/**
 * Lead Conversion to Potential Clients
 * Grouped bar: X-axis Executive, Y-axis Potential Leads Count; 3 bars per executive (Meta, Data, Website) for comparison
 */
const LeadConversionToPotentialChart = ({
  title = 'Lead Conversion to Potential Clients',
  subtitle = 'Sum of all leads converted to Potential Client per Executive',
  dataBySource = {}, // { Meta: [], Data: [], Website: [] } - each array: [{ assigned_to_id?, assigned_to_name, potential_leads_count }]
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
  // Build unified executive list (id -> name), preserving first-seen order across Meta, Data, Website
  const execOrder = [];
  const execMap = new Map();
  SOURCES.forEach((src) => {
    const arr = dataBySource[src] ?? [];
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

  // One series per source (Meta, Data, Website); data aligned to execOrder – grouped bars for comparison
  const series = SOURCES.map((src) => {
    const arr = dataBySource[src] ?? [];
    const byId = new Map(arr.map((item) => {
      const id = item.assigned_to_id ?? item.id ?? item.assigned_to_name ?? 'unassigned';
      const count = Number(item.potential_leads_count ?? item.count ?? 0) || 0;
      return [id, count];
    }));
    const data = execOrder.map((id) => byId.get(id) ?? 0);
    return { name: src, data };
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
      formatter: (val) => (val != null && Number(val) > 0 ? String(val) : ''),
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
      labels: { style: { colors: '#333', fontSize: '12px' } },
      title: { text: 'Potential Leads Count', style: { color: '#666', fontSize: '12px' } },
      min: 0,
      tickAmount: 5,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      show: true,
    },
    grid: {
      borderColor: '#e8e8e8',
      padding: { top: 30, right: 10, bottom: 25, left: 10 },
    },
    tooltip: {
      y: { formatter: (val) => `${val ?? 0} potential clients` },
    },
  };

  const hasData = categories.length > 0;

  return (
    <div className="lead-conversion-to-potential-chart-container">
      <div className="lead-conversion-to-potential-chart-header">
        <div>
          <h2 className="lead-conversion-to-potential-chart-title">{title}</h2>
          <p className="lead-conversion-to-potential-chart-subtitle">{subtitle}</p>
        </div>
        <div className="lead-conversion-to-potential-chart-dropdown">
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
        <div className="lead-conversion-to-potential-chart-loading">Loading...</div>
      ) : !hasData ? (
        <div className="lead-conversion-to-potential-chart-empty">{emptyMessage}</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={350} />
      )}
    </div>
  );
};

export default LeadConversionToPotentialChart;
