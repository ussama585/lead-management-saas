import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import ExecutivePerformanceLeaderboardChart from './executive-performance-leaderboard-chart.component.jsx';
import RecruiterPerformanceLeaderboardChart from './recruiter-performance-leaderboard-chart.component.jsx';

const capture = vi.hoisted(() => ({ options: null }));
vi.mock('../tables/new-table.jsx', () => ({ default: ({ mrtOptions }) => {
  capture.options = mrtOptions;
  return <div>Shared table</div>;
} }));
vi.mock('../bootstrap-date-range-modal.component.jsx', () => ({ default: () => null }));
beforeEach(() => { capture.options = null; });

it('keeps every executive visible and preserves rank keys, coloring and formatted revenue', () => {
  const records = Array.from({ length: 12 }, (_, index) => ({ assigned_to_id: index + 10, assigned_to_name: `Executive ${index}`, revenue_amount: 1500 }));
  renderToStaticMarkup(<ExecutivePerformanceLeaderboardChart data={records} />);
  const options = capture.options;
  expect(options.enablePagination).toBe(false);
  expect(options.data).toHaveLength(12);
  expect(options.getRowId(options.data[0])).toBe('10');
  expect(options.muiTableBodyRowProps({ row: { original: options.data[0] } }).className).toBe('leaderboard-row-1st');
  const revenue = options.columns.find(column => column.id === 'revenue_amount');
  expect(revenue.Cell({ cell: { getValue: () => 1500 }, row: { original: options.data[0], index: 0 } })).toBe('Rs 1,500');
});

it('keeps recruiter data and medals without sorting, selecting or paginating rankings', () => {
  const records = [{ rank: 1, recruiter_name: 'First', total_jobs: 14 }, { rank: 3, recruiter_name: 'Third', total_jobs: 7 }];
  renderToStaticMarkup(<RecruiterPerformanceLeaderboardChart data={records} />);
  const options = capture.options;
  expect(options.data).toBe(records);
  expect(options.enablePagination).toBe(false);
  expect(options.enableSorting).toBe(false);
  expect(options.enableRowSelection).toBe(false);
  expect(options.muiTableBodyRowProps({ row: { original: records[1] } }).className).toBe('recruiter-row-3');
  expect(options.getRowId(records[1], 1)).toBe('1');
});

it('preserves the existing empty state instead of rendering an empty ranking table', () => {
  const html = renderToStaticMarkup(<ExecutivePerformanceLeaderboardChart data={[]} emptyMessage="No results" />);
  expect(html).toContain('No results');
  expect(capture.options).toBeNull();
});
