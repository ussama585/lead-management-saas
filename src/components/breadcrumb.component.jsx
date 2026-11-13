import React from 'react';
import BackButton from './back-button.jsx';
export default function Breadcrumb({ goBack, linkText = 'View Users' }) {
  return <div className='mb-6 flex items-center gap-3'>
    {goBack && <BackButton onClick={goBack} />}
    <h1 className='text-2xl font-semibold tracking-tight'>{linkText}</h1>
  </div>;
}
