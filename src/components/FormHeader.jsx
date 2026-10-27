import { Input } from './ui/app-controls.jsx';
import React from 'react';
import { Row, Col } from 'antd';
import '../assets/styles/legacy/global.generated.css';

const FormHeader = ({
  formTitle,
  onTitleChange,
  errors,
  touched
}) => {
  return (
    <div className="mt-4 mb-4  bg-light rounded-3 border" style={{ borderColor: '#e9ecef' }}>
      <div className="text-center mb-4">
        <h2 className="mb-2 text-primary" style={{ fontSize: '24px', fontWeight: '600' }}>Form Builder</h2>
        <p className="mb-0 text-primary" style={{ fontSize: '14px', opacity: 0.8 }}>Create and customize your form questions</p>
      </div>

      <Row gutter={[16, 16]}>
        {/* Form Title */}
        <Col xs={24}>
          <div className="mb-3">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: '14px', color: '#3e6a9f' }}>
              Form Title <span className="text-danger">*</span>
            </label>
            <Input
              value={formTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              placeholder="Enter an engaging form title"
              className="antd-input styled-input"
              style={{
                fontSize: '14px',
                fontWeight: '400',
                borderRadius: '8px',
                border: errors?.formTitle && touched?.formTitle ? '2px solid #ff4d4f' : '2px solid #e9ecef',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
              onFocus={(e) => {
                if (!(errors?.formTitle && touched?.formTitle)) {
                  e.target.style.borderColor = '#3e6a9f';
                  e.target.style.boxShadow = '0 0 0 3px rgba(62, 106, 159, 0.1)';
                }
              }}
              onBlur={(e) => {
                if (!(errors?.formTitle && touched?.formTitle)) {
                  e.target.style.borderColor = '#e9ecef';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors?.formTitle && touched?.formTitle && (
              <div className="invalid-feedback" style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                {typeof errors.formTitle === 'string'
                  ? errors.formTitle
                  : errors.formTitle?.message || 'Invalid form title'}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default FormHeader;

