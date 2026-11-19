import React from 'react';

const centered = { align: 'center', sx: { textAlign: 'center', '& .Mui-TableHeadCell-Content': { justifyContent: 'center' } } };
const isEmpty = value => value == null || (typeof value === 'string' && (!value.trim() || value.trim() === '-')) || (Array.isArray(value) && value.length === 0);

export function leadTablePresentation(columns) {
  return columns.map(column => {
    if (!column.accessorKey || ['row_number', 'follow_up', 'remarks'].includes(column.accessorKey) || /history|extra_data/.test(column.accessorKey)) return column;
    const getValue = row => column.accessorKey === 'industry' ? row.original.industry || row.original.industry_sector
      : column.accessorKey === 'assigned_to' ? row.original.assigned_to_name : row.original[column.accessorKey];
    const originalCell = column.Cell;
    const originalProps = column.muiTableBodyCellProps;
    const editable = ['status', 'project_size', 'assigned_to_name'].includes(column.accessorKey);
    const numeric = ['job_count', 'total_vacancies', 'how_many_hires'].includes(column.accessorKey);
    return {
      ...column,
      ...(editable ? { enableEditing: false } : {}),
      ...(editable || numeric ? { muiTableHeadCellProps: centered } : {}),
      muiTableBodyCellProps: args => {
        const props = typeof originalProps === 'function' ? originalProps(args) : originalProps || {};
        return isEmpty(getValue(args.row)) || numeric ? { ...props, align: 'center', sx: [...(Array.isArray(props.sx) ? props.sx : [props.sx || {}]), { textAlign: 'center', justifyContent: 'center', '& > *': { marginInline: 'auto' } }] } : props;
      },
      Cell: args => {
        if (isEmpty(getValue(args.row)) && !editable) return <span>-</span>;
        if (numeric && getValue(args.row) === 0) return <span>0</span>;
        return originalCell ? originalCell(args) : args.cell.getValue();
      },
    };
  });
}
