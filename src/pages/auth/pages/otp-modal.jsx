import React, { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import OTPInput from 'react-otp-input';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { loginUser } from '@/pages/shared/services/auth-service.js';
import useUserStore from '@/pages/shared/store/user-store.js';
import { getRoleHome } from '../role-home.js';

export default function OtpModal({ openModal, setOpenModal, email, onSubmit, title = 'Check your email', description, submitText = 'Verify and continue' }) {
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const mutation = useMutation(async () => {
    if (onSubmit) return onSubmit(otp);
    return loginUser({ email, otp });
  }, { onSuccess: data => {
    if (!onSubmit) {
      const { name, email: address, phone, user_type, id, slug } = data;
      setUser({ name, email: address, phone, user_type, id, slug });
      navigate(getRoleHome(user_type) || '/', { replace: true });
    }
    setOpenModal(false);
  } });
  useEffect(() => { if (!openModal) { setOtp(''); mutation.reset(); } }, [openModal]);
  return <Dialog open={openModal} onOpenChange={value => !mutation.isLoading && setOpenModal(value)}><DialogContent>
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description || <>Enter the six digit verification code sent to {email}.</>}</DialogDescription></DialogHeader>
    <form onSubmit={event => { event.preventDefault(); if (/^\d{6}$/.test(otp)) mutation.mutate(); }} className='grid gap-6'>
      <OTPInput value={otp} onChange={setOtp} numInputs={6} inputType='tel' shouldAutoFocus containerStyle={{ display: 'flex', justifyContent: 'center', gap: 8 }} skipDefaultStyles renderInput={props => <Input {...props} aria-label={`Verification code digit ${props['aria-label'] || ''}`} className='h-12 w-10 px-2 text-center text-lg' disabled={mutation.isLoading} />} />
      {mutation.isError && <p role='alert' className='sop-field-error'>Verification failed. Check your code and try again.</p>}
      <Button type='submit' disabled={mutation.isLoading || !/^\d{6}$/.test(otp)}>{mutation.isLoading && <Loader2 className='size-4 animate-spin' />}{mutation.isLoading ? 'Verifying...' : submitText}</Button>
    </form>
  </DialogContent></Dialog>;
}
