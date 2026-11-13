import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import JobsSelectionTable from './jobs-selection-table.jsx';
import { message } from './ui/notifications.jsx';

const captured = vi.hoisted(() => ({ options: null }));
vi.mock('./tables/new-table.jsx', () => ({ default: ({ mrtOptions }) => { captured.options = mrtOptions; return null; } }));
vi.mock('./ui/notifications.jsx', () => ({ message: { error: vi.fn() } }));

const jobs = [{ id: 1, job_title: 'Developer', min_salary: 1000, max_salary: 2000, number_of_vacancies: 2 },
  { id: 2, job_title: 'Designer', min_salary: 1000, number_of_vacancies: 1 }];
const money = { 1: { chargesPerResource: '1,000', discountPerResource: '100', discount: '25' },
  2: { chargesPerResource: '', discountPerResource: '' } };
let selectionChange;
let rowChange;
function render(overrides = {}) {
  return renderToStaticMarkup(<JobsSelectionTable availableJobs={jobs} selectedJobIds={['1']} jobRowData={money}
    contractCurrency="Pakistani Rupee (PKR)" loading={false} jobsLoading={false} loadingProposal={false}
    onJobSelectionChange={selectionChange} onJobRowDataChange={rowChange} {...overrides} />);
}
function cell(id, index = 0) {
  return captured.options.columns.find(column => column.id === id).Cell({ row: { original: captured.options.data[index] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  captured.options = null;
  selectionChange = vi.fn();
  rowChange = vi.fn();
});

it('keeps the explicit financial selection rules instead of MRT row selection', () => {
  render();
  expect(captured.options.enableRowSelection).toBe(false);
  const header = captured.options.columns[0].Header();
  expect(header.props.checked).toBe(false);
  expect(header.props.indeterminate).toBe(true);
  header.props.onChange({ target: { checked: true } });
  expect(selectionChange).toHaveBeenLastCalledWith(['1']);
  header.props.onChange({ target: { checked: false } });
  expect(selectionChange).toHaveBeenLastCalledWith([]);
  cell('job_selection', 1).props.onChange({ target: { checked: true } });
  expect(selectionChange).toHaveBeenLastCalledWith(['1', '2']);
  cell('job_selection').props.onChange({ target: { checked: false } });
  expect(selectionChange).toHaveBeenLastCalledWith([]);
});

it('preserves salaries, resources, discounts and selected-only totals', () => {
  render();
  expect(cell('salary')).toBe('Rs. 1,000 - Rs. 2,000');
  expect(cell('resources')).toBe(2);
  expect(cell('after_discount')).toBe('Rs. 900');
  expect(cell('total')).toBe('Rs. 1,800');
  expect(cell('after_discount', 1)).toBe('');
  expect(cell('total', 1)).toBe('');
  expect(captured.options.getRowId(captured.options.data[0])).toBe('1');
});

it('retains charge formatting/reset and discount validation through editable input callbacks', () => {
  render();
  const charges = cell('charges');
  expect(charges.props.value).toBe('Rs. 1,000');
  charges.props.onChange({ target: { value: 'Rs. 2,500' } });
  expect(rowChange).toHaveBeenLastCalledWith('1', { ...money[1], chargesPerResource: '2,500', discount: '' });
  const discount = cell('discount');
  rowChange.mockClear();
  discount.props.onChange({ target: { value: '1,500' } });
  expect(rowChange).not.toHaveBeenCalled();
  expect(message.error).toHaveBeenCalledWith('Discount per resource cannot be greater than charges per resource');
  discount.props.onChange({ target: { value: 'Rs. 250' } });
  expect(rowChange).toHaveBeenLastCalledWith('1', { ...money[1], discountPerResource: '250' });
  const event = { target: { value: 'Rs. 1,000.25' } };
  charges.props.onFocus(event);
  // Preserve the existing focus normalizer, including the symbol's period.
  expect(event.target.value).toBe('.1000.25');
});

it('keeps read-only cells, disabled inputs and the no-checkbox mode', () => {
  render({ loading: true, showCheckboxes: false });
  expect(captured.options.columns.some(column => column.id === 'job_selection')).toBe(false);
  expect(cell('charges').props.disabled).toBe(true);
  expect(cell('discount').props.disabled).toBe(true);
  expect(cell('charges', 1)).toBe('');
});

it('preserves loading, empty and backend error outputs', () => {
  expect(render({ loadingProposal: true })).toContain('Loading proposal data...');
  expect(captured.options).toBeNull();
  expect(render({ jobsLoading: true })).toContain('Loading jobs...');
  expect(render({ availableJobs: [] })).toContain('Error');
  expect(render({ availableJobs: [], showCheckboxes: false })).toContain('No jobs available for this lead.');
  expect(render({ jobsError: 'Unable to load job pricing' })).toContain('Unable to load job pricing');
});
