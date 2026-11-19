import React from 'react';
import { describe, expect, it } from 'vitest';
import { leadTablePresentation } from './lead-table-presentation.jsx';

const args = (key, value) => ({ row: { original: { [key]: value } }, cell: { getValue: () => value } });

describe('leadTablePresentation', () => {
  it('centers empty fields while preserving zero and false values', () => {
    const [column] = leadTablePresentation([{ accessorKey: 'count', Cell: ({ cell }) => <span>{String(cell.getValue())}</span> }]);
    for (const value of [null, undefined, '', '  ', []]) {
      expect(column.Cell(args('count', value)).props.children).toBe('-');
      expect(column.muiTableBodyCellProps(args('count', value)).align).toBe('center');
    }
    expect(column.Cell(args('count', 0)).props.children).toBe('0');
    expect(column.Cell(args('count', false)).props.children).toBe('false');
  });

  it('retains select renderers and their permissions for empty editable fields', () => {
    const cell = <select disabled><option>-</option></select>;
    const [column] = leadTablePresentation([{ accessorKey: 'project_size', Cell: () => cell }]);
    expect(column.Cell(args('project_size', null))).toBe(cell);
    expect(column.enableEditing).toBe(false);
    expect(column.muiTableHeadCellProps.align).toBe('center');
  });

  it('preserves action cells and the actual assigned name', () => {
    const action = { accessorKey: 'follow_up', Cell: () => <button>Follow up</button> };
    const [unchanged, assignee] = leadTablePresentation([action, { accessorKey: 'assigned_to', Cell: ({ row }) => <span>{row.original.assigned_to_name}</span> }]);
    expect(unchanged).toBe(action);
    expect(assignee.Cell({ row: { original: { assigned_to_name: 'Executive' } } }).props.children).toBe('Executive');
  });
});
