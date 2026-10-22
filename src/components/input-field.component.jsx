import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';
import { cn } from './lib/utils.js';
export default function InputField({ type = 'text', ...props }) {
  const [visible, setVisible] = useState(false);
  return <div className='relative'>
    <Input {...props} type={type === 'password' && visible ? 'text' : type} className={cn(props.className, type === 'password' && 'pr-10')} />
    {type === 'password' && <Button type='button' variant='ghost' size='icon' className='absolute right-0 top-0' aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} disabled={props.disabled} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff /> : <Eye />}</Button>}
  </div>;
}
