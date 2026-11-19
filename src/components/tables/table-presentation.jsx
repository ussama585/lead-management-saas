import React from 'react';

function numericColumn(column, value) {
  const key = column.accessorKey || column.id || '';
  if (column.meta?.numeric === false || /phone|mobile|postal|zip|date|timestamp/i.test(key)) return false;
  if (column.meta?.numeric === true || /(^|_)(count|salary|experience|vacancies|hires|resources|amount|budget|price|cost|revenue|fee|rate|score|percentage|quantity|age|hours|years|total)(_|$)/i.test(key)) return true;
  return typeof value === 'number' || (typeof value === 'string' && /^[-+]?\d+(?:,\d{3})*(?:\.\d+)?%?$/.test(value.trim()));
}

function emptyContent(node) {
  if (node == null || node === '') return true;
  if (typeof node === 'string') return !node.trim() || node.trim() === '-';
  if (Array.isArray(node)) return node.every(emptyContent);
  if (!React.isValidElement(node)) return false;
  // Interactive/custom components can expose actions even without a stored value.
  if (![React.Fragment, 'span', 'div', 'p', 'a'].includes(node.type) || node.props.onClick) return false;
  return emptyContent(node.props.children);
}

export function companyBeforeName(columns) {
  const result = [...columns];
  const companyIndex = result.findIndex(column => (column.id || column.accessorKey) === 'company_name');
  const nameIndex = result.findIndex(column => ['contact_person_name', 'full_name', 'name'].includes(column.id || column.accessorKey));
  if (companyIndex > nameIndex && nameIndex >= 0) result.splice(nameIndex, 0, result.splice(companyIndex, 1)[0]);
  return result;
}

export function tablePresentation(columns = []) {
  return companyBeforeName(columns.map(column => {
    if (column.columns) return { ...column, columns: tablePresentation(column.columns) };
    if (column.meta?.sharedTablePresentation) return column;
    const key = column.accessorKey || column.id || '';
    const numeric = numericColumn(column);
    const select = column.editVariant === 'select' || /^(status|project_size|assigned_to(?:_name)?|job_type|job_nature|currency|country|city)$/.test(key);
    const originalCell = column.Cell;
    const originalHeadProps = column.muiTableHeadCellProps;
    return {
      ...column,
      meta: { ...column.meta, sharedTablePresentation: true },
      muiTableHeadCellProps: args => {
          const props = typeof originalHeadProps === 'function' ? originalHeadProps(args) : originalHeadProps || {};
          const sample = args.table?.getPrePaginationRowModel?.().flatRows
            ?.map(row => row.getAllCells().find(cell => cell.column.id === (column.id || column.accessorKey))?.getValue())
            .find(value => value != null && value !== '');
          if (!numeric && !select && !numericColumn(column, sample)) return props;
          return { ...props, align: 'center', sx: [...(Array.isArray(props.sx) ? props.sx : [props.sx || {}]), { textAlign: 'center', '& .Mui-TableHeadCell-Content': { justifyContent: 'center' } }] };
      },
      Cell: args => {
        const value = args.cell?.getValue?.();
        const rendered = originalCell ? originalCell(args) : typeof value === 'boolean' ? String(value) : value;
        if (emptyContent(rendered)) return <span className="table-empty-value">-</span>;
        return numeric || numericColumn(column, value) ? <span className="table-centered-value">{rendered}</span> : rendered;
      },
    };
  }));
}
