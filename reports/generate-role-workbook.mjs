import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import ExcelJS from 'exceljs';
import { roleHome, getRolePath } from '../src/pages/auth/role-home.js';
import { canAccessMenu, getLayoutRole, isSuperAdmin } from '../src/pages/auth/role-access.js';

const date = '2026-11-05';
const roles = Object.keys(roleHome);
const title = value => value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
const layoutFile = 'src/layouts/app-layout.jsx';
const layout = fs.readFileSync(layoutFile, 'utf8');
const menuCode = layout.slice(layout.indexOf('const baseMenu ='), layout.indexOf('const sidebarBadgeByKey'));
const withoutIcons = context => {
  const visit = node => ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)
    ? context.factory.createNull() : ts.visitEachChild(node, visit, context);
  return node => ts.visitNode(node, visit);
};
const executableMenu = ts.transpileModule(menuCode, {
  fileName: 'menu.jsx', compilerOptions: { target: ts.ScriptTarget.ES2022 },
  transformers: { before: [withoutIcons] },
}).outputText;
const getMenu = new Function('user', 'signedInUser', 'isSuperAdmin', 'canAccessMenu', `${executableMenu}\nreturn menuItems;`);
const menus = Object.fromEntries(roles.map(role => [role, role === 'data_entry_executive' ? [
  { key: '1', label: 'Dashboard', group: 'Overview' },
  { key: '11', label: 'Sales Data', group: 'Data Entry' },
  { key: 'add-sales-data', label: 'Add Sales Data', group: 'Data Entry' },
] : getMenu({ user_type: getLayoutRole(role) }, { user_type: role }, isSuperAdmin, canAccessMenu)]));
const sources = new Set([layoutFile, 'src/layouts/app-layout-data-entry-executive.jsx', 'src/layouts/admin-shell.jsx',
  'src/pages/auth/role-access.js', 'src/pages/auth/role-home.js', 'src/layouts/role-routes.jsx']);
const entries = [];
function feature(module, area, name, details, source, allowed = null, condition = '') {
  if (!fs.existsSync(source)) throw new Error(`Missing source: ${source}`);
  sources.add(source);
  entries.push({ module, area, name, details, source, allowed, condition });
}
const add = (module, source, features, allowed = null) => features.forEach(([area, name, details, condition = '']) =>
  feature(module, area, name, details, source, allowed, condition));
const admins = ['super_admin', 'company_admin'];
const managers = ['super_admin', 'company_admin', 'sales_manager'];
const leadPages = {
  'Website Leads': 'src/pages/leads/pages/website-leads/website-leads.jsx',
  'Data Leads': 'src/pages/leads/pages/data-leads/data-leads.jsx',
  'Meta Leads': 'src/pages/leads/pages/meta-leads/meta-leads-standard.jsx',
};
for (const [module, source] of Object.entries(leadPages)) {
  add(module, source, [
    ['Listing', 'View leads and lead details', 'Lead table, contact information, source and lead profile.'],
    ['Listing', 'Search, sort and paginate', 'Search and navigate the lead listing.'],
    ['Filters', 'Date and project size filters', 'Filter by date range and project size.'],
    ['Filters', 'Status filters', 'Filter the listing by lead status.'],
    ['Filters', 'Persist selected filters', 'Selected filters, dates, search, sorting and pagination persist in URL parameters.'],
    ['Status', 'Update lead status', 'Save a selected status directly without opening a remarks modal.'],
    ['Follow-up', 'Follow-up history and scheduling', 'Read follow-ups, add remarks, schedule the next follow-up or mark it not required.'],
    ['Details', 'Duplicate lead information', 'Review duplicate information and linked lead details.', 'When the lead is marked as a duplicate.'],
  ]);
  add(module, source, [
    ['Filters', 'Company filter', 'Scope listings to the selected company.'],
    ['History', 'Lead audit history', 'Open the lead history modal.'],
  ], ['super_admin']);
  add(module, source, [
    ['Filters', 'Assignee filter', 'Filter leads by an assigned user.'],
    ['Assignment', 'Reassign lead', 'Select an assignee and confirm the assignment.'],
  ], managers);
  add(module, source, [['Actions', 'View/edit action icons', 'Dedicated view and edit actions in the lead table.']], admins);
  feature(module, 'Remarks', 'Add or edit remarks', 'Save remarks from the lead modal; super admin includes company_id.',
    'src/components/show-remarks-lead.jsx', admins, 'Sales roles have a role-dependent read-only remarks mode in the listing.');
  const jobSource = module === 'Website Leads' ? 'src/pages/leads/pages/shared/lead-detail.jsx'
    : module === 'Data Leads' ? 'src/pages/leads/pages/data-leads/data-lead.jsx' : 'src/pages/leads/pages/meta-leads/meta-lead.jsx';
  add(module, jobSource, [
    ['Jobs', 'Active jobs table', 'View lead jobs and their details.'],
    ['Jobs', 'Add a job', 'Open the job creation form linked to the lead.', 'Some lead status / converted lead checks can restrict creating or editing jobs.'],
  ]);
  add(module, jobSource, [
    ['Jobs', 'Edit job icon', 'Open the job edit form using the pencil action.'],
    ['Jobs', 'Delete job with remarks', 'Enter mandatory deletion remarks and confirm deletion.'],
  ], admins);
  feature(module, 'Jobs', 'Deleted jobs and restore', 'Deleted Jobs uses the same listing API with is_active=false; Restore asks for confirmation and PATCHes only is_active=true.',
    'src/components/job-listing-tabs.jsx', null, 'Restore is currently rendered for every viewer of these lead job tabs; server permissions still apply.');
  if (module !== 'Data Leads') feature(module, 'Assignment', 'Manage automatic assignees',
    'Load all company users from accounts/users-for-assigning; show name and user type; add/remove users and configure skip rounds.',
    'src/components/manage-assignees-modal.jsx', admins);
}
feature('Data Leads', 'Create', 'Create a data lead', 'Company selection for super admin; contact, industry, project size, currency and contract fields. Assignees load for the company selected inside the modal.',
  'src/pages/leads/pages/data-leads/data-lead-dialog.jsx');
add('Dashboard', 'src/pages/dashboard/pages/admin/super-admin-stats.jsx', [
  ['Overview', 'Role dashboard', 'Summary statistics and charts for the signed-in role.'],
], ['super_admin']);
add('Dashboard', 'src/components/charts/role-lead-dashboard.jsx', [
  ['Overview', 'Lead performance dashboard', 'Role-aware lead summaries and charts; manager statistics scopes where configured.'],
], ['company_admin', 'sales_manager', 'sales_executive']);
add('Dashboard', 'src/pages/dashboard/pages/data-entry-executive/dashboard.jsx', [
  ['Overview', 'Data entry statistics', 'Total data entered, data entered today and sales data trend chart.'],
  ['Filters', 'Week/month/year filter', 'Change the dashboard time period.'],
], ['data_entry_executive']);
add('User Activity', 'src/pages/dashboard/pages/admin/audit-history-list.jsx', [
  ['Listing', 'Activity audit table', 'View changed fields, old/new values, category, actor, date and duration.'],
  ['Filters', 'Category, user and date filters', 'Filter user activity; search, sorting and pagination are available.'],
]);
add('Follow-up', 'src/pages/dashboard/pages/shared/common-leads-follow-up.jsx', [
  ['Listing', 'Follow-up listing', 'View follow-up records for website, data and Meta leads.'],
  ['Filters', 'Search, date, type and sorting', 'Filter and navigate the follow-up table.'],
  ['Actions', 'Open lead details', 'Navigate to the related lead profile.'],
  ['Actions', 'Add follow-up and remarks', 'Record a follow-up and schedule the next one.', 'Visibility is checked by role and source; company admin has an explicit company follow-up route.'],
]);
add('Sales Data', 'src/pages/sales-executive/data-entry-table.jsx', [
  ['Listing', 'Sales data listing', 'Company/contact records with status, assignee and date information.'],
  ['Filters', 'Status, search, dates and pagination', 'Filter, sort and browse sales data.'],
  ['Details', 'Open and edit sales data', 'Open a sales data record through its linked company value.'],
  ['Assignment', 'Assignment management', 'Assignment controls and assigned/unassigned user tabs.', 'Controls depend on role and current tab.'],
], ['super_admin', 'company_admin', 'sales_manager']);
add('Sales Data', 'src/pages/sales-executive/leads-table.jsx', [
  ['Listing', 'Assigned/unassigned sales data', 'View the data entry executive sales data list.'],
  ['Listing', 'Search, sorting and pagination', 'Browse and find sales data records.'],
  ['Actions', 'Edit sales data', 'Open a listed record in the edit form.'],
], ['data_entry_executive']);
add('Sales Data', 'src/pages/sales-executive/data-entry-table.jsx', [
  ['Filters', 'Company filter', 'Choose the company whose sales data is shown.'],
  ['Export', 'Export all to CSV', 'Download sales data with the Export All action.', 'The current button checks the legacy admin role string.'],
], ['super_admin']);
add('Add Sales Data', 'src/pages/sales-executive/add-update-lead.jsx', [
  ['Create', 'Create sales data', 'Enter company, contact, industry/sector, location, website/social links and acquisition information.'],
  ['Validation', 'Form validation', 'Formik validation and field-level API errors.'],
], ['data_entry_executive']);
add('User Management', 'src/pages/users/pages/user-management-page.jsx', [
  ['Listing', 'Users by role', 'Role tabs with user counts, search, sorting and pagination.'],
  ['Actions', 'View and edit users', 'Open user details or edit user information.', 'Some actions exclude super admin target accounts.'],
  ['Actions', 'Delete user', 'Delete workflow with confirmation and OTP where configured.', 'Some actions exclude super admin target accounts.'],
  ['Actions', 'Reset user password', 'Open the password reset dialog from a user row.'],
]);
add('User Management', 'src/pages/users/pages/create-user-page.jsx', [
  ['Create', 'Create user', 'User details, role and manager selection; company selection for super admin.'],
  ['Profile image', 'Upload/remove selected image', 'Upload an image and remove the unsaved selection with a trash icon.'],
]);
add('User Management', 'src/pages/users/pages/edit-user-page.jsx', [
  ['Edit', 'Edit user contact/manager information', 'Update name, phone, email and manager fields supported by the form.'],
  ['Profile image', 'Replace/delete saved profile image', 'Pencil and delete icons; saved image deletion uses accounts/picture/delete/{userId}.'],
]);
add('Sales Executives', 'src/pages/users/pages/executives/sales-executive-listing-page.jsx', [
  ['Listing', 'Executive team listing', 'View the sales executive listing and open executive detail pages.'],
  ['Details', 'Executive performance and records', 'Review executive information and related work from the detail screen.'],
], ['sales_manager']);
add('Companies', 'src/pages/companies/pages/companies-page.jsx', [
  ['Listing', 'Company listing', 'Search, sort and paginate companies; inspect active/inactive status.'],
  ['Actions', 'Create/view/edit/delete companies', 'Company action buttons and their dialogs.'],
]);
add('Companies', 'src/pages/companies/pages/company-detail-page.jsx', [
  ['Company users', 'User listing and role/manager information', 'View users belonging to the selected company.'],
  ['Company users', 'Create/edit company user', 'Company-scoped user forms with role and manager selection.'],
  ['Company users', 'Delete company user', 'OTP-confirmed company user deletion.'],
  ['Company users', 'Reset password', 'Reset a company user password.'],
  ['Company users', 'Upload/delete profile image', 'Company user edit includes profile image deletion through the account picture endpoint.'],
]);
add('Demo Request', 'src/pages/demo-requests/demo-requests-page.jsx', [
  ['Listing', 'Demo request table', 'View requester information, message and creation date with listing controls.'],
  ['Actions', 'Edit request', 'Edit a demo request through a modal.'],
  ['Actions', 'Delete request', 'Confirm deletion of a demo request.'],
]);
add('Settings', 'src/pages/dashboard/pages/admin/admin-settings-page.jsx', [
  ['Lead statuses', 'Manage lead statuses', 'List/create/edit/delete company lead statuses.'],
  ['Project sizes', 'Manage project sizes', 'List/create/edit/delete company project sizes.'],
  ['Follow-up Duration', 'List/create/edit/delete duration', 'Configure check-up follow-up duration in minutes.'],
]);
add('Settings', 'src/pages/dashboard/pages/admin/admin-settings-page.jsx', [
  ['Company scope', 'Company selection', 'Company-scoped lead status/project size settings; duration tab defaults to the first company. Duration create payload includes company_id.'],
], ['super_admin']);
add('Settings', 'src/pages/dashboard/pages/admin/admin-settings-page.jsx', [
  ['Company scope', 'Own-company settings', 'Settings apply to the authenticated company; duration creation omits company_id.'],
], ['company_admin']);

const wb = new ExcelJS.Workbook();
wb.creator = 'Project source review'; wb.subject = 'Role sidebar modules and internal features';
wb.created = new Date(`${date}T12:00:00+05:00`);
const sheetCounts = {};
function sheet(name, headers, rows, widths) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1, xSplit: name === 'Sidebar Matrix' ? 2 : 0 }] });
  ws.columns = headers.map((header, i) => ({ header, key: `c${i}`, width: widths?.[i] || 25 }));
  rows.forEach(row => ws.addRow(row));
  ws.getRow(1).height = 30;
  ws.getRow(1).eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } }; cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }; });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: headers.length } };
  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i); row.alignment = { vertical: 'top', wrapText: true };
    let lines = 1;
    row.eachCell((cell, col) => {
      cell.font = { name: 'Calibri', size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 ? 'FFF0F5FA' : 'FFFFFFFF' } };
      if (cell.value === 'Shown') { cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF166534' } }; }
      if (cell.value === 'Not in sidebar') cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF64748B' } };
      lines = Math.max(lines, Math.ceil(String(cell.value ?? '').length / Math.max(8, ws.getColumn(col).width - 3)));
    });
    row.height = Math.min(120, Math.max(30, lines * 15 + 8));
  }
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  sheetCounts[name] = rows.length;
  return ws;
}
sheet('Read Me', ['Item', 'Details'], [
  ['Prepared', `${date} (Asia/Karachi); based on current local source, including uncommitted changes.`],
  ['Active roles', roles.map(title).join(', ')],
  ['How to read', 'Sidebar Matrix: module visibility. Modules by Role: navigational inventory. Features: one row per role/module/feature, with conditions and source file.'],
  ['Permission meaning', 'This is a frontend inventory, not a backend permission audit. API authorization, record ownership, company scope and record status can further restrict actions.'],
  ['Feature status', 'Listed features are available in the module UI unless a condition is stated. Features with explicit role restrictions are included only for the matching roles.'],
  ['Internal features', 'Features inside lead profiles, job tabs and company detail are included under their parent sidebar module; they are not additional sidebar entries.'],
  ['Role alias', 'The API role admin is treated as Super Admin by role-access.js; it is not an additional active role. Some older buttons still check admin literally.'],
  ['Legacy roles', 'Marketing Manager, Recruitment Manager, Recruitment Executive, Accountant and Project Manager still have legacy menu definitions. They are not listed in current roleHome / USER_TYPES. See Legacy Roles.'],
  ['Scope', 'Summarizes major visible modules and implemented workflows; route-only screens are not treated as sidebar modules. Conditional features are described rather than represented as unconditional grants.'],
], [25, 115]);
const allModules = [...new Set(Object.values(menus).flat().map(item => item.label))];
sheet('Sidebar Matrix', ['Group', 'Module', ...roles.map(title)], allModules.map(module => [
  Object.values(menus).flat().find(item => item.label === module).group, module,
  ...roles.map(role => menus[role].some(item => item.label === module) ? 'Shown' : 'Not in sidebar'),
]), [23, 25, ...roles.map(() => 23)]);
const suffixes = { '1': '', '20': '/audit-history-list', '10': '/leads', '15': '/data-leads', '9': '/meta-leads',
  '17': '/follow-up', '11': '/data-entry-table', '2': '/user-management', '4': '/sales-executive-listing',
  '26': '/companies', '27': '/demo-requests', '21': '/settings', 'add-sales-data': '/add-update-lead' };
const moduleRows = [];
for (const role of roles) for (const item of menus[role]) {
  const route = role === 'data_entry_executive' && item.label === 'Sales Data' ? '/data-entry-executive/leads-table'
    : getRolePath(role, suffixes[item.key] || '/');
  moduleRows.push([title(role), role, item.group, item.label, route,
    entries.filter(e => e.module === item.label && (!e.allowed || e.allowed.includes(role))).map(e => e.name).join('; '),
    role === 'data_entry_executive' ? 'src/layouts/app-layout-data-entry-executive.jsx' : layoutFile]);
}
const requestedModules = ['Website Leads', 'Meta Leads', 'Data Leads', 'Sales Data', 'Follow-up'];
function moduleFilters(role, module) {
  const company = role === 'super_admin' ? ['Company'] : [];
  if (module === 'Sales Data') return [...company, ...(role === 'data_entry_executive'
    ? ['Assigned / unassigned'] : ['Status', 'Assigned user / assignment tabs', 'Date range']), 'Search', 'Sorting', 'Pagination'];
  if (module === 'Follow-up') return [...company, 'Follow ups / Past Follow ups', 'Date range', 'Search', 'Sorting', 'Pagination'];
  return [...company, 'Status', 'Date range', 'Project size', ...(role !== 'sales_executive' ? ['Assignee'] : []),
    ...(module !== 'Meta Leads' ? ['Duplicate / non-duplicate'] : []), 'Search', 'Sorting', 'Pagination'];
}
const focusedModuleRows = requestedModules.flatMap(module => roles.filter(role => menus[role].some(item => item.label === module)).map(role => {
  const available = entries.filter(e => e.module === module && e.area !== 'Filters' && (!e.allowed || e.allowed.includes(role)));
  return [module, title(role), moduleFilters(role, module).join('\n'),
    available.map(e => e.name).join('\n'),
    [...new Set(available.map(e => e.condition).filter(Boolean))].join('\n\n')];
}));
sheet('Modules by Role', ['Module', 'User Role', 'Filters / Listing Controls', 'Features', 'Conditions'], focusedModuleRows, [23, 24, 40, 105, 65]);
const featureRows = [];
for (const role of roles) for (const item of menus[role]) for (const f of entries.filter(e => e.module === item.label && (!e.allowed || e.allowed.includes(role)))) {
  featureRows.push([title(role), item.label, f.area, f.name, f.details, f.condition ? 'Conditional / see note' : 'Available in module', f.condition, f.source]);
}
for (const role of roles) {
  featureRows.push([title(role), 'Account menu (not sidebar)', 'Account', 'Change own password', 'Open the Change Password dialog from the account menu.', 'Available in account menu', '', 'src/components/change-password-dialog.jsx']);
  featureRows.push([title(role), 'Account menu (not sidebar)', 'Session', 'Log out', 'Clear the local session and return to login.', 'Available in account menu', '', 'src/layouts/admin-shell.jsx']);
}
sources.add('src/components/change-password-dialog.jsx');
sheet('Features', ['Role', 'Parent Module', 'Area', 'Feature', 'Description', 'Availability', 'Conditions / Scope', 'Source File'], featureRows, [23, 27, 22, 35, 70, 28, 75, 65]);
const legacyRoles = ['marketing_manager', 'recruitment_manager', 'recruitment_executive', 'accountant', 'project_manager'];
sheet('Legacy Roles', ['Legacy Role', 'Legacy Menu Definition', 'Current Registration', 'Source'], legacyRoles.map(role => [title(role),
  getMenu({ user_type: role }, { user_type: role }, isSuperAdmin, canAccessMenu).map(item => item.label).join('; '),
  'Not registered in current roleHome / USER_TYPES; do not assume this menu is an active supported workspace.', layoutFile]), [28, 95, 85, 50]);
sheet('Source Files', ['Source File', 'Purpose'], [...sources].sort().map(file => [file,
  file.includes('role-access') ? 'Menu and route permission checks' : file.includes('role-home') ? 'Active role registration and route roots'
    : file.includes('layouts/') ? 'Sidebar / role navigation' : 'Feature implementation reference']), [85, 55]);
const output = path.resolve(`reports/role-modules-features-${date}.xlsx`);
await wb.xlsx.writeFile(output);
const verified = new ExcelJS.Workbook(); await verified.xlsx.readFile(output);
for (const [name, rows] of Object.entries(sheetCounts)) if (verified.getWorksheet(name).rowCount !== rows + 1) throw new Error(`Workbook verification failed: ${name}`);
if (moduleRows.length !== 35) throw new Error(`Unexpected sidebar module count: ${moduleRows.length}`);
console.log(JSON.stringify({ output, roles: roles.length, modules: moduleRows.length, featureRows: featureRows.length, sheets: sheetCounts }));
