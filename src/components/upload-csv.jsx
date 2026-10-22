import React, { useState } from "react";
import { useMutation } from "react-query";
import { Button, message, Modal, Spin } from "antd";
import { uploadCSVFileData } from "../pages/shared/services/headhunting.js"
import { salesDataValidationSchema } from '../pages/shared/schemas/sales-data.js';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/upload-csv.css';

function UploadCSV() {
    const [data, setData] = useState([]);
    const [errors, setErrors] = useState([]);
    const [isValidating, setIsValidating] = useState(false);
    const [validationModalVisible, setValidationModalVisible] = useState(false);
    const [validationStats, setValidationStats] = useState({
        totalRows: 0,
        validRows: 0,
        invalidRows: 0
    });
    const [validData, setValidData] = useState([]);
    const [invalidData, setInvalidData] = useState([]);

    const handleFileUpload = async (e) => {
      setData([]);
      setErrors([]);
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
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        reader.readAsText(file);
        reader.onload = async (event) => {
          const workbook = XLSX.read(event.target.result, { type: 'string' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          setData(sheetData);
          await validateRows(sheetData);
        };
      } else {
        reader.readAsBinaryString(file);
        reader.onload = async (event) => {
          const workbook = XLSX.read(event.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          setData(sheetData);
          await validateRows(sheetData);
        };
      }
      e.target.value = null;
    };

    const validateRows = async (sheetData) => {
      if (!sheetData || sheetData.length < 2) {
        setErrors([]);
        setValidationStats({ totalRows: 0, validRows: 0, invalidRows: 0 });
        return;
      }
      
      setIsValidating(true);
      const headers = sheetData[0];
      const rowErrors = [];
      const validRows = [];
      const invalidRows = [];
      
      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        const obj = {};
        headers.forEach((header, idx) => {
          let value = row[idx];
          if (header === 'phone' && value !== undefined && value !== null) {
            value = String(value).trim();
          }
          obj[header] = value;
        });
        
        let cellErrors = {};
        try {
          await salesDataValidationSchema.validate(obj, { abortEarly: false });
          // If validation passes, add to valid rows
          validRows.push(row);
        } catch (err) {
          if (err.inner && err.inner.length > 0) {
            err.inner.forEach(e => {
              cellErrors[e.path] = e.message;
            });
          }
          // If validation fails, add to invalid rows
          invalidRows.push(row);
        }
        rowErrors.push(cellErrors);
      }
      
      setErrors(rowErrors);
      setValidData(validRows);
      setInvalidData(invalidRows);
      setValidationStats({
        totalRows: sheetData.length - 1, // Exclude header
        validRows: validRows.length,
        invalidRows: invalidRows.length
      });
      setIsValidating(false);
      setValidationModalVisible(true);
    };

    const handleUploadCSVFile = () => {
      if (validData.length > 0) {
        uploadFileData([data[0], ...validData]); // Include headers with valid data
      } else {
        message.warning("No valid data to upload.");
      }
    }

    const { mutate: uploadFileData, isLoading } = useMutation({
      mutationFn: uploadCSVFileData,
      onSuccess: (data) => {
        message.success("Data uploaded successfully.");
        setData([]);
        setErrors([]);
        setValidData([]);
        setInvalidData([]);
        setValidationModalVisible(false);
      },
      onError: (error) => {
        message.error("Error uploading data. Please try again.");
      },
    });

    const downloadInvalidData = async () => {
      if (invalidData.length === 0) {
        message.info("No invalid data to download.");
        return;
      }

      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([data[0], ...invalidData]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invalid Data");

      const fileName = `invalid_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      message.success("Invalid data downloaded successfully.");
    };

    function formatHeader(header) {
      return header
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    const hasInvalidRows = errors.some(e => Object.keys(e).length > 0);

    return (
      <>
      <div className="upload-csv__container">
        <input type="file" accept=".xls,.xlsx,.csv,text/csv" multiple={false} onChange={handleFileUpload} />

        {isValidating && (
          <div className="upload-csv__loading">
            <Spin size="large" />
            <div className="upload-csv__loading-text">Validating data...</div>
          </div>
        )}

        {data.length > 0 && !isValidating && (
          <>
          <div className="upload-csv__actions">
            <Button
              type='primary'
              onClick={handleUploadCSVFile}
              disabled={isLoading || validData.length === 0}
              className="upload-csv__upload-btn"
              loading={isLoading}
            >
              Upload Valid Data ({validData.length} rows)
            </Button>
            {invalidData.length > 0 && (
              <Button
                onClick={downloadInvalidData}
                className="upload-csv__download-invalid-btn"
              >
                Download Invalid Data ({invalidData.length} rows)
              </Button>
            )}
          </div>

          <div className="upload-csv__table-wrap">
            <table className="upload-csv__table">
            <thead>
              <tr>
                {data[0].map((header, idx) => (
                  <th key={idx}>
                    {formatHeader(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(1).map((row, rowIndex) => {
                const paddedRow = [...row];
                const cellErrors = errors[rowIndex] || {};
                const hasRowError = Object.keys(cellErrors).length > 0;
                return (
                  <tr key={rowIndex} className={hasRowError ? 'upload-csv__row--error' : ''}>
                    {paddedRow.map((cell, colIndex) => {
                      const header = data[0][colIndex];
                      const errorMsg = cellErrors[header];
                      return (
                        <td key={colIndex} className={errorMsg ? 'upload-csv__cell--error' : ''}>
                          {errorMsg ? errorMsg : cell}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <Modal
        title="Validation Results"
        open={validationModalVisible}
        onCancel={() => setValidationModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setValidationModalVisible(false)}>
            Close
          </Button>
        ]}
        width={500}
      >
        <div className="upload-csv__modal-body">
          <div className="upload-csv__modal-title">
            Data Validation Complete
          </div>
          <div className="upload-csv__stats-row">
            <div className="upload-csv__stat">
              <div className="upload-csv__stat-value upload-csv__stat-value--total">
                {validationStats.totalRows}
              </div>
              <div className="upload-csv__stat-label">Total Rows</div>
            </div>
            <div className="upload-csv__stat">
              <div className="upload-csv__stat-value upload-csv__stat-value--valid">
                {validationStats.validRows}
              </div>
              <div className="upload-csv__stat-label">Valid Rows</div>
            </div>
            <div className="upload-csv__stat">
              <div className="upload-csv__stat-value upload-csv__stat-value--invalid">
                {validationStats.invalidRows}
              </div>
              <div className="upload-csv__stat-label">Invalid Rows</div>
            </div>
          </div>
          {validationStats.invalidRows > 0 && (
            <div className="upload-csv__invalid-note">
              Invalid rows will be excluded from upload. You can download them separately.
            </div>
          )}
        </div>
      </Modal>
      </>
    )
}

export default UploadCSV;
