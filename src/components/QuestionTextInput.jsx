import React from 'react';

const QuestionTextInput = ({
  value,
  onChange,
  onBlur,
  placeholder = "What would you like to ask?",
  name,
  disabled = false,
  error = false,
  errorMessage,
  /** Google Forms–style title row: large underline, no label */
  variant = 'default',
}) => {
  if (variant === 'google') {
    return (
      <div className="gf-qcard-title-wrap">
        <input
          type="text"
          className="gf-qcard-title-input"
          value={value || ''}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          placeholder={placeholder}
          disabled={disabled}
          name={name}
          data-gf-title="1"
          aria-label="Question title"
          style={{
            width: '100%',
            border: 'none',
            borderBottom: error ? '2px solid #d93025' : '2px solid #e8eaed',
            borderRadius: 0,
            backgroundColor: 'transparent',
            fontSize: '16px',
            lineHeight: '24px',
            padding: '8px 0',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'text',
            color: '#202124',
            fontFamily: 'Inter, sans-serif',
          }}
          onFocus={(e) => {
            if (!disabled && !error) {
              e.target.style.borderBottomColor = '#1a73e8';
            }
          }}
          onBlur={(e) => {
            onBlur?.(e);
            if (!disabled && !error) {
              e.target.style.borderBottomColor = '#e8eaed';
            }
          }}
        />
        {error && errorMessage && (
          <div style={{ color: '#d93025', fontSize: '12px', marginTop: '4px' }}>
            {typeof errorMessage === 'string'
              ? errorMessage
              : errorMessage?.message || 'Invalid input'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '500',
        color: '#6B7280',
        marginBottom: '4px'
      }}>
        Question Text <span style={{ color: '#EF4444' }}>*</span>
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        style={{
          width: '100%',
          borderRadius: '6px',
          border: error ? '1px solid #EF4444' : '1px solid #D1D5DB',
          backgroundColor: '#FFFFFF',
          fontSize: '14px',
          padding: '8px 12px',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        }}
        onFocus={(e) => {
          if (!disabled && !error) {
            e.target.style.borderColor = '#3e6a9f';
            e.target.style.boxShadow = '0 0 0 3px rgba(62, 106, 159, 0.1)';
          }
        }}
        onBlur={(e) => {
          if (onBlur) {
            onBlur(e);
          }
          if (!disabled && !error) {
            e.target.style.borderColor = '#D1D5DB';
            e.target.style.boxShadow = 'none';
          }
        }}
      />
      {error && errorMessage && (
        <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>
          {typeof errorMessage === 'string'
            ? errorMessage
            : errorMessage?.message || 'Invalid input'}
        </div>
      )}
    </div>
  );
};

export default QuestionTextInput;

