import ManualLocationInput from '../../components/manual-location-input.jsx';
import { message } from '../../components/ui/notifications.jsx';
import { Modal } from '../../components/ui/app-modal.jsx';
import { Select } from '../../components/ui/app-select.jsx';
import { Button, Spin, Tooltip } from '../../components/ui/app-controls.jsx';
import React, { useState, useRef } from 'react';
import InputField from '../../components/input-field.component.jsx';
import { Alert, Form, Row, Col, InputNumber } from 'antd';
import { Formik, Field, Form as FormikForm, ErrorMessage } from 'formik';
import { salesDataValidationSchema } from '../shared/schemas/sales-data.js';
import { dataEntryCreateSchema } from './schemas/data-entry-create-schema.js';
import api from '../shared/services/api.js';
import useUserStore from '../shared/store/user-store.js';
import { isSuperAdmin } from '../auth/role-access.js';
import '../../assets/styles/legacy/create-user.css';
import '../../assets/styles/legacy/leads.generated.css';
import '../../assets/styles/legacy/select-black-text.css';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { bulkCreateDataEntry } from '../shared/services/data-entry-service.js';

import { countriesNames } from '../shared/utils/countries.js';
import { Upload as UploadOutlined, Download as DownloadOutlined, CircleHelp as QuestionCircleOutlined } from 'lucide-react';

export function readCompanyList(payload) {
  if (payload?.status === false || payload?.success === false) throw new Error(payload.message || 'Could not load companies.');
  const rows = [payload, payload?.results, payload?.data, payload?.data?.results].find(Array.isArray);
  if (!rows) throw new Error('Could not read the company list.');
  return rows.map(company => ({ ...company, id: Number(company.id), name: String(company.name ?? '').trim() }))
    .filter(company => Number.isInteger(company.id) && company.id > 0 && company.name);
}

export async function listCompanies() {
  const { data } = await api.get('/accounts/simple-users-list');
  return readCompanyList(data);
}

export async function createDataEntry(values, role) {
  const payload = {};
  for (const field of ['representative_name', 'designation', 'company_name', 'industry_sector', 'phone', 'email', 'city', 'country', 'company_address', 'company_website', 'company_social_link', 'acquired_through', 'status']) {
    payload[field] = String(values[field] ?? '').trim();
  }
  if (isSuperAdmin(role)) payload.company = Number(values.company);
  const { data } = await api.post('/data-entry/create', payload);
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not create sales data.');
  return data;
}

// Add industry options
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
  company: null,
  status: 'Pending',
};

// Normalize phone for import: strip all non-digit chars except leading +
function normalizeImportedPhone(input) {
  if (!input) return '';
  const s = String(input).trim();
  return s.startsWith('+') ? '+' + s.slice(1).replace(/\D/g, '') : s.replace(/\D/g, '');
}

// Add ErrorBoundary for debugging
class DebugErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red' }}>Error: {String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}

// Validation rules tooltips mapping
const validationTooltips = {
  company_name: 'This field is required. Enter the company name.',
  phone: 'Either phone or email is required. No format validation.',
  email: 'Required. Format: Valid email address (e.g., example@domain.com). Either phone or email is required.',
  company_website: 'Optional. URL must start with http:// or https:// (e.g., https://www.example.com)',
  company_social_link: 'Optional. URL must start with http:// or https:// (e.g., https://www.linkedin.com/company/example)',
};

// Helper component to render error message with tooltip
const ErrorMessageWithTooltip = ({ name, tooltip }) => (
  <ErrorMessage name={name}>
    {(errorMessage) => {
      if (!errorMessage) return null;
      return (
        <Tooltip title={tooltip} placement="top">
          <div className="form-error" style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <QuestionCircleOutlined size="1em" className="app-icon" style={{ fontSize: '12px' }} />
            <span>{errorMessage}</span>
          </div>
        </Tooltip>
      );
    }}
  </ErrorMessage>
);

const AddUpdateLead = () => {
  const requiredMark = <span style={{ color: '#3E6A9F', marginLeft: 2 }}>*</span>;
  const navigate = useNavigate();
  const { user } = useUserStore();
  const superAdmin = isSuperAdmin(user?.user_type);
  const queryClient = useQueryClient();
  const { data: companies = [], isLoading: loadingCompanies, isError: companiesError, error: companyError, refetch: refetchCompanies } = useQuery({
    queryKey: ['data-entry-company-options', '/accounts/simple-users-list', user?.id, user?.user_type],
    queryFn: listCompanies,
    enabled: superAdmin,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
  const { mutate: createLead, isLoading } = useMutation(values => createDataEntry(values, user?.user_type), {
    onSuccess: (data) => {
      message.success(data?.message || 'Lead added successfully');
      queryClient.invalidateQueries(['data-entry-list']);
      queryClient.invalidateQueries(['data-entry-list-count']);
      queryClient.invalidateQueries(['data-entry-executive-stats']);
      navigate('/data-entry-executive/leads-table'); // Go back to leads table
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || 'Failed to add lead');
    },
  });

  // Bulk upload state
  const [csvData, setCsvData] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationStats, setValidationStats] = useState({ totalRows: 0, validRows: 0, invalidRows: 0 });
  const [validData, setValidData] = useState([]);
  const [invalidData, setInvalidData] = useState([]);
  const fileInputRef = useRef(null);
  const [uploadResultModalVisible, setUploadResultModalVisible] = useState(false);
  const [uploadResult, setUploadResult] = useState({ skipped: [], message: '' });
  const [lastUploadResponse, setLastUploadResponse] = useState(null);

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // reset file input
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e) => {
    setCsvData([]);
    setValidData([]);
    setInvalidData([]);
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      alert('Please upload a valid Excel or CSV file (.xls, .xlsx, .csv)');
      return;
    }
    setIsValidating(true);
    const XLSX = await import('xlsx');
    const reader = new FileReader();
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      reader.readAsText(file);
      reader.onload = async (event) => {
        const workbook = XLSX.read(event.target.result, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        setCsvData(sheetData);
        await validateRows(sheetData);
      };
    } else {
      reader.readAsBinaryString(file);
      reader.onload = async (event) => {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        setCsvData(sheetData);
        await validateRows(sheetData);
      };
    }
  };

  const validateRows = async (sheetData) => {
    const headers = sheetData[0];
    const validRows = [];
    const invalidRows = [];
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      // Check for object values in any cell (except null)
      let hasObjectCell = false;
      for (let cell of row) {
        if (typeof cell === 'object' && cell !== null) {
          hasObjectCell = true;
          break;
        }
      }
      if (hasObjectCell) {
        invalidRows.push({ row, reason: 'Cell contains an object value' });
        continue;
      }

      // Ensure row has enough columns to match headers
      const paddedRow = [...row];
      while (paddedRow.length < headers.length) {
        paddedRow.push(''); // Pad missing columns with empty strings
      }

      const obj = {};
      headers.forEach((header, idx) => {
        let value = paddedRow[idx];
        // Normalize any field whose header includes 'phone' (case-insensitive)
        if (header && header.toLowerCase().includes('phone')) {
          value = normalizeImportedPhone(value);
        }
        obj[header] = value;
      });
      try {
        await salesDataValidationSchema.validate(obj, { abortEarly: false });
        // Push the normalized row (array) to validRows
        const normalizedRow = headers.map(header => obj[header]);
        validRows.push(normalizedRow);
      } catch (err) {
        let reason = 'Validation error';
        if (err && err.errors && err.errors.length > 0) {
          reason = err.errors.join('; ');
        } else if (err && err.message) {
          reason = err.message;
        }
        invalidRows.push({ row: paddedRow, reason });
      }
    }
    setValidData(validRows);
    setInvalidData(invalidRows);
    setValidationStats({
      totalRows: sheetData.length - 1,
      validRows: validRows.length,
      invalidRows: invalidRows.length
    });
    setIsValidating(false);
    setValidationModalVisible(true);
  };

  const { mutate: uploadFileData, isLoading: isUploading } = useMutation({
    mutationFn: async (data) => {
      const { headers, validRows } = data;
      const formattedData = validRows.map((row, rowIdx) => {
        const obj = {};
        headers.forEach((header, idx) => {
          let value = row[idx];
          // Fix for phone numbers in scientific notation or as numbers
          if (header && header.trim().toLowerCase() === 'phone') {
            if (typeof value === 'number') {
              const numStr = value.toFixed(0);
              // Add leading zero for Pakistani numbers if missing
              if (numStr.length === 10 && (numStr.startsWith('3') || /^[2-9]/.test(numStr))) {
                value = '0' + numStr;
              } else {
                value = numStr;
              }
            } else if (typeof value === 'string' && value.match(/^[0-9.]+e[+0-9]+$/i)) {
              const num = Number(value);
              if (!isNaN(num)) {
                const numStr = num.toFixed(0);
                // Add leading zero for Pakistani numbers if missing
                if (numStr.length === 10 && (numStr.startsWith('3') || /^[2-9]/.test(numStr))) {
                  value = '0' + numStr;
                } else {
                  value = numStr;
                }
              }
            }
          }
          obj[header] = value ?? '';
        });
        return obj;
      });
      return await bulkCreateDataEntry(formattedData);
    },
    onSuccess: (data) => {
      setLastUploadResponse(data);
      message.success('Data uploaded successfully.');
      setCsvData([]);
      setValidData([]);
      setInvalidData([]);
      setValidationModalVisible(false);
      // Navigate to leads table after successful upload
      navigate('/data-entry-executive/leads-table');
      // Show skipped/failed records in a modal if any
      if (data && Array.isArray(data.skipped) && data.skipped.length > 0) {
        setUploadResult({ skipped: data.skipped, message: data.message });
        setUploadResultModalVisible(true);
      }
    },
    onError: (error) => {
      message.error('Error uploading data. Please try again.');
    }
  });

  const handleUploadCSVFile = () => {
    if (validData.length > 0) {
      uploadFileData({ headers: csvData[0], validRows: validData });
    } else {
      message.warning('No valid data to upload.');
    }
  };

  const downloadInvalidData = async (event) => {
    if (invalidData.length === 0) {
      message.info('No invalid data to download.');
      return;
    }
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    // Add 'Reason' as the first column
    const headersWithReason = ['Reason', ...csvData[0]];
    const worksheetData = [headersWithReason];
    invalidData.forEach(({ row, reason }) => {
      worksheetData.push([reason, ...row]);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invalid Data');
    const fileName = `invalid_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    message.success('Invalid data downloaded successfully.');
    if (event && event.target) {
      event.target.blur();
    }
  };

  const handleDownloadUploadResponse = () => {
    if (!lastUploadResponse) {
      message.info('No upload response to download yet.');
      return;
    }
    let responseData = [];
    if (lastUploadResponse.skipped && Array.isArray(lastUploadResponse.skipped)) {
      responseData = lastUploadResponse.skipped.map(item => ({ ...item.data, reason: item.reason }));
    } else if (lastUploadResponse.created && Array.isArray(lastUploadResponse.created)) {
      responseData = lastUploadResponse.created.map(item => item.data || item);
    } else if (lastUploadResponse.results && Array.isArray(lastUploadResponse.results)) {
      responseData = lastUploadResponse.results;
    } else if (lastUploadResponse.data && Array.isArray(lastUploadResponse.data)) {
      responseData = lastUploadResponse.data;
    } else if (Array.isArray(lastUploadResponse)) {
      responseData = lastUploadResponse;
    } else {
      const responseKeys = Object.keys(lastUploadResponse);
      for (const key of responseKeys) {
        if (Array.isArray(lastUploadResponse[key])) {
          if (lastUploadResponse[key].length > 0 && lastUploadResponse[key][0].data) {
            responseData = lastUploadResponse[key].map(item => item.data);
          } else {
            responseData = lastUploadResponse[key];
          }
          break;
        }
      }
    }
    // If no data found, create a sample row with the upload response info
    if (!responseData.length) {
      responseData = [{}];
    }
    // Use keys from the first data object as headers
    const csvKeys = [
      "reason",
      "representative_name",
      "designation",
      "company_name",
      "industry_sector",
      "phone",
      "email",
      "city",
      "country",
      "company_address",
      "company_website",
      "company_social_link",
      "acquired_through",
      "created_at"
    ];
    const csvRows = [csvKeys];
    // Add data rows
    responseData.forEach(row => {
      const csvRow = csvKeys.map(key => {
        const value = row[key];
        if (value === null || value === undefined || value === '') {
          return '';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(csvRow);
    });
    // Convert to CSV string
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upload_response_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('CSV file downloaded successfully.');
  };

  const handleDownloadEmptyTemplate = () => {
    // Define expected CSV column headers (matching the form fields)
    const csvHeaders = [
      'representative_name',
      'designation',
      'company_name',
      'industry_sector',
      'phone',
      'email',
      'city',
      'country',
      'company_address',
      'company_website',
      'company_social_link',
      'acquired_through'
    ];
    
    // Create CSV content with headers only (no data rows)
    const csvContent = csvHeaders.join(',') + '\n';
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_data_template_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('Empty CSV template downloaded successfully.');
  };

  const goBack = () => {
    navigate('/data-entry-executive/leads-table');
  };

  return (
      <>
    
      <BreadCrumb linkText="Add Sales Data" goBack={goBack} />
    <div className="container " >
      <div style={{ marginTop: 24, maxWidth: 1440, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h2 style={{ 
            margin: 0, 
            textAlign: 'left',
            color: '#3E6A9F',
            fontSize: '28px',
            fontWeight: '600'
          }}>Add Sales Data</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className='custom-button' onClick={handleDownloadEmptyTemplate}>
              <DownloadOutlined size="1em" className="app-icon" style={{ marginRight: 4 }} />Download Empty
            </button>
            <button className='custom-button' onClick={handleUploadButtonClick}>Upload CSV</button>
            <input
              type="file"
              accept=".xls,.xlsx,.csv,text/csv"
              multiple={false}
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <Formik
          initialValues={{ ...initialState, company: null }}
          validationSchema={dataEntryCreateSchema(superAdmin)}
          onSubmit={(values, { setErrors, setStatus, setSubmitting }) => {
            createLead(values, { onError: error => {
              const body = error?.response?.data;
              const fields = body?.errors || body;
              const errors = {};
              if (fields && typeof fields === 'object') for (const key of Object.keys(initialState)) {
                if (typeof fields[key] === 'string' || Array.isArray(fields[key])) errors[key] = Array.isArray(fields[key]) ? fields[key].join(' ') : fields[key];
              }
              setErrors(errors);
              setStatus(body?.message || body?.detail || error.message || 'Could not create sales data.');
            }, onSettled: () => setSubmitting(false) });
          }}
        >
          {({ handleSubmit, status }) => (
            <FormikForm onSubmit={handleSubmit}>
              {status && <Alert type="error" showIcon message={status} className="mb-4" />}
              <Row gutter={[24, 24]}>
                {superAdmin && <Col xs={24} sm={12} lg={8}>
                  <label htmlFor="data-entry-company" className="form-label">Company {requiredMark}</label>
                  <Field name="company">{({ field, form }) => <Select id="data-entry-company"
                    value={field.value ?? undefined} onChange={value => form.setFieldValue('company', value ?? null)}
                    onBlur={() => form.setFieldTouched('company', true)} loading={loadingCompanies}
                    showSearch allowClear optionFilterProp="label" placeholder="Select company"
                    options={companies.map(company => ({ value: company.id, label: company.name }))}
                    notFoundContent={loadingCompanies ? <Spin size="small" /> : 'No companies found'}
                    style={{ width: '100%' }} />}</Field>
                  {companiesError && <div role="alert">{companyError?.response?.data?.message || companyError?.message || 'Could not load companies.'} <Button type="link" onClick={() => refetchCompanies()}>Retry</Button></div>}
                  <ErrorMessage name="company" component="div" className="form-error" />
                </Col>}
                <Col xs={24} sm={12} lg={8}>
                  <label htmlFor="data-entry-status" className="form-label">Status {requiredMark}</label>
                  <Field name="status">{({ field, form }) => <Select id="data-entry-status" value={field.value}
                    onChange={value => form.setFieldValue('status', value)} style={{ width: '100%' }}
                    options={['Pending', 'Converted', 'Contacted But No Response'].map(value => ({ value, label: value }))} />}</Field>
                  <ErrorMessage name="status" component="div" className="form-error" />
                </Col>
                <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                  <label htmlFor="representative_name" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Representative Name 
                  </label>
                  <Form.Item name="representative_name" style={{ marginBottom: 0 }}>
                    <Field name="representative_name" as={InputField} placeholder="Enter representative name" className="antd-input styled-input" />
                    <ErrorMessage name="representative_name" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                  <label htmlFor="designation" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Designation
                  </label>
                  <Form.Item name="designation" style={{ marginBottom: 0 }}>
                    <Field name="designation" as={InputField} placeholder="Enter designation" className="antd-input styled-input" />
                    <ErrorMessage name="designation" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                  <label htmlFor="company_name" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Company Name {requiredMark}
                  </label>
                  <Form.Item name="company_name" style={{ marginBottom: 0 }}>
                    <Field name="company_name" as={InputField} placeholder="Enter company name" className="antd-input styled-input" />
                    <ErrorMessageWithTooltip name="company_name" tooltip={validationTooltips.company_name} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                  <label htmlFor="industry_sector" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Industry/Sector
                  </label>
                  <Form.Item name="industry_sector" style={{ marginBottom: 0 }}>
                    <Field name="industry_sector">
                      {({ field, form }) => (
                        <Select
                          mode="tags"
                          value={field.value ? field.value.split(',').filter(Boolean) : []}
                          onChange={value => {
                            // Filter out empty values and join with comma
                            const filteredValue = Array.isArray(value) ? value.filter(v => v && v.trim()) : [];
                            form.setFieldValue('industry_sector', filteredValue.join(','));
                          }}
                          options={industryOptions}
                          placeholder="Select or type industry/sector"
                          style={{ width: '100%', color: '#000000' }}
                          showSearch
                          allowClear
                          tokenSeparators={[',']}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="industry_sector" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                  <label htmlFor="phone" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Phone {requiredMark}
                  </label>
                  <Form.Item name="phone" style={{ marginBottom: 0 }}>
                    <Field name="phone" as={InputField} placeholder="Enter phone" className="antd-input styled-input" />
                    <ErrorMessageWithTooltip name="phone" tooltip={validationTooltips.phone} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                  <label htmlFor="email" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Email {requiredMark}
                  </label>
                  <Form.Item name="email" style={{ marginBottom: 0 }}>
                    <Field name="email" as={InputField} placeholder="Enter email" className="antd-input styled-input" />
                    <ErrorMessageWithTooltip name="email" tooltip={validationTooltips.email} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <label htmlFor="city" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    City 
                  </label>
                  <Form.Item name="city" style={{ marginBottom: 0 }}>
                    <Field name="city">
                      {({ field, form }) => (
                        <ManualLocationInput
                          {...field}
                          value={field.value}
                          onChange={value => {
                            // Ensure we get a string value, not an object
                            const stringValue = typeof value === 'object' ? value?.value || '' : value || '';
                            form.setFieldValue('city', stringValue);
                          }}
                          placeholder='Select city'
                          style={{ width: '100%', color: '#000000' }}
                          showSearch
                        />
                      )}
                    </Field>
                    <ErrorMessage name="city" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                  <label htmlFor="country" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Country 
                  </label>
                  <Form.Item name="country" style={{ marginBottom: 0 }}>
                    <Field name="country">
                      {({ field, form }) => (
                        <ManualLocationInput
                          {...field}
                          value={field.value}
                          onChange={value => {
                            // Ensure we get a string value, not an object
                            const stringValue = typeof value === 'object' ? value?.value || '' : value || '';
                            form.setFieldValue('country', stringValue);
                          }}
                          placeholder='Select country'
                          style={{ width: '100%', color: '#000000' }}
                          showSearch
                        />
                      )}
                    </Field>
                    <ErrorMessage name="country" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                  <label htmlFor="company_website" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Company Website
                  </label>
                  <Form.Item name="company_website" style={{ marginBottom: 0 }}>
                    <Field name="company_website" as={InputField} placeholder="URL should start from https:// or http://" className="antd-input styled-input" />
                    <ErrorMessageWithTooltip name="company_website" tooltip={validationTooltips.company_website} />
        </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <label htmlFor="company_social_link" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Company Social Media Link
                  </label>
                  <Form.Item name="company_social_link" style={{ marginBottom: 0 }}>
                    <Field name="company_social_link" as={InputField} placeholder="URL should start from https:// or http://" className="antd-input styled-input" />
                    <ErrorMessageWithTooltip name="company_social_link" tooltip={validationTooltips.company_social_link} />
        </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="company_address" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Company Address
                  </label>
                  <Form.Item name="company_address" style={{ marginBottom: 0 }}>
                    <Field name="company_address" as={InputField} placeholder="Enter company address" className="antd-input styled-input" />
                    <ErrorMessage name="company_address" component="div" className="form-error" />
        </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="acquired_through" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Data Acquired Through
                  </label>
                  <Form.Item name="acquired_through" style={{ marginBottom: 0 }}>
                    <Field name="acquired_through">
                      {({ field, form }) => (
                        <Select
                          {...field}
                          value={field.value}
                          onChange={value => {
                            // Ensure we get a string value, not an object
                            const stringValue = typeof value === 'object' ? value?.value || '' : value || '';
                            form.setFieldValue('acquired_through', stringValue);
                          }}
                          placeholder='Select how data was acquired'
                          style={{ width: '100%', color: '#000000' }}
                          showSearch
                        >
                          <Select.Option value="" disabled>Select how data was acquired</Select.Option>
                          <Select.Option value="LinkedIn">LinkedIn</Select.Option>
                          <Select.Option value="Facebook">Facebook</Select.Option>
                          <Select.Option value="WhatsApp">Whatsapp</Select.Option>
                          <Select.Option value="Referral">Referral</Select.Option>
                          <Select.Option value="Apollo">Apollo</Select.Option>
                          <Select.Option value="Other">Other</Select.Option>
                        </Select>
                      )}
                    </Field>
                    <ErrorMessage name="acquired_through" component="div" className="form-error" />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ textAlign: 'left', marginTop: '16px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="custom-button"
                  loading={isLoading}
                  style={{ minWidth: 120, height: '40px', fontSize: '14px', fontWeight: '500', borderRadius: '6px' }}
                >
                  Submit
                </Button>
              </div>
            </FormikForm>
          )}
        </Formik>
      </div>
    </div>
    <Modal
        title="Upload Lead Data"
        open={validationModalVisible}
        onCancel={() => setValidationModalVisible(false)}
        footer={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
              <Button type="primary" size="middle" onClick={handleUploadCSVFile} disabled={isUploading || validData.length === 0} style={{ background: '#3E6A9F', borderColor: '#3E6A9F', color: 'white' }} loading={isUploading}>
                <UploadOutlined size="1em" className="app-icon" style={{ marginRight: 4 }} />Upload Valid Data ({validationStats.validRows})
              </Button>
              {validationStats.invalidRows > 0 && (
                <Button type="default" size="middle" onClick={downloadInvalidData} style={{ borderColor: '#3E6A9F', color: '#3E6A9F', background: 'white' }}>
                  <DownloadOutlined size="1em" className="app-icon" style={{ marginRight: 4 }} />Download Invalid Data ({validationStats.invalidRows})
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="middle" onClick={() => setValidationModalVisible(false)}>
                Close
              </Button>
            </div>
          </div>
        }
        width={700}
      >
        {isValidating ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {validationStats.totalRows}
                </div>
                <div style={{ color: '#666' }}>Total Rows</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {validationStats.validRows}
                </div>
                <div style={{ color: '#666' }}>Valid Rows</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  {validationStats.invalidRows}
                </div>
                <div style={{ color: '#666' }}>Invalid Rows</div>
              </div>
            </div>
            {validationStats.invalidRows > 0 && (
              <div style={{ color: '#ff4d4f', fontSize: '14px', marginBottom: 18 }}>
                Invalid rows will be excluded from upload. You can download them separately.
              </div>
            )}
            {/* Show invalid rows with reasons in a table */}
            {invalidData.length > 0 && (
              <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #eee', padding: 3, background: '#f5f5f5' }}>Reason</th>
                      {csvData[0]?.map((header, idx) => (
                        <th key={idx} style={{ border: '1px solid #eee', padding: 3, background: '#f5f5f5' }}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invalidData.map(({ row, reason }, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #eee', padding: 3, color: '#d4380d', fontWeight: 'bold', maxWidth: 200 }}>
                          <span title={reason}>{reason}</span>
                        </td>
                        {row.map((cell, cidx) => (
                          <td key={cidx} style={{ border: '1px solid #eee', padding: 3 }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
      <Modal
        title="Upload Issues"
        open={uploadResultModalVisible}
        onCancel={() => setUploadResultModalVisible(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              type="default" 
              size="middle" 
              onClick={handleDownloadUploadResponse}
              style={{ borderColor: '#3E6A9F', color: '#3E6A9F', background: 'white' }}
            >
              <DownloadOutlined size="1em" className="app-icon" style={{ marginRight: 4 }} />Download Upload Response
            </Button>
            <Button onClick={() => setUploadResultModalVisible(false)}>Close</Button>
          </div>
        }
        width={700}
      >
        <DebugErrorBoundary>
        <div style={{ marginBottom: 8, color: '#ff4d4f', fontSize: '14px' }}>{uploadResult.message}</div>
        {uploadResult.skipped.length > 0 ? (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #eee', padding: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#f5f5f5' }}>Reason</th>
                  <th style={{ border: '1px solid #eee', padding: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#f5f5f5' }}>Phone</th>
                  <th style={{ border: '1px solid #eee', padding: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#f5f5f5' }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {uploadResult.skipped.map((item, idx) => {
                  let reasonDisplay;
                  if (item.reason === null || item.reason === undefined) {
                    reasonDisplay = '';
                  } else if (typeof item.reason === 'object') {
                    reasonDisplay = JSON.stringify(item.reason);
                  } else {
                    reasonDisplay = String(item.reason);
                  }
                  return (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #eee', padding: 3, color: '#d4380d', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        <span title={reasonDisplay}>{reasonDisplay}</span>
                      </td>
                      <td style={{ border: '1px solid #eee', padding: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        <span title={item.data?.phone ?? ''}>{item.data?.phone ?? ''}</span>
                      </td>
                      <td style={{ border: '1px solid #eee', padding: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        <span title={item.data?.email ?? ''}>{item.data?.email ?? ''}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div>No skipped records.</div>
        )}
        </DebugErrorBoundary>
      </Modal>
    </>
  );
};

export default AddUpdateLead; 
