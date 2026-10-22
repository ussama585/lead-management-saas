import ReactApexCharts from 'react-apexcharts';
import React, { useMemo } from 'react';
import { useAppTheme } from '../providers/app-theme-context.js';

// react-apexcharts 1.x uses exports.default. Depending on the bundler's
// CommonJS interop, the import can be the component or { default: component }.
const ChartComponent = ReactApexCharts.default ?? ReactApexCharts;

export default function ApexChart({ options, ...props }) {
  const mode = useAppTheme()?.mode || 'light';
  const type = props.type === 'line' ? 'area' : props.type;
  const isArea = type === 'area';
  const labelColor = mode === 'dark' ? '#cbd5e1' : '#64748b';
  const themedOptions = useMemo(() => ({
    ...options,
    theme: { ...options?.theme, mode },
    chart: { ...options?.chart, fontFamily: 'Inter, sans-serif', background: 'transparent', foreColor: labelColor, toolbar: { show: false }, zoom: { enabled: false } },
    tooltip: { ...options?.tooltip, theme: 'dark', ...(isArea && { shared: false, intersect: false, marker: { show: false }, x: { show: false } }) },
    grid: { ...options?.grid, borderColor: mode === 'dark' ? '#334155' : '#edf0f4', strokeDashArray: 0, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    xaxis: { ...options?.xaxis,
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { ...options?.xaxis?.labels, style: { ...options?.xaxis?.labels?.style, colors: labelColor, fontSize: '12px' } },
      crosshairs: { show: true, stroke: { color: '#3E6A9F', width: 1, dashArray: 5 } },
    },
    ...(isArea && {
      colors: ['#367bce', '#14b8a6', '#8b5cf6', '#f59e0b'],
      stroke: { ...options?.stroke, curve: 'smooth', width: 3 },
      fill: { type: 'gradient', gradient: { shade: mode, type: 'vertical', opacityFrom: 0.25, opacityTo: 0.01, stops: [0, 95, 100] } },
      dataLabels: { enabled: false },
      markers: { size: 0, strokeColors: mode === 'dark' ? '#151e30' : '#fff', strokeWidth: 3, hover: { size: 7 } },
    }),
  }), [options, mode, isArea, labelColor]);
  return <ChartComponent {...props} type={type} options={themedOptions} />;
}
