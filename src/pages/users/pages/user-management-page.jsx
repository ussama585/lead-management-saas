import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Row, Col, Form, Input, message, Select, DatePicker, Divider, Alert } from "antd";
import { Formik, Form as FormikForm, Field, ErrorMessage, useField } from "formik";
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Spin, Modal, Table, Button, Tooltip } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import TableComponent from '../../../components/tables/table.component.jsx';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import '../../../assets/styles/legacy/user-management-page.css';
import { ToggleRight as ToggleOnIcon } from 'lucide-react';
import { ToggleLeft as ToggleOffIcon } from 'lucide-react';


import { debounce } from "lodash";
import moment from 'moment';
import formatDateUniversal from '../../shared/utils/formatDate.js';

import EditUserIcon from '../../../assets/images/table-icons/edit-user.svg';
import DeleteUserIcon from '../../../assets/images/table-icons/delete-user.svg';
import ProfileImagePlaceholder from '../../../assets/images/user-card-icons/user-placeholder.svg';
import TargetIcon from '../../../assets/images/table-icons/target-icon.svg';
import GreenPencilIcon from '../../../assets/images/table-icons/green-pencil.svg';
import BlueHamburgerIcon from '../../../assets/images/table-icons/blue-hamburger.svg';

import { getUsers, getAllUsers, getCompanyManagementUsers, getUserCount, getUserTabCounts, toggleUserActivation, requestDeleteUserOtp, validateDeleteUserOtp } from '../../shared/services/users-service.js';
import useUserStore from '../../shared/store/user-store.js';
import { isSuperAdmin } from '../../auth/role-access.js';
import { getTargetForUser } from '../../shared/services/stats-service.js';
import OtpModal from '../../auth/pages/otp-modal.jsx';

export default function UserManagement() {
  const { user: currentUser } = useUserStore();
  console.log(currentUser, "useruseruser")
  const isSuperAdminViewer = isSuperAdmin(currentUser?.user_type);
  const isCompany = currentUser?.user_type === 'company_admin';
  const companyId = isCompany ? currentUser?.company_id : undefined;
  const [activeFilter, setActiveFilter] = useState('');

  const [userForTarget, setUserForTarget] = useState({
    id: undefined,
    name: undefined,
  })

  const [selectedTab, setSelectedTab] = useState('all');

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [toggleUserActivationModalVisible, setToggleUserActivationModalVisible] = useState(false);

  const [userToDelete, setUserToDelete] = useState(null);
  const [userToToggleActivation, setUserToToggleActivation] = useState(null);

  const [userCount, setUserCount] = useState({});


  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);


  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [weekStartDateForTarget, setWeekStartDateForTarget] = useState(null);

  const [timeRange, setTimeRange] = useState({
    start_date: undefined,
    end_date: undefined
  });

  // Table sorting: start "unsorted" and allow asc → desc → clear (no sort)
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [search, setSearch] = useState('');

  const [initialDataForTarget, setInitialDataForTarget] = useState([
    { date: '', values: Array(7).fill("") }, // 8 fields for each date
    { date: '', values: Array(7).fill("") },
    { date: '', values: Array(7).fill("") },
    { date: '', values: Array(7).fill("") },
    { date: '', values: Array(7).fill("") },
    { date: '', values: Array(7).fill("") },
    { date: '', values: Array(7).fill("") },
  ]);

  const [otp, setOtp] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);

  // Fetch users list with pagination
  const usersQueryKey = ['usersList', currentUser?.id, currentUser?.user_type, companyId, pagination.pageIndex, pagination.pageSize, selectedTab, search, sorting, activeFilter];
  const { data: usersList = {}, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: usersQueryKey,
    queryFn: () => isSuperAdminViewer
      ? getAllUsers({ page: pagination.pageIndex + 1, pageSize: pagination.pageSize, userType: selectedTab, search, sorting, isActive: activeFilter })
      : currentUser?.user_type === 'company_admin'
        ? getCompanyManagementUsers(companyId, { page: pagination.pageIndex + 1, pageSize: pagination.pageSize, userType: selectedTab, search, sorting, isActive: activeFilter })
        : getUsers(pagination.pageIndex + 1, pagination.pageSize, selectedTab, search, sorting),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes (adjust as needed)
    cacheTime: 1000 * 60 * 30,
  });

  // Fetch user counts 
  const { data: countData } = useQuery({
    queryKey: ['userCount', currentUser?.id, currentUser?.user_type, companyId],
    queryFn: isSuperAdminViewer || currentUser?.user_type === 'company_admin' ? getUserTabCounts : getUserCount,
    enabled: Boolean(currentUser?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes (adjust as needed)
    cacheTime: 1000 * 60 * 30,
  });

  // Mutation to toggle a user's activation
  const toggleUserActivationMutation = useMutation({
    mutationFn: ({ userId, isActive }) => {
      return toggleUserActivation(userId, isActive);
    },

    onMutate: () => {
      setIsToggling(true);
    },

    onSuccess: (data, variables) => {
      // Update the users list in the cache
      queryClient.setQueryData(
        usersQueryKey,
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            results: oldData.results.map(user =>
              user.id === variables.userId
                ? { ...user, is_active: !user.is_active }
                : user
            ),
          };
        }
      );
      message.success('User state updated successfully.');
    },

    onSettled: () => {
      setIsToggling(false); // Reset loading state after success or error
      setToggleUserActivationModalVisible(false);
      queryClient.invalidateQueries(['usersList']);
      queryClient.invalidateQueries(['userCount']); // Refresh count after deletion
    },
  });




  const { data: targetForUser, isLoading: loadingTargetForUser } = useQuery({
    queryKey: ['targetForUser', userForTarget.id, timeRange.start_date, timeRange.end_date],
    queryFn: () => getTargetForUser(userForTarget.id, timeRange.start_date, timeRange.end_date),
    enabled: Boolean(timeRange.start_date && timeRange.end_date && userForTarget.id),
    staleTime: 1000 * 60 * 5, // 5 minutes (adjust as needed)
    cacheTime: 1000 * 60 * 30,
  })

  const debouncedSetSearch = useMemo(
    () => debounce((val) => { setSearch(val); setPagination(previous => ({ ...previous, pageIndex: 0 })); }, 500),
    []
  );

  useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

  const handleGlobalFilterChange = (val) => {
    setGlobalFilter(val);         // updates UI
    debouncedSetSearch(val);      // triggers API with delay
  };

  useEffect(() => {
    if (targetForUser && targetForUser.targets) {
      const updatedData = targetForUser.targets.map((target) => ({
        date: formatDateUniversal(target.date, false),
        values: [
          target.companies_reached ?? "-",
          target.companies_registered ?? "-",
          target.applications_received ?? "-",
          target.job_posted ?? "-",
          target.candidates_reached ?? "-",
          target.candidate_registered ?? "-", // Assuming this is the correct field name in API response
          target.hired ?? "-",
        ],
      }));

      setInitialDataForTarget(updatedData);
      // setWeekStartDateForTarget(null);
    }
  }, [targetForUser]);

  const handleTabClick = (tabValue) => {
    setPagination({ pageIndex: 0, pageSize: 10 });
    setSelectedTab(tabValue);

  };

  const handleCreateUser = () => {
    navigate('/admin/create-user');
  };

  const handleDeleteUser = async (userId, userName) => {
    console.log('[UserManagement] Requesting OTP for user deletion:', userId);
    await requestDeleteUserOtp(userId);
    setUserToDelete({
      userId: userId,
      userName: userName
    });
    setOtpModalVisible(true);
    console.log('[UserManagement] OTP modal shown for user:', userId);
  };

  const handleOtpSubmit = async (otp) => {
    if (userToDelete && userToDelete.userId) {
      try {
        await validateDeleteUserOtp(userToDelete.userId, otp); // Only proceed if successful
        setOtpModalVisible(false);
        setUserToDelete(null);
        // Invalidate all usersList queries to ensure reload
        queryClient.invalidateQueries({ queryKey: ['usersList'] });
        queryClient.invalidateQueries({ queryKey: ['userCount'] }); // Invalidate userCount for tab update
        message.success('User deleted successfully ');
      } catch (error) {
        // Show OTP error message
        message.error('Invalid OTP. Please try again.');
      }
    }
  };

  const handleToggleUser = (userId, userName, isActive) => {

    setUserToToggleActivation({
      userId: userId,
      userName: userName,
      isActive: isActive,
    });

    setToggleUserActivationModalVisible(true);
  };

  const confirmToggleUserActivation = () => {
    if (userToToggleActivation.userId && userToToggleActivation.userName) {
      toggleUserActivationMutation.mutate({ userId: userToToggleActivation?.userId, isActive: userToToggleActivation?.isActive });
    }
  };

  useEffect(() => {
    if (countData) {
      setUserCount({
        ...countData,
        all: countData.all,
        admin: countData.admins ?? countData.company_admin,
        sales_manager: countData.sales_manager ?? countData.managers,
        sales_executive: countData.sales_executive ?? countData.executives,
        data_entry_executive: countData.data_entry_executive ?? countData.data_entry_executives,
        recruitment_manager: countData.recruitment_managers,
        recruitment_executive: countData.recruitment_executives,
        project_manager: countData.project_managers || countData.project_manager || 0,
        marketing_manager: countData.marketing_manager,
        accountant: countData.accountant
      });
    }
  }, [countData]);

  const handleSortingChange = (newSorting) => {
    // Allow MRT's normal cycle: asc → desc → [] (clear sort)
    setSorting(newSorting || []);
    setPagination(previous => ({ ...previous, pageIndex: 0 }));
  };


  const columns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        enableSorting: false,
        enableColumnFilter: false,
        enableColumnActions: false,
        Cell: ({ row }) => <span>{row.index + 1 + pagination.pageIndex * pagination.pageSize}</span>,
      },
      {
        header: 'Name',
        accessorKey: 'name',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }}>
              <img
                src={row.profile_pic || ProfileImagePlaceholder}
                alt="Profile"
                style={{ width: 40, height: 40, flexShrink: 0, objectFit: 'cover', borderRadius: '50%', marginRight: '10px' }}
              />
              <span>{row.name}</span>
            </div>
          );
        },
      },
      {
        header: 'User Type',
        accessorKey: 'user_type',
        Cell: ({ cell }) => <span style={{ display: 'flex', alignItems: 'center' }}>{String(cell.getValue() || '')
          .replace(/_/g, ' ') // Replace underscores with spaces
          .replace(/\b\w/g, char => char.toUpperCase())}</span>,
      },
      {
        header: 'Phone',
        accessorKey: 'phone',
        Cell: ({ cell }) => <span style={{ display: 'flex', alignItems: 'center' }}>{cell.getValue()}</span>,
      },
      {
        header: 'Email',
        accessorKey: 'email',
        Cell: ({ cell }) => <span style={{ display: 'flex', alignItems: 'center' }}>{cell.getValue()}</span>,
      },
      {
        header: 'Manager',
        accessorKey: 'manager',
        enableSorting: true,  // Add this line
        enableColumnFilter: true,  // Add this line
        enableColumnActions: true,  // Add this line
        Cell: ({ cell }) => <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cell.getValue() ? cell.getValue() : "-"}</span>,
      },
      {
        header: 'Edit User',
        accessorFn: (row) => row,
        enableSorting: false,
        enableColumnFilter: false,
        enableColumnActions: false,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            !isSuperAdmin(row.user_type) ? (
              <img
                src={EditUserIcon}
                alt="Edit"
                onClick={() => navigate(`/admin/edit-user/${row.id}`)}
                style={{ cursor: 'pointer', width: '20px', height: '20px' }}
              />
            ) : (
              <span>-</span>
            )
          );
        },
      },
      {
        header: 'Delete User',
        enableColumnActions: false,
        accessorFn: (row) => row,
        enableSorting: false,
        enableColumnFilter: false,
        enableColumnActions: false,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            !isSuperAdmin(row.user_type) ? (
              <img
                src={DeleteUserIcon}
                alt="Delete"
                onClick={() => handleDeleteUser(row.id, row.name)}
                style={{ cursor: 'pointer', width: '20px', height: '20px' }}
              />
            ) : (
              <span>-</span>
            )
          );
        },
      },
      {
        header: 'Active/Deactive User',
        enableSorting: false,
        enableColumnFilter: false,
        enableColumnActions: false,
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            !isSuperAdmin(row.user_type) ? (
              row.is_active ? (
                <ToggleOnIcon size="1em" className="app-icon"

                  onClick={() => handleToggleUser(row.id, row.name, row.is_active)}
                  style={{ fontSize: 35, ...({ cursor: 'pointer', color: 'green' }) }}
                />
              ) : (
                <ToggleOffIcon size="1em" className="app-icon"

                  onClick={() => handleToggleUser(row.id, row.name, row.is_active)}
                  style={{ fontSize: 35, ...({ cursor: 'pointer', color: 'red' }) }}
                />
              )
            ) : (
              <span>-</span>
            )
          );
        },
      },
      // {
      //   header: 'Targets',
      //   enableSorting: false,
      //   enableColumnFilter: false,
      //   enableColumnActions: false,
      //   accessorFn: (row) => row,
      //   Cell: ({ cell }) => {
      //     const row = cell.getValue();
      //     // Only show for non-admin and non-data_entry_executive
      //     return (
      //       !isSuperAdmin(row.user_type) && row.user_type !== 'data_entry_executive' ? (
      //         <img
      //           src={TargetIcon}
      //           alt="Target"
      //           onClick={() => navigate(`/admin/target-detail/${row.id}`)}
      //           style={{ cursor: 'pointer', width: '20px', height: '20px' }}
      //         />
      //       ) : (
      //         <span>-</span>
      //       )
      //     );
      //   },
      // },

    ],
    [navigate, pagination.pageIndex, pagination.pageSize]
  );


  const columnHeaders = [
    { label: "Date", key: "date" },
    { label: "Companies Approached", key: "companies_approached" },
    { label: "Companies Registered", key: "companies_registered" },
    { label: "Applications Received", key: "applications_received" },
    { label: "Job Posts", key: "job_posts" },
    { label: "Candidates Approached", key: "candidates_approached" },
    { label: "Candidates Registered", key: "candidates_registered" },
    { label: "Hirings", key: "hirings" },
  ];



  const getWeekDates = (startDate) => {
    if (!startDate) return [];
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(startDate.clone().add(i, 'days').format('ddd, MMM D, YYYY'));
    }
    return dates;
  };

  const handleWeekChangeForTarget = (date) => {
    if (!date) {
      // If date is null (no week selected), clear the dates in initialData
      setWeekStartDateForTarget(null);
      setInitialDataForTarget((prevData) =>
        prevData.map((row) => ({
          ...row,
          date: '', // Clear the date for each row
        }))
      );

      setTimeRange({
        start_date: undefined,
        end_date: undefined,
      });


      return;
    }



    // Adjust start of the week to Monday and end to Sunday
    const startOfWeek = date.startOf('week').add(1, 'day'); // Monday


    const endOfWeek = startOfWeek.clone().add(6, 'days'); // Sunday

    setWeekStartDateForTarget(startOfWeek);


    setTimeRange({
      start_date: startOfWeek.format("YYYY-MM-DD"),
      end_date: endOfWeek.format("YYYY-MM-DD"),
    });

    // Get the week dates (Monday to Sunday)
    const weekDates = getWeekDates(startOfWeek);

    // Update initialDataForNewTarget with the selected week's dates
    setInitialDataForTarget((prevData) =>
      prevData.map((row, index) => ({
        ...row,
        date: weekDates[index] || '', // Update the date for each row
      }))
    );
  };

  useEffect(() => {
    setGlobalFilter('');
    setSearch('');
  }, [selectedTab]);

  return (
    <>
      <BreadCrumb linkText="All Users" />

      <div className="client-tabs-container">

        <div className="client-tabs">
          {isSuperAdminViewer || currentUser?.user_type === 'company_admin' ? [
            ['all', 'All Users'], ...(isSuperAdminViewer ? [['super_admin', 'Super Admins']] : []), ['company_admin', 'Company Admins'],
            ['sales_manager', 'Sales Managers'], ['sales_executive', 'Sales Executives'], ['data_entry_executive', 'Data Entry Executives'],
          ].map(([value, label]) => <button key={value} type="button" className={`tab ${selectedTab === value ? 'active' : ''}`} onClick={() => handleTabClick(value)}>
            {label} ({userCount[value] ?? 0})
          </button>) : <>
            <button
              className={`tab ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabClick('all')}
            >
              All ({userCount['all'] || 0})
            </button>
            <button
              className={`tab ${selectedTab === 'sales_manager' ? 'active' : ''}`}
              onClick={() => handleTabClick('sales_manager')}
            >
              Sales Managers ({userCount['sales_manager'] || 0})
            </button>
            <button
              className={`tab ${selectedTab === 'sales_executive' ? 'active' : ''}`}
              onClick={() => handleTabClick('sales_executive')}
            >
              Sales Executives ({userCount['sales_executive'] || 0})
            </button>
            <button
              className={`tab ${selectedTab === 'data_entry_executive' ? 'active' : ''}`}
              onClick={() => handleTabClick('data_entry_executive')}
            >
              Data Entry Executives ({userCount['data_entry_executive'] || 0})
            </button>
            <button
              className={`tab ${selectedTab === 'recruitment_manager' ? 'active' : ''}`}
              onClick={() => handleTabClick('recruitment_manager')}
            >
              Recruitment Managers ({userCount['recruitment_manager'] || 0})
            </button>
            <button
              className={`tab ${selectedTab === 'recruitment_executive' ? 'active' : ''}`}
              onClick={() => handleTabClick('recruitment_executive')}
            >
              Recruitment Executives ({userCount['recruitment_executive'] || 0})
            </button>
            <button
              className={`tab ${selectedTab === 'project_manager' ? 'active' : ''}`}
              onClick={() => handleTabClick('project_manager')}
            >
              Project Managers ({userCount['project_manager'] || 0})
            </button>

            <button
              className={`tab ${selectedTab === 'marketing_manager' ? 'active' : ''}`}
              onClick={() => handleTabClick('marketing_manager')}
            >
              Marketing Manager ({userCount['marketing_manager'] || 0})
            </button>

            <button
              className={`tab ${selectedTab === 'accountant' ? 'active' : ''}`}
              onClick={() => handleTabClick('accountant')}
            >
              Accountant ({userCount['accountant'] || 0})
            </button>
            <button
              className={`tab ${selectedTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleTabClick('admin')}
            >
              Admins ({userCount['admin'] || 0})
            </button>
          </>}

        </div>

        <button className="createUserBtn" onClick={handleCreateUser}>
          Create New User
        </button>

      </div>

      <Divider />
      {isSuperAdminViewer && <div className="mb-4 flex items-center gap-3">
        <label htmlFor="user-active-filter">Account status</label>
        <Select id="user-active-filter" value={activeFilter} style={{ width: 180 }} options={[
          { value: '', label: 'All statuses' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' },
        ]} onChange={value => { setActiveFilter(value); setPagination(previous => ({ ...previous, pageIndex: 0 })); }} />
      </div>}
      {isError && <Alert className="mb-4" type="error" showIcon message={error?.response?.data?.message || error?.message || 'Could not load users.'} action={<Button onClick={() => refetch()}>Retry</Button>} />}

      <div>
        <TableComponent
          initialState={pagination}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          globalFilter={globalFilter}
          onGlobalFilterChange={handleGlobalFilterChange}
          columns={isSuperAdminViewer ? columns.filter(column => column.accessorKey !== 'manager') : columns}
          isLoading={isLoading}
          isFetching={isFetching}
          enableGlobalFilter={true}
          data={usersList.results || []}
          totalCount={usersList.count || 0}
          heading={selectedTab
            .split('_') // Split the string by underscores
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
            .join(' ')}
        />
      </div>

      <OtpModal
        openModal={otpModalVisible}
        setOpenModal={setOtpModalVisible}
        email={userToDelete ? userToDelete.userName : ''}
        onSubmit={handleOtpSubmit}
      />

      <Modal
        title="Confirm Changing User's State"
        visible={toggleUserActivationModalVisible}
        onOk={confirmToggleUserActivation}
        onCancel={() => {

          setToggleUserActivationModalVisible(false);


        }}
        okText={
          isToggling ? (
            <span>
              <Spin style={{ color: 'white' }} indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin" style={{ color: 'white' }} />} size="small" /> Changing State...
            </span>
          ) : (
            userToToggleActivation?.isActive ? "Deactivate" : "Activate"
          )
        }
        cancelText="Cancel"
        okButtonProps={{
          disabled: isToggling,
          className: isToggling ? 'custom-disabled-button' : '',
        }}
        cancelButtonProps={{
          disabled: isToggling,
          className: isToggling ? 'custom-disabled-button' : 'custom-delete-btn',
        }}
        className='custom-delete-modal'
      >
        {userToToggleActivation ? (
          <p>Are you sure you want to change this user's state: <br /><b>{userToToggleActivation.userName}</b> ?</p>
        ) : (
          <p>Loading...</p> // Fallback content
        )}
      </Modal>



    </>
  );
}
