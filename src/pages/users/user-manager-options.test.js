import { describe, expect, it } from 'vitest';
import { managerFromUser, managerIdFromOptions, selectedManagerId, withSelectedManager } from './user-manager-options.js';

const selected = { id: 21, name: 'Company 4 Manager', email: 'company4manager.sop@gmail.com', user_type: 'sales_manager' };
describe('nested manager details in both edit-user forms', () => {
  it('resolves an older account ID to the company simple-list manager ID', () => {
    expect(managerIdFromOptions([{ id: 6, name: 'Company 4 Manager' }], { manager_id: 21, manager_name: 'Company 4 Manager' })).toBe(6);
    expect(managerIdFromOptions([{ id: 6, name: 'Same' }, { id: 8, name: 'Same' }], { manager_id: 21, manager_name: 'Same' })).toBe('');
  });
  it('maps the new manager_id and manager_name response into the selected option', () => {
    const manager = managerFromUser({ manager_id: 21, manager_name: 'Company 4 Manager' });
    expect(selectedManagerId(manager)).toBe(21);
    expect(withSelectedManager([], manager)).toEqual([{ id: 21, name: 'Company 4 Manager' }]);
  });
  it('shows no manager when the new response has a null manager_id', () => {
    expect(selectedManagerId(managerFromUser({ manager_id: null, manager_name: null }))).toBe('');
  });
  it('keeps the loaded manager name when the selected response omits its name', () => {
    expect(withSelectedManager([{ id: '21', name: 'Company 4 Manager' }], managerFromUser({ manager_id: 21 }))).toEqual([{ id: 21, name: 'Company 4 Manager' }]);
  });
  it('uses the nested ID as the selected form value', () => {
    expect(selectedManagerId(selected)).toBe(21);
    expect(selectedManagerId(null)).toBe('');
    expect(selectedManagerId(21)).toBe(21);
  });
  it('keeps the selected manager available before options have loaded', () => {
    expect(withSelectedManager(undefined, selected)).toEqual([selected]);
    expect(withSelectedManager([{ id: 22, name: 'Other manager' }], selected)[0]).toEqual(selected);
  });
  it('merges selected manager details without duplicate options or changing source data', () => {
    const options = [{ id: 21, name: 'Old name' }];
    expect(withSelectedManager(options, selected)).toEqual([selected]);
    expect(options).toEqual([{ id: 21, name: 'Old name' }]);
  });
});
