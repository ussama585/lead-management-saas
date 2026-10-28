import { message } from './ui/notifications.jsx';
import { Modal } from './ui/app-modal.jsx';
import { Input } from './ui/app-controls.jsx';
import { Button } from './ui/app-controls.jsx';
import React, { useState, useEffect } from 'react';
import { Form } from 'antd';
import { Pencil as EditOutlined } from 'lucide-react';
import api from '../pages/shared/services/api.js';
import { useMutation, useQueryClient } from 'react-query';

const LeadEditModal = ({
  lead,
  leadType,
  user,
  trigger = 'button',
  buttonProps = {},
  onSubmit,
  onSuccess,
  onBeforeOpen,
  freshLead,
  onClose,
}) => {
  const isMetaLead = leadType === 'Meta Lead';
  const [isVisible, setIsVisible] = useState(false);
  const [opening, setOpening] = useState(false);
  const leadToUse = freshLead ?? lead;
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const updateLeadMutation = useMutation(
    (values) => {
      if (typeof onSubmit === "function") {
        return onSubmit(values);
      }
      return api.patch(`/lead-generation/update/${leadToUse.id}`, values);
    },
    {
      onSuccess: async (...args) => {
        message.success('Lead information updated successfully');
        if (!onSubmit && leadToUse?.id) {
          queryClient.invalidateQueries(`lead-${leadToUse.id}`);
        }
        if (typeof onSuccess === "function") {
          const result = onSuccess(...args);
          if (result && typeof result.then === "function") {
            await result;
          }
        }
        setIsVisible(false);
        onClose?.();
      },
      onError: () => {
        message.error('Failed to update lead information');
      },
    }
  );

  useEffect(() => {
    if (isVisible && leadToUse) {
      form.setFieldsValue({
        contact_person_name: isMetaLead ? (leadToUse.full_name ?? leadToUse.contact_person_name ?? '') : (leadToUse.contact_person_name ?? leadToUse.full_name ?? ''),
        company_name: leadToUse.company_name ?? '',
        phone_number: leadToUse.phone_number ?? '',
        contact_person_designation: isMetaLead ? (leadToUse.job_title ?? leadToUse.contact_person_designation ?? leadToUse.designation ?? '') : (leadToUse.contact_person_designation ?? leadToUse.designation ?? leadToUse.job_title ?? ''),
        email: leadToUse.email ?? leadToUse.work_email ?? '',
      });
    }
  }, [isVisible, leadToUse, form, isMetaLead]);

  const handleSubmit = (values) => {
    updateLeadMutation.mutate(values);
  };

  const canEdit = user?.user_type === 'super_admin' || user?.user_type === 'sales_manager' || 
                 (user?.user_type === 'sales_executive' && user?.id === leadToUse?.assigned_to);

  if (!canEdit) {
    return null;
  }

  const {
    style: customButtonStyle = {},
    size: customButtonSize,
    onClick: customButtonOnClick,
    ...restButtonProps
  } = buttonProps || {};

  const handleTriggerClick = async (event) => {
    if (typeof customButtonOnClick === "function") {
      customButtonOnClick(event);
    }
    if (typeof onBeforeOpen === "function") {
      setOpening(true);
      try {
        const result = onBeforeOpen();
        if (result && typeof result.then === "function") {
          await result;
        }
      } finally {
        setOpening(false);
      }
    }
    setIsVisible(true);
  };

const TriggerComponent = trigger === 'icon' ? (
  <EditOutlined size="1em" className="app-icon" 
    style={{ cursor: 'pointer', color: '#3e6a9f', marginLeft: 8 }}
    onClick={handleTriggerClick}
  />
) : (
  <Button 
    icon={<EditOutlined size="1em" className="app-icon" />}
    size={customButtonSize || "small"}
    style={{ 
      backgroundColor: '#3e6a9f', 
      borderColor: '#3e6a9f', 
      color: 'white',
      ...customButtonStyle,
    }}
    onClick={handleTriggerClick}
    loading={opening}
    disabled={opening}
    {...restButtonProps}
  >
    Edit Lead
  </Button>
);

  return (
    <>
      {TriggerComponent}
      
      <Modal
        title="Edit Lead Information"
        open={isVisible}
        onCancel={() => {
          setIsVisible(false);
          onClose?.();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Contact Person Name"
            name="contact_person_name"
            rules={[{ required: true, message: 'Please enter contact person name' }]}
          >
            <Input placeholder="Enter contact person name" />
          </Form.Item>

          <Form.Item
            label="Company Name"
            name="company_name"
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone_number"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { pattern: /^[\+]?[0-9\s\-\(\)]+$/, message: 'Please enter a valid phone number' }
            ]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            label="Designation"
            name="contact_person_designation"
          >
            <Input placeholder="Enter designation" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Button 
              onClick={() => setIsVisible(false)} 
              style={{ marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button 
  type="primary" 
  htmlType="submit"
  loading={updateLeadMutation.isLoading}
  style={{ 
    backgroundColor: '#3e6a9f', 
    borderColor: '#3e6a9f' 
  }}
>
  Update Lead
</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default LeadEditModal;
