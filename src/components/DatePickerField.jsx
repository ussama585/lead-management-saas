// src/components/DatePickerField.jsx
import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import './DatePickerField.css';

const DatePickerField = (props) => {
  const {
    label,
    name,
    value,
    onChange,
    onBlur,
    error,
    touched,
    placeholder,
    format,
    showTime = false,
    showTimeConfig, // e.g. { format: 'h:mm A', minuteStep: 15 } for 12-hour and 15-min steps
    style = {},
    disabledDate,
    disabled = false,
    allowClear = true,
    /** Avoid clipping inside Modal / overflow:hidden parents */
    getPopupContainer = () => document.body,
  } = props;

  const resolvedShowTime = showTimeConfig ?? (showTime ? true : false);

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label htmlFor={name} className="form-label text-start mt-3 mb-1">
          {label}
        </label>
      )}

      <DatePicker
        id={name}
        name={name}
        showTime={resolvedShowTime}
        format={format}
        placeholder={placeholder}
        value={value ? dayjs(value) : null}
        onChange={onChange}
        onBlur={onBlur}
        style={{ width: '100%', ...style }}
        disabledDate={disabledDate || (() => false)}
        disabled={disabled}
        allowClear={allowClear}
        popupClassName="date-picker-field-popup"
        getPopupContainer={getPopupContainer}
      />

      {error && touched && <div className="text-red">{error}</div>}
    </div>
  );
};

export default DatePickerField;
