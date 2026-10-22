/**
 * JobRemarksModal – Modal for viewing, adding, and editing job-level remarks
 * (project manager / job remarks). Fetches list by jobId, supports create and update.
 */
import React, { useState } from 'react';
import { Modal, List, Input, Button, message } from 'antd';
import { Pencil as EditOutlined } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  getJobRemarksList,
  createJobRemark,
  updateRemarksById,
} from '../pages/shared/services/project-manager-service.js';
import { formatDateUniversal } from '../pages/shared/utils/formatDate.js';

const { TextArea } = Input;

const JobRemarksModal = ({ visible, onClose, jobId, readOnly = false }) => {
  const queryClient = useQueryClient();

  // Local state: new remark input, and which existing remark is being edited
  const [newRemark, setNewRemark] = useState('');
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [editingRemarkText, setEditingRemarkText] = useState('');

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery(
    ['jobRemarks', jobId],
    () => getJobRemarksList(jobId),
    {
      enabled: visible && !!jobId,
      refetchOnWindowFocus: false,
    }
  );

  const remarks = data?.results || [];

  const invalidateRemarks = () => {
    queryClient.invalidateQueries(['jobRemarks', jobId]);
  };

  // Create a new remark for this job
  const createMutation = useMutation(
    (remarkText) => createJobRemark(jobId, remarkText),
    {
      onSuccess: () => {
        message.success('Remark added');
        setNewRemark('');
        invalidateRemarks();
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to add remark';
        message.error(errorMessage);
      },
    }
  );

  // Update an existing remark by id
  const updateMutation = useMutation(
    ({ id, remark }) => updateRemarksById(id, remark),
    {
      onSuccess: () => {
        message.success('Remark updated');
        setEditingRemarkId(null);
        setEditingRemarkText('');
        invalidateRemarks();
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to update remark';
        message.error(errorMessage);
      },
    }
  );

  // Submit new remark (validates non-empty, then create)
  const handleAddRemark = () => {
    if (!newRemark.trim()) {
      message.warning('Please enter a remark');
      return;
    }
    createMutation.mutate(newRemark.trim());
  };

  // Enter edit mode for an existing remark
  const handleStartEdit = (remark) => {
    setEditingRemarkId(remark.id);
    setEditingRemarkText(remark.remark || '');
  };

  // Save edited remark (validates non-empty, then update)
  const handleSaveEdit = () => {
    if (!editingRemarkText.trim()) {
      message.warning('Remark cannot be empty');
      return;
    }
    updateMutation.mutate({ id: editingRemarkId, remark: editingRemarkText.trim() });
  };

  // Close modal and reset local state; block close while mutations are in flight
  const handleClose = () => {
    if (createMutation.isLoading || updateMutation.isLoading) {
      return;
    }
    setNewRemark('');
    setEditingRemarkId(null);
    setEditingRemarkText('');
    onClose();
  };

  return (
    <Modal
      title="Job Remarks"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      {!readOnly && (
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 4,
              fontWeight: 500,
            }}
          >
            Add New Remark
          </label>
          <TextArea
            rows={3}
            value={newRemark}
            onChange={(e) => setNewRemark(e.target.value)}
            placeholder="Type a new remark for this job"
            maxLength={500}
            style={{ borderColor: '#3E6A9F' }}
          />
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={handleAddRemark}
              loading={createMutation.isLoading}
              className="custom-button"
              style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
            >
              Add Remark
            </Button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 8, fontWeight: 500 }}>
        Existing Remarks {isFetching || isLoading ? '(Loading...)' : ''}
      </div>

      <List
        bordered
        style={{ maxHeight: 300, overflowY: 'auto' }}
        locale={{ emptyText: 'No remarks yet for this job.' }}
        dataSource={remarks}
        renderItem={(item) => (
          <List.Item
            actions={readOnly ? [] : [
              editingRemarkId === item.id ? (
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
                <div>
                  <span>{formatDateUniversal(item?.created_at) || '—'}</span>
                  {item?.created_at && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        color: '#888',
                        fontWeight: 300,
                      }}
                    >
                      {(() => {
                        const d = new Date(item.created_at);
                        if (isNaN(d.getTime())) return '';
                        const h = d.getHours();
                        const m = d.getMinutes().toString().padStart(2, '0');
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const h12 = h % 12 || 12;
                        return `${h12}:${m} ${ampm}`;
                      })()}
                    </span>
                  )}
                  {item?.updated_at &&
                    item.updated_at !== item.created_at && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          color: '#888',
                          fontWeight: 400,
                        }}
                      >
                        {`(Edited: ${formatDateUniversal(
                          item.updated_at
                        )})`}
                      </span>
                    )}
                </div>
              }
              description={
                !readOnly && editingRemarkId === item.id ? (
                  <TextArea
                    rows={2}
                    value={editingRemarkText}
                    onChange={(e) => setEditingRemarkText(e.target.value)}
                  />
                ) : (
                  <span>{item.remark || ''}</span>
                )
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default JobRemarksModal;

