import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import StatsCard from './stats-card.component.jsx';

it('shows dashboard counts without the percentage or comparison text', () => {
  const html = renderToStaticMarkup(<StatsCard title="Total Users" value={42} percentage={12.5} showTrend={false} />);
  expect(html).toContain('Total Users');
  expect(html).toContain('>42<');
  expect(html).not.toContain('12.5%');
  expect(html).not.toContain('Higher than last week');
  expect(html).not.toContain('dashboard-stat-card__trend');
});

it('retains completion information for target cards using the default', () => {
  const html = renderToStaticMarkup(<StatsCard title="Target" value={10} isTarget completion={50} />);
  expect(html).toContain('50%');
  expect(html).toContain('completed');
});
