import { useEffect, useRef, useState } from 'react';
import { resendOtp, otpRetrySeconds, otpSecondsRemaining } from '../../shared/services/otp-resend-service.js';
import { otpErrorMessage } from '../../shared/utils/otp-error.js';

export default function useOtpResend({ open, email, onResent }) {
  const [deadline, setDeadline] = useState(0);
  const [remaining, setRemaining] = useState(60);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    generation.current += 1;
    inFlight.current = false;
    setPending(false);
    setRemaining(60);
    setDeadline(open ? Date.now() + 60000 : 0);
    setError('');
    return () => { generation.current += 1; };
  }, [open, email]);

  useEffect(() => {
    if (!open || !deadline) return;
    const update = () => setRemaining(otpSecondsRemaining(deadline));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [open, deadline]);

  async function resend() {
    if (!open || !email || !deadline || otpSecondsRemaining(deadline) > 0 || inFlight.current) return;
    const requestGeneration = generation.current;
    inFlight.current = true;
    setPending(true); setError('');
    try {
      const result = await resendOtp(email);
      if (generation.current !== requestGeneration) return;
      const seconds = Math.max(60, otpRetrySeconds(result));
      setDeadline(Date.now() + seconds * 1000); setRemaining(seconds);
      onResent?.(result);
    } catch (failure) {
      if (generation.current !== requestGeneration) return;
      setError(otpErrorMessage(failure) || 'Could not resend OTP. Please try again.');
      const seconds = otpRetrySeconds(failure, failure?.response?.status === 429 ? 60 : 0);
      if (seconds > 0) { setDeadline(Date.now() + seconds * 1000); setRemaining(seconds); }
    } finally {
      if (generation.current === requestGeneration) { inFlight.current = false; setPending(false); }
    }
  }

  return { resend, remaining, pending, error, canResend: Boolean(open && email && deadline && remaining === 0 && !pending) };
}
