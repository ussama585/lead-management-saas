import React from 'react';
import { MenuItem, TextField } from '@mui/material';
import { Select, selectOptions } from '../ui/app-select.jsx';
import { InlineDropdownContext } from './inline-dropdown-context.js';

function findSelect(element) {
  if (!React.isValidElement(element)) return null;
  if (element.type === Select) return element;
  return React.Children.toArray(element.props.children).map(findSelect).find(Boolean);
}

function replaceSelect(element, target, replacement) {
  if (element === target) return replacement;
  if (!React.isValidElement(element) || !React.Children.toArray(element.props.children).some(React.isValidElement)) return element;
  const children = Array.isArray(element.props.children)
    ? element.props.children.map(child => replaceSelect(child, target, replacement))
    : replaceSelect(element.props.children, target, replacement);
  return React.cloneElement(element, { children });
}

// Keep each column's existing permissions and mutation callbacks. Only its
// presentation changes: select controls stay visible in their table cells.
export function inlineSelectColumns(columns = []) {
  return columns.map(column => {
    if (column.columns) return { ...column, columns: inlineSelectColumns(column.columns) };
    if (column.enableEditing === false) return column;
    if (column.Edit) {
      if (!column.meta?.inlineDropdown) return { ...column, enableEditing: false };
      if (column.meta.inlineEditorStyled) return column;
      const OriginalEditor = column.Edit;
      return { ...column, meta: { ...column.meta, inlineEditorStyled: true }, enableEditing: column.enableEditing ?? true,
        Edit: args => <InlineDropdownContext.Provider value={true}><OriginalEditor {...args} /></InlineDropdownContext.Provider> };
    }
    if (column.editVariant === 'select') return { ...column, enableEditing: column.enableEditing ?? true };
    if (!column.Cell) return { ...column, enableEditing: false };
    const originalCell = column.Cell;
    const getSelect = args => findSelect(originalCell(args));
    const originalHeadProps = column.muiTableHeadCellProps;
    return {
      ...column,
      meta: { ...column.meta, inlineDropdown: true },
      enableEditing: false,
      muiTableHeadCellProps: args => {
        const props = typeof originalHeadProps === 'function' ? originalHeadProps(args) : originalHeadProps || {};
        const rows = args.table?.getPrePaginationRowModel?.().flatRows || [];
        const hasSelect = rows.slice(0, 5).some(row => {
          const cell = row.getAllCells().find(item => item.column.id === (column.id || column.accessorKey));
          return cell && getSelect({ ...args, cell, row });
        });
        return hasSelect ? { ...props, align: 'center', sx: [...(Array.isArray(props.sx) ? props.sx : [props.sx || {}]), { textAlign: 'center', '& .Mui-TableHeadCell-Content': { justifyContent: 'center' } }] } : props;
      },
      Cell: args => {
        const element = originalCell(args);
        const select = findSelect(element);
        if (!select || select.props.mode || select.props.labelInValue) return element;
        if ((typeof column.enableEditing === 'function' && !column.enableEditing(args.row)) || args.table?.options?.enableEditing === false
          || (typeof args.table?.options?.enableEditing === 'function' && !args.table.options.enableEditing(args.row))) {
          return replaceSelect(element, select, React.cloneElement(select, { disabled: true }));
        }
        return element;
      },
      Edit: args => {
        const select = getSelect(args);
        if (!select) return originalCell(args);
        const { value, options, children, onChange, disabled, loading } = select.props;
        return <TextField select fullWidth size="small" variant="standard" value={value ?? ''}
          className="table-inline-edit-editor"
          disabled={disabled || loading} inputProps={{ 'aria-label': `Edit ${column.header}` }}
          onClick={event => event.stopPropagation()}
          onBlur={() => args.table.setEditingCell(null)}
          onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); args.table.setEditingCell(null); } }}
          onChange={event => {
            if (String(event.target.value) !== String(value)) onChange?.(event.target.value);
            args.table.setEditingCell(null);
          }}>
          {selectOptions(options, children).map(option => <MenuItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</MenuItem>)}
        </TextField>;
      },
    };
  });
}
