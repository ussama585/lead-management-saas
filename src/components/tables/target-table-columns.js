const center = { align: 'center' };
const column = (header, accessorKey, extra = {}) => ({
  id: accessorKey,
  header,
  accessorKey,
  muiTableHeadCellProps: center,
  muiTableBodyCellProps: center,
  ...extra,
});

// Both target listings and target detail use the same target/completed pairs.
// Rows remain the page's existing transformed API data; no totals are recalculated here.
export function targetTableColumns({ rowNumbers = false, weekKey = 'week', showName = false, dateWidth } = {}) {
  const pairs = [
    ['companies-reached', 'Companies Reached Out', 'companiesReachedOut'],
    ['companies-sign-up', 'Companies Sign Up', 'companiesSignUp'],
    ['applications-received', 'Applications Received', 'applicationsReceived'],
    ['hirings', 'Hirings', 'hirings'],
    ['job-posts', 'Job Posts', 'jobPosts'],
    ['candidates-reached', 'Candidates Reached', 'candidatesReached'],
    ['candidates-registered', 'Candidates Registered', 'candidatesRegistered'],
  ];
  return [
    ...(rowNumbers ? [{ id: 'sr', header: '#', size: 60, minSize: 60,
      muiTableHeadCellProps: center, muiTableBodyCellProps: center,
      Cell: ({ row }) => row.index + 1 }] : []),
    column('Week', weekKey),
    column('Date', 'date', dateWidth ? { size: dateWidth } : {}),
    ...(showName ? [column('Name', 'name')] : []),
    ...pairs.map(([id, header, key]) => ({
      id,
      header,
      muiTableHeadCellProps: center,
      columns: [column('Target', `${key}Target`), column('Completed', `${key}Completed`)],
    })),
  ];
}
