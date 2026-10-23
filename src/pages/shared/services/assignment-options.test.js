import { describe, expect, it, vi } from 'vitest';
import api from './api.js';
import { getAssigningUsersListing, getManangersExecutives } from './users-service.js';
import { getMetaLeadsAssigningUserList } from './metaLeads.js';
import { getAssigningUserList, getAssignRecruiterList } from './headhunting.js';
import { getRecruiterAssigningList } from './project-service.js';
vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../store/user-store.js', () => ({ default: () => ({ user: {} }) }));
describe('assignment options across modules', () => {
  it.each([getAssigningUsersListing, getManangersExecutives, getMetaLeadsAssigningUserList, getAssigningUserList, getAssignRecruiterList, getRecruiterAssigningList])(
    'loads the authoritative users-for-assigning array', async load => {
      const users = [{ id: 5, name: 'Usman Khan', user_type: 'data_entry_executive' }, { id: 13, name: 'Ali', user_type: 'sales_executive' }];
      api.get.mockResolvedValue({ data: users });
      expect(await load('sales_manager')).toEqual(users);
      expect(api.get).toHaveBeenLastCalledWith('/accounts/users-for-assigning?user_type=sales_executive');
    },
  );
});
