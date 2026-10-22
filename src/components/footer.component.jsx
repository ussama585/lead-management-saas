import React from 'react';
import { Layout, Typography, Space } from 'antd';

const { Footer } = Layout;

const AntFooter = () => {
  return (
    <Footer
      style={{
        backgroundColor: '#3E6A9F',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '20px 40px',
      }}
    >
      {/* Left Side Content */}
      <Typography.Text style={{ fontWeight: '500', color: 'white' }}>
        © 2024 Search O Pal
      </Typography.Text>

      {/* Right Side Content */}
      <Typography.Text style={{ fontWeight: '500', color: 'white' }}>
        A Product by{' '}
        <Typography.Link href="#" style={{ color: 'white', textDecoration: 'underline' }}>
          Simcoe IT
        </Typography.Link>
      </Typography.Text>
    </Footer>
  );
};

export default AntFooter;
