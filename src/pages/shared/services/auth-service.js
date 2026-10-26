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
        const account = payload?.data;
        if (payload?.success !== true) throw new Error(payload?.message || 'Super admin sign-in failed.');
        if (!isSuperAdmin(account?.user_type)) throw new Error('This account does not have super admin access.');
        if (typeof account?.access !== 'string' || !account.access.trim() ||
            typeof account?.refresh !== 'string' || !account.refresh.trim()) {
            throw new Error('The login response did not include valid session tokens.');
        }
        localStorage.setItem('access_token', account.access);
        localStorage.setItem('refresh_token', account.refresh);
        const { id, name, email: address, phone, user_type, slug, is_superuser } = account;
        return { id, name, email: address, phone, user_type, slug, is_superuser,
            ...(account.company_id != null ? { company_id: account.company_id } : {}),
            ...(account.company != null ? { company: account.company } : {}),
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Unable to sign in. Please try again.');
    }
};

export const loginUser = async (values) => {
    const formData = new FormData();
    formData.append('email', values.email);
    formData.append('otp', values.otp);


    try {
        const response = await axios.post(`${API_URL}/accounts/validate-otp`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });


        const { access, refresh } = response.data;

        // Store tokens in localStorage
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        console.error('Login error response:', error.response?.data);
        throw error.response?.data || new Error('Login failed');
    }
};

export const loginWithPassword = async ({ email, password }) => {
    try {
        const formData = new FormData();
        formData.append('email', email.trim());
        formData.append('password', password);
        const { data: payload } = await axios.post(`${API_URL.replace(/\/$/, '')}/accounts/login`, formData);
        if (payload?.success === false) throw new Error(payload.message || 'Login failed.');
        const session = payload?.data ?? payload;
        const account = session?.user ?? session;
        if (!getRoleHome(account?.user_type)) throw new Error('The login response did not include a supported user role.');
        const access = session?.access ?? payload?.access;
        const refresh = session?.refresh ?? payload?.refresh;
        if (typeof access !== 'string' || !access.trim() || typeof refresh !== 'string' || !refresh.trim()) {
            throw new Error('The login API did not return session tokens. Direct sign-in must be enabled on the server.');
        }
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        const { id, name, email: address, phone, user_type, slug, is_superuser } = account;
        return { id, name, email: address, phone, user_type, slug, is_superuser,
            ...(account.company_id != null ? { company_id: account.company_id } : {}),
            ...(account.company != null ? { company: account.company } : {}),
        };
    } catch (error) {
        if (error.response?.status === 404) throw new Error('User does not exist');
        throw new Error(error.response?.data?.message || error.message || 'Unable to sign in. Please try again.');
    }
};
