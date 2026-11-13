import React from 'react';
import AnimatedFollowUpIcon from '../animated-follow-up-icon.jsx';
import TableActionMenu, { collectTableActions } from './table-action-menu.jsx';
import { inlineSelectColumns } from './inline-select-columns.jsx';

const isActionColumn = column => column.id !== 'lead_actions' && typeof column.header === 'string' &&
  /^(actions?|edit(?:\s+\w+)?|delete(?:\s+\w+)?|restore|details?|view(?:\s*\/\s*edit|\s+(?:details?|job|lead|profile|invoice|cv|usage)))$/i.test(column.header) && !/reason/i.test(column.header);

function syncIcon(node, label) {
  if (!React.isValidElement(node) || node.type === AnimatedFollowUpIcon) return node;
  const props = node.props;
  const title = typeof props.title === 'string' ? props.title : label;
  if (props.onClick && node.type?.render && !props.children && !props.icon) {
    return <AnimatedFollowUpIcon icon={node.type} onClick={props.onClick} disabled={props.disabled}
      tone={/active.*deactive/i.test(label) && props.style?.color === 'red' ? 'danger' : 'primary'}
      title={title} aria-label={props['aria-label'] || title} />;
  }
  if (!React.Children.toArray(props.children).some(React.isValidElement)) return node;
  const children = Array.isArray(props.children)
    ? props.children.map(child => syncIcon(child, title))
    : syncIcon(props.children, title);
  return React.cloneElement(node, { children });
}

export function syncTableColumns(columns = []) {
  const actions = columns.filter(column => isActionColumn(column) && column.Cell);
  let addedActions = false;
  const synced = columns.flatMap(column => {
    if (column.columns) return [{ ...column, columns: syncTableColumns(column.columns) }];
    if (actions.includes(column)) {
      if (addedActions) return [];
      addedActions = true;
      return [{ id: 'shared_row_actions', header: 'Actions', size: 80, enableSorting: false, enableEditing: false,
        muiTableHeadCellProps: { align: 'center' }, muiTableBodyCellProps: { align: 'center' },
        Cell: args => {
          const rendered = actions.map(action => {
            const id = action.id || action.accessorKey;
            const sourceCell = args.row.getAllCells?.().find(cell => cell.column.id === id);
            const getValue = () => action.accessorFn ? action.accessorFn(args.row.original) : action.accessorKey ? args.row.original[action.accessorKey] : undefined;
            return { action, node: action.Cell({ ...args, cell: sourceCell || { ...args.cell, getValue } }) };
          });
          const items = rendered.flatMap(({ action, node }) => collectTableActions(node, action.header));
          if (!items.length) return <>{rendered.map(({ node }, index) => <React.Fragment key={index}>{node}</React.Fragment>)}</>;
          return <TableActionMenu actions={items} />;
        },
      }];
    }
    if (!column.Cell) return [column];
    return [{ ...column, Cell: args => syncIcon(column.Cell(args), column.header) }];
  });
  return inlineSelectColumns([
    ...synced.filter(column => !isFinalActionColumn(column)),
    ...synced.filter(isFinalActionColumn),
  ]);
}

function isFinalActionColumn(column) {
  return ['shared_row_actions', 'lead_actions', 'mrt-row-actions'].includes(column.id)
    || /^actions?$/i.test(column.header || '');
}

export function actionsLastOrder(columns, order) {
  const leafColumns = columns.flatMap(column => column.columns || [column]);
  const actionIds = leafColumns.filter(isFinalActionColumn).map(column => column.id || column.accessorKey);
  const ids = leafColumns.map(column => column.id || column.accessorKey).filter(Boolean);
  const valid = new Set([...ids, 'mrt-row-select', 'mrt-row-numbers', 'mrt-row-expand', 'mrt-row-actions']);
  const current = [...new Set([...order.filter(id => valid.has(id)), ...ids])];
  return [...current.filter(id => !actionIds.includes(id)), ...current.filter(id => actionIds.includes(id))];
}
