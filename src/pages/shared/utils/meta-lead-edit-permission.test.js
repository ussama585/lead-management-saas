import { expect, it } from 'vitest';
import { canSalesExecutiveEditMetaLead } from './meta-lead-edit-permission.js';

const user = { id: 4, user_type: 'sales_executive' };
it.each([{ assigned_to: 4 }, { assigned_to: '4' }, { assigned_to_id: '4' }, { assigned_to: { id: 4 } }, { assigned_to: { user_id: '4' } }])('allows the assigned executive for API representation %j', lead => {
  expect(canSalesExecutiveEditMetaLead(user, lead)).toBe(true);
});
it.each([{}, { assigned_to: null }, { assigned_to: 5 }, { assigned_to: '' }])('does not hide the Meta Lead detail action because assignment data is missing or uses another ID: %j', lead => {
  expect(canSalesExecutiveEditMetaLead(user, lead)).toBe(true);
});
it.each(['sales_manager', 'company_admin', 'data_entry_executive', undefined])('does not expand other roles through the Sales Executive permission: %s', user_type => {
  expect(canSalesExecutiveEditMetaLead({ user_type })).toBe(false);
});
