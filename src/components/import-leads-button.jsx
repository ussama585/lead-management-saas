import React, { useState, useRef } from 'react';
import { Button, Modal, message, Spin, Table, Tabs, Alert } from 'antd';
import { Upload as UploadOutlined, Pencil as EditOutlined, CircleCheck as CheckCircleOutlined, CircleX as CloseCircleOutlined } from 'lucide-react';
import { useMutation } from 'react-query';
import Papa from 'papaparse';

import { bulkAddMetaLeads, bulkUpdateMetaLeads } from '../pages/shared/services/metaLeads.js';
import { formatSalaryNum } from '../pages/shared/utils/formatters.js';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/import-leads-button.css';

const ImportLeadsButton = ({ onSuccess }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [updateCsvData, setUpdateCsvData] = useState(null);
  const [updateCsvColumns, setUpdateCsvColumns] = useState([]);
  
  // Response modal states
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [responseType, setResponseType] = useState('success'); // 'success' or 'error'
  
  const fileInputRef = useRef(null);
  const updateFileInputRef = useRef(null);

  // API call to bulk add leads
  const importLeadsMutation = useMutation(
    (leadsData) => bulkAddMetaLeads(leadsData),
    {
      onSuccess: (data) => {
        setResponseData(data);
        setResponseType('success');
        setResponseModalVisible(true);
        setIsModalVisible(false);
        setCsvData(null);
        setCsvColumns([]);
        onSuccess?.();
      },
      onError: (error) => {
        setResponseData(error);
        setResponseType('error');
        setResponseModalVisible(true);
      },
    }
  );

  // API call to bulk update leads
  const updateLeadsMutation = useMutation(
    (leadsData) => bulkUpdateMetaLeads(leadsData),
    {
      onSuccess: (data) => {
        setResponseData(data);
        setResponseType('success');
        setResponseModalVisible(true);
        setIsUpdateModalVisible(false);
        setUpdateCsvData(null);
        setUpdateCsvColumns([]);
        onSuccess?.();
      },
      onError: (error) => {
        setResponseData(error);
        setResponseType('error');
        setResponseModalVisible(true);
      },
    }
  );

  // Map CSV fields to JSON - handles messy field names dynamically
  const mapCsvToJson = (csvRow) => {
    const normalizeKey = (key) =>
      key
        ?.trim()
        ?.toLowerCase()
        ?.replace(/\s+/g, '_')
        ?.replace(/[^\w_]/g, '');

    const normalizedRow = {};
    Object.keys(csvRow).forEach((key) => {
      normalizedRow[normalizeKey(key)] = csvRow[key]?.trim?.() || '';
    });

    const mapped = {
      id: normalizedRow.id || '',
      created_time: normalizedRow.created_time || new Date().toISOString(),
      ad_id: normalizedRow.ad_id || '',
      ad_name: normalizedRow.ad_name || '',
      adset_id: normalizedRow.adset_id || '',
      adset_name: normalizedRow.adset_name || '',
      campaign_id: normalizedRow.campaign_id || '',
      campaign_name: normalizedRow.campaign_name || '',
      form_id: normalizedRow.form_id || '',
      form_name: normalizedRow.form_name || '',
      is_organic: normalizedRow.is_organic || '',
      platform: normalizedRow.platform || '',

      who_are_you:
        normalizedRow.who_are_you ||
        normalizedRow.whoareyou ||
        normalizedRow.are_you_an_employer_or_a_job_seeker ||
        normalizedRow.areyouanemployerorajobseeker ||
        '',

      headhunting_service_acknowledged:
        normalizedRow.our_headhunting_service_is_paid_are_you_sure_you_want_to_continue ||
        normalizedRow.headhuntingserviceacknowledged ||
        '',

      how_many_hires:
        normalizedRow.how_many_employees_do_you_want_to_hire ||
        normalizedRow.number_of_positions_to_hire ||
        normalizedRow._how_many_hires_do_you_need ||
        '',

      salary_budget: (() => {
        const raw =
          normalizedRow.what_is_the_approximate_monthly_salary_budget_for_this_role ||
          normalizedRow.salarybudget ||
          '';
        return raw ? formatSalaryNum(raw) : '';
      })(),

      role_hiring_for:
        normalizedRow.what_role_are_you_hiring_it_sales_financeetc ||
        normalizedRow.whatkindoftalentareyoulookingtohire ||
        normalizedRow.role_hiring_for ||
        '',

      preferred_contact_method: normalizedRow.preferred_contact_method || '',

      full_name:
        normalizedRow.full_name ||
        normalizedRow.firstname ||
        normalizedRow.first_name ||
        '',

      phone_number:
        normalizedRow.phone ||
        normalizedRow.phonenumber ||
        normalizedRow.phone_number ||
        '',

      work_email:
        normalizedRow.email ||
        normalizedRow.work_email ||
        normalizedRow.workemail ||
        '',

      company_name:
        normalizedRow.companyname ||
        normalizedRow.company_name ||
        normalizedRow.company ||
        '',

      job_title: normalizedRow.job_title || '',
      city: normalizedRow.city || '',
      lead_status: normalizedRow.lead_status || 'complete',
    };

    return mapped;
  };

  // Handle CSV file upload for import
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const columns = results.meta?.fields || Object.keys(results.data[0]);
          setCsvColumns(columns);

          const convertedData = results.data.map(mapCsvToJson);
          setCsvData(convertedData);

          message.success(`Loaded ${convertedData.length} leads from CSV`);
        } else {
          message.error('No valid data found in CSV file');
        }
      },
      error: (error) => {
        message.error(`Error parsing CSV: ${error.message}`);
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle CSV file upload for updates
  const handleUpdateFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const columns = results.meta?.fields || Object.keys(results.data[0]);
          setUpdateCsvColumns(columns);

          const convertedData = results.data.map(mapCsvToJson);
          setUpdateCsvData(convertedData);

          message.success(`Loaded ${convertedData.length} leads for update`);
        } else {
          message.error('No valid data found in CSV file');
        }
      },
      error: (error) => {
        message.error(`Error parsing CSV: ${error.message}`);
      },
    });

    if (updateFileInputRef.current) {
      updateFileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!csvData || csvData.length === 0) {
      message.error('No data to import');
      return;
    }

    importLeadsMutation.mutate(csvData);
  };

  const handleUpdate = async () => {
    if (!updateCsvData || updateCsvData.length === 0) {
      message.error('No data to update');
      return;
    }

    updateLeadsMutation.mutate(updateCsvData);
  };

  // Generate table columns from CSV columns
  const getTableColumns = (columns) => {
    return columns.map(col => ({
      title: col,
      dataIndex: col,
      key: col,
      width: 120,
      ellipsis: true,
      render: (text) => <span className="import-leads-button__cell-text">{text || '-'}</span>,
    }));
  };

  // Render response modal content
 // Render response modal content
const renderResponseContent = () => {
  if (responseType === 'success') {
    const isBulkUpdate = Array.isArray(responseData?.updated);
    const isImport = typeof responseData?.created === 'number';

    return (
      <div className="import-leads-button__response">
        {responseData?.message && (
          <div className="import-leads-button__box import-leads-button__box--centered">
            <div className="import-leads-button__message">{responseData.message}</div>
          </div>
        )}

        {isImport && (
          <div className="import-leads-button__stats-row">
            {['created', 'updated', 'skipped', 'discarded'].map(
              (key) =>
                responseData[key] !== undefined && (
                  <div key={key} className="import-leads-button__box import-leads-button__box--flex">
                    <div className="import-leads-button__value">{responseData[key]}</div>
                    <div className="import-leads-button__label">{key}</div>
                  </div>
                )
            )}
          </div>
        )}

        {isBulkUpdate && (
          <div>
            {responseData.updated?.length > 0 && (
              <div className="import-leads-button__box">
                <div className="import-leads-button__value import-leads-button__value--spaced">
                  Updated {responseData.updated.length} leads
                </div>
                <div className="import-leads-button__list">
                  {responseData.updated.map((id, i) => (
                    <div key={i}>• {id}</div>
                  ))}
                </div>
              </div>
            )}

            {responseData.skipped?.length > 0 && (
              <div className="import-leads-button__box">
                <div className="import-leads-button__value import-leads-button__value--spaced">
                  Skipped {responseData.skipped.length} leads
                </div>
                <div className="import-leads-button__list import-leads-button__list--tall">
                  {responseData.skipped.map((item, i) => (
                    <div
                      key={i}
                      className="import-leads-button__skipped-item"
                    >
                      <div className="import-leads-button__skipped-reason">Reason: {item.reason}</div>
                      {item.lead_id && <div className="import-leads-button__label">ID: {item.lead_id}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Error section
  return (
    <div className="import-leads-button__response">
      <div className="import-leads-button__box import-leads-button__box--centered">
        <div className="import-leads-button__message">
          {responseData?.message || 'An error occurred'}
        </div>
      </div>

      <pre
        className="import-leads-button__box import-leads-button__box--code"
      >
        {JSON.stringify(responseData, null, 2)}
      </pre>
    </div>
  );
};



  return (
    <>
      {/* Buttons */}
      <div className="import-leads-button__actions">
        <Button
          className="import-leads-button__action-btn"
          icon={<EditOutlined size="1em" className="app-icon" />}
          onClick={() => setIsUpdateModalVisible(true)}
        >
          Bulk Update Leads
        </Button>
        <Button
          className="import-leads-button__action-btn"
          icon={<UploadOutlined size="1em" className="app-icon" />}
          onClick={() => setIsModalVisible(true)}
        >
          Import Leads
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="import-leads-button__hidden-input"
        onChange={handleFileChange}
      />

      <input
        ref={updateFileInputRef}
        type="file"
        accept=".csv"
        className="import-leads-button__hidden-input"
        onChange={handleUpdateFileChange}
      />

      {/* Import Modal */}
      <Modal
        title="Import Leads from CSV"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setCsvData(null);
          setCsvColumns([]);
        }}
        width={1200}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setIsModalVisible(false);
              setCsvData(null);
              setCsvColumns([]);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="upload"
            type="default"
            onClick={() => fileInputRef.current?.click()}
            disabled={importLeadsMutation.isLoading}
          >
            Choose CSV File
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleImport}
            loading={importLeadsMutation.isLoading}
            disabled={!csvData || csvData.length === 0}
          >
            Import {csvData && `(${csvData.length} leads)`}
          </Button>,
        ]}
      >
        <Spin spinning={importLeadsMutation.isLoading}>
          <div className="import-leads-button__modal-body">
            {!csvData ? (
              <div className="import-leads-button__empty-state">
                <p className="import-leads-button__empty-text">
                  Upload a CSV file to import leads
                </p>
                <Button
                  type="dashed"
                  size="large"
                  onClick={() => fileInputRef.current?.click()}
                  className="import-leads-button__select-btn"
                >
                  <UploadOutlined size="1em" className="app-icon" /> Select CSV File
                </Button>
              </div>
            ) : (
              <div className="import-leads-button__data-wrap">


                <Tabs
                  items={[
                    {
                      key: 'raw',
                      label: 'Raw CSV Data',
                      children: (
                        <div className="import-leads-button__tab-panel">
                          <Table
                            columns={getTableColumns(csvColumns)}
                            dataSource={csvData.map((item, idx) => ({
                              key: idx,
                              ...item
                            }))}
                            pagination={{
                              pageSize: 10,
                              size: 'small',
                            }}
                            size="small"
                            scroll={{ x: 1500 }}
                          />
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </Spin>
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        title="Bulk Update Leads from CSV"
        open={isUpdateModalVisible}
        onCancel={() => {
          setIsUpdateModalVisible(false);
          setUpdateCsvData(null);
          setUpdateCsvColumns([]);
        }}
        width={1200}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setIsUpdateModalVisible(false);
              setUpdateCsvData(null);
              setUpdateCsvColumns([]);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="upload"
            type="default"
            onClick={() => updateFileInputRef.current?.click()}
            disabled={updateLeadsMutation.isLoading}
          >
            Choose CSV File
          </Button>,
          <Button
            key="update"
            type="primary"
            onClick={handleUpdate}
            loading={updateLeadsMutation.isLoading}
            disabled={!updateCsvData || updateCsvData.length === 0}
          >
            Update {updateCsvData && `(${updateCsvData.length} leads)`}
          </Button>,
        ]}
      >
        <Spin spinning={updateLeadsMutation.isLoading}>
          <div className="import-leads-button__modal-body">
            {!updateCsvData ? (
              <div className="import-leads-button__empty-state">
                <p className="import-leads-button__empty-text">
                  Upload a CSV file to bulk update leads
                </p>
                <Button
                  type="dashed"
                  size="large"
                  onClick={() => updateFileInputRef.current?.click()}
                  className="import-leads-button__select-btn"
                >
                  <UploadOutlined size="1em" className="app-icon" /> Select CSV File
                </Button>
              </div>
            ) : (
              <div className="import-leads-button__data-wrap">
                <div className="import-leads-button__success-banner">
                  <p className="import-leads-button__success-text">
                    ✓ CSV loaded successfully - {updateCsvData.length} leads ready to update
                  </p>
                </div>

                <Tabs
                  items={[
                    {
                      key: 'raw',
                      label: 'Raw CSV Data',
                      children: (
                        <div className="import-leads-button__tab-panel">
                          <Table
                            columns={getTableColumns(updateCsvColumns)}
                            dataSource={updateCsvData.map((item, idx) => ({
                              key: idx,
                              ...item
                            }))}
                            pagination={{
                              pageSize: 10,
                              size: 'small',
                            }}
                            size="small"
                            scroll={{ x: 1500 }}
                          />
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </Spin>
      </Modal>

      {/* Response Modal */}
      <Modal
        
        open={responseModalVisible}
        onCancel={() => setResponseModalVisible(false)}
        width={800}
        footer={[
          <Button 
            key="close" 
            type="primary"
            onClick={() => setResponseModalVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        {renderResponseContent()}
      </Modal>
    </>
  );
};

export default ImportLeadsButton;