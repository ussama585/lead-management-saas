import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-apexcharts', () => ({
  default: { default: ({ series }) => <div data-testid='chart'>{series[0].data.join(',')}</div> },
}));
vi.mock('../bootstrap-date-range-modal.component.jsx', () => ({ default: () => null }));

import ExecutiveMobilisationAmountsChart from './executive-mobilisation-amounts-chart.component.jsx';

describe('executive mobilisation chart', () => {
  it('renders data when the chart dependency has a CommonJS default wrapper', () => {
    const html = renderToStaticMarkup(<ExecutiveMobilisationAmountsChart data={[{ assigned_to_name: 'Sales Executive', mobilisation_amount: '1500' }]} />);
    expect(html).toContain('data-testid="chart"');
    expect(html).toContain('1500');
  });
  it('keeps the empty and loading states', () => {
    expect(renderToStaticMarkup(<ExecutiveMobilisationAmountsChart />)).toContain('No data to display');
    expect(renderToStaticMarkup(<ExecutiveMobilisationAmountsChart isLoading />)).toContain('Loading...');
  });
});
