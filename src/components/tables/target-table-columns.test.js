import { expect, it } from 'vitest';
import { targetTableColumns } from './target-table-columns.js';

it('preserves target/completed groups with distinct stable IDs and accessors', () => {
  const columns = targetTableColumns();
  expect(columns.slice(0, 2).map(column => column.accessorKey)).toEqual(['week', 'date']);
  const groups = columns.filter(column => column.columns);
  expect(groups.map(group => group.header)).toEqual(['Companies Reached Out', 'Companies Sign Up', 'Applications Received',
    'Hirings', 'Job Posts', 'Candidates Reached', 'Candidates Registered']);
  const all = [...columns, ...groups.flatMap(group => group.columns)];
  expect(new Set(all.map(column => column.id)).size).toBe(all.length);
  expect(groups[0].columns.map(column => column.accessorKey)).toEqual(['companiesReachedOutTarget', 'companiesReachedOutCompleted']);
  expect(groups.every(group => group.columns.map(column => column.header).join(',') === 'Target,Completed')).toBe(true);
});

it('keeps listing row numbers, differing week fields, date sizing and optional names', () => {
  const columns = targetTableColumns({ rowNumbers: true, weekKey: 'weekRange', showName: true, dateWidth: 200 });
  expect(columns[0].Cell({ row: { index: 3 } })).toBe(4);
  expect(columns.slice(0, 4).map(column => column.id)).toEqual(['sr', 'weekRange', 'date', 'name']);
  expect(columns[2].size).toBe(200);
  expect(columns[3].muiTableBodyCellProps).toEqual({ align: 'center' });
});
