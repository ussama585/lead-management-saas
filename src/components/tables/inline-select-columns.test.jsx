import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { Select } from '../ui/app-select.jsx';
import { inlineSelectColumns } from './inline-select-columns.jsx';

function setup(disabled = false) {
  const onChange = vi.fn();
  const [column] = inlineSelectColumns([{ header: 'Assigned To', accessorKey: 'assigned_to_name',
    Cell: () => <Select value="2" disabled={disabled} options={[{ value: '1', label: 'Ali' }, { value: '2', label: 'Ali' }]} onChange={onChange} /> }]);
  const cell = { column: { id: 'assigned_to_name' } };
  const row = { getAllCells: () => [cell] };
  const table = { setEditingCell: vi.fn() };
  return { column, args: { cell, row, table }, onChange, table };
}

it('displays text until the user opens native cell editing', () => {
  const { column, args, table } = setup();
  const view = column.Cell(args);
  expect(view.type).toBe('button');
  expect(view.props.children).toBe('Ali');
  view.props.onClick({ stopPropagation: vi.fn() });
  expect(table.setEditingCell).toHaveBeenCalledWith(args.cell);
  expect(column.enableEditing(args.row)).toBe(true);
});

it('preserves ID-based assignment and closes the editor after a change', () => {
  const { column, args, onChange, table } = setup();
  const editor = column.Edit(args);
  expect(editor.props.value).toBe('2');
  expect(editor.props.autoFocus).toBeUndefined();
  expect(editor.props.InputProps?.disableUnderline).not.toBe(true);
  editor.props.onChange({ target: { value: '1' } });
  expect(onChange).toHaveBeenCalledWith('1');
  expect(table.setEditingCell).toHaveBeenLastCalledWith(null);
});

it('keeps disabled permissions and cancels without saving', () => {
  const { column, args, onChange, table } = setup(true);
  expect(column.enableEditing(args.row)).toBe(false);
  expect(column.Cell(args).props.disabled).toBe(true);
  column.Edit(args).props.onKeyDown({ key: 'Escape', stopPropagation: vi.fn() });
  expect(table.setEditingCell).toHaveBeenCalledWith(null);
  expect(onChange).not.toHaveBeenCalled();
});

it('retains existing explicit editors and never edits plain text columns', () => {
  const existing = { accessorKey: 'name', enableEditing: false, Cell: () => <span>Name</span> };
  expect(inlineSelectColumns([existing])[0]).toBe(existing);
  const plain = { accessorKey: 'name', Cell: () => <span>Name</span> };
  const [column] = inlineSelectColumns([plain]);
  const cell = { column: { id: 'name' } };
  expect(column.enableEditing({ getAllCells: () => [cell] })).toBe(false);
});

it('never enables automatic text editors for accessor-only or custom text editor columns', () => {
  const columns = inlineSelectColumns([
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email', enableEditing: true },
    { header: 'Notes', accessorKey: 'notes', Edit: () => <input /> },
  ]);
  expect(columns.every(column => column.enableEditing === false)).toBe(true);
});

it('only retains explicitly identified dropdown editors', () => {
  const [column] = inlineSelectColumns([{ accessorKey: 'status', Edit: () => <Select />, meta: { inlineDropdown: true } }]);
  expect(column.enableEditing).toBe(true);
});

it('uses the same native inline field for existing job dropdown editors', () => {
  function JobEditor() {
    const [value, setValue] = React.useState('Full Time');
    return <Select value={value} options={[{ value: 'Full Time', label: 'Full Time' }]} onChange={setValue} />;
  }
  const [column] = inlineSelectColumns([{ header: 'Job Type', accessorKey: 'job_type', Edit: JobEditor, meta: { inlineDropdown: true } }]);
  const html = renderToStaticMarkup(column.Edit({}));
  expect(html).toContain('table-inline-edit-editor');
  expect(html).toContain('role="combobox"');
  expect(html).not.toContain('data-slot="select-trigger"');
});

it('preserves adjacent cell content and avoids saving an unchanged selection', () => {
  const onChange = vi.fn();
  const [column] = inlineSelectColumns([{ header: 'Status', accessorKey: 'status',
    Cell: () => <div><Select value="Active" options={[{ value: 'Active', label: 'Active' }]} onChange={onChange} /><span>Additional action</span></div> }]);
  const table = { setEditingCell: vi.fn() };
  const args = { table, cell: {}, row: {} };
  const view = column.Cell(args);
  expect(view.type).toBe('div');
  expect(view.props.children[1].props.children).toBe('Additional action');
  column.Edit(args).props.onChange({ target: { value: 'Active' } });
  expect(onChange).not.toHaveBeenCalled();
});
