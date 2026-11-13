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
import { otpErrorMessage } from '../../shared/utils/otp-error.js';
import useOtpResend from '../hooks/use-otp-resend.js';
import { message } from '@/components/ui/notifications.jsx';

export default function OtpModal({ openModal, setOpenModal, email, onSubmit, title = 'Check your email', description, submitText = 'Verify and continue' }) {
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const mutation = useMutation(async () => {
    if (onSubmit) return onSubmit(otp);
    return loginUser({ email, otp });
  }, { onSuccess: data => {
    if (!onSubmit) {
      setUser(data);
      navigate(getRoleHome(data.user_type) || '/', { replace: true });
    }
    setOpenModal(false);
  } });
  const resend = useOtpResend({ open: openModal, email: email || user?.email, onResent: result => {
    setOtp(''); mutation.reset();
    message.success(result?.message || 'A new OTP has been sent to your email.');
  } });
  const busy = mutation.isLoading || resend.pending;
  useEffect(() => { if (!openModal) { setOtp(''); mutation.reset(); } }, [openModal]);
  return <Dialog open={openModal} onOpenChange={value => !busy && setOpenModal(value)}><DialogContent>
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description || <>Enter the six digit verification code sent to {email}.</>}</DialogDescription></DialogHeader>
    <form onSubmit={event => { event.preventDefault(); if (!busy && /^\d{6}$/.test(otp)) mutation.mutate(); }} className='grid gap-6'>
      <OTPInput value={otp} onChange={setOtp} numInputs={6} inputType='tel' shouldAutoFocus containerStyle={{ display: 'flex', justifyContent: 'center', gap: 8 }} skipDefaultStyles renderInput={props => <Input {...props} placeholder="0" aria-label={`Verification code digit ${props['aria-label'] || ''}`} className='h-12 w-10 px-2 text-center text-lg' disabled={busy} />} />
      {mutation.isError && <p role='alert' className='sop-field-error'>{otpErrorMessage(mutation.error)}</p>}
      <Button type='submit' disabled={busy || !/^\d{6}$/.test(otp)}>{mutation.isLoading && <Loader2 className='size-4 animate-spin' />}{mutation.isLoading ? 'Verifying...' : submitText}</Button>
    </form>
    {(email || user?.email) && <div className="mt-2 flex flex-col items-end gap-2 text-right text-sm">
      <button type="button" className="text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: 'transparent', border: 0, padding: 0, boxShadow: 'none' }}
        disabled={!resend.canResend || mutation.isLoading} onClick={resend.resend}>
        {resend.pending ? 'Resending OTP...' : resend.remaining > 0 ? `Resend OTP in ${resend.remaining}s` : 'Resend OTP'}
      </button>
      {resend.error && <p role="alert" className="sop-field-error">{resend.error}</p>}
    </div>}
  </DialogContent></Dialog>;
}
