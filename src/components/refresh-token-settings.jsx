import React, { useState } from 'react';
import { Alert, Button, Card } from 'antd';
import { RefreshCw } from 'lucide-react';
import { useMutation } from 'react-query';
import api, { storeRefreshedTokens } from '../pages/shared/services/api.js';

export async function refreshSession() {
  const token = localStorage.getItem('refresh_token');
  if (!token || token === 'null' || token === 'undefined') throw new Error('No refresh token is available. Please sign in again.');
  const body = new FormData();
  body.append('refresh', token);
  const { data } = await api.post('/accounts/token/refresh', body, { skipTokenRefresh: true });
  storeRefreshedTokens(data);
}

export default function RefreshTokenSettings() {
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const refresh = useMutation(refreshSession, { onSuccess: () => setLastRefreshed(new Date()) });
  return <Card title='Refresh Token'>
    <p className='mb-4 text-sm text-muted-foreground'>Renew your current session using the refresh token saved when you signed in.</p>
    <Button type='primary' icon={<RefreshCw size={16} />} loading={refresh.isLoading} onClick={() => refresh.mutate()}>Refresh session</Button>
    {refresh.isSuccess && <Alert className='mt-4' type='success' showIcon message='Session refreshed successfully.' description={lastRefreshed ? `Last refreshed at ${lastRefreshed.toLocaleTimeString()}` : undefined} />}
    {refresh.isError && <Alert className='mt-4' type='error' showIcon message={refresh.error?.response?.data?.message || refresh.error?.response?.data?.detail || refresh.error?.message || 'Could not refresh the session. Please sign in again.'} />}
  </Card>;
}
