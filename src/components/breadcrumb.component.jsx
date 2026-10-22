import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button.jsx';
export default function Breadcrumb({ goBack, linkText = 'View Users' }) {
  return <div className='mb-6 flex items-center gap-3'>
    {goBack && <Button type='button' variant='outline' size='icon' aria-label='Go back' onClick={goBack}><ArrowLeft /></Button>}
    <h1 className='text-2xl font-semibold tracking-tight'>{linkText}</h1>
  </div>;
}
