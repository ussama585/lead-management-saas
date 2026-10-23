import React, { useState } from 'react';
import { Formik } from 'formik';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Form, Select, Button, message, Spin } from 'antd';
import { createUserSchema } from '../schemas/create-user-schema.js';
import { isSuperAdmin } from '../../auth/role-access.js';
import api from '../../shared/services/api.js';
import useUserStore from '../../shared/store/user-store.js';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import UserDetailCard from '../../../components/user-detail-card.component.jsx';
import UserPlaceholderIcon from '../../../assets/images/user-card-icons/user-placeholder.svg';
import InputField from '../../../components/input-field.component.jsx';
import '../../../assets/styles/legacy/create-user.css';

const { Option } = Select;

export async function createUser(values) {
  const payload = {
    name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(),
    password: values.password, user_type: values.user_type,
  };
  if (values.company_id) payload.company_id = Number(values.company_id);
  if (values.user_type === 'sales_executive' && values.manager) payload.manager_id = Number(values.manager);
  const { data } = await api.post('/accounts/signup', payload);
  if (data?.success === false || data?.status === false) throw new Error(data.message || 'Could not create user.');
  return data;
}

async function listCompanies(search) {
  const { data } = await api.get('/company/list', { params: { page: 1, size: 100, ...(search ? { search } : {}) } });
  if (!Array.isArray(data?.results)) throw new Error(data?.message || 'Could not load companies.');
  return data.results;
}

async function listSalesManagers() {
  const { data } = await api.get('/sales-manager/simple-list');
  if (!Array.isArray(data)) throw new Error(data?.message || 'Could not load sales managers.');
  return data;
}

export default function CreateUser() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const superAdmin = isSuperAdmin(user?.user_type);
  const [companySearch, setCompanySearch] = useState('');
  const { data: companies = [], isLoading: loadingCompanies, isError: companiesError, refetch: refetchCompanies } = useQuery({
    queryKey: ['create-user-companies', user?.id, companySearch],
    queryFn: () => listCompanies(companySearch), enabled: superAdmin,
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [hoveredOption, setHoveredOption] = useState(null);
  const [loading, setLoading] = useState(false);

  const { mutate: createUserMutate, isLoading } = useMutation({
    mutationFn: createUser,
    onMutate: () => {
      setLoading(true); // Set loading to true when mutation starts
    },

    onSuccess: () => {
      queryClient.invalidateQueries('usersList');
      queryClient.invalidateQueries('userCount'); // Refetch user counts for tabs
      message.success('User created successfully');
    },
    onError: (error) => {
      // Check for API error response for existing user
      const apiMsg = error?.response?.data;
      if (apiMsg && apiMsg.email && Array.isArray(apiMsg.email) && apiMsg.email[0].includes('already exists')) {
        message.error('A user with this email already exists.');
      } else {
        message.error(`Failed to create user: ${error.message}`);
      }
    },
    onSettled: () => {
      setLoading(false); // Reset loading state when mutation is settled
    },
  });

  const handleUserTypeChange = (value, setFieldValue) => {
    setFieldValue('user_type', value); // Changed from userType to user_type
    setCurrentUserType(value); // Update current user type for manager list
    setFieldValue('manager', ''); // Clear manager selection when user type changes
  };
  const handleManagerSelect = (value, setFieldValue) => {
    setFieldValue('manager', value);
  };

  // State to track current user type for manager list
  const [currentUserType, setCurrentUserType] = useState('sales_executive');

  const { data: managerList = [], isLoading: loadingManagerList, isError: managerListError, refetch: refetchManagers } = useQuery({
    queryKey: ['create-user-sales-managers', user?.id, user?.user_type],
    queryFn: listSalesManagers,
    enabled: currentUserType === 'sales_executive',
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return (
    <>
      <BreadCrumb linkText="Create New User" />
      <div className="container">

        <div className="flex-container">
          <UserDetailCard
            type="general"
            name={name}
            phoneNumber={phone}
            email={email}
            isCreate={false}
            showPencil={false}
            avatar={UserPlaceholderIcon}

          />

          <div className="form-container">
            <Formik
              initialValues={{
                name: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                user_type: 'sales_executive', // Ensure this matches the initialValues
                manager: '',
                company_id: superAdmin ? '' : (user?.company_id || user?.company?.id || (typeof user?.company === 'number' ? user.company : '')),
              }}
              validationSchema={createUserSchema(superAdmin)}
              onSubmit={(values, { setErrors }) => {
                createUserMutate(values, { onError: error => {
                  const body = error?.response?.data;
                  const fields = body?.errors || body;
                  if (!fields || typeof fields !== 'object') return;
                  const errors = {};
                  for (const key of ['name', 'email', 'phone', 'password', 'user_type', 'company_id', 'manager_id']) {
                    const value = fields[key];
                    if (typeof value === 'string' || Array.isArray(value)) errors[key === 'manager_id' ? 'manager' : key] = Array.isArray(value) ? value.join(' ') : value;
                  }
                  setErrors(errors);
                } });
              }}
              validateOnMount
              validateOnBlur // Validate on blur
              validateOnChange // Validate on change
            >
              {({ handleSubmit, values, setFieldValue, errors, touched }) => (
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    {superAdmin && <Form.Item className="form-item" validateStatus={touched.company_id && errors.company_id ? 'error' : undefined} help={touched.company_id && errors.company_id}>
                      <label className="label">Company <span className="asterisk">*</span></label>
                      <Select className="dropdown-select" placeholder="Select Company" value={values.company_id || undefined}
                        loading={loadingCompanies} showSearch filterOption={false} onSearch={setCompanySearch}
                        onChange={value => { setFieldValue('company_id', value); setFieldValue('manager', ''); }}
                        options={companies.map(company => ({ value: company.id, label: company.name }))} />
                      {companiesError && <div role="alert">Could not load companies. <Button type="link" onClick={() => refetchCompanies()}>Retry</Button></div>}
                    </Form.Item>}
                    <Form.Item className="form-item">
                      <label className="label">
                        Name <span className="asterisk">*</span>
                      </label>
                      <InputField
                        type="text"
                        placeholder="Enter your name"
                        value={values.name}
                        onChange={(e) => {
                          setFieldValue('name', e.target.value);
                          setName(e.target.value); // Update local state
                        }}
                        name="name"
                      />
                      {touched.name && errors.name && (
                        <div className="error" style={{ color: 'red' }}>
                          {errors.name}
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item className="form-item">
                      <label className="label">
                        Email <span className="asterisk">*</span>
                      </label>
                      <InputField
                        type="email"
                        placeholder="Enter your email"
                        value={values.email}
                        onChange={(e) => {
                          setFieldValue('email', e.target.value);
                          setEmail(e.target.value); // Update local state
                        }}
                        name="email"
                      />
                      {touched.email && errors.email && (
                        <div className="error" style={{ color: 'red' }}>
                          {errors.email}
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item className="form-item">
                      <label className="label">
                        Phone <span className="asterisk">*</span>
                      </label>
                      <InputField
                        type="tel"
                        placeholder="Enter your phone number"
                        value={values.phone}
                        onChange={(e) => {
                          setFieldValue('phone', e.target.value);
                          setPhone(e.target.value); // Update local state
                        }}
                        name="phone"
                      />
                      {touched.phone && errors.phone && (
                        <div className="error" style={{ color: 'red' }}>
                          {errors.phone}
                        </div>
                      )}
                    </Form.Item>


                    <Form.Item className="form-item">
                      <label className="label">
                        Password <span className="asterisk">*</span>
                      </label>
                      <InputField
                        type="password"
                        placeholder="Enter your password"
                        value={values.password}
                        onChange={(e) => setFieldValue('password', e.target.value)}
                        name="password"
                        className="password-field"
                      />
                      {touched.password && errors.password && (
                        <div className="error" style={{ color: 'red' }}>
                          {errors.password}
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item className="form-item">
                      <label className="label">
                        Confirm Password <span className="asterisk">*</span>
                      </label>
                      <InputField
                        type="password"
                        placeholder="Confirm your password"
                        value={values.confirmPassword}
                        onChange={(e) => setFieldValue('confirmPassword', e.target.value)}
                        name="confirmPassword"
                      />
                      {touched.confirmPassword && errors.confirmPassword && (
                        <div className="error" style={{ color: 'red' }}>
                          {errors.confirmPassword}
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item className="form-item">
                      <label className="label">
                        Create User Type <span className="asterisk">*</span>
                      </label>
                      <Select
                        className="dropdown-select"
                        popupMatchSelectWidth={false}
                        value={values.user_type}
                        onChange={(value) => handleUserTypeChange(value, setFieldValue)}
                      >
                        <Option
                          value="sales_manager"
                          className="option"
                          onMouseEnter={() => setHoveredOption("sales_manager")}
                          onMouseLeave={() => setHoveredOption(null)}
                        >
                          Sales Manager
                        </Option>

                        <Option
                          value="sales_executive"
                          className="option"
                          onMouseEnter={() => setHoveredOption("sales_executive")}
                          onMouseLeave={() => setHoveredOption(null)}
                        >
                          Sales Executive
                        </Option>
                        <Option
                          value="data_entry_executive"
                          className="option"
                          onMouseEnter={() => setHoveredOption("data_entry_executive")}
                          onMouseLeave={() => setHoveredOption(null)}
                        >
                          Data Entry Executive
                        </Option>
                      </Select>
                      {/* Show error for user_type */}
                      {touched.user_type && errors.user_type && (
                        <div className="error" style={{ color: 'red' }}>
                          {errors.user_type}
                        </div>
                      )}
                    </Form.Item>
                    {(values.user_type == "sales_executive") ? (
                      <Form.Item className="form-item">
                        <label className="label">
                          Managers
                          {/* <span className="asterisk">*</span> */}
                        </label>
                        <Select
                          className="dropdown-select"
                          popupMatchSelectWidth={false}
                          value={values.manager || undefined}
                          placeholder={"Select Manager"}
                          loading={loadingManagerList}
                          showSearch
                          optionFilterProp="children"
                          notFoundContent={loadingManagerList ? <Spin size="small" /> : 'No managers found'}
                          onChange={(value) => handleManagerSelect(value, setFieldValue)}
                        >
                          {managerList?.length > 0 &&
                            managerList.map((item) => (
                              <Option
                                key={item?.id}
                                value={item?.id}
                                className="option"
                              >
                                {item?.name}
                              </Option>
                            ))
                          }
                        </Select>
                        {managerListError && <div role="alert" className="error">
                          Could not load managers. <Button type="link" onClick={() => refetchManagers()}>Retry</Button>
                        </div>}
                        {/* Show error for user_type */}
                        {touched.manager && errors.manager && (
                          <div className="error" style={{ color: 'red' }}>
                            {errors.manager}
                          </div>
                        )}
                      </Form.Item>
                    ) : null}
                  </div>

                  <Form.Item>

                    <Button
                      type="primary"
                      className="create-button"
                      loading={loading} // Show loading state
                      htmlType="submit"
                      disabled={loading} // Disable button when loading
                    >

                      Create
                    </Button>

                  </Form.Item>
                </form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
}
