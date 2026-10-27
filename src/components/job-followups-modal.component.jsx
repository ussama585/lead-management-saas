import { message } from './ui/notifications.jsx';
import { Modal } from './ui/app-modal.jsx';
import { Button } from './ui/app-controls.jsx';
import React, { useState, useEffect } from 'react';
import { List } from 'antd';
import { Pencil as EditOutlined } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  getJobFollowupsList,
  createJobFollowup,
  updateFollowupById,
} from '../pages/shared/services/project-manager-service.js';
import { formatDateUniversal } from '../pages/shared/utils/formatDate.js';
import DatePickerField from './DatePickerField.jsx';
import dayjs from 'dayjs';

const formatRelativeTime = (dateString) => {
  if (!dateString) return '—';
  
  const followupDate = dayjs(dateString);
  const now = dayjs();
  const diffMs = followupDate.diff(now);
  
  // If date is in the past
  if (diffMs < 0) {
    const absDiff = Math.abs(diffMs);
    const diffSeconds = Math.floor(absDiff / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    const remainingSeconds = diffSeconds % 60;
    const remainingMinutes = diffMinutes % 60;
    const remainingHours = diffHours % 24;
    
    const parts = [];
    
    if (diffDays > 0) {
      parts.push(`${diffDays} day${diffDays > 1 ? 's' : ''}`);
      // Don't show minutes when there are days
    } else if (diffHours > 0) {
      parts.push(`${diffHours} hour${diffHours > 1 ? 's' : ''}`);
      if (remainingMinutes > 0) {
        parts.push(`${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`);
      }
    } else if (diffMinutes > 0) {
      parts.push(`${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`);
      if (remainingSeconds > 0) {
        parts.push(`${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`);
      }
    } else {
      parts.push(`${diffSeconds} second${diffSeconds > 1 ? 's' : ''}`);
    }
    
    return parts.join(' and ') + ' ago';
  } 
  // If date is in the future
  else {
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    const remainingSeconds = diffSeconds % 60;
    const remainingMinutes = diffMinutes % 60;
    const remainingHours = diffHours % 24;
    
    const parts = [];
    
    if (diffDays > 0) {
      parts.push(`${diffDays} day${diffDays > 1 ? 's' : ''}`);
      // Don't show minutes when there are days
    } else if (diffHours > 0) {
      parts.push(`${diffHours} hour${diffHours > 1 ? 's' : ''}`);
      if (remainingMinutes > 0) {
        parts.push(`${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`);
      }
    } else if (diffMinutes > 0) {
      parts.push(`${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`);
      if (remainingSeconds > 0) {
        parts.push(`${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`);
      }
    } else {
      parts.push(`${diffSeconds} second${diffSeconds > 1 ? 's' : ''}`);
    }
    
    return parts.join(' and ') + ' remaining';
  }
};

const JobFollowupsModal = ({ visible, onClose, jobId }) => {
  const queryClient = useQueryClient();
  const [newFollowupDate, setNewFollowupDate] = useState(null); // ISO string or null
  const [editingFollowupId, setEditingFollowupId] = useState(null);
  const [editingFollowupDate, setEditingFollowupDate] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every minute to refresh relative time display
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [visible]);

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery(
    ['jobFollowups', jobId],
    () => getJobFollowupsList(jobId),
    {
      enabled: visible && !!jobId,
      refetchOnWindowFocus: false,
    }
  );

  const followups = data?.results || [];

  const invalidateFollowups = () => {
    queryClient.invalidateQueries(['jobFollowups', jobId]);
  };

  const createMutation = useMutation(
    (isoDate) => createJobFollowup(jobId, isoDate),
    {
      onSuccess: () => {
        message.success('Follow-up added');
        setNewFollowupDate(null);
        invalidateFollowups();
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to add follow-up';
        message.error(errorMessage);
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, followupDate }) => updateFollowupById(id, followupDate),
    {
      onSuccess: () => {
        message.success('Follow-up updated');
        setEditingFollowupId(null);
        setEditingFollowupDate(null);
        invalidateFollowups();
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to update follow-up';
        message.error(errorMessage);
      },
    }
  );

  const handleAddFollowup = () => {
    if (!newFollowupDate) {
      message.warning('Please select a follow-up date');
      return;
    }
    // newFollowupDate already stored as ISO string
    createMutation.mutate(newFollowupDate);
  };

  const handleStartEdit = (followup) => {
    setEditingFollowupId(followup.id);
    // Store as ISO/raw string; DatePickerField will convert with dayjs internally
    setEditingFollowupDate(followup.followup_date || null);
  };

  const handleSaveEdit = () => {
    if (!editingFollowupDate) {
      message.warning('Please select a follow-up date');
      return;
    }
    updateMutation.mutate({
      id: editingFollowupId,
      // editingFollowupDate is stored as ISO string
      followupDate: editingFollowupDate,
    });
  };

  const handleClose = () => {
    if (createMutation.isLoading || updateMutation.isLoading) {
      return;
    }
    setNewFollowupDate(null);
    setEditingFollowupId(null);
    setEditingFollowupDate(null);
    onClose();
  };

  return (
    <Modal
      title="Job Follow-ups"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'block',
            marginBottom: 4,
            fontWeight: 500,
          }}
        >
          Add New Follow-up
        </label>
        <DatePickerField
          name="new_followup"
          showTime
          showTimeConfig={{
            format: 'h:mm A',
            minuteStep: 15,
            use12Hours: true,
          }}
          value={newFollowupDate}
          onChange={(value) =>
            setNewFollowupDate(value ? value.toISOString() : null)
          }
          format={(value) =>
            value ? formatDateUniversal(value.toDate(), true) : ''
          }
        />
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button
            type="primary"
            onClick={handleAddFollowup}
            loading={createMutation.isLoading}
            className="custom-button"
            style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
          >
            Add Follow-up
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: 8, fontWeight: 500 }}>
        Existing Follow-ups {isFetching || isLoading ? '(Loading...)' : ''}
      </div>

      <List
        bordered
        style={{ maxHeight: 300, overflowY: 'auto' }}
        locale={{ emptyText: 'No follow-ups yet for this job.' }}
        dataSource={followups}
        renderItem={(item) => {
          const isPast = item?.followup_date ? dayjs(item.followup_date).isBefore(dayjs()) : false;
          const followupDate = item?.followup_date ? dayjs(item.followup_date) : null;
          const now = dayjs();
          const diffDays = followupDate ? Math.abs(followupDate.diff(now, 'day')) : 0;
          const showTime = diffDays < 1; // Show time only when less than 1 day
          
          return (
            <List.Item
              style={isPast ? { backgroundColor: '#f5f5f5' } : {}}
              actions={[
                editingFollowupId === item.id ? (
                  <Button
                    key="save"
                    type="link"
                    style={{ color: '#3E6A9F' }}
                    onClick={handleSaveEdit}
                    loading={updateMutation.isLoading}
                  >
                    Save
                  </Button>
                ) : (
                  <Button
                    key="edit"
                    type="link"
                    onClick={() => handleStartEdit(item)}
                    icon={<EditOutlined size="1em" className="app-icon" />}
                    style={{ color: '#3E6A9F' }}
                  >
                    Edit
                  </Button>
                ),
              ]}
            >
            <List.Item.Meta
              title={
                item?.followup_date ? (
                  <span>
                    {formatDateUniversal(item.followup_date, showTime)}
                    {' '}
                    <span style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>
                      ({formatRelativeTime(item.followup_date)})
                    </span>
                  </span>
                ) : '—'
              }
              description={
                editingFollowupId === item.id ? (
                  <DatePickerField
                    name={`edit_followup_${item.id}`}
                    showTime
                    showTimeConfig={{
                      format: 'h:mm A',
                      minuteStep: 15,
                      use12Hours: true,
                    }}
                    value={editingFollowupDate}
                    onChange={(value) =>
                      setEditingFollowupDate(
                        value ? value.toISOString() : null
                      )
                    }
                    format={(value) =>
                      value ? formatDateUniversal(value.toDate(), true) : ''
                    }
                  />
                ) : item?.updated_at && item.updated_at !== item.created_at ? (
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    Edited: {formatDateUniversal(item.updated_at, false)}
                  </div>
                ) : null
              }
            />
          </List.Item>
          );
        }}
      />
    </Modal>
  );
};

export default JobFollowupsModal;

