import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';
import '../../../assets/styles/legacy/not-found-page.css';

const NotFoundPage = () => {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you are looking for does not exist."
        extra={
          <Link to="/">
            <Button type="primary" className='home-button'>Back to Home</Button>
          </Link>
        }
      />
    </div>
  );
};

export default NotFoundPage;
