import React, { useEffect, useState } from 'react';
import InputField from '../../components/input-field.component.jsx';
import { Button } from '../../components/ui/button.jsx';
import SalesDataSelect from './sales-data-select.jsx';
import toast from 'react-hot-toast';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { Formik, Field, Form as FormikForm, ErrorMessage } from 'formik';
import { salesDataValidationSchema } from '../shared/schemas/sales-data.js';
import '../../assets/styles/legacy/create-user.css';
import '../../assets/styles/legacy/leads.generated.css';
import '../../assets/styles/legacy/select-black-text.css';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from 'react-query';
import { getDataEntryById, updateDataEntryById } from '../shared/services/data-entry-service.js';
const message = { success: toast.success, error: toast.error };
import { citiesNames, countriesNames } from '../shared/utils/countries.js';
import { useFormik } from 'formik';
import useUserStore from '../shared/store/user-store.js';
import { getRolePath } from '../auth/role-home.js';

const industryOptions = [
    { label: "Technology", value: "Technology" },
    { label: "Healthcare", value: "Healthcare" },
    { label: "Finance", value: "Finance" },
    { label: "Education", value: "Education" },
    { label: "Manufacturing", value: "Manufacturing" },
    { label: "Retail", value: "Retail" },
    { label: "Real Estate", value: "Real Estate" },
    { label: "Transportation", value: "Transportation" },
    { label: "Energy", value: "Energy" },
    { label: "Media & Entertainment", value: "Media & Entertainment" },
    { label: "Consulting", value: "Consulting" },
    { label: "Legal", value: "Legal" },
    { label: "Government", value: "Government" },
    { label: "Other", value: "Other" },
];

const initialState = {
  representative_name: '',
  designation: '',
  company_name: '',
  industry_sector: '',
  phone: '',
  email: '',
  city: null,
  country: null,
  company_address: '',
  company_website: '',
  company_social_link: '',
  acquired_through: null,
};

const EditDataEntry = () => {
  const requiredMark = <span style={{ color: '#3E6A9F', marginLeft: 2 }}>*</span>;
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState(initialState);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getDataEntryById(id);
        setInitialValues({
          ...initialState,
          ...data,
          city: data.city || null,
          country: data.country || null,
        });
      } catch (err) {
        message.error(err?.message || 'Failed to fetch data entry');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line
  }, [id]);

  const { mutate: updateLead, isLoading } = useMutation(
    ({ id, values }) => updateDataEntryById(id, values),
    {
      onSuccess: (data) => {
        message.success(data?.message || 'Data updated successfully');
        navigate(getRolePath(user?.user_type, '/data-entry-table'), { replace: true });
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to update data entry');
      },
    }
  );

  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validationSchema: salesDataValidationSchema,
    onSubmit: (values) => {
      const payload = {
        ...values,
        company_social_link: values.company_social_link,
      };
      updateLead({ id, values: payload });
    },
  });

  const handleAutoSave = async (event, key, value) => {
  if (id) {
    if (event) {
      formik.handleBlur(event);
    }

    // Only save if value is different from original
    if (value !== initialValues[key] && value !== null && value !== undefined) {
      const payload = {
        [key]: value,
        phone: formik.values.phone,  // always include phone
        email: formik.values.email,  // always include email
      };

      updateLead({ id, values: payload });
    }
  }
};


  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 80 }}><LoadingOutlined className="mx-auto size-6 animate-spin" aria-label="Loading sales data" /></div>;
  }

  return (
    <>
      <BreadCrumb linkText="Edit Sales Data" goBack={() => navigate(-1)} />
      <div className="container ">
        <div style={{ marginTop: 24, maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 style={{
            margin: '0 0 32px 0',
            textAlign: 'left',
            color: '#3E6A9F',
            fontSize: '28px',
            fontWeight: '600'
          }}>Edit Sales Data</h2>
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={salesDataValidationSchema}
            onSubmit={(values, { resetForm }) => {
              const payload = {
                ...values,
                company_social_link: values.company_social_link,
              };
              updateLead({ id, values: payload });
            }}
          >
            {({ handleSubmit }) => (
              <FormikForm onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="min-w-0">
                    <label htmlFor="representative_name" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Representative Name
                    </label>
                    <div>
                      <Field 
                        name="representative_name" 
                        as={InputField} 
                        placeholder="Enter representative name" 
                        className="antd-input styled-input"
                        onBlur={(event) => handleAutoSave(event, 'representative_name', formik.values.representative_name)}
                      />
                      <ErrorMessage name="representative_name" component="div" className="form-error" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="designation" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Designation
                    </label>
                    <div>
                      <Field 
                        name="designation" 
                        as={InputField} 
                        placeholder="Enter designation" 
                        className="antd-input styled-input"
                        onBlur={(event) => handleAutoSave(event, 'designation', formik.values.designation)}
                      />
                      <ErrorMessage name="designation" component="div" className="form-error" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="company_name" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Company Name {requiredMark}
                    </label>
                    <div>
                      <Field 
                        name="company_name" 
                        as={InputField} 
                        placeholder="Enter company name" 
                        className="antd-input styled-input"
                        onBlur={(event) => handleAutoSave(event, 'company_name', formik.values.company_name)}
                      />
                      <ErrorMessage name="company_name" component="div" className="form-error" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="industry_sector" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Industry/Sector
                    </label>
                    <div>
                      <Field name="industry_sector">
                        {({ field, form }) => (
                          <SalesDataSelect
                            mode="multiple"
                            value={field.value ? field.value.split(',').filter(Boolean) : []}
                            onChange={value => {
                              form.setFieldValue('industry_sector', value.join(','));
                              handleAutoSave(null, 'industry_sector', value.join(','));
                            }}
                            options={industryOptions}
                            placeholder="Select or type industry/sector"
                            style={{ width: '100%', color: '#000000' }}
                            showSearch
                          />
                        )}
                      </Field>
                      <ErrorMessage name="industry_sector" component="div" className="form-error" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="phone" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Phone {requiredMark}
                    </label>
                    <div>
                      <Field 
                        name="phone" 
                        as={InputField} 
                        placeholder="Enter phone" 
                        className="antd-input styled-input"
                        onBlur={(event) => handleAutoSave(event, 'phone', formik.values.phone)}
                      />
                      <ErrorMessage name="phone" component="div" className="form-error" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="email" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Email {requiredMark}
                    </label>
                    <div>
                      <Field 
                        name="email" 
                        as={InputField} 
                        placeholder="Enter email" 
                        className="antd-input styled-input"
                        onBlur={(event) => handleAutoSave(event, 'email', formik.values.email)}
                      />
                      <ErrorMessage name="email" component="div" className="form-error" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="city" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      City
                    </label>
                    <div>
                      <Field name="city">
                        {({ field, form }) => (
                          <SalesDataSelect
                            {...field}
                            value={field.value}
                            onChange={value => {
                              const stringValue = typeof value === 'object' ? value?.value || '' : value || '';
                              form.setFieldValue('city', stringValue);
                              handleAutoSave(null, 'city', stringValue);
                            }}
                            options={citiesNames}
                            placeholder='Select city'
                            style={{ width: '100%', color: '#000000' }}
                            showSearch
                          />
                        )}
                      </Field>
                      <ErrorMessage name="city" component="div" className="form-error" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="country" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Country
                    </label>
                    <div>
                      <Field name="country">
                        {({ field, form }) => (
                          <SalesDataSelect
                            {...field}
                            value={field.value}
                            onChange={value => {
                              const stringValue = typeof value === 'object' ? value?.value || '' : value || '';
                              form.setFieldValue('country', stringValue);
                              handleAutoSave(null, 'country', stringValue);
                            }}
                            options={countriesNames}
                            placeholder='Select country'
                            style={{ width: '100%', color: '#000000' }}
                            showSearch
                          />
                        )}
                      </Field>
                      <ErrorMessage name="country" component="div" className="form-error" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="company_website" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Company Website
                    </label>
                    <div>
                      <Field name="company_website" as={InputField} placeholder="URL should start from https:// or http://" className="antd-input styled-input" />
                      <ErrorMessage name="company_website" component="div" className="form-error" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="company_social_link" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Company Social Media Link
                    </label>
                    <div>
                      <Field name="company_social_link" as={InputField} placeholder="URL should start from https:// or http://" className="antd-input styled-input" />
                      <ErrorMessage name="company_social_link" component="div" className="form-error" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="company_address" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Company Address
                    </label>
                    <div>
                      <Field name="company_address" as={InputField} placeholder="Enter company address" className="antd-input styled-input" />
                      <ErrorMessage name="company_address" component="div" className="form-error" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="acquired_through" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Data Acquired Through
                    </label>
                    <div>
                      <Field name="acquired_through">
                        {({ field, form }) => (
                          <SalesDataSelect
                            {...field}
                            value={field.value}
                            onChange={value => {
                              const stringValue = typeof value === 'object' ? value?.value || '' : value || '';
                              form.setFieldValue('acquired_through', stringValue);
                              handleAutoSave(null, 'acquired_through', stringValue);
                            }}
                            placeholder='Select how data was acquired'
                            style={{ width: '100%', color: '#000000' }}
                            showSearch
                            options={[
                              {value: 'LinkedIn', label: 'LinkedIn'}, {value: 'Facebook', label: 'Facebook'},
                              {value: 'WhatsApp', label: 'Whatsapp'}, {value: 'Referral', label: 'Referral'},
                              {value: 'Other', label: 'Other'},
                            ]}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="acquired_through" component="div" className="form-error" />
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'left', marginTop: '16px' }}>
                  <Button
                    type="submit"
                    className="custom-button"
                    disabled={isLoading}
                    style={{ minWidth: 120, height: '40px', fontSize: '14px', fontWeight: '500', borderRadius: '6px' }}
                  >
                    {isLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </FormikForm>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};

export default EditDataEntry; 
