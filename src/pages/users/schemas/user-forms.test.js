import { describe, expect, it } from 'vitest';
import { createUserSchema } from './create-user-schema.js';
import { editUserSchema } from './edit-user-schema.js';
import { applyUserErrors, assertUserSuccess, userFormError } from '../user-form-errors.js';
const user = { name: 'Test User', email: 'test@example.com', phone: '+923001234567', password: 'secret123', confirmPassword: 'secret123', user_type: 'sales_executive', manager: '', company_id: 1 };
describe('User form validation', () => {
  it('prefers detailed API errors over generic validation messages', () => {
    expect(userFormError({ response: { data: { message: 'Validation failed.', errors: { account: { email: ['This email is already registered.'] } } } } })).toBe('This email is already registered.');
    expect(userFormError({ response: { data: { non_field_errors: ['You cannot create this user.'] } } })).toBe('You cannot create this user.');
    expect(userFormError({ response: { data: { detail: 'Permission denied.' } } })).toBe('Permission denied.');
  });
  it.each([['name', '', 'Name is required'], ['email', '', 'Email is required'], ['email', 'bad-email', 'Enter a valid email'], ['phone', '', 'Phone number is required'], ['password', '123', 'at least 6'], ['confirmPassword', 'different', 'Passwords must match'], ['company_id', '', 'Select a company']])('validates create %s', async (key, value, message) => {
    await expect(createUserSchema(true).validateAt(key, { ...user, [key]: value })).rejects.toThrow(message);
  });
  it('accepts a valid create form and optional manager', async () => {
    await expect(createUserSchema(true).validate(user)).resolves.toBeDefined();
  });
  it('allows editing without changing password and rejects a short new password', async () => {
    await expect(editUserSchema.validate({ ...user, password: '' })).resolves.toBeDefined();
    await expect(editUserSchema.validate({ ...user, password: '123' })).rejects.toThrow('at least 6');
  });
  it.each(['name', 'email', 'phone'])('requires edit %s', async key => {
    await expect(editUserSchema.validate({ ...user, [key]: '' })).rejects.toThrow();
  });
  it('preserves detailed validation errors from successful HTTP responses', () => {
    expect(() => assertUserSuccess({ success: false, message: 'Validation failed.', errors: 'Email already exists.' })).toThrow('Email already exists.');
  });
  it('maps backend field aliases and marks their errors visible', () => {
    const captured = {};
    const error = { response: { data: { message: 'Validation failed.', errors: { email: ['Already exists.'], manager_id: ['Invalid manager.'] } } } };
    applyUserErrors(error, { setErrors: value => captured.errors = value, setTouched: value => captured.touched = value, setStatus: value => captured.status = value });
    expect(captured.errors).toEqual({ email: 'Already exists.', manager: 'Invalid manager.' });
    expect(captured.touched).toEqual({ email: true, manager: true });
    expect(userFormError(error)).toBe('Already exists. Invalid manager.');
  });
});
