import React from 'react';
import { Select } from 'antd';

/**
 * Reusable status select dropdown
 */
const DEFAULT_STYLE = { width: 'fit-content' };

const StatusSelect = ({
  value,
  options,
  onChange,
  disabled = false,
  style = DEFAULT_STYLE,
  className,
}) => (
  <Select
    value={value}
    className={className}
    style={style}
    onChange={onChange}
    popupMatchSelectWidth={false}
    disabled={disabled}
    placeholder="Select Status"
  >
    {options.map((opt) => (
      <Select.Option key={opt.key ?? opt.value} value={opt.value}>
        {opt.label}
      </Select.Option>
    ))}
  </Select>
);

export default StatusSelect;

