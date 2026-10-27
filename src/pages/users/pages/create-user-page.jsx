import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRolePath } from '../../auth/role-home.js';
import { Formik } from 'formik';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Form, Select, Button, message, Spin } from 'antd';
import { assertUserSuccess, userFormError, applyUserErrors } from '../user-form-errors.js';
import { createUserSchema } from '../schemas/create-user-schema.js';
import { isSuperAdmin } from '../../auth/role-access.js';
import api from '../../shared/services/api.js';
import useUserStore from '../../shared/store/user-store.js';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import UserDetailCard from '../../../components/user-detail-card.component.jsx';
import UserFormPreviewSync from '../../../components/user-form-preview-sync.jsx';
import UserPlaceholderIcon from '../../../assets/images/user-card-icons/user-placeholder.svg';
import InputField from '../../../components/input-field.component.jsx';
import '../../../assets/styles/legacy/create-user.css';
import '../../../assets/styles/user-management-form.css';

const { Option } = Select;

export async function createUser(values) {
  const payload = {
    name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(),
    password: values.password, user_type: values.user_type,
  };
  if (values.company_id) payload.company_id = Number(values.company_id);
  if (values.user_type === 'sales_executive' && values.manager) payload.manager_id = Number(values.manager);
  const { data } = await api.post('/accounts/signup', payload);
  return assertUserSuccess(data);
}

async function listCompanies(search) {
  const { data } = await api.get('/company/list', { params: { page: 1, size: 100, ...(search ? { search } : {}) } });
  if (!Array.isArray(data?.results)) throw new Error(data?.message || 'Could not load companies.');
  return data.results;
}

export async function listSalesManagers(companyId) {
  if (!companyId) throw new Error('Select a company first.');
  const { data } = await api.get('/sales-manager/simple-list', { params: { company_id: companyId } });
  if (!Array.isArray(data)) throw new Error(data?.message || 'Could not load sales managers.');
  return data;
}

export default function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const goBack = () => navigate(getRolePath(user?.user_type, '/user-management'));
  const superAdmin = isSuperAdmin(user?.user_type);
  const [companySearch, setCompanySearch] = useState('');
  const { data: companies = [], isLoading: loadingCompanies, isError: companiesError, refetch: refetchCompanies } = useQuery({
    queryKey: ['create-user-companies', user?.id, companySearch],
    queryFn: () => listCompanies(companySearch), enabled: superAdmin,
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [previewValues, setPreviewValues] = useState({});

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
      navigate(getRolePath(user?.user_type, '/user-management'), { replace: true });
    },
    onError: (error) => {
      // Check for API error response for existing user
      message.error(userFormError(error));
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
  const managerCompanyId = previewValues.company_id || (!superAdmin ? user?.company_id || user?.company?.id || user?.company : null);

  const { data: managerList = [], isLoading: loadingManagerList, isError: managerListError, refetch: refetchManagers } = useQuery({
    queryKey: ['create-user-sales-managers', user?.id, user?.user_type, managerCompanyId],
    queryFn: () => listSalesManagers(managerCompanyId),
    enabled: currentUserType === 'sales_executive' && Boolean(managerCompanyId),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return (
    <>
      <BreadCrumb linkText="Create New User" goBack={goBack} />
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
            details={[
              { label: 'Name', value: previewValues.name }, { label: 'Email', value: previewValues.email },
              { label: 'Phone', value: previewValues.phone },
              { label: 'Password', value: previewValues.password, secret: true },
              { label: 'Confirm Password', value: previewValues.confirmPassword, secret: true },
              { label: 'User Type', value: previewValues.user_type?.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) },
              ...(superAdmin ? [{ label: 'Company', value: companies.find(company => String(company.id) === String(previewValues.company_id))?.name }] : []),
              ...(previewValues.user_type === 'sales_executive' ? [{ label: 'Manager', value: managerList.find(manager => String(manager.user_id) === String(previewValues.manager))?.name }] : []),
            ]}

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
              onSubmit={(values, helpers) => {
                helpers.setStatus(null);
                createUserMutate(values, {
                  onError: error => {
                    applyUserErrors(error, helpers);
                  }
                });
              }}
              validateOnMount
              validateOnBlur // Validate on blur
              validateOnChange // Validate on change
            >
              {({ handleSubmit, handleBlur, values, setFieldValue, setFieldTouched, errors, touched }) => (
                <form className="user-management-form" onSubmit={handleSubmit} onBlur={handleBlur} noValidate>
                  <UserFormPreviewSync onChange={setPreviewValues} />
                  <div className="form-grid">
                    {superAdmin && <Form.Item className="form-item">
                      <label className="label">Company <span className="asterisk">*</span></label>
                      <Select className="dropdown-select" placeholder="Select Company" value={values.company_id || undefined}
                        onBlur={() => setFieldTouched('company_id', true)}
                        loading={loadingCompanies} showSearch filterOption={false} onSearch={setCompanySearch}
                        onChange={value => { setFieldValue('company_id', value); setFieldValue('manager', ''); }}
                        options={companies.map(company => ({ value: company.id, label: company.name }))} />
                      {touched.company_id && errors.company_id && (
                        <div className="error" style={{ color: 'red' }}>{errors.company_id}</div>
                      )}
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
                        onBlur={() => setFieldTouched('user_type', true)}
                        onChange={(value) => handleUserTypeChange(value, setFieldValue)}
                      >
                        {user?.user_type == "super_admin" && (
                          <Option
                            value="company_admin"
                            className="option"
                            onMouseEnter={() => setHoveredOption("company_admin")}
                            onMouseLeave={() => setHoveredOption(null)}
                          >
                            Company Admin
                          </Option>
                        )}

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
                          onBlur={() => setFieldTouched('manager', true)}
                          placeholder={managerCompanyId ? 'Select Manager' : 'Select a company first'}
                          disabled={!managerCompanyId || loadingManagerList}
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
                                value={item?.user_id}
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
