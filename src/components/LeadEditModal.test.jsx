import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import LeadEditModal from './LeadEditModal.jsx';

vi.mock('react-query', () => ({ useMutation: () => ({ mutate: vi.fn(), isLoading: false }), useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('../pages/shared/services/api.js', () => ({ default: { patch: vi.fn() } }));
vi.mock('./ui/app-modal.jsx', () => ({ Modal: () => null }));
vi.mock('antd', () => { const Form = () => null; Form.useForm = () => [{ setFieldsValue: vi.fn() }]; Form.Item = () => null; return { Form }; });

it.each([undefined, 5, '4', { id: 4 }])('renders Edit Lead for a Sales Executive viewing a Meta Lead with assignment %j', assigned_to => {
  const html = renderToStaticMarkup(<LeadEditModal user={{ id: 4, user_type: 'sales_executive' }} lead={{ id: 9, assigned_to }} leadType="Meta Lead" />);
  expect(html).toContain('Edit Lead');
  expect(html).toContain('<button');
});

it('keeps the existing Website Lead permission restriction', () => {
  expect(renderToStaticMarkup(<LeadEditModal user={{ id: 4, user_type: 'sales_executive' }} lead={{ id: 9, assigned_to: 5 }} leadType="Website Lead" />)).toBe('');
});
