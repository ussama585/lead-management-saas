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

const alphabetical = value => typeof value === 'string' && /\p{L}/u.test(value);

function tablePills(node) {
  if (!React.isValidElement(node)) return node;
  const { style, children } = node.props;
  const pill = node.type === 'span' && style?.padding != null && style?.borderRadius != null
    && (style.backgroundColor != null || style.background != null);
  if (!pill && !React.Children.toArray(children).some(React.isValidElement)) return node;
  return React.cloneElement(node, {
    ...(pill ? { className: `${node.props.className || ''} table-value-pill`.trim() } : {}),
    ...(React.Children.toArray(children).some(React.isValidElement) ? {
      children: Array.isArray(children) ? children.map(tablePills) : tablePills(children),
    } : {}),
  });
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
    const followUps = /^follow[\s_-]*ups?$/i.test(column.header || '')
      || /^follow_up(?:_icon|_actions)?$/.test(key);
    const originalCell = column.Cell;
    const originalHeadProps = column.muiTableHeadCellProps;
    const originalBodyProps = column.muiTableBodyCellProps;
    return {
      ...column,
      meta: { ...column.meta, sharedTablePresentation: true },
      muiTableHeadCellProps: args => {
          const props = typeof originalHeadProps === 'function' ? originalHeadProps(args) : originalHeadProps || {};
          return { ...props, align: 'left', sx: [...(Array.isArray(props.sx) ? props.sx : [props.sx || {}]), { textAlign: 'left', '& .Mui-TableHeadCell-Content': { justifyContent: 'flex-start' } }] };
      },
      muiTableBodyCellProps: args => {
        const props = typeof originalBodyProps === 'function' ? originalBodyProps(args) : originalBodyProps || {};
        if (followUps) return { ...props, align: 'center', sx: [...(Array.isArray(props.sx) ? props.sx : [props.sx || {}]), { textAlign: 'center', justifyContent: 'center', '& > *': { marginInline: 'auto' } }] };
        const value = args.cell?.getValue?.();
        if (numeric || numericColumn(column, value) || !alphabetical(value)) return props;
        return { ...props, align: 'left', sx: [...(Array.isArray(props.sx) ? props.sx : [props.sx || {}]), { textAlign: 'left', justifyContent: 'flex-start', '& > *': { marginInline: 0 } }] };
      },
      Cell: args => {
        const value = args.cell?.getValue?.();
        const rendered = tablePills(originalCell ? originalCell(args) : typeof value === 'boolean' ? String(value) : value);
        if (emptyContent(rendered)) return <span className="table-empty-value">-</span>;
        return followUps || numeric || numericColumn(column, value) ? <span className="table-centered-value">{rendered}</span> : rendered;
      },
    };
  }));
}
