import { message } from './ui/notifications.jsx';
import { Modal } from './ui/app-modal.jsx';
import { Select } from './ui/app-select.jsx';
import { Button } from './ui/app-controls.jsx';
import React, { useState, useMemo } from 'react';
import { Space, Popconfirm } from 'antd';
import { Trash2 as DeleteOutlined, Plus as PlusOutlined, UserPlus as UserAddOutlined } from 'lucide-react';
import { useQuery, useMutation } from 'react-query';
import { getAssigningUsersListing } from '../pages/shared/services/users-service.js';
import useUserStore from '../pages/shared/store/user-store.js';
import { isSuperAdmin } from '../pages/auth/role-access.js';
import NewTableComponent from './tables/new-table.jsx';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/manage-assignees-modal.css';

/**
 * Props:
 *   visible          – boolean
 *   onClose          – () => void
 *   leadType         – 'meta-leads' | 'website-leads'  (controls title / note copy)
 *   fetchAssigned    – async () => { users, total_users }
 *   addAssigned      – async (payload[]) => { message }
 *   removeAssigned   – async (ids[]) => { message }
 *   queryKey         – unique react-query cache key string
 */
const ManageAssigneesModal = ({
  visible,
  onClose,
  leadType = 'website-leads',
  fetchAssigned,
  addAssigned,
  removeAssigned,
  queryKey,
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUsersSkipRounds, setSelectedUsersSkipRounds] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const user = useUserStore((state) => state.user);

  const isMetaLeads = leadType === 'meta-leads';
  const title = isMetaLeads ? 'Manage User Assignments' : 'Manage User Assignments - Lead Generation';
  const noteText = isMetaLeads
    ? 'Meta leads are automatically assigned to users in this list, one by one. If a user is removed, they will stop receiving leads.'
    : 'Website leads are automatically assigned to users in this list, one by one. If a user is removed, they will stop receiving leads.';

  const {
    data: assignedUsersData,
    isLoading: loadingAssignedUsers,
    refetch: refetchAssignedUsers,
  } = useQuery([queryKey], fetchAssigned, {
    enabled: visible,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  });

  const { data: allExecutivesData, isLoading: loadingExecutives } = useQuery({
    queryKey: ['executiveListOnly', user?.id, user?.user_type],
    queryFn: () => getAssigningUsersListing('sales_executive'),
    enabled: visible && isSuperAdmin(user?.user_type),
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const addUsersMutation = useMutation((payload) => addAssigned(payload), {
    onSuccess: (data) => {
      message.success(data.message || 'User(s) added successfully');
      setSelectedUsers([]);
      refetchAssignedUsers();
    },
    onError: (error) => {
      message.error(error.message || 'Failed to add user(s)');
    },
  });

  const removeUsersMutation = useMutation((ids) => removeAssigned(ids), {
    onSuccess: (data) => {
      message.success(data.message || 'User(s) removed successfully');
      refetchAssignedUsers();
    },
    onError: (error) => {
      message.error(error.message || 'Failed to remove user(s)');
    },
  });

  const assignedUsers = assignedUsersData?.users || [];
  const assignedUserIds = new Set(assignedUsers.map((u) => u.id));
  const availableExecutives = (allExecutivesData || []).filter(
    (exec) => !assignedUserIds.has(exec.id)
  );

  const selectedExecutives = useMemo(
    () => selectedUsers.map((id) => availableExecutives.find((exec) => exec.id === id)).filter(Boolean),
    [selectedUsers, availableExecutives]
  );

  const filteredAssignedUsers = useMemo(() => {
    if (!globalFilter) return assignedUsers;
    const lower = globalFilter.toLowerCase();
    return assignedUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.id.toString().includes(lower)
    );
  }, [assignedUsers, globalFilter]);

  const handleSelectedUsersChange = (ids) => {
    setSelectedUsers(ids);
    setSelectedUsersSkipRounds((prev) => {
      const updated = {};
      ids.forEach((id) => {
        if (Object.prototype.hasOwnProperty.call(prev, id)) updated[id] = prev[id];
      });
      return updated;
    });
  };

  const handleAddUsers = () => {
    if (selectedUsers.length === 0) {
      message.warning('Please select at least one user to add');
      return;
    }
    const payload = selectedUsers.map((id) => ({
      id,
      skip_round: typeof selectedUsersSkipRounds[id] === 'number' ? selectedUsersSkipRounds[id] : 0,
    }));
    addUsersMutation.mutate(payload);
  };

  const handleRemoveUser = (userId) => {
    removeUsersMutation.mutate([userId]);
  };

  const columns = useMemo(
    () => [
      { header: 'ID', accessorKey: 'id', size: 80, enableSorting: true },
      {
        header: 'Name',
        accessorKey: 'name',
        enableSorting: true,
        Cell: ({ cell }) => <span className="manage-assignees-modal__cell-name">{cell.getValue()}</span>,
      },
      { header: 'Email', accessorKey: 'email', enableSorting: true },
      {
        header: 'Skip Round',
        accessorKey: 'skip_round',
        size: 110,
        enableSorting: true,
        Cell: ({ cell }) => <span>{cell.getValue() ?? 0}</span>,
      },
      {
        header: 'Action',
        accessorKey: 'action',
        size: 120,
        enableSorting: false,
        Cell: ({ row }) => (
          <Popconfirm
            title="Remove this user?"
            description="This user will no longer be available for assignment to leads."
            onConfirm={() => handleRemoveUser(row.original.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined size="1em" className="app-icon" />} loading={removeUsersMutation.isLoading} size="small">
              Remove
            </Button>
          </Popconfirm>
        ),
      },
    ],
    [removeUsersMutation.isLoading]
  );

  if (!isSuperAdmin(user?.user_type)) return null;

  return (
    <Modal
      title={
        <div className="flex-row gap-8">
          <UserAddOutlined size="1em" className={["app-icon", "manage-assignees-modal__title-icon"].filter(Boolean).join(' ')} />
          <span>{title}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      classNames={{ body: 'manage-assignees-modal__body' }}
    >
      {/* Add Users Section */}
      <div className="manage-assignees-modal__add-section">
        <h4 className="manage-assignees-modal__section-heading">Add Sales Executives</h4>
        <Space.Compact className="manage-assignees-modal__compact">
          <Select
            mode="multiple"
            placeholder="Search and select executives to add..."
            value={selectedUsers}
            onChange={handleSelectedUsersChange}
            className="manage-assignees-modal__select"
            showSearch
            allowClear
            optionFilterProp="label"
            options={availableExecutives.map((exec) => ({
              value: exec.id,
              label: `${exec.name} (Executive)`,
            }))}
            loading={loadingExecutives}
            disabled={availableExecutives.length === 0}
            maxTagCount="responsive"
          />
          <Button
            type="primary"
            icon={<PlusOutlined size="1em" className="app-icon" />}
            onClick={handleAddUsers}
            loading={addUsersMutation.isLoading}
            disabled={selectedUsers.length === 0}
            className="manage-assignees-modal__add-button"
          >
            Add Selected
          </Button>
        </Space.Compact>

        {selectedExecutives.length > 0 && (
          <div className="mt-16">
            <h5 className="manage-assignees-modal__selected-heading">Selected Sales Executives</h5>
            <div className="flex-row flex-wrap gap-12">
              {selectedExecutives.map((exec) => (
                <div
                  key={exec.id}
                  className="manage-assignees-modal__selected-card"
                >
                  <div className="manage-assignees-modal__selected-card-name">{exec.name}</div>
                  <div className="manage-assignees-modal__selected-card-email">{exec.email}</div>
                  <div className="manage-assignees-modal__skip-round-row">
                    <span className="manage-assignees-modal__skip-round-label">Skip Round:</span>
                    <Select
                      size="small"
                      value={typeof selectedUsersSkipRounds[exec.id] === 'number' ? selectedUsersSkipRounds[exec.id] : 0}
                      onChange={(value) =>
                        setSelectedUsersSkipRounds((prev) => ({ ...prev, [exec.id]: value }))
                      }
                      className="manage-assignees-modal__skip-round-select"
                    >
                      {[0, 1, 2, 3, 4, 5].map((val) => (
                        <Select.Option key={val} value={val}>
                          {val}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined size="1em" className="app-icon" />}
                    onClick={() => handleSelectedUsersChange(selectedUsers.filter((id) => id !== exec.id))}
                    className="manage-assignees-modal__selected-card-remove"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {availableExecutives.length === 0 && !loadingExecutives && (
          <div className="manage-assignees-modal__empty-note">
            All available executives have been added.
          </div>
        )}
      </div>

      {/* Assigned Users Section */}
      <div>
        <h4 className="manage-assignees-modal__section-heading">
          Assigned Executives ({assignedUsersData?.total_users || 0})
        </h4>

        <NewTableComponent
          totalCount={filteredAssignedUsers.length}
          columns={columns}
          data={filteredAssignedUsers}
          initialState={{}}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          isLoading={loadingAssignedUsers}
          enableRowSelection={false}
          heading="Assigned Sales Executives"
          enableStickyHeader={false}
        />

        <div className="manage-assignees-modal__info-note">
          <strong>ℹ Note:</strong> {noteText}
        </div>
      </div>
    </Modal>
  );
};

export default ManageAssigneesModal;
