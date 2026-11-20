import React from 'react';
import { Select } from '../../../components/ui/app-select.jsx';
import { Button } from '../../../components/ui/app-controls.jsx';
import LeadTopFiltersAccordion from '../../../components/lead-top-filters-accordion.jsx';
import { LeadProjectFilter } from '../../../components/lead-date-filter-slot.jsx';
import '../../../assets/styles/data-leads-page.css';
import '../../../assets/styles/user-management-filters.css';

const companyRoles = [
  ['all', 'All Users'], ['company_admin', 'Company Admins'], ['sales_manager', 'Sales Managers'],
  ['sales_executive', 'Sales Executives'], ['data_entry_executive', 'Data Entry Executives'],
];
const otherRoles = [
  ['all', 'All Users'], ['sales_manager', 'Sales Managers'], ['sales_executive', 'Sales Executives'],
  ['data_entry_executive', 'Data Entry Executives'], ['recruitment_manager', 'Recruitment Managers'],
  ['recruitment_executive', 'Recruitment Executives'], ['project_manager', 'Project Managers'],
  ['marketing_manager', 'Marketing Manager'], ['accountant', 'Accountant'], ['admin', 'Admins'],
];

export default function UserManagementFilters({ superAdminOnly, companyRolesOnly, showAccountStatus, counts = {},
  role, onRoleChange, status, onStatusChange, onCreate }) {
  return <>
    <LeadTopFiltersAccordion portalAware>
    <div className="lead-filter-toolbar data-leads-ui data-leads-local-toolbar">
    <LeadProjectFilter><div className="lead-listing-filter-dropdowns user-management-filter-fields" data-filter-columns={Number(!superAdminOnly) + Number(showAccountStatus)}>
      {!superAdminOnly && <div className="lead-listing-filter-dropdown">
        <label className="sr-only" htmlFor="user-role-filter">User role</label>
        <Select id="user-role-filter" placeholder="Filter by user role" style={{ width: '100%' }} showSearch optionFilterProp="label"
          value={role} onChange={onRoleChange} options={(companyRolesOnly ? companyRoles : otherRoles)
            .map(([value, label]) => ({ value, label: `${label} (${counts[value] ?? 0})` }))} />
      </div>}
      {showAccountStatus && <div className="lead-listing-filter-dropdown">
        <label className="sr-only" htmlFor="user-active-filter">Account status</label>
        <Select id="user-active-filter" placeholder="Filter by account status" style={{ width: '100%' }} value={status || 'all'}
          onChange={value => onStatusChange(value === 'all' ? '' : value)} options={[
            { value: 'all', label: 'All Statuses' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' },
          ]} />
      </div>}
    </div></LeadProjectFilter>
    </div>
    </LeadTopFiltersAccordion>
    <div className="user-management-actions">
      <Button type="primary" className="user-management-create-button" onClick={onCreate}>Create New User</Button>
    </div>
  </>;
}
