import ExcelJS from 'exceljs';
import assert from 'node:assert/strict';

const source = 'C:/Users/Search O Pal/Desktop/Book1.xlsx';
const output = 'reports/Book1-completed.xlsx';
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(source);
const sheet = workbook.worksheets[0];
const originals = [];
sheet.eachRow(row => row.eachCell(cell => {
  if (cell.value) originals.push([cell.address, cell.value]);
}));
const roles = ['Super Admin', 'Company Admin', 'Sales Manager', 'Sales Executive', 'Data Entry Executive'];
const section = (heading, bullets) => `${heading}\n${bullets.map(text => `- ${text}`).join('\n')}`;
const join = (...sections) => sections.filter(Boolean).join('\n\n');
const unavailable = section('Module Access', ['This module is not available in the role sidebar']);
function set(module, role, text) {
  let row;
  sheet.eachRow(candidate => { if (candidate.getCell(1).value === module) row = candidate; });
  if (!row) { row = sheet.addRow([module]); }
  const cell = row.getCell(roles.indexOf(role) + 2);
  if (!cell.value) cell.value = text;
}
function scope(role) {
  return role === 'Super Admin' ? 'selected company' : 'company to which the logged in user belongs';
}

set('Dashboard', 'Sales Executive', join(
  section('Stat Cards', ['Website Leads', 'Data Leads', 'Meta Leads', 'Client, project, job and target stats when returned for the executive']),
  section('Graphs', ['Total Leads Received', 'Lead Status Distribution', 'Mobilisation Amounts per Executive', 'Leads Status Health']),
  section('Filters', ['Date Range Filter for graphs', 'Period Filter for Total Leads Received', 'Lead Source Filter for Lead Status Distribution'])
));
set('Dashboard', 'Data Entry Executive', join(
  section('Stat Cards', ['Total Data Entered', 'Data Entered Today']),
  section('Sales Data Stats', ['Total and Today data trends']),
  section('Filters', ['Week Filter', 'Month Filter', 'Year Filter'])
));

for (const module of ['Website Leads', 'Data Leads', 'Meta Leads']) {
  for (const role of roles) {
    if (role === 'Data Entry Executive') { set(module, role, unavailable); continue; }
    const admin = ['Super Admin', 'Company Admin'].includes(role);
    const executive = role === 'Sales Executive';
    set(module, role, join(
      section('Filters', [...(role === 'Super Admin' ? ['Company Filter'] : []), 'Project Size Filter', 'Date Range Filter', ...(module !== 'Meta Leads' ? ['Duplicate / Non-Duplicate Filter'] : []), 'Search, Sorting and Pagination']),
      admin && module !== 'Data Leads' && section('Manage Assignees Option', [`User list of ${scope(role)}`, `${role} can add or remove automatic assignees and configure skip rounds`]),
      !executive && section('Assignee Filters', [`Assigned users of ${scope(role)}`]),
      section('Status Filters', [`Lead statuses configured for ${scope(role)}`]),
      section(`${module} Listing`, [
        `${role} can see leads returned for the logged in role and company scope`,
        `${role} can open lead details`,
        ...(admin ? [`${role} can edit listing details through the available edit action`] : []),
        ...(!executive ? [`${role} can reassign leads`] : []),
        `${role} can change lead status`, `${role} can view follow-up history, add follow-ups and schedule the next follow-up`,
        `${role} can view duplicate lead information when available`,
        ...(role === 'Super Admin' ? [`${role} can view lead audit history`] : []),
        ...(module === 'Data Leads' ? [`${role} can add a data lead`] : [])
      ]),
      section(`Jobs Listing Against ${module}`, [
        `${role} can view jobs and job details against a lead`,
        `${role} can add a job when the lead status allows it`,
        ...(admin ? [`${role} can edit jobs through the available edit action`, `${role} can delete jobs with deletion remarks`] : []),
        `${role} can view Deleted Jobs and use Restore where available`
      ])
    ));
  }
}

for (const role of roles) {
  const admin = ['Super Admin', 'Company Admin'].includes(role);
  const companyFilter = role === 'Super Admin' ? ['Company Filter'] : [];
  set('Follow-up', role, role === 'Data Entry Executive' ? unavailable : join(
    section('Filters', [...companyFilter, 'Follow ups / Past Follow ups', 'Date Range Filter', 'Search, Sorting and Pagination']),
    section('Follow-up Listing', [`${role} can view follow-ups against Website, Data and Meta leads`, `${role} can open the related lead details`, `${role} can add follow-up remarks and schedule the next follow-up where available`])
  ));
  set('Sales Data', role, role === 'Sales Executive' ? unavailable : join(
    section('Filters', [...companyFilter, ...(role !== 'Data Entry Executive' ? ['Status Filter', 'Assigned User Filter', 'Date Range Filter'] : []), 'Assigned / Unassigned Tabs', 'Search, Sorting and Pagination']),
    section('Sales Data Listing', [`${role} can view sales data records`, `${role} can open and edit sales data`, ...(role !== 'Data Entry Executive' ? [`${role} can manage assignments using the available assignment controls`] : []), ...(role === 'Super Admin' ? ['Export All to CSV is available for the legacy admin account role'] : [])])
  ));
  set('User Activity', role, !admin ? unavailable : join(
    section('Filters', [...companyFilter, 'Category Filter', 'User Filter', 'Date Range Filter', 'Search, Sorting and Pagination']),
    section('User Activity Listing', [`${role} can view activity records`, `${role} can view changed fields, old and new values, category, user, date and duration`])
  ));
  set('User Management', role, !admin ? unavailable : join(
    section('Filters', [...companyFilter, 'User Role Tabs with Counts', 'Active / Inactive Filter', 'Search, Sorting and Pagination']),
    role === 'Super Admin' && section('User Groups', ['Super Admin', 'Company Users']),
    section('User Listing', [`${role} can view users within the available company scope`, `${role} can create a user with an allowed role and manager`, `${role} can view and edit eligible users`, `${role} can activate or deactivate eligible users with confirmation`, `${role} can delete eligible users with OTP confirmation`, `${role} can reset a user password where the reset action is available`]),
    section('User Profile', [`${role} can update contact and manager information`, `${role} can upload, replace or delete a user profile image`])
  ));
  set('Companies', role, role !== 'Super Admin' ? unavailable : join(
    section('Filters', ['Active Companies / Deleted Companies', 'Search, Sorting and Pagination']),
    section('Company Listing', ['Super Admin can create, view and edit companies', 'Super Admin can delete a company with OTP confirmation', 'Super Admin can restore a deleted company with confirmation']),
    section('Company Users', ['Super Admin can view users of the selected company', 'Super Admin can create and edit company users', 'Super Admin can delete a company user with OTP confirmation', 'Super Admin can reset a company user password', 'Super Admin can upload or delete a company user profile image'])
  ));
  set('Demo Request', role, role !== 'Super Admin' ? unavailable : join(
    section('Filters', ['Search, Sorting and Pagination']),
    section('Demo Request Listing', ['Super Admin can view requester details, message and request date', 'Super Admin can edit a demo request', 'Super Admin can delete a demo request with confirmation'])
  ));
  set('Settings', role, !admin ? section('Settings', ['Settings can be opened from the account menu', 'Lead status, project size and follow-up duration management sections are not available for this role']) : join(
    role === 'Super Admin' && section('Filters', ['Company Filter']),
    section('Lead Statuses', [`${role} can view lead statuses of ${scope(role)}`, ...(role === 'Company Admin' ? ['Company Admin can add, edit and delete lead statuses'] : [])]),
    section('Project Sizes', [`${role} can view project sizes of ${scope(role)}`, ...(role === 'Company Admin' ? ['Company Admin can add, edit and delete project sizes'] : [])]),
    section('Follow-up Duration', [`${role} can view, add, edit and delete check-up follow-up duration`, 'Duration is configured in minutes'])
  ));
  set('Sales Executives', role, role !== 'Sales Manager' ? unavailable : join(
    section('Filters', ['Search, Sorting and Pagination']),
    section('Sales Executives Listing', ['Sales Manager can view sales executives in the available team scope', 'Sales Manager can open executive details', 'Sales Manager can review executive performance and related records'])
  ));
  set('Add Sales Data', role, role !== 'Data Entry Executive' ? unavailable : join(
    section('Sales Data Form', ['Data Entry Executive can add sales data', 'Company and contact details', 'Industry / Sector details', 'Location details', 'Website and social links', 'Acquisition information']),
    section('Validation', ['Required field validation', 'Field error messages'])
  ));
  set('Account Menu', role, section('Account Options', [`${role} can open Settings`, `${role} can reset own password`, `${role} can log out`]));
}

// Preserve the supplied wording; flag existing discrepancies separately.
const notes = workbook.addWorksheet('Review Notes');
notes.addRows([
  ['Section', 'Review Note'],
  ['Documentation scope', 'Completed from the existing role inventory and current frontend source. UI availability is described; backend authorization is not audited.'],
  ['Original content', 'Existing non-empty cells in Sheet1 are preserved exactly. New content follows the same headings and dash-bullet pattern.'],
  ['Dashboard / Sales Manager', 'The existing text does not include Sales Executives. This card now appears with the top stat cards; executive name and email cards remain below the charts.'],
  ['Website Leads / Sales Manager', 'The existing Manage Assignees paragraph needs review: the current toolbar shows this option only to super_admin and company_admin.'],
  ['Website Leads / Sales Manager', 'Existing listing-edit and job edit/delete claims need review: the prior feature inventory restricts those dedicated actions to administrator roles.'],
  ['Website Leads / Company Admin and Sales Manager', 'The existing Jobs paragraph says Super Admin in both columns; review the role names and permissions before publishing.'],
  ['Dashboard / Super Admin and Company Admin', 'Sales Executive Performance appears twice in the supplied text. Review the intended label for the lead charts section.'],
  ['Sales Executive dashboard', 'Client, project, job and target cards depend on the fields returned by the executive stats API.'],
  ['Settings / Super Admin', 'Current role-access.js restricts lead status and project size mutations to Company Admin. Super Admin can inspect company settings; follow-up duration has its own management controls.'],
  ['Module Access', 'Not available in the role sidebar describes navigation visibility; it does not claim a complete API permission audit.'],
  ['Sources', 'reports/role-modules-features-2026-11-05.xlsx; src/App.jsx; src/pages/auth/role-access.js; current dashboard, lead, company, user management, settings and account menu components.']
]);
sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
sheet.getColumn(1).width = 24;
for (let column = 2; column <= 6; column++) sheet.getColumn(column).width = 58;
sheet.eachRow((row, index) => {
  row.eachCell({ includeEmpty: true }, cell => {
    cell.alignment = { vertical: 'top', wrapText: true };
    cell.font = { name: 'Calibri', size: 11, bold: index === 1 || cell.col === 'A' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFD9E2F3' } } };
    if (index === 1) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF24476A' } };
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    }
  });
  row.height = index === 1 ? 32 : Math.min(409, Math.max(60, ...row.values.filter(v => typeof v === 'string').map(v => v.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 57)), 0) * 14)));
});
notes.columns = [{ width: 42 }, { width: 110 }];
notes.eachRow((row, index) => {
  row.alignment = { vertical: 'top', wrapText: true };
  row.height = index === 1 ? 26 : 60;
  if (index === 1) row.font = { bold: true };
});
await workbook.xlsx.writeFile(output);
const check = new ExcelJS.Workbook();
await check.xlsx.readFile(output);
for (const [address, value] of originals) assert.deepEqual(check.worksheets[0].getCell(address).value, value);
for (let r = 2; r <= check.worksheets[0].rowCount; r++) {
  for (let c = 1; c <= 6; c++) assert.ok(check.worksheets[0].getCell(r, c).value, `Missing cell ${r},${c}`);
}
console.log(`Created ${output}; verified original cells and all ${sheet.rowCount - 1} feature rows across five roles.`);
