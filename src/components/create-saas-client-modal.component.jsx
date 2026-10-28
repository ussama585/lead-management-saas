import ManualLocationInput from './manual-location-input.jsx';
import { message } from './ui/notifications.jsx';
import { Modal } from './ui/app-modal.jsx';
import { Select } from './ui/app-select.jsx';
import { Input } from './ui/app-controls.jsx';
import { Button } from './ui/app-controls.jsx';
import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getClientDetails, createSaasClient } from '../pages/shared/services/headhunting.js';
import { countriesNames } from '../pages/shared/utils/countries.js';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/create-saas-client-modal.component.css';

/**
 * Props:
 *   open        — boolean
 *   clientId    — number | string
 *   onClose     — () => void
 *   onSuccess   — (response) => void  (optional, called after successful creation)
 */
const CreateSaasClientModal = ({ open, clientId, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ city: null, country: null });
  const [errorMsg, setErrorMsg] = useState(null);

  const { data: clientDetail, isLoading: loadingDetail } = useQuery(
    ['saasClientDetails', clientId],
    () => getClientDetails(clientId),
    {
      enabled: open && !!clientId,
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (!clientDetail) return;
    setForm({
      city: clientDetail.city || null,
      country: clientDetail.country || null,
    });
  }, [clientDetail]);

  const createMutation = useMutation(
    ({ clientId, city, country }) => createSaasClient(clientId, { city, country }),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Job Portal client created successfully');
        queryClient.invalidateQueries(['clientDetails', clientId]);
        queryClient.invalidateQueries('headhuntingClients');
        queryClient.invalidateQueries('headhuntingClientCounts');
        handleClose();
        onSuccess?.(response);
      },
      onError: (error) => {
        const errMsg =
          error?.message ||
          error?.details?.message ||
          (typeof error === 'string' ? error : 'Failed to create Job Portal client');
        setErrorMsg(errMsg);
      },
    }
  );

  const handleClose = useCallback(() => {
    setForm({ city: null, country: null });
    setErrorMsg(null);
    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (!clientId) return;
    if (!form.city || !form.country) {
      setErrorMsg('City and country are required');
      return;
    }
    setErrorMsg(null);
    createMutation.mutate({ clientId, city: form.city, country: form.country });
  }, [clientId, form.city, form.country, createMutation]);

  return (
    <Modal
      title="Job Portal Client"
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={createMutation.isLoading}>
          Cancel
        </Button>,
        <Button
          key="create"
          type="primary"
          onClick={handleConfirm}
          loading={createMutation.isLoading}
          disabled={loadingDetail}
          className="saas-client-modal__create-btn"
        >
          Create Client
        </Button>,
      ]}
      centered
      destroyOnClose
    >
      {loadingDetail ? (
        <div className="saas-client-modal__loading">
          <LoadingOutlined size="1em"  className={["app-icon app-icon-spin", "saas-client-modal__loading-icon"].filter(Boolean).join(' ')} />
          <div className="saas-client-modal__loading-text">Loading client details...</div>
        </div>
      ) : (
        <>
          <p className="saas-client-modal__intro">
            Review the client details below before creating a Job Portal client.
          </p>
          {errorMsg && (
            <Alert
              type="error"
              message={errorMsg}
              showIcon
              closable
              onClose={() => setErrorMsg(null)}
              className="saas-client-modal__alert"
            />
          )}
          <div className="saas-client-modal__field">
            <label className="form-label text-start mb-1 saas-client-modal__field-label">Name</label>
            <Input
              value={clientDetail?.company_name || clientDetail?.contact_person_name || clientDetail?.name || ''}
              disabled
            />
          </div>
          <div className="saas-client-modal__field">
            <label className="form-label text-start mb-1 saas-client-modal__field-label">Email</label>
            <Input value={clientDetail?.email || ''} disabled />
          </div>
          <div className="saas-client-modal__field">
            <label className="form-label text-start mb-1 saas-client-modal__field-label">Phone</label>
            <Input value={clientDetail?.phone_number || clientDetail?.phone || ''} disabled />
          </div>
          <div className="saas-client-modal__field">
            <label className="form-label text-start mb-1 saas-client-modal__field-label">City<sup>*</sup></label>
            <ManualLocationInput
              className="antd-input dropdown saas-client-modal__select-full"
              placeholder="Select City"
              value={form.city || undefined}
              showSearch
              allowClear
              onChange={(value) => setForm((prev) => ({ ...prev, city: value || null }))}
            />
          </div>
          <div>
            <label className="form-label text-start mb-1 saas-client-modal__field-label">Country<sup>*</sup></label>
            <ManualLocationInput
              className="antd-input dropdown saas-client-modal__select-full"
              placeholder="Select Country"
              value={form.country || undefined}
              showSearch
              allowClear
              onChange={(value) => setForm((prev) => ({ ...prev, country: value || null }))}
            />
          </div>
        </>
      )}
    </Modal>
  );
};

export default CreateSaasClientModal;
