import { message } from './ui/notifications.jsx';
import { Modal } from './ui/app-modal.jsx';
import { Input } from './ui/app-controls.jsx';
import { Button } from './ui/app-controls.jsx';
import React, { useState, useEffect } from 'react';
import { Typography } from 'antd';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../pages/shared/services/api.js';
import { API_URL } from '../pages/shared/utils/api.js';
import "../assets/styles/legacy/sales-data.generated.css";
import useUserStore from '../pages/shared/store/user-store.js';

const { Text } = Typography;

function ShowRemarksHeadhunting({ id, setIdForRemarks, showRemarksModal, setShowRemarksModal, addedById, setAddedById, onRemarksSaved }) {

  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [remarksValue, setRemarksValue] = useState('');
  const [remarksError, setRemarksError] = useState('');

  const getData = async () => {
    const endpoint = `/headhunting/update-client/${id}`;
    const response = await api.get(endpoint);
    return response.data;
  };

  const { data, isLoading: loadingRemarks } = useQuery({
    queryKey: ['getHeadhuntingRemarks', id], // include id for scoped caching
    queryFn: getData,
    enabled: !!id,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data?.remarks !== undefined) {
      setRemarksValue(data.remarks || '');
    }
  }, [data]);

  const updateRemarks = async ({ id, value }) => {
    const response = await api.patch(`/headhunting/update-client/${id}`, {
      remarks: value,
    });
    return response.data;
  };

  const { mutate: mutateRemarks, isLoading: isSaving } = useMutation({
    mutationFn: ({ id, value }) => updateRemarks({ id, value }),
    onSuccess: () => {
      message.success('Remarks saved successfully.');
      queryClient.invalidateQueries(['getHeadhuntingRemarks', id]);
      
      // Call the callback if provided
      if (onRemarksSaved) {
        onRemarksSaved();
      }
    },
    onError: () => {
      message.error('Error saving remarks. Please try again.');
    },
  });

  const handleClose = () => {
    setShowRemarksModal(false);
    setIdForRemarks('');
    setAddedById('');
    setRemarksError(''); // Clear error when modal is closed
  };

  const handleSave = () => {
    // Clear previous errors
    setRemarksError('');
    
    // Validate remarks is not empty
    if (!remarksValue || remarksValue.trim() === '') {
      setRemarksError('Remarks cannot be empty');
      return;
    }
    
    mutateRemarks({ id, value: remarksValue });
  };

  return (
    <Modal
      className="sales-data"
      open={showRemarksModal}
      onCancel={handleClose}
      title="Remarks"
      centered
     footer={[
  !(user.user_type === 'recruitment_manager' || user.user_type === 'recruitment_executive' || user.user_type === 'project_manager') && (
    <Button
      className="custom-button"
      key="save"
      onClick={handleSave}
      disabled={isSaving}
      style={{ background: '#3E6A9F', color: '#fff', border: 'none' }}
    >
      {isSaving ? 'Saving...' : 'Save'}
    </Button>
  ),
  <Button key="close" onClick={handleClose} disabled={isSaving}>
    Close
  </Button>
]}

    >
      <Input.TextArea
        value={remarksValue}
        onChange={(e) => {
          setRemarksValue(e.target.value);
          // Clear error when user starts typing
          if (remarksError) setRemarksError('');
        }}
        autoSize={{ minRows: 3 }}
        placeholder={"Enter remarks here..." }
        style={{color:'#000', borderColor: "#000"}}
        status={remarksError ? 'error' : ''}
      />
      {remarksError && (
        <div style={{ color: '#ff4d4f', fontSize: '14px', marginTop: '8px' }}>
          {remarksError}
        </div>
      )}
    </Modal>
  );
}

export default ShowRemarksHeadhunting; 
