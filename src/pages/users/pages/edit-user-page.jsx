import { message } from '../../../components/ui/notifications.jsx';
import { Modal } from '../../../components/ui/app-modal.jsx';
import { Select } from '../../../components/ui/app-select.jsx';
import { Button, Spin } from '../../../components/ui/app-controls.jsx';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRolePath } from '../../auth/role-home.js';
import useUserStore from '../../shared/store/user-store.js';
import { Formik } from 'formik';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Form, Upload } from 'antd';
import { LoaderCircle as LoadingOutlined, Upload as UploadOutlined } from 'lucide-react';
import { editUserSchema } from '../schemas/edit-user-schema.js';
import { userFormError, applyUserErrors, assertUserSuccess } from '../user-form-errors.js';
import { editUser, getUserDetails } from '../../shared/services/users-service.js';
import api from '../../shared/services/api.js';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import UserDetailCard from '../../../components/user-detail-card.component.jsx';
import UserFormPreviewSync from '../../../components/user-form-preview-sync.jsx';
import { managerIdFromOptions } from '../user-manager-options.js';
import UserPlaceholderIcon from '../../../assets/images/user-card-icons/user-placeholder.svg';
import InputField from '../../../components/input-field.component.jsx';
import '../../../assets/styles/legacy/create-user.css';
import '../../../assets/styles/user-management-form.css';

const { Option } = Select;
const antIcon = <LoadingOutlined size="1em" className="app-icon app-icon-spin" style={{ fontSize: 24 }}  />;

export async function getEditUserSalesManagers(companyId) {
  if (!companyId) throw new Error('The user is missing a company ID.');
  const { data } = await api.get('/sales-manager/simple-list', { params: { company_id: companyId } });
  assertUserSuccess(data);
  if (!Array.isArray(data)) throw new Error('Could not load sales managers.');
  return data;
}

export default function EditUser() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const goBack = () => navigate(getRolePath(user?.user_type, '/user-management'));
  const queryClient = useQueryClient();
  const { id: userId } = useParams();

  const [initialValues, setInitialValues] = useState({
    name: '',
    email: '',
    phone: '',
    profile_pic: '',
    password: '',
    manager: '',
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [previewValues, setPreviewValues] = useState({});

  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: userDetails, isLoading, error } = useQuery({
    queryKey: ['userDetails', userId],
    queryFn: () => getUserDetails(userId),
    keepPreviousData: true,
    staleTime: 0,
    cacheTime: 0,
  });

  const ManagerType = userDetails?.data?.user_type;

  const formatUserType = (userType) => {
    return userType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const managerCompanyId = userDetails?.data?.company_id;
  const { data: managerList, isLoading: loadingManagerList } = useQuery({
    queryKey: ['managers-list', user?.id, user?.user_type, userId, managerCompanyId, 'simple-list'],
    queryFn: () => getEditUserSalesManagers(managerCompanyId),
    enabled: Boolean(managerCompanyId) && ['sales_executive', 'recruitment_executive'].includes(ManagerType),
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (userDetails) {
      setInitialValues({
        name: userDetails.data.name || '',
        email: userDetails.data.email || '',
        phone: userDetails.data.phone || '',
        password: '',
        profile_pic: userDetails.data.profile_pic || '',
        manager: managerIdFromOptions(managerList, userDetails?.data),

      });
      setPhoneNumber(userDetails.data.phone || '');
      setEmail(userDetails.data.email || '');
    }
  }, [userDetails, managerList]);

  const { mutate: editUserMutate } = useMutation({
    mutationFn: async (formData) => assertUserSuccess(await editUser(userId, formData)),

    onMutate: () => setIsUpdating(true),
    onSettled: () => setIsUpdating(false),
    onSuccess: () => {
      queryClient.invalidateQueries('usersList');
      message.success('User edited successfully');
    },
    onError: (error) => {
      message.error(userFormError(error));
    },
  });

  const handleUserTypeChange = (value, setFieldValue) => {
    setFieldValue('user_type', value);
  };

  const handleImageEditClick = () => {
    setIsImageModalVisible(true);
  };

  const handleFileChange = ({ file, fileList }) => {
    if (file.status === 'removed') {

      setSelectedFile(null);
    } else {

      setSelectedFile(file);
    }
  };

  const handleImageUpload = () => {
    if (!selectedFile) {
      message.error("Please select a file before submitting.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('profile_pic', selectedFile); // Assuming 'profile_pic' is the key expected by your backend

    // Call the mutation to upload the image
    editUserMutate(formData, {
      onSuccess: () => {
        setIsUploading(false);
        setIsImageModalVisible(false);
        message.success("Profile picture updated successfully");
        setSelectedFile(null); // Reset selected file after successful upload
      },
      onError: (error) => {
        setIsUploading(false);
        message.error(userFormError(error));
      }
    });
  };


  const handleManagerSelect = (value, setFieldValue) => {
    setFieldValue('manager', value);
  };
  const managerOptions = managerList || [];


  if (error) return <p>Error loading user details</p>;
 
  return (
    <>
      <BreadCrumb linkText="Edit User" goBack={goBack} />
      <Spin spinning={isLoading} indicator={antIcon} size="large">
        <div className="container">
          <div className="flex-container">
            <UserDetailCard
              type="user"
              name={previewValues.name || ''}
              isCreate={false}
              profileImg={userDetails?.data?.profile_pic || undefined}
              phoneNumber={phoneNumber}
              email={email}
              onEditPicture={handleImageEditClick}
              editPictureByAvatar
              details={[
                { label: 'Name', value: previewValues.name }, { label: 'Email', value: previewValues.email },
                { label: 'Phone', value: previewValues.phone },
                { label: 'New Password', value: previewValues.password, secret: true },
                { label: 'User Type', value: ManagerType?.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) },
                ...(['sales_executive', 'recruitment_executive'].includes(ManagerType) ? [
                  { label: 'Manager', value: managerOptions.find(manager => String(manager.user_id) === String(previewValues.manager))?.name },
                ] : []),
              ]}
            />

            <div className="form-container">
              <Formik
                initialValues={initialValues}
                validationSchema={editUserSchema}
                onSubmit={(values, helpers) => {
                  helpers.setStatus(null);
                  const formData = new FormData();

                  // Compare current values with initial values and include only changed fields
                  Object.keys(values).forEach((key) => {
                    if (values[key] !== initialValues[key] && values[key] !== '') {
                      if (key === 'user_type') {
                        // Format the value before comparison
                        const formattedValue = formatUserType(values[key]);
                        if (formattedValue !== initialValues[key]) {
                    
                          formData.append(key, values[key]); // Append the original value
                        }
                      } else {
                        formData.append(key === 'manager' ? 'manager_id' : key, values[key]);
                      }
                    }
                  });


                  if (formData.has('name') || formData.has('email') || formData.has('phone') || formData.has('password') || formData.has('manager_id')) {
                    // If there are changes, make the API call
                    editUserMutate(formData, {
                      onSuccess: () => navigate(getRolePath(user?.user_type, '/user-management'), { replace: true }),
                      onError: error => applyUserErrors(error, helpers),
                    });
                  } else {
                    message.info('No changes were made');
                  }
                }}
                enableReinitialize
              >
                {({ handleSubmit, handleBlur, values, setFieldValue, setFieldTouched, errors, touched }) => (
                  <form className="user-management-form" onSubmit={handleSubmit} onBlur={handleBlur} noValidate>
                    <UserFormPreviewSync onChange={setPreviewValues} />
                    <div className="form-grid">
                      <Form.Item className="form-item">
                        <label className="label">
                          Name <span className="asterisk">*</span>
                        </label>
                        <InputField
                          type="text"
                          placeholder="Enter your name"
                          value={values.name}
                          onChange={(e) => setFieldValue('name', e.target.value)}
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
                            setEmail(e.target.value);
                          }}
                          name="email"
                          disabled={true}
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
                            setPhoneNumber(e.target.value);
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
                        <label className="label">New Password (optional)</label>
                        <InputField
                          type="password"
                          placeholder="Enter a new password"
                          value={values.password}
                          onChange={(e) => setFieldValue('password', e.target.value)}
                          name="password"
                        />
                        {touched.password && errors.password && (
                          <div className="error" style={{ color: 'red' }}>
                            {errors.password}
                          </div>
                        )}
                      </Form.Item>

                      {(ManagerType == "sales_executive" || ManagerType == "recruitment_executive") ? (
                        <Form.Item className="form-item">
                          <label className="label">
                            Managers
                            {/* <span className="asterisk">*</span> */}
                          </label>
                          <Select
                            className="dropdown-select"
                            name="manager"
                            onBlur={() => setFieldTouched('manager', true)}
                            popupMatchSelectWidth={false}
                            value={values.manager || undefined}
                            disabled={!managerCompanyId || loadingManagerList}
                            loading={loadingManagerList}
                            placeholder={"Select Manager"}
                            onChange={(value) => handleManagerSelect(value, setFieldValue)}
                          >
                            {managerOptions.length > 0 &&
                              managerOptions.map((item) => (
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
                      <Button type="primary" className="create-button" htmlType="submit" loading={isUpdating}>
                        Update
                      </Button>
                    </Form.Item>
                  </form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </Spin>

      <Modal
        title="Edit Profile Picture"
        visible={isImageModalVisible}
        onCancel={() => setIsImageModalVisible(false)}
        footer={[
          <Button key="cancel" disabled={isUploading} onClick={() => setIsImageModalVisible(false)} className="custom-button cancel-btn">
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleImageUpload} // Call handleImageUpload on button click
            disabled={isUploading}
            loading={isUploading}
            className="custom-button"
          >
            Edit
          </Button>,
        ]}
      >
        <Upload
          beforeUpload={() => false} // Prevent automatic upload
          onChange={handleFileChange} // Handle file change and store it
          accept="image/*"
          showUploadList={true}
        >
          <Button className="custom-button" icon={<UploadOutlined size="1em" className="app-icon" />} disabled={isUploading}>
            Click to Upload
          </Button>
        </Upload>

      </Modal>
    </>
  );
}
