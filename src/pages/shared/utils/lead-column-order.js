export function dateBeforeStatusHistory(columns) {
  const followupDate = columns.find(column => column.accessorKey === 'followup_date');
  const followups = columns.find(column => column.accessorKey === 'follow_up');
  if (followupDate && followups) {
    columns = columns.filter(column => column !== followupDate);
    columns.splice(columns.indexOf(followups) + 1, 0, followupDate);
  }
  const history = columns.find(column => String(column.accessorKey || '').startsWith('status_history'));
  const date = columns.find(column => ['created_at', 'created_time'].includes(column.accessorKey));
  if (!history || !date) return columns;
  const ordered = columns.filter(column => column !== date);
  ordered.splice(ordered.indexOf(history), 0, date);
  return ordered;
}
