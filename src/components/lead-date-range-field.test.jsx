import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import dayjs from 'dayjs';
import { expect, it, vi } from 'vitest';
import LeadDateRangeField from './lead-date-range-field.jsx';
import DateRange from './bootstrap-date-range-modal.component.jsx';

const value = [dayjs('2026-11-01'), dayjs('2026-11-20')];

it('gives standalone date filters an internal clear control', () => {
  const html = renderToStaticMarkup(<DateRange value={value} showModal={false} setShowModal={vi.fn()} onDone={vi.fn()} />);
  expect(html.match(/class="lead-date-range-field"/g)).toHaveLength(1);
  expect(html.match(/aria-label="Clear date range"/g)).toHaveLength(1);
});

it('does not duplicate the field or clear button when already wrapped', () => {
  const html = renderToStaticMarkup(<LeadDateRangeField hasValue onClear={vi.fn()}>
    <DateRange value={value} showModal={false} setShowModal={vi.fn()} onDone={vi.fn()} />
  </LeadDateRangeField>);
  expect(html.match(/class="lead-date-range-field"/g)).toHaveLength(1);
  expect(html.match(/aria-label="Clear date range"/g)).toHaveLength(1);
});

it('shows the same placeholder without a clear icon when empty', () => {
  const html = renderToStaticMarkup(<DateRange value={null} showModal={false} setShowModal={vi.fn()} onDone={vi.fn()} />);
  expect(html).toContain('Filter by date range');
  expect(html).not.toContain('aria-label="Clear date range"');
});
