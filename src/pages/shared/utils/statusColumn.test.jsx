import { describe, expect, it, vi } from 'vitest';
import { createStatusColumn } from './statusColumn.jsx';
import { STATUS_OPTIONS } from '../../leads/pages/website-leads/website-leads-constants.js';
vi.mock('../services/leads.js', () => ({ getConversionToPotential: vi.fn(), createOrUpdateConversionToPotential: vi.fn() }));
vi.mock('antd', () => { const Select = () => null; Select.Option = () => null; return { Select, message: {} }; });

describe('Website Lead status dropdown', () => {
  function render(role, overrides = {}) {
    const onOpenRemarksModal = vi.fn();
    const onDirectStatusUpdate = vi.fn();
    const lead = { id: 5, status: 'Pending Contact', ...overrides };
    const column = createStatusColumn({ userType: role, statusColors: {}, statusOptions: STATUS_OPTIONS,
      requireRemarksForAll: true, editableRoles: ['admin', 'super_admin', 'company_admin', 'sales_manager', 'sales_executive'],
      onOpenRemarksModal, onDirectStatusUpdate });
    return { cell: column.Cell({ cell: { getValue: () => lead.status }, row: { original: lead } }), lead, onOpenRemarksModal, onDirectStatusUpdate };
  }
  it.each(['super_admin', 'company_admin', 'sales_manager', 'sales_executive'])('shows the current selection and all configured options for %s', role => {
    const { cell } = render(role);
    expect(cell.props.value).toBe('Pending Contact');
    expect(cell.props.children.map(option => option.props.value)).toEqual(STATUS_OPTIONS);
  });
  it('updates Potential Client directly without jobs or a conversion modal', async () => {
    const { cell, lead, onOpenRemarksModal, onDirectStatusUpdate } = render('super_admin', { job_count: 0 });
    await cell.props.onChange('Potential Client');
    expect(onDirectStatusUpdate).toHaveBeenCalledWith(lead, 'Potential Client');
    expect(onOpenRemarksModal).not.toHaveBeenCalled();
  });
  it.each(STATUS_OPTIONS.filter(status => !['Pending Contact', 'Potential Client'].includes(status)))('opens remarks before saving %s', async status => {
    const { cell, lead, onOpenRemarksModal, onDirectStatusUpdate } = render('super_admin');
    await cell.props.onChange(status);
    expect(onOpenRemarksModal).toHaveBeenCalledWith(lead, status);
    expect(onDirectStatusUpdate).not.toHaveBeenCalled();
  });
  it('does not update when selecting the current value', async () => {
    const { cell, onOpenRemarksModal } = render('super_admin');
    await cell.props.onChange('Pending Contact');
    expect(onOpenRemarksModal).not.toHaveBeenCalled();
  });
  it('keeps converted leads read-only', () => {
    expect(render('super_admin', { converted_to_client: true }).cell.type).toBe('span');
  });
});
