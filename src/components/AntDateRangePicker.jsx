import React from 'react';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function AntDateRangePicker({
  value,
  onChange,
  className = '',
  placeholder = ['Start date', 'End date']
}) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00A854',
          borderRadius: 6,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          colorBorder: '#D0D5DD',
          colorTextPlaceholder: '#98A2B3',
          controlHeight: 38
        }
      }}
    >
      <RangePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        format="DD/MM/YYYY"
        className={`ant-custom-range-picker ${className}`}
        style={{
          border: '1px solid #D0D5DD',
          borderRadius: '6px',
          padding: '6px 12px',
          boxShadow: 'none'
        }}
      />
    </ConfigProvider>
  );
}
