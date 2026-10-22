import React, { useState } from 'react';
import Chart from './apex-chart.jsx';

const samples = {
  Yearly: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], values: [2200, 1500, 2800, 8495, 2400, 3200, 9800, 11900] },
  Monthly: { categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [3200, 8495, 5100, 11900] },
  Weekly: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [1200, 2100, 1600, 4200, 3200, 6400, 5800] },
};

export default function SalesPerformancePreview() {
  const [period, setPeriod] = useState('Yearly');
  const sample = samples[period];
  const options = {
    chart: { type: 'area' },
    xaxis: { categories: sample.categories, labels: { rotate: 0 } },
    yaxis: { min: 0, tickAmount: 6, labels: { formatter: value => `Rs ${value >= 1000 ? `${Number((value / 1000).toFixed(1))}k` : Math.round(value)}` } },
    tooltip: { y: { formatter: value => `Rs ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` } },
    legend: { show: false },
    grid: { padding: { left: 8, right: 12 } },
  };
  return <section className='sales-performance-preview-chart-container mb-6' aria-label='Sales performance preview'>
    <div className='sales-performance-preview-chart-header'>
      <div>
        <h2 className='sales-performance-preview-chart-title'>Sales Performance</h2>
        <p className='sales-performance-preview-chart-subtitle'>Sample revenue over time <span className='ml-2 rounded bg-muted px-2 py-1 text-xs'>Demo data</span></p>
      </div>
      <select aria-label='Sales performance period' value={period} onChange={event => setPeriod(event.target.value)} className='rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm'>
        {Object.keys(samples).map(value => <option key={value}>{value}</option>)}
      </select>
    </div>
    <Chart options={options} series={[{ name: 'Revenue', data: sample.values }]} type='area' height={350} />
  </section>;
}
