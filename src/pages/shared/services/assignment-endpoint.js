import useUserStore from '../store/user-store.js';

export function assignmentEndpoint() {
  return useUserStore.getState().user?.user_type === 'company_admin'
    ? '/accounts/users-for-assigning'
    : '/accounts/users-for-assigning?user_type=sales_executive';
}
