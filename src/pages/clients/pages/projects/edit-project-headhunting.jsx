import React, { useEffect, useRef, useState } from 'react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { Button, Input, Col, Row, Select, DatePicker, message, Upload, Spin } from 'antd';
import { useFormik } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { editProjectHeadhuntingValidationSchema } from '../../../shared/schemas/project.js';
import { currencyOptions } from '../../../shared/utils/countries.js';
import { useMutation, useQuery } from 'react-query';
import { updateProjectStatus, getProjectDetails } from '../../../shared/services/headhunting.js';
import {
  formatNumberWithCommas,
  unformatNumber,
  toNumericValue,
  formatCurrencyInput,
  roundToTwoDecimals,
} from '../../utils/projectFormNumbers.js';

const { Option } = Select;
const { TextArea } = Input;

const PRICING_TYPE_OPTIONS = [
  { label: 'Fixed Price', value: 'Fixed Price' },
  { label: 'Salary Based Price', value: 'Salary Based Price' },
];

const MAX_PROPOSAL_SIZE_MB = 5;
const PRICE_READONLY_STYLE = { backgroundColor: '#f5f5f5', color: '#000000', WebkitTextFillColor: '#000000' };
const SUBMIT_BUTTON_STYLE = { marginTop: 24, background: '#3E6A9F', color: '#fff' };
const LOADING_CONTAINER_STYLE = { textAlign: 'center', padding: '50px' };
const formatProjectCompletionDeadline = (dateValue) => {
  if (!dateValue) return null;
  const parsed = dayjs(dateValue);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
};

export default function EditProjectHeadhunting() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isSubmitRef = useRef(false);
  const [contractPriceInput, setContractPriceInput] = useState('');
  const [contractSubtotalInput, setContractSubtotalInput] = useState('');
  const [discountAmountInput, setDiscountAmountInput] = useState('');
  const [discountPercentageInput, setDiscountPercentageInput] = useState('');

  const goBack = () => navigate(-1);

  const updateTotals = ({
      nextSubTotal = contractSubtotalInput,
      nextDiscountAmount = discountAmountInput,
      nextDiscountPercent = discountPercentageInput,
      changed,
    }) => {
      const subValueRaw = toNumericValue(nextSubTotal);
      let discountValueRaw = toNumericValue(nextDiscountAmount);
      let discountPercentRaw = parseFloat(nextDiscountPercent) || 0;

      if (changed === 'amount') {
        discountValueRaw = Math.min(discountValueRaw, subValueRaw);
        discountPercentRaw = subValueRaw ? (discountValueRaw / subValueRaw) * 100 : 0;
      } else if (changed === 'percent') {
        discountPercentRaw = Math.min(discountPercentRaw, 100);
        discountValueRaw = subValueRaw ? (discountPercentRaw / 100) * subValueRaw : 0;
      } else if (changed === 'subtotal') {
        if (subValueRaw === 0) {
          discountValueRaw = 0;
          discountPercentRaw = 0;
        } else {
          discountValueRaw = Math.min(discountValueRaw, subValueRaw);
          discountPercentRaw = subValueRaw ? (discountValueRaw / subValueRaw) * 100 : 0;
        }
      }

      // Apply 2-decimal rounding for all numeric values
      const subValue = roundToTwoDecimals(subValueRaw) || 0;
      const discountValue = roundToTwoDecimals(discountValueRaw) || 0;
      const discountPercentValue = roundToTwoDecimals(discountPercentRaw) || 0;
      const totalValue = roundToTwoDecimals(Math.max(subValue - discountValue, 0)) || 0;

      setContractSubtotalInput(subValue ? formatNumberWithCommas(subValue) : '');
      setDiscountAmountInput(discountValue ? formatNumberWithCommas(discountValue) : '');
      setDiscountPercentageInput(
        discountPercentValue ? Number(discountPercentValue.toFixed(2)).toString() : ''
      );
      setContractPriceInput(
        totalValue ? formatNumberWithCommas(totalValue) : subValue ? '0' : ''
      );

      // Update formik values
      formik.setFieldValue('contract_subtotal_amount', subValue || '');
      formik.setFieldValue('discount_amount', discountValue || '');
      formik.setFieldValue('discount_percentage', discountPercentValue || '');
      formik.setFieldValue('contract_price', totalValue || '');
    };

    const handleSubTotalChange = (e) => {
      const { value } = e.target;
      if (!value) {
        setContractSubtotalInput('');
        setDiscountAmountInput('');
        setDiscountPercentageInput('');
        setContractPriceInput('');
        formik.setFieldValue('contract_subtotal_amount', '');
        formik.setFieldValue('discount_amount', '');
        formik.setFieldValue('discount_percentage', '');
        formik.setFieldValue('contract_price', '');
        return;
      }
      const formatted = formatCurrencyInput(value);
      updateTotals({ nextSubTotal: formatted, changed: 'subtotal' });
    };

    const handleDiscountAmountChange = (e) => {
      const { value } = e.target;
      if (!value) {
        updateTotals({ nextDiscountAmount: '', nextDiscountPercent: '', changed: 'amount' });
        return;
      }
      const formatted = formatCurrencyInput(value);
      updateTotals({ nextDiscountAmount: formatted, changed: 'amount' });
    };

    const handleDiscountPercentChange = (e) => {
      let { value } = e.target;
      if (!value) {
        updateTotals({ nextDiscountPercent: '', changed: 'percent' });
        return;
      }
      // Only allow numbers and decimal point
      value = value.replace(/[^\d.]/g, '');
      
      // Prevent multiple decimal points
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit to 2 decimal places
      const [whole, decimal] = value.split('.');
      if (decimal && decimal.length > 2) {
        value = `${whole}.${decimal.slice(0, 2)}`;
      }
      
      updateTotals({ nextDiscountPercent: value, changed: 'percent' });
    };

    // Fetch project details
    const { data: projectData, isLoading: projectLoading, error: projectError } = useQuery(
      ['projectDetails', id],
      () => getProjectDetails(id),
      {
        enabled: !!id,
        refetchOnWindowFocus: false,
      }
    );

    const updateProjectMutation = useMutation(
      async (values) => {
        // Check if this is a file upload (has proposal file)
        if (values.proposal && values.proposal instanceof File) {
          // Create FormData for file upload
          const formData = new FormData();
          Object.keys(values).forEach(key => {
            if (values[key] !== null && values[key] !== undefined && values[key] !== '') {
              formData.append(key, values[key]);
            }
          });
          
          const response = await updateProjectStatus(id, formData);
          return response;
        } else {
          // Send JSON data for autosave
          const response = await updateProjectStatus(id, values);
          return response;
        }
      },
      {
        onSuccess: (response) => {
          if (isSubmitRef.current) {
            message.destroy('project-toast');
            message.success({ content: response?.message || "Project updated successfully", key: 'project-toast' });
            navigate(-1);
          }
        },
        onError: (error) => {
          message.destroy('project-toast');
          message.error({ content: error?.message || "Failed to update project", key: 'project-toast' });
        },
        onSettled: () => {
          isSubmitRef.current = false;
        }
      }
    );

  const handleAutoSave = async (event, key, value) => {
    if (event) {
      formik.handleBlur(event);
    }
    
    // Don't proceed if projectData is not loaded yet
    if (!projectData) {
      return;
    }
    
    // Prepare the full payload from current formik values
    // This ensures that even on handleAutoSave (onBlur), we send everything
    const fullPayload = {
      project_name: formik.values.project_name,
      contract_currency: formik.values.contract_currency || null,
      contract_price: roundToTwoDecimals(formik.values.contract_price),
      contract_subtotal_amount: roundToTwoDecimals(formik.values.contract_subtotal_amount),
      pricing_type: formik.values.pricing_type || null,
      discount_amount: roundToTwoDecimals(formik.values.discount_amount),
      discount_percentage: roundToTwoDecimals(formik.values.discount_percentage),
      project_completion_deadline: formatProjectCompletionDeadline(formik.values.project_completion_deadline),
      remarks: formik.values.remarks || null,
    };

    // Handle different field types for the specific field being changed
    let payloadValue = value;
    if (value === '') {
      payloadValue = null;
    }
    
    if (['contract_price', 'contract_subtotal_amount', 'discount_amount', 'discount_percentage'].includes(key)) {
      if (value === '' || value === null) {
        payloadValue = null;
      } else {
        const numericRaw = typeof value === 'string' ? Number(unformatNumber(value)) : Number(value);
        if (Number.isFinite(numericRaw) && numericRaw >= 0) {
          payloadValue = roundToTwoDecimals(numericRaw);
        }
      }
    }
    if (key === 'project_completion_deadline') {
      payloadValue = formatProjectCompletionDeadline(value);
    }
    
    // Update the specific field in the payload to ensure it has the latest value from the event
    if (key !== 'proposal') {
      fullPayload[key] = payloadValue;
    }
    
    const originalValue = key === 'project_completion_deadline'
      ? formatProjectCompletionDeadline(projectData[key])
      : projectData[key];

    // Only save if the value for this specific field is actually different from original
    // This prevents unnecessary full-payload saves on every blur if nothing changed
    if (payloadValue !== originalValue && payloadValue !== undefined) {
      isSubmitRef.current = false;
      updateProjectMutation.mutate(fullPayload);
    }
  };

  const formik = useFormik({
    initialValues: {
      project_name: '',
      contract_currency: '',
      contract_price: '',
      contract_subtotal_amount: '',
      pricing_type: '',
      discount_amount: '',
      discount_percentage: '',
      project_completion_deadline: null,
      remarks: '',
      proposal: null,
    },
    enableReinitialize: true,
    validationSchema: editProjectHeadhuntingValidationSchema,
    onSubmit: (values) => {
      // Validation check before submission
      if (!values.project_name.trim()) {
        message.error('Project name is required');
        return;
      }
      if (!values.project_completion_deadline) {
        message.error('Project completion deadline is required');
        return;
      }
      
      // Prepare the payload for form submission (all numeric fields rounded to 2 decimals)
      const payload = {
        project_name: values.project_name,
        contract_currency: values.contract_currency || null,
        contract_price: roundToTwoDecimals(values.contract_price),
        contract_subtotal_amount: roundToTwoDecimals(values.contract_subtotal_amount),
        pricing_type: values.pricing_type || null,
        discount_amount: roundToTwoDecimals(values.discount_amount),
        discount_percentage: roundToTwoDecimals(values.discount_percentage),
        project_completion_deadline: formatProjectCompletionDeadline(values.project_completion_deadline),
        remarks: values.remarks || null,
        ...(values.proposal && { proposal: values.proposal })
      };
      
      isSubmitRef.current = true;
      updateProjectMutation.mutate(payload);
    },
  });

  // Update form values when project data is loaded
  useEffect(() => {
    if (projectData) {
      const formattedSubtotal = projectData.contract_subtotal_amount ? formatNumberWithCommas(projectData.contract_subtotal_amount) : '';
      const formattedDiscountAmount = projectData.discount_amount ? formatNumberWithCommas(projectData.discount_amount) : '';
      const formattedDiscountPercent = projectData.discount_percentage ? Number(projectData.discount_percentage).toFixed(2) : '';
      const formattedPrice = projectData.contract_price ? formatNumberWithCommas(projectData.contract_price) : '';

      formik.setValues({
        project_name: projectData.project_name || projectData.job_title || '',
        contract_currency: projectData.contract_currency || '',
        contract_price: projectData.contract_price || '',
        contract_subtotal_amount: projectData.contract_subtotal_amount || '',
        pricing_type: projectData.pricing_type || '',
        discount_amount: projectData.discount_amount || '',
        discount_percentage: projectData.discount_percentage || '',
        project_completion_deadline: projectData.project_completion_deadline ? dayjs(projectData.project_completion_deadline) : null,
        remarks: projectData.remarks || '',
        proposal: null,
      });
      
      setContractSubtotalInput(formattedSubtotal);
      setDiscountAmountInput(formattedDiscountAmount);
      setDiscountPercentageInput(formattedDiscountPercent);
      setContractPriceInput(formattedPrice);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when projectData loads
  }, [projectData]);

  // Show loading state
  if (projectLoading) {
    return (
      <div className="lead-job-page">
        <BreadCrumb goBack={goBack} linkText="Edit Project " />
        <div className="container">
          <div className="job-card">
            <div style={LOADING_CONTAINER_STYLE}>
              <Spin size="large" />
              <p>Loading project details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (projectError) {
    return (
      <div className="lead-job-page">
        <BreadCrumb goBack={goBack} linkText="Edit Project" />
        <div className="container">
          <div className="job-card">
            <div style={LOADING_CONTAINER_STYLE}>
              <p style={{ color: 'red' }}>Error loading project details: {projectError.message}</p>
              <Button onClick={goBack}>Go Back</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-job-page">
      <BreadCrumb goBack={goBack} linkText="Edit Project" />
      <div className="container">
        <div className="job-card">
          <div className="container">
            <div className="row">
              <h1>Edit Project</h1>
            </div>
          </div>
          <div className="container">
            <form onSubmit={formik.handleSubmit}>
              <Row gutter={[10, { xs: 8, sm: 16, md: 24, lg: 32 }]}>  
                
                <Col xs={24} sm={12} md={12} lg={6}>
                  <label className="form-label text-start mt-3 mb-1">Project Name*</label>
                  <Input
                    name="project_name"
                    value={formik.values.project_name}

                    disabled={true}
                    onChange={formik.handleChange}
                    onBlur={(event) => handleAutoSave(event, 'project_name', formik.values.project_name)}
                    placeholder="Project Name"
                    className="antd-input styled-input"
                    status={formik.errors.project_name && formik.touched.project_name ? 'error' : ''}
                  />
                  {formik.errors.project_name && formik.touched.project_name && (
                    <div className="text-red">{formik.errors.project_name}</div>
                  )}
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <label className="form-label text-start mt-3 mb-1">Pricing Type</label>
                  <Select
                    name="pricing_type"
                    value={formik.values.pricing_type || undefined}
                    onChange={value => {
                      formik.setFieldValue('pricing_type', value);
                      handleAutoSave(null, 'pricing_type', value);
                    }}
                    onBlur={formik.handleBlur}
                    placeholder="Select Pricing Type"
                    className="antd-input dropdown"
                    allowClear
                  >
                    {PRICING_TYPE_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                  {formik.errors.pricing_type && formik.touched.pricing_type && (
                    <div className="text-red">{formik.errors.pricing_type}</div>
                  )}
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <label className="form-label text-start mt-3 mb-1">Contract Currency</label>
                  <Select
                    name="contract_currency"
                    value={formik.values.contract_currency || undefined}
                    onChange={value => {
                      formik.setFieldValue('contract_currency', value);
                      handleAutoSave(null, 'contract_currency', value);
                    }}
                    onBlur={formik.handleBlur}
                    placeholder="Select Contract Currency"
                    className="antd-input dropdown"
                    allowClear
                    showSearch
                    options={currencyOptions}
                  />
                  {formik.errors.contract_currency && formik.touched.contract_currency && (
                    <div className="text-red">{formik.errors.contract_currency}</div>
                  )}
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <label className="form-label text-start mt-3 mb-1">Contract Subtotal Amount</label>
                  <Input
                    name="contract_subtotal_amount"
                    type="text"
                    value={contractSubtotalInput}
                    onChange={handleSubTotalChange}
                    onBlur={(e) => handleAutoSave(e, 'contract_subtotal_amount', e.target.value)}
                    placeholder="Contract Subtotal"
                    className="antd-input styled-input"
                    status={formik.errors.contract_subtotal_amount && formik.touched.contract_subtotal_amount ? 'error' : ''}
                  />
                  {formik.errors.contract_subtotal_amount && formik.touched.contract_subtotal_amount && (
                    <div className="text-red">{formik.errors.contract_subtotal_amount}</div>
                  )}
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <label className="form-label text-start mt-3 mb-1">Discount Amount</label>
                  <Input
                    name="discount_amount"
                    type="text"
                    value={discountAmountInput}
                    onChange={handleDiscountAmountChange}
                    onBlur={(e) => handleAutoSave(e, 'discount_amount', e.target.value)}
                    placeholder="Discount Amount"
                    className="antd-input styled-input"
                    disabled={!contractSubtotalInput}
                    status={formik.errors.discount_amount && formik.touched.discount_amount ? 'error' : ''}
                  />
                  {formik.errors.discount_amount && formik.touched.discount_amount && (
                    <div className="text-red">{formik.errors.discount_amount}</div>
                  )}
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <label className="form-label text-start mt-3 mb-1">Discount Percentage</label>
                  <Input
                    name="discount_percentage"
                    type="text"
                    value={discountPercentageInput}
                    onChange={handleDiscountPercentChange}
                    onBlur={(e) => handleAutoSave(e, 'discount_percentage', e.target.value)}
                    placeholder="Discount %"
                    className="antd-input styled-input"
                    disabled={!contractSubtotalInput}
                    suffix="%"
                    status={formik.errors.discount_percentage && formik.touched.discount_percentage ? 'error' : ''}
                  />
                  {formik.errors.discount_percentage && formik.touched.discount_percentage && (
                    <div className="text-red">{formik.errors.discount_percentage}</div>
                  )}
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <label className="form-label text-start text-black mt-3 mb-1">Contract Price (Total)</label>
                  <Input
                    name="contract_price"
                    type="text"
                    style={PRICE_READONLY_STYLE}
                    value={contractPriceInput}
                    disabled
                    placeholder="Auto-calculated"
                    className="antd-input styled-input"
                    status={formik.errors.contract_price && formik.touched.contract_price ? 'error' : ''}
                  />
                  {formik.errors.contract_price && formik.touched.contract_price && (
                    <div className="text-red">{formik.errors.contract_price}</div>
                  )}
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <label className="form-label text-start mt-3 mb-1">Project Completion Deadline*</label>
                  <DatePicker
                    name="project_completion_deadline"
                    value={formik.values.project_completion_deadline}
                    onChange={(date) => {
                      formik.setFieldValue('project_completion_deadline', date);
                      formik.setFieldTouched('project_completion_deadline', true, false);
                      handleAutoSave(null, 'project_completion_deadline', date);
                    }}
                    onBlur={formik.handleBlur}
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }}
                    className="antd-input styled-input"
                    status={formik.errors.project_completion_deadline && formik.touched.project_completion_deadline ? 'error' : ''}
                  />
                  {formik.errors.project_completion_deadline && formik.touched.project_completion_deadline && (
                    <div className="text-red">{formik.errors.project_completion_deadline}</div>
                  )}
                </Col>

                <Col xs={24} sm={12} md={12} lg={6}>
                  <label className="form-label text-start mt-3 mb-1">Proposal (PDF)</label>
                  <Upload
                    accept=".pdf"
                    beforeUpload={(file) => {
                      if (file.type !== 'application/pdf') {
                        message.error('You can only upload PDF files!');
                        return false;
                      }
                      if (file.size / 1024 / 1024 >= MAX_PROPOSAL_SIZE_MB) {
                        message.error(`File must be smaller than ${MAX_PROPOSAL_SIZE_MB}MB!`);
                        return false;
                      }
                      return false;
                    }}
                    onChange={(info) => {
                      const file = info.fileList[0]?.originFileObj || null;
                      formik.setFieldValue('proposal', file);
                      formik.setFieldTouched('proposal', true);
                    }}
                    fileList={formik.values.proposal ? [{
                      uid: '-1',
                      name: formik.values.proposal.name,
                      status: 'done',
                    }] : []}
                    maxCount={1}
                    onRemove={() => {
                      formik.setFieldValue('proposal', null);
                      formik.setFieldTouched('proposal', true);
                    }}
                  >
                    <Button>Select PDF File</Button>
                  </Upload>
                  {formik.values.proposal ? (
                    <Button style={{ marginTop: 8 }} onClick={() => {
                      const url = URL.createObjectURL(formik.values.proposal);
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}>View</Button>
                  ) : projectData?.proposal ? (
                    <Button style={{ marginTop: 8 }} onClick={async () => {
                      try {
                        if (projectData?.proposal) {
                          window.open(projectData.proposal, '_blank', 'noopener,noreferrer');
                        } else {
                          message.error('Failed to load proposal');
                        }
                      } catch (e) {
                        message.error('Failed to open proposal');
                      }
                    }}>View Current Proposal</Button>
                  ) : null}
                  {formik.errors.proposal && formik.touched.proposal && (
                    <div className="text-red">{formik.errors.proposal}</div>
                  )}
                </Col>

                <Col xs={24}>
                  <label className="form-label text-start mt-3 mb-1">Remarks</label>
                  <TextArea
                    name="remarks"
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                    onBlur={(event) => handleAutoSave(event, 'remarks', formik.values.remarks)}
                    placeholder="Add remarks or notes"
                    className="antd-input styled-input"
                    rows={4}
                    status={formik.errors.remarks && formik.touched.remarks ? 'error' : ''}
                  />
                  {formik.errors.remarks && formik.touched.remarks && (
                    <div className="text-red">{formik.errors.remarks}</div>
                  )}
                </Col>

              </Row>
              <Button
                type="primary"
                htmlType="submit"
                className="custom-button"
                style={SUBMIT_BUTTON_STYLE}
                loading={updateProjectMutation.isLoading}
              >
                Update
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
