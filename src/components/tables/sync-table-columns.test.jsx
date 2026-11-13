import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip.jsx';
import { Eye, Pencil } from 'lucide-react';
import { expect, it, vi } from 'vitest';
import { syncTableColumns, actionsLastOrder } from './sync-table-columns.jsx';
import { collectTableActions } from './table-action-menu.jsx';
import { Select } from '../ui/app-select.jsx';
import AnimatedFollowUpIcon from '../animated-follow-up-icon.jsx';

it('consolidates CRUD columns and retains row-specific callbacks and accessor functions', () => {
  const edit = vi.fn(); const remove = vi.fn();
  const columns = syncTableColumns([
    { header: 'Name', accessorKey: 'name' },
    { header: 'Edit', accessorFn: row => row, Cell: ({ cell }) => <Pencil onClick={() => edit(cell.getValue().id)} /> },
    { header: 'Delete', Cell: ({ row }) => <button disabled={row.original.locked} onClick={() => remove(row.original.id)}>Delete</button> },
    { header: 'Delete Reason', accessorKey: 'delete_reason' },
  ]);
  expect(columns.map(column => column.header)).toEqual(['Name', 'Delete Reason', 'Actions']);
  const menu = columns[2].Cell({ row: { original: { id: 7, locked: true } }, cell: {} });
  menu.props.actions[0].onClick();
  expect(edit).toHaveBeenCalledWith(7);
  expect(menu.props.actions[1].disabled).toBe(true);
  expect(remove).not.toHaveBeenCalled();
});

it('retains confirmation wrappers instead of deleting directly from the menu', () => {
  const remove = vi.fn();
  function Confirm({ children }) { return children; }
  const actions = collectTableActions(<Confirm title="Delete?" onConfirm={remove}><button disabled>Delete</button></Confirm>, 'Delete');
  expect(actions[0]).toMatchObject({ label: 'Delete', disabled: true });
  expect(actions[0].confirm.onConfirm).toBe(remove);
  expect(remove).not.toHaveBeenCalled();
});

it('normalizes standalone icon cells and keeps existing native editors', () => {
  const open = vi.fn();
  const Edit = () => <input />;
  const columns = syncTableColumns([
    { header: 'Attachment', accessorKey: 'attachment', Cell: () => <Eye onClick={open} /> },
    { header: 'Status', accessorKey: 'status', Edit, enableEditing: true },
  ]);
  const icon = columns[0].Cell({});
  expect(icon.type).toBe(AnimatedFollowUpIcon);
  expect(icon.props.icon).toBe(Eye);
  expect(icon.props.onClick).toBe(open);
  expect(columns[1].Edit).toBe(Edit);
});

it('adapts legacy dropdowns without overriding disabled permissions', () => {
  const [column] = syncTableColumns([{ header: 'Status', accessorKey: 'status', Cell: () => <Select disabled value="Active" options={[{ label: 'Active', value: 'Active' }]} /> }]);
  const cell = { column: { id: 'status' } };
  expect(column.enableEditing({ getAllCells: () => [cell] })).toBe(false);
});

it('places existing lead menus last and corrects controlled or saved column order', () => {
  const columns = syncTableColumns([
    { id: 'lead_actions', header: 'Action', Cell: () => <button>View</button> },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
  ]);
  expect(columns.at(-1).id).toBe('lead_actions');
  expect(actionsLastOrder(columns, ['mrt-row-select', 'lead_actions', 'name', 'removed'])).toEqual(['mrt-row-select', 'name', 'status', 'lead_actions']);
});

it('preserves a single element child for Sales Data tooltip triggers', () => {
  const [column] = syncTableColumns([{ header: 'Phone', accessorKey: 'phone', Cell: ({ cell }) =>
    <Tooltip><TooltipTrigger asChild><span onClick={() => {}}>{cell.getValue()}</span></TooltipTrigger><TooltipContent>Copy phone</TooltipContent></Tooltip> }]);
  const element = column.Cell({ cell: { getValue: () => '12345' } });
  const trigger = element.props.children[0];
  expect(React.isValidElement(trigger.props.children)).toBe(true);
  expect(() => renderToStaticMarkup(element)).not.toThrow();
});

it('colors inactive user toggles red and preserves the activation handler', () => {
  const toggle = vi.fn();
  const [column] = syncTableColumns([{ header: 'Active/Deactive User', accessorKey: 'is_active',
    Cell: ({ row }) => <Eye style={{ color: row.original.is_active ? 'green' : 'red' }} onClick={toggle} /> }]);
  const inactive = column.Cell({ row: { original: { is_active: false } } });
  const active = column.Cell({ row: { original: { is_active: true } } });
  expect(inactive.props.tone).toBe('danger');
  expect(active.props.tone).toBe('primary');
  inactive.props.onClick();
  expect(toggle).toHaveBeenCalledOnce();
});
