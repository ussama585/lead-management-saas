import React from 'react';
import { expect, it, vi } from 'vitest';
import { companyBeforeName, tablePresentation } from './table-presentation.jsx';

it('centers missing values without hiding zero or false', () => {
  const [column] = tablePresentation([{ accessorKey: 'value' }]);
  for (const value of [null, undefined, '', ' ', '-']) {
    expect(column.Cell({ cell: { getValue: () => value } }).props.className).toBe('table-empty-value');
  }
  expect(column.Cell({ cell: { getValue: () => 0 } }).props.children).toBe(0);
  expect(column.Cell({ cell: { getValue: () => false } })).toBe('false');
});

it('centers experience and formatted salary columns while preserving phone formatting', () => {
  for (const accessorKey of ['min_experience', 'max_experience', 'min_salary', 'max_salary']) {
    const [column] = tablePresentation([{ accessorKey, Cell: () => <span>5,000</span> }]);
    expect(column.muiTableHeadCellProps({}).align).toBe('center');
    expect(column.Cell({ cell: { getValue: () => 5000 } }).props.className).toBe('table-centered-value');
  }
  const [phone] = tablePresentation([{ accessorKey: 'phone_number' }]);
  expect(phone.Cell({ cell: { getValue: () => '03001234567' } })).toBe('03001234567');
});

it('preserves actions and computed cell content even when their raw values are absent', () => {
  const open = vi.fn();
  const action = <button onClick={open}>View history</button>;
  const [column, computed] = tablePresentation([
    { accessorKey: 'history', Cell: () => action },
    { accessorKey: 'company', Cell: ({ row }) => <span>{row.original.company?.name}</span> },
  ]);
  expect(column.Cell({ cell: { getValue: () => null } })).toBe(action);
  expect(open).not.toHaveBeenCalled();
  expect(computed.Cell({ row: { original: { company: { name: 'Example' } } }, cell: {} }).props.children).toBe('Example');
});

it('keeps existing header props and centers select and resource headings', () => {
  const [column] = tablePresentation([{ accessorKey: 'total_vacancies', muiTableHeadCellProps: () => ({ title: 'Resources', sx: { color: 'red' } }) }]);
  expect(column.muiTableHeadCellProps({})).toMatchObject({ title: 'Resources', align: 'center' });
  expect(column.muiTableHeadCellProps({}).sx[0]).toEqual({ color: 'red' });
});

it('puts Company before Name and leaves other table orders intact', () => {
  expect(companyBeforeName([{ id: 'id' }, { id: 'full_name' }, { id: 'company_name' }, { id: 'actions' }]).map(c => c.id))
    .toEqual(['id', 'company_name', 'full_name', 'actions']);
  const columns = [{ id: 'job_title' }, { id: 'status' }];
  expect(companyBeforeName(columns)).toEqual(columns);
});

it('left-aligns text headings and values despite existing centered styles', () => {
  for (const accessorKey of ['company_name', 'status', 'assigned_to_name', 'project_size']) {
    const [column] = tablePresentation([{ accessorKey, muiTableHeadCellProps: { align: 'center' }, muiTableBodyCellProps: { align: 'center', sx: { color: 'red' } } }]);
    expect(column.muiTableHeadCellProps({}).align).toBe('left');
    expect(column.muiTableBodyCellProps({ cell: { getValue: () => 'Example' } })).toMatchObject({ align: 'left' });
    expect(column.muiTableBodyCellProps({ cell: { getValue: () => 'Example' } }).sx[0]).toEqual({ color: 'red' });
  }
});

it('normalizes pill spacing without altering its colors or callback', () => {
  const onClick = vi.fn();
  const style = { color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: 4 };
  const [column] = tablePresentation([{ accessorKey: 'status', Cell: () => <span style={style} onClick={onClick}>Active</span> }]);
  const pill = column.Cell({ cell: { getValue: () => 'Active' } });
  expect(pill.props.className).toBe('table-value-pill');
  expect(pill.props.style).toBe(style);
  expect(pill.props.onClick).toBe(onClick);
});
