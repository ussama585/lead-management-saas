// src/services/authService.js
import axios from 'axios';
import { API_URL } from '../utils/api.js';
import { isSuperAdmin } from '../../auth/role-access.js';
import { getRoleHome } from '../../auth/role-home.js';

export const loginSuperAdmin = async ({ email, password }) => {
    try {
        const formData = new FormData();
        formData.append('email', email.trim());
        formData.append('password', password);
        const response = await axios.post(`${API_URL.replace(/\/$/, '')}/accounts/superuser/login`, formData);
        const payload = response.data;
        const challenge = payload?.data ?? payload;
        if (payload?.success !== true) throw new Error(payload?.message || 'Super admin sign-in failed.');
        if (challenge?.otp_required !== true) throw new Error('The super admin login API did not request OTP verification.');
        return { email: challenge.email || email.trim(), otp_required: true };
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Unable to sign in. Please try again.');
    }
};

export const loginUser = async ({ email, otp, superAdminOnly = false }) => {
    const formData = new FormData();
    formData.append('email', email.trim());
    formData.append('otp', String(otp).trim());
    try {
        const { data: payload } = await axios.post(`${API_URL.replace(/\/$/, '')}/accounts/validate-otp`, formData);
        if (payload?.success === false || payload?.status === false) throw new Error(payload.message || 'OTP verification failed.');
        const session = payload?.data ?? payload;
        const account = session?.user ?? session;
        if (!getRoleHome(account?.user_type)) throw new Error('The login response did not include a supported user role.');
        if (superAdminOnly && !isSuperAdmin(account.user_type)) throw new Error('This account does not have super admin access.');
        const access = session?.access ?? payload?.access;
        const refresh = session?.refresh ?? payload?.refresh;
        if (typeof access !== 'string' || !access.trim() || typeof refresh !== 'string' || !refresh.trim()) {
            throw new Error('The verification response did not include valid session tokens.');
        }
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        const { id, name, email: address, phone, user_type, slug, is_superuser } = account;
        return { id, name, email: address || email.trim(), phone, user_type, slug, is_superuser,
            ...(account.company_id != null ? { company_id: account.company_id } : {}),
            ...(account.company != null ? { company: account.company } : {}),
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Verification failed. Check your code and try again.');
    }
};

export const loginWithPassword = async ({ email, password }) => {
    try {
        const formData = new FormData();
        formData.append('email', email.trim());
        formData.append('password', password);
        const { data: payload } = await axios.post(`${API_URL.replace(/\/$/, '')}/accounts/login`, formData);
        if (payload?.success === false || payload?.status === false) throw new Error(payload.message || 'Login failed.');
        const challenge = payload?.data ?? payload;
        if (challenge?.otp_required !== true) throw new Error('The login API did not request OTP verification. Super admins should use super admin sign in.');
        return { email: challenge.email || email.trim(), otp_required: true };
    } catch (error) {
        if (error.response?.status === 404) throw new Error('User does not exist');
        throw new Error(error.response?.data?.message || error.message || 'Unable to sign in. Please try again.');
    }
};
