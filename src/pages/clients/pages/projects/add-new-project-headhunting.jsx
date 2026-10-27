import { message } from '../../../../components/ui/notifications.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Button } from '../../../../components/ui/app-controls.jsx';
import React, { useState } from 'react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { Col, Row, Upload } from 'antd';
import { useFormik } from 'formik';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { projectHeadhuntingValidationSchema } from '../../../shared/schemas/project.js';
import { currencyOptions } from '../../../shared/utils/countries.js';
import { useMutation, useQueryClient } from 'react-query';
import { createHeadhuntingProject } from '../../../shared/services/headhunting.js';
import {
  formatNumberWithCommas,
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

export default function AddNewProjectHeadhunting() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const queryClient = useQueryClient();
  const [contractPriceInput, setContractPriceInput] = useState('');
  const [contractSubtotalInput, setContractSubtotalInput] = useState('');
  const [discountAmountInput, setDiscountAmountInput] = useState('');
  const [discountPercentageInput, setDiscountPercentageInput] = useState('');

  const createProjectMutation = useMutation(createHeadhuntingProject, {
    onSuccess: () => {
      message.destroy('project-toast');
      message.success({ content: 'Project created successfully', key: 'project-toast' });
      if (clientId) {
        queryClient.invalidateQueries(['clientProjectCounts', clientId]);
        queryClient.invalidateQueries(['clientProjects', clientId]);
      }
      navigate(-1);
    },
    onError: (error) => {
      message.destroy('project-toast');
      message.error({ content: error?.response?.data?.message || 'Failed to create project', key: 'project-toast' });
    },
  });

  const formik = useFormik({
    initialValues: {
      client: clientId || '',
      proposal: null,
      contract_currency: '',
      contract_price: '',
      contract_subtotal_amount: '',
      pricing_type: '',
      discount_amount: '',
      discount_percentage: '',
      remarks: '',
      created_at: null,
    },
    enableReinitialize: true,
    validationSchema: projectHeadhuntingValidationSchema,
    onSubmit: (values) => {
      const payload = {
        client: values.client,
        contract_currency: values.contract_currency || null,
        contract_price: roundToTwoDecimals(values.contract_price),
        contract_subtotal_amount: roundToTwoDecimals(values.contract_subtotal_amount),
        pricing_type: values.pricing_type || null,
        discount_amount: roundToTwoDecimals(values.discount_amount),
        discount_percentage: roundToTwoDecimals(values.discount_percentage),
        remarks: values.remarks || null,
        proposal: values.proposal,
      };
      createProjectMutation.mutate(payload);
    },
  });

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

      // Round all numeric values to 2 decimals
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

      // Update formik values (numbers already rounded)
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
      value = value.replace(/[^\d.]/g, '');
      const [whole, decimal] = value.split('.');
      if (decimal) {
        value = `${whole}.${decimal.slice(0, 2)}`;
      }
      updateTotals({ nextDiscountPercent: value, changed: 'percent' });
    };
    
  const goBack = () => (clientId ? navigate(`/client-head-hunting/${clientId}`) : navigate(-1));

  return (
    <div className="lead-job-page">
      <BreadCrumb goBack={goBack} linkText="Projects" />
      <div className="container">
        <div className="job-card">
          <div className="container">
            <div className="row">
              <h1>Add New Project </h1>
            </div>
          </div>
          <div className="container">
            <form onSubmit={formik.handleSubmit}>
              <Row gutter={[10, { xs: 8, sm: 16, md: 24, lg: 32 }]}>  
                <Col xs={24} sm={12} md={12} lg={6}>
                  <label className="form-label text-start mt-3 mb-1">Pricing Type</label>
                  <Select
                    name="pricing_type"
                    value={formik.values.pricing_type || undefined}
                    onChange={value => formik.setFieldValue('pricing_type', value)}
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
                    onChange={value => formik.setFieldValue('contract_currency', value)}
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
                  <label className="form-label text-start mt-3 mb-1">Proposal (PDF)<sup>*</sup></label>
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
                      const file = info.fileList[0]?.originFileObj ?? null;
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
                  {formik.errors.proposal && (formik.touched.proposal || formik.submitCount > 0) && (
                    <div className="text-red">{formik.errors.proposal}</div>
                  )}
                </Col>

                <Col xs={24}>
                  <label className="form-label text-start mt-3 mb-1">Remarks</label>
                  <TextArea
                    name="remarks"
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
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
                loading={createProjectMutation.isLoading}
              >
                Save
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
