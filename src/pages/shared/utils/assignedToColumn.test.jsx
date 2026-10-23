import { describe, expect, it, vi } from 'vitest';
import { createAssignedToColumn } from './assignedToColumn.jsx';
vi.mock('antd', () => { const Select = () => null; Select.Option = () => null; return { Select }; });
vi.mock('./statusColumn.jsx', () => ({ isLeadConvertedToClient: entry => entry.converted_to_client === true }));
describe('Data Leads assignment by user ID', () => {
  it('distinguishes users with identical names and selects the existing assignee', () => {
    const onAssignmentChange = vi.fn();
    const lead = { assigned_to: 2, assigned_to_name: 'Ali' };
    const column = createAssignedToColumn({ userType: 'super_admin', editableRoles: ['super_admin'], useAssigneeIds: true,
      executivesList: [{ id: 1, name: 'Ali' }, { id: 2, name: 'Ali' }], onAssignmentChange });
    const cell = column.Cell({ row: { original: lead } });
    expect(cell.props.value).toBe('2');
    expect(cell.props.children.map(option => option.props.value)).toEqual(['1', '2']);
    cell.props.onChange('1');
    expect(onAssignmentChange).toHaveBeenCalledWith(lead, '1');
  });
});
