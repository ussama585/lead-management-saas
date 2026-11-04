import { afterEach, describe, expect, it, vi } from 'vitest';
import api from './api.js';
import { getAssigningUsersListing, getManangersExecutives } from './users-service.js';
import { getMetaLeadsAssigningUserList } from './metaLeads.js';
import { getAssigningUserList, getAssignRecruiterList } from './headhunting.js';
import { getRecruiterAssigningList } from './project-service.js';
import useUserStore from '../store/user-store.js';
vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../store/user-store.js', () => ({ default: Object.assign(() => ({ user: {} }), { getState: vi.fn(() => ({ user: {} })) }) }));
afterEach(() => vi.unstubAllGlobals());
describe('assignment options across modules', () => {
  it.each(['super_admin', 'company_admin'])('uses the selected company for super admin and no parameters for company admin: %s', async role => {
    vi.stubGlobal('window', { location: { search: '?company_id=5' } });
    useUserStore.getState.mockReturnValue({ user: { user_type: role } });
    api.get.mockResolvedValue({ data: [] });
    await getAssigningUsersListing('sales_executive', { filterByUserType: true });
    expect(api.get).toHaveBeenLastCalledWith(role === 'super_admin' ? '/accounts/users-for-assigning?company_id=5' : '/accounts/users-for-assigning');
    useUserStore.getState.mockReturnValue({ user: {} });
  });
  it.each([getAssigningUsersListing, getManangersExecutives, getMetaLeadsAssigningUserList, getAssigningUserList, getAssignRecruiterList, getRecruiterAssigningList])(
    'omits user_type for company admins', async load => {
      useUserStore.getState.mockReturnValue({ user: { user_type: 'company_admin' } });
      api.get.mockResolvedValue({ data: [] });
      await load('company_admin');
      expect(api.get).toHaveBeenLastCalledWith('/accounts/users-for-assigning');
      useUserStore.getState.mockReturnValue({ user: {} });
    },
  );
  it.each([getAssigningUsersListing, getManangersExecutives, getMetaLeadsAssigningUserList, getAssigningUserList, getAssignRecruiterList, getRecruiterAssigningList])(
    'loads the authoritative users-for-assigning array', async load => {
      const users = [{ id: 5, name: 'Usman Khan', user_type: 'data_entry_executive' }, { id: 13, name: 'Ali', user_type: 'sales_executive' }];
      api.get.mockResolvedValue({ data: users });
      expect(await load('sales_manager')).toEqual(users);
      expect(api.get).toHaveBeenLastCalledWith('/accounts/users-for-assigning?user_type=sales_executive');
    },
  );
});
