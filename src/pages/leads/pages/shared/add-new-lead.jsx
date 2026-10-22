import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Col, Row, Select, Divider, Form, message, Spin } from 'antd';
import { useQuery, useMutation } from 'react-query';
import { FieldArray, FormikProvider, useFormik } from "formik";
import { Trash2 as DeleteOutlined, Plus as PlusOutlined } from 'lucide-react';

import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { getManangersExecutives, getAssigningUsersListing } from "../../../shared/services/users-service.js";
import { newLeadSchema } from '../../../shared/schemas/schema.js';
import { currencyOptions } from '../../../shared/utils/countries.js';
import api from '../../../shared/services/api.js';
import useUserStore from '../../../shared/store/user-store.js';
import "../../../../assets/styles/legacy/leads.generated.css";

const { TextArea } = Input;

const vacancyOptions = Array.from({ length: 100 }, (_, i) => ({
        label: i + 1,
        value: i + 1,
    })).concat({ label: "100+", value: 101 });

// Add industry options
const initialIndustryOptions = [
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

// Sort alphabetically
function sortIndustries(arr) {
  return arr.slice().sort((a, b) => a.label.localeCompare(b.label));
}

// Project size options
const PROJECT_SIZE_OPTIONS = [
  { label: 'Below 25k', value: 'Below 25k' },
  { label: '25k - 50k', value: '25k - 50k' },
  { label: '50k - 100k', value: '50k - 100k' },
  { label: 'Above 100k', value: 'Above 100k' }
];

const AddNewLead = () => {
  const user = useUserStore((state) => state.user);
  const [assignedTo, setAssignedTo] = useState(
    user?.user_type === 'sales_executive'  ? user?.id : null
  );
  const { id, jobId } = useParams();
  const navigate = useNavigate();
  const { Option } = Select;
    
   
    document.title = user?.user_type === 'admin' ? 'Add New Lead (Admin) | Search O Pal' : 'Add New Lead | Search O Pal'

     const onSubmit = (values) => {
        if (!formik.isValid) {
            return;
        }

        // Build payload with only required fields
        const payload = {
            contact_person_name: values.contact_person_name,
            contact_person_designation: values.contact_person_designation,
            email: values.email,
            phone_number: values.phone_number,
            company_name: values.company_name,
        };

        // Add optional fields only if they have valid values
        if (values.industry) {
            payload.industry = values.industry;
        }
        
        if (assignedTo) {
            payload.assigned_to = assignedTo;
        }

        if (values.remarks && values.remarks.trim()) {
            payload.remarks = values.remarks.trim();
        }
        
        if (values.project_size) {
            payload.project_size = values.project_size;
        }
        
        if (values.contract_currency) {
            payload.contract_currency = values.contract_currency;
        }
        
        if (values.contract_price && !isNaN(Number(values.contract_price)) && Number(values.contract_price) > 0) {
            payload.contract_price = Number(values.contract_price);
        }

        leadMutation.mutate(payload);
    }

    const formik = useFormik({
        initialValues: {
        contact_person_name: "",
        contact_person_designation: "",
        email: "",
        phone_number: "",
        company_name: "",
        industry: null,
        remarks: "",
        project_size: null,
        contract_currency: null,
        contract_price: "",
        },
        enableReinitialize: true,
        validationSchema: newLeadSchema,
        onSubmit,
        validateOnMount: true,
    });

    
        const goBack = () => {
            // Navigate back to data-leads since that's where the Add New Lead button is located
            navigate('/data-leads');
        }

        
        const sendUpdate = (payload) => {
            return api.patch(`/lead-generation/job/${jobId}`, payload);
        };

        const updateStatusMutation = useMutation(sendUpdate, {
            onSuccess: () => {
            message.success("Status Updated Successfully");
            },
            onError: () => {
            message.error("Something went wrong");
            },
        });


        const handleAutoSave = async (event, key, value) => {
            formik.handleBlur(event); // still lets Formik track touched fields
            
            const payload = {[key]: value}
            updateStatusMutation.mutate(payload)
        };


        const handleExperienceSave = (event, value) => {            

            formik.handleBlur(event); // to keep touched state

            let payload = {};

            if (!Boolean(formik.errors.years_of_experience)){

                
                if (value.includes("-")) {
                    const [min, max] = value.split("-").map(Number);
                    if (!isNaN(min) && !isNaN(max) && min <= max) {
                        payload.min_experience = min;
                        payload.max_experience = max;
                    }
                } else {
                    const exp = Number(value);
                    if (!isNaN(exp)) {
                        payload.min_experience = exp;
                        payload.max_experience = 0;
                    }
                }
                
                updateStatusMutation.mutate(payload);
            }
        };

        

  const leadGenerationApiCall = async (data) => {
    const response = await api.post('/data-leads/create', data);
    return response.data;
  };

  const leadMutation = useMutation(leadGenerationApiCall, {
    onSuccess: (res) => {
      message.success(res.message ? res.message : "Request sent successfully", 3);
      const resetValues = {
        contact_person_name: '',
        contact_person_designation: '',
        email: '',
        phone_number: '',
        company_name: '',
        industry: null,
        remarks: '',
        project_size: null,
        contract_currency: null,
        contract_price: '',
      };
      formik.resetForm({ values: resetValues });
      
      // Navigate back to data-leads after successful lead creation
      navigate('/data-leads');
    },
    onError: (res) => {
      message.error({
        content: res?.response?.data?.message ? res?.response?.data?.message : "Request unsuccessful",
        duration: 3,
      });
    },
  });

  // Fetch executives or managers/executives based on user type
  const { data } = useQuery({
    queryKey: ['executiveList', user?.user_type],
    queryFn: () => user?.user_type === 'admin' 
        ? getManangersExecutives()
        : getAssigningUsersListing('sales_executive'),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const executivesList = useMemo(() => {
    if (user?.user_type === 'admin') {
      // For admin, data from getManangersExecutives() is directly the array
      const allUsers = data || []; // Data is directly the array
      return allUsers.filter(u => u.user_type === 'sales_executive' || u.user_type === 'sales_manager');
    }
    // For sales manager/executive, data from getAssigningUsersListing is directly the array
    return data || [];
  }, [data, user?.user_type]);

    return (
        <div className='lead-job-page'>
            <BreadCrumb goBack={goBack} linkText={user?.user_type === 'admin' ? "New Lead (Admin)" : "New Lead"} />

            <div className="container">
                

        <FormikProvider value={formik}>
          
          <form onSubmit={formik.handleSubmit} className='mt-5'> 
              <Row gutter={[10, { xs: 8, sm: 16, md: 24, lg: 32 }]}>
              
              {/* 1. Company name */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label
                  htmlFor="company_name"
                  className="form-label text-start mt-3 mb-1"
                >
                  Company Name<span className="text-primary">*</span>
                </label>
                <Input
                  id="company_name"
                  type="text"
                  value={formik.values.company_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.errors.company_name && formik.touched.company_name
                      ? "form-control form-control-icon is-invalid antd-input styled-input error-input"
                      : "form-control form-control-icon antd-input styled-input"
                  }
                  placeholder="Enter Company Name"
                  name="company_name"
                  style={{
                    width: '100%',
                    '::placeholder': {
                      fontSize: '15px'
                    }
                  }}
                />
                {formik.errors.company_name && formik.touched.company_name && (
                  <div className="invalid-feedback" style={{ color: '#ff4d4f' }}>{formik.errors.company_name}</div>
                )}
             </Col>

              {/* 2. Representative name */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label
                  htmlFor="contact_person_name"
                  className="form-label text-start mt-3 mb-1">
                  Representative Name<span className="text-primary">*</span>
                </label>
                <Input
                  id="contact_person_name"
                  type="text"
                  value={formik.values.contact_person_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.errors.contact_person_name && formik.touched.contact_person_name
                      ? "form-control form-control-icon is-invalid antd-input styled-input  error-input"
                      : "form-control form-control-icon antd-input styled-input "
                  }
                  placeholder="Enter Representative Name"
                  name="contact_person_name"
                  style={{
                    width: '100%',
                    '::placeholder': {
                      color: '#808080',
                      fontSize: '15px'
                    }
                  }}
                />
                {formik.errors.contact_person_name && formik.touched.contact_person_name && (
                  <div className="invalid-feedback" style={{ color: '#ff4d4f' }}>{formik.errors.contact_person_name}</div>
                )}
              </Col>

              {/* 3. Designation */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label
                  htmlFor="contact_person_designation"
                  className="form-label text-start mt-3 mb-1">
                  Designation<span className="text-primary">*</span>
                </label>
                <Input
                  id="contact_person_designation"
                  type="text"
                  value={formik.values.contact_person_designation}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.errors.contact_person_designation && formik.touched.contact_person_designation
                      ? "form-control form-control-icon is-invalid antd-input styled-input error-input"
                      : "form-control form-control-icon antd-input styled-input"
                  }
                  placeholder="Enter Designation"
                  name="contact_person_designation"
                  style={{
                    width: '100%',
                    '::placeholder': {
                      fontSize: '15px'
                    }
                  }}
                />
                {formik.errors.contact_person_designation && formik.touched.contact_person_designation && (
                  <div className="invalid-feedback" style={{ color: '#ff4d4f' }}>{formik.errors.contact_person_designation}</div>
                )}
              </Col>

              {/* 4. Email */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label
                  htmlFor="email"
                  className="form-label text-start mt-3 mb-1"
                >
                  Email<span className="text-primary">*</span>
                </label>
                <Input
                  id="email"
                  type="text"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.errors.email && formik.touched.email
                      ? "form-control form-control-icon is-invalid antd-input styled-input error-input"
                      : "form-control form-control-icon antd-input styled-input"
                  }
                  placeholder="Enter Email"
                  name="email"
                  style={{
                    width: '100%',
                    '::placeholder': {
                      fontSize: '15px'
                    }
                  }}
                />
                {formik.errors.email && formik.touched.email && (
                  <div className="invalid-feedback" style={{ color: '#ff4d4f' }}>{formik.errors.email}</div>
                )}
             </Col>

              {/* 5. Phone */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label
                  htmlFor="phone_number"
                  className="form-label text-start mt-3 mb-1"
                >
                  Phone Number<span className="text-primary">*</span>
                </label>
                <Input
                  id="phone_number"
                  type="text"
                  value={formik.values.phone_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.errors.phone_number && formik.touched.phone_number
                      ? "form-control form-control-icon is-invalid antd-input styled-input error-input"
                      : "form-control form-control-icon antd-input styled-input"
                  }
                  placeholder="Enter Phone Number"
                  name="phone_number"
                  style={{
                    width: '100%',
                    '::placeholder': {
                      fontSize: '15px'
                    }
                  }}
                />
                {formik.errors.phone_number && formik.touched.phone_number && (
                  <div className="invalid-feedback" style={{ color: '#ff4d4f' }}>{formik.errors.phone_number}</div>
                )}
             </Col>

              {/* 6. Contract Currency */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label className="form-label text-start mt-3 mb-1">Contract Currency</label>
                <Select
                  value={formik.values.contract_currency || undefined}
                  onChange={(value) => formik.setFieldValue('contract_currency', value)}
                  onBlur={formik.handleBlur}
                  placeholder="Select Currency"
                  className="antd-input dropdown"
                  allowClear
                  showSearch
                  options={currencyOptions}
                />
                {formik.errors.contract_currency && formik.touched.contract_currency && (
                  <div className="invalid-feedback" style={{ color: '#ff4d4f' }}>{formik.errors.contract_currency}</div>
                )}
              </Col>

              {/* 7. Contract Price */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label className="form-label text-start mt-3 mb-1">Contract Price</label>
                <Input
                  type="number"
                  value={formik.values.contract_price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.errors.contract_price && formik.touched.contract_price
                      ? "form-control form-control-icon is-invalid antd-input styled-input error-input"
                      : "form-control form-control-icon antd-input styled-input"
                  }
                  placeholder="Enter Contract Price"
                  name="contract_price"
                  style={{
                    width: '100%',
                    '::placeholder': {
                      fontSize: '15px'
                    }
                  }}
                />
                {formik.errors.contract_price && formik.touched.contract_price && (
                  <div className="invalid-feedback" style={{ color: '#ff4d4f' }}>{formik.errors.contract_price}</div>
                )}
              </Col>

              {/* 8. Industry */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label htmlFor="industry" className="form-label text-start mt-3 mb-1">
                  Industry
                </label>
                <Select
                  id="industry"
                  mode="tags"
                  value={formik.values.industry ? [formik.values.industry] : []}
                  onChange={value => {
                    const newValue = Array.isArray(value) ? value[value.length - 1] : value;
                    formik.setFieldValue('industry', newValue);
                  }}
                  onBlur={formik.handleBlur}
                  className={
                    formik.errors.industry && formik.touched.industry
                      ? "antd-input dropdown error-input"
                      : "antd-input dropdown"
                  }
                  placeholder="Select or type Industry"
                  name="industry"
                  style={{ width: '100%' }}
                  allowClear
                  showSearch
                  options={initialIndustryOptions}
                >
                  {/* No static options, user can type freely */}
                </Select>
                {formik.errors.industry && formik.touched.industry && (
                  <div className="invalid-feedback" style={{ color: '#ff4d4f' }}>{formik.errors.industry}</div>
                )}
              </Col>

              {/* 9. Project Size */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label className="form-label text-start mt-3 mb-1">Project Size</label>
                <Select
                  value={formik.values.project_size || undefined}
                  onChange={(value) => formik.setFieldValue('project_size', value)}
                  onBlur={formik.handleBlur}
                  placeholder="Select Project Size"
                  className="antd-input dropdown"
                  allowClear
                  options={PROJECT_SIZE_OPTIONS}
                />
                {formik.errors.project_size && formik.touched.project_size && (
                  <div className="invalid-feedback" style={{ color: '#ff4d4f' }}>{formik.errors.project_size}</div>
                )}
              </Col>

              {/* Assignee Dropdown - Only for sales_manager and admin (extra field at the end) */}
              {(user?.user_type === 'sales_manager' || user?.user_type === 'admin') && (
                <Col xs={24} sm={12} md={8} lg={6}>
                  <label className="form-label text-start mt-3 mb-1">Assign To</label>
                  <Select
                    labelInValue
                    value={assignedTo ? { value: assignedTo, label: (executivesList.find(e => e.id === assignedTo)?.name || user?.name) } : undefined}
                    onChange={(option) => {
                      setAssignedTo(option ? option.value : '');
                    }}
                    placeholder="Select Assignee"
                    style={{width: '100%'}}
                  >
                    {executivesList.map((executive) => (
                      <Option key={executive.id} value={executive.id}>
                        {executive?.name} - {executive?.user_type === 'sales_manager' ? 'Manager' : 'Executive'}
                      </Option>
                    ))}
                    {user?.user_type === 'sales_manager' && (
                      <Option value={user?.id}>
                        {user?.name}
                      </Option>
                    )}
                  </Select>
                </Col>
              )}

              {/* Remarks */}
              <Col xs={24} sm={24} md={24} lg={24}>
                <label className="form-label text-start mt-3 mb-1">Remarks</label>
                <TextArea
                  value={formik.values.remarks}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter Remarks"
                  name="remarks"
                  rows={4}
                  className={
                    formik.errors.remarks && formik.touched.remarks
                      ? "antd-input styled-input error-input"
                      : "antd-input styled-input"
                  }
                />
                {formik.errors.remarks && formik.touched.remarks && (
                  <div className="invalid-feedback" style={{ color: '#ff4d4f' }}>{formik.errors.remarks}</div>
                )}
              </Col>

              <div className="col-md-12 text-end mt-2 mb-4 pe-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  className="createUserBtn ms-2"
                  loading={leadMutation.isLoading}
                  style={{ minWidth: 120, height: '40px', fontSize: '14px', fontWeight: '500', borderRadius: '6px' }}
                >
                  Submit
                </Button>
              </div>
              </Row>
          </form>
        </FormikProvider>

                
            </div>
        </div>
    );
}


export default AddNewLead;

