import { Modal } from '../../../components/ui/app-modal.jsx';
import { Input } from '../../../components/ui/app-controls.jsx';
import { Button } from '../../../components/ui/app-controls.jsx';
import { DatePicker } from 'antd';
import { useFormik } from 'formik';
import React from 'react'
import { targetSchema } from '../../shared/schemas/schema.js';
import { submitTargetData } from '../../shared/services/stats-service.js';
import { useMutation } from 'react-query';
import dayjs from 'dayjs';

const SetTargetModal = ({ isModalOpen, setIsModalOpen, refetchTargets }) => {

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onChange = (date, dateString) => {
    console.log(date, dateString);
    formik.setFieldValue('date', dateString)
  };

  const { mutate, isPending } = useMutation({
    mutationFn: submitTargetData,
    onSuccess: (res) => {
      refetchTargets()
      formik.resetForm();
      setIsModalOpen(false);
    },
    onError: (err) => {
      console.error("Submission failed", err.message);
    }
  });

  const formik = useFormik({
    initialValues: {
      date: '',
      candidates_reached: '',
    },
    validationSchema: targetSchema,
    onSubmit: (values) => {
      mutate(values);
    },
  });

  return (
    <Modal
      title="Set Target"
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
    >
      <form onSubmit={formik.handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Date</label>
          <DatePicker
            style={{ width: '100%' }}
            onChange={onChange}
            value={formik.values.date ? dayjs(formik.values.date) : null}
          />
          {formik.errors.date && <div style={{ color: 'red' }}>{formik.errors.date}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>No. of Candidates Reached</label>
          <Input
            className="no-spinner"
            type="number"
            name="candidates_reached"
            placeholder="Candidates Reached"
            value={formik.values.candidates_reached}
            onChange={(e) => formik.setFieldValue('candidates_reached', e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
          {formik.errors.candidates_reached && (
            <div style={{ color: 'red' }}>{formik.errors.candidates_reached}</div>
          )}
        </div>

        <Button className='createUserBtn' type="primary" htmlType="submit" loading={isPending} block>
          Submit
        </Button>
      </form>
    </Modal>
  )
}

export default SetTargetModal