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
// presentation changes: MRT renders the editor in each editable cell by default.
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
    return {
      ...column,
      meta: { ...column.meta, inlineDropdown: true },
      enableEditing: row => {
        if (typeof column.enableEditing === 'function' && !column.enableEditing(row)) return false;
        const cell = row.getAllCells().find(item => item.column.id === (column.id || column.accessorKey));
        if (!cell) return false;
        const select = getSelect({ cell, row, column: cell.column });
        return Boolean(select && !select.props.disabled && !select.props.loading && !select.props.mode && !select.props.labelInValue);
      },
      Cell: args => {
        const element = originalCell(args);
        const select = findSelect(element);
        if (!select || select.props.mode || select.props.labelInValue) return element;
        const { value, options, children, disabled, loading, disabledReason } = select.props;
        const label = selectOptions(options, children).find(option => String(option.value) === String(value))?.label ?? value ?? '-';
        const display = <button type="button" className="table-inline-edit-value" disabled={disabled || loading}
          title={disabled ? disabledReason : `Edit ${column.header}`}
          onClick={event => { event.stopPropagation(); args.table.setEditingCell(args.cell); }}>{label || '-'}</button>;
        return replaceSelect(element, select, display);
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
