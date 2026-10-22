import React from 'react';
import { DatePicker, Button } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const DateRangeFilter = ({ dateRange, onChange, onClear }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
    <RangePicker
      value={dateRange}
      onChange={onChange}
      format="MMM DD, YYYY"
      allowClear
      style={{ borderColor: '#3e6a9f' }}
    />
    {dateRange && (
      <Button
        size="small"
        onClick={onClear}
        style={{ borderColor: '#3e6a9f', color: '#3e6a9f' }}
      >
        Clear
      </Button>
    )}
  </div>
);

export const filterByDateRange = (rows, dateRange) => {
  if (!dateRange || !dateRange[0] || !dateRange[1]) return rows;
  const start = dateRange[0].startOf('day');
  const end = dateRange[1].endOf('day');
  return rows.filter((r) => {
    if (!r.date) return false;
    const d = dayjs(r.date);
    return d.isAfter(start) || d.isSame(start) ? d.isBefore(end) || d.isSame(end) : false;
  });
};

export default DateRangeFilter;
