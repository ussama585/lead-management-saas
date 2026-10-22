import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Input, Select, DatePicker, Upload, message, Tooltip } from 'antd';
import { Upload as UploadOutlined, FileImage as FileImageOutlined, Pencil as EditOutlined } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import dayjs from 'dayjs';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import { getProjectPaymentList, createProjectPayment, updateProjectPayment } from '../../../shared/services/headhunting.js';
import { currencyOptions } from '../../../shared/utils/countries.js';
import { formatCurrencyInput, unformatNumber } from '../../utils/projectFormNumbers.js';

const { Option } = Select;

const emptyPaymentForm = {
  payment_date: null,
  currency: null,
  amount: '',
  invoice: null,
  payment_proof: null,
};

export default function ProjectPayments() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const goBack = () => navigate(-1);

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [paymentModal, setPaymentModal] = useState({ visible: false, editingId: null });
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  const { data: paymentsData, isLoading } = useQuery(
    ['projectPaymentList', projectId, pagination.pageIndex, pagination.pageSize],
    () => getProjectPaymentList(projectId, pagination.pageIndex + 1, pagination.pageSize),
    { enabled: !!projectId, refetchOnWindowFocus: false }
  );

  const projectName = paymentsData?.results?.[0]?.project_name || '';

  const closePaymentModal = () => {
    setPaymentModal({ visible: false, editingId: null });
    setPaymentForm(emptyPaymentForm);
  };

  const createPaymentMutation = useMutation(
    (values) => createProjectPayment(values),
    {
      onSuccess: () => {
        message.success('Payment added successfully');
        closePaymentModal();
        queryClient.invalidateQueries(['projectPaymentList', projectId]);
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to add payment');
      },
    }
  );

  const updatePaymentMutation = useMutation(
    ({ id, values }) => updateProjectPayment(id, values),
    {
      onSuccess: () => {
        message.success('Payment updated successfully');
        closePaymentModal();
        queryClient.invalidateQueries(['projectPaymentList', projectId]);
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to update payment');
      },
    }
  );

  const openAddModal = () => {
    setPaymentForm(emptyPaymentForm);
    setPaymentModal({ visible: true, editingId: null });
  };

  const openEditModal = (record) => {
    setPaymentForm({
      payment_date: record.payment_date ? dayjs(record.payment_date) : null,
      currency: record.currency || null,
      amount: record.amount ? formatCurrencyInput(String(record.amount)) : '',
      invoice: null,
      payment_proof: null,
    });
    setPaymentModal({ visible: true, editingId: record.id });
  };

  const handleSubmitPayment = () => {
    if (!paymentForm.payment_date || !paymentForm.currency || !paymentForm.amount) {
      message.error('Payment date, currency and amount are required');
      return;
    }

    const values = {
      payment_date: paymentForm.payment_date.format('YYYY-MM-DD'),
      currency: paymentForm.currency,
      amount: unformatNumber(paymentForm.amount),
      invoice: paymentForm.invoice,
      payment_proof: paymentForm.payment_proof,
    };

    if (paymentModal.editingId) {
      updatePaymentMutation.mutate({ id: paymentModal.editingId, values });
    } else {
      createPaymentMutation.mutate({ project: projectId, ...values });
    }
  };

  const columns = useMemo(
    () => [
      {
        header: 'Payment Date',
        accessorKey: 'payment_date',
        Cell: ({ cell }) => {
          const val = cell.getValue();
          return <span>{val ? dayjs(val).format('DD MMM YYYY') : '-'}</span>;
        },
      },
      {
        header: 'Currency',
        accessorKey: 'currency',
      },
      {
        header: 'Amount',
        accessorKey: 'amount',
        Cell: ({ cell }) => {
          const val = cell.getValue();
          const num = Number(val);
          return <span>{isNaN(num) ? val : num.toLocaleString()}</span>;
        },
      },
      {
        header: 'Invoice',
        accessorKey: 'invoice',
        enableSorting: false,
        Cell: ({ cell }) => {
          const url = cell.getValue();
          return url ? (
            <Tooltip title="View Invoice">
              <FileImageOutlined size="1em" className="app-icon"
                style={{ fontSize: 18, color: '#3E6A9F', cursor: 'pointer' }}
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              />
            </Tooltip>
          ) : (
            <span>-</span>
          );
        },
      },
      {
        header: 'Payment Proof',
        accessorKey: 'payment_proof',
        enableSorting: false,
        Cell: ({ cell }) => {
          const url = cell.getValue();
          return url ? (
            <Tooltip title="View Payment Proof">
              <FileImageOutlined size="1em" className="app-icon"
                style={{ fontSize: 18, color: '#3E6A9F', cursor: 'pointer' }}
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              />
            </Tooltip>
          ) : (
            <span>-</span>
          );
        },
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        Cell: ({ cell }) => {
          const val = cell.getValue();
          return <span>{val ? dayjs(val).format('DD MMM YYYY, hh:mm A') : '-'}</span>;
        },
      },
      {
        header: 'Edit',
        accessorKey: 'edit',
        id: 'edit_action',
        enableSorting: false,
        size: 52,
        Cell: ({ row }) => (
          <Tooltip title="Edit Project">
            <EditOutlined size="1em"
              className={["app-icon", "table-icon-action table-icon-action--edit"].filter(Boolean).join(' ')}
              onClick={() => openEditModal(row.original)}
            />
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <>
      <BreadCrumb goBack={goBack} linkText={projectName ? `Payments - ${projectName}` : 'Project Payments'} />

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button
            type="primary"
            style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
            onClick={openAddModal}
          >
            Add Project
          </Button>
        </div>

        <NewTableComponent
          columns={columns}
          data={paymentsData?.results || []}
          totalCount={paymentsData?.count || 0}
          heading={`Payments ${paymentsData?.count ? `(${paymentsData.count})` : '(0)'}`}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          isLoading={isLoading}
          enableRowSelection={false}
        />
      </div>

      <Modal
        title={paymentModal.editingId ? 'Edit Payment' : 'Add Payment'}
        open={paymentModal.visible}
        onCancel={closePaymentModal}
        onOk={handleSubmitPayment}
        confirmLoading={createPaymentMutation.isLoading || updatePaymentMutation.isLoading}
        okText={paymentModal.editingId ? 'Save' : 'Add'}
        okButtonProps={{ style: { background: '#3E6A9F', borderColor: '#3E6A9F' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <div>
            <label className="form-label mb-1">Payment Date</label>
            <DatePicker
              style={{ width: '100%' }}
              value={paymentForm.payment_date}
              onChange={(date) => setPaymentForm((prev) => ({ ...prev, payment_date: date }))}
            />
          </div>

          <div>
            <label className="form-label mb-1">Currency</label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select currency"
              value={paymentForm.currency}
              onChange={(value) => setPaymentForm((prev) => ({ ...prev, currency: value }))}
            >
              {currencyOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="form-label mb-1">Amount</label>
            <Input
              placeholder="Enter amount"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm((prev) => ({ ...prev, amount: formatCurrencyInput(e.target.value) }))
              }
            />
          </div>

          <div>
            <label className="form-label mb-1">Invoice</label>
            <Upload
              accept="image/*,.pdf"
              maxCount={1}
              beforeUpload={() => false}
              fileList={paymentForm.invoice ? [{ uid: '-1', name: paymentForm.invoice.name, status: 'done' }] : []}
              onChange={(info) => setPaymentForm((prev) => ({ ...prev, invoice: info.fileList[0]?.originFileObj || null }))}
              onRemove={() => setPaymentForm((prev) => ({ ...prev, invoice: null }))}
            >
              <Button icon={<UploadOutlined size="1em" className="app-icon" />}>Select File</Button>
            </Upload>
          </div>

          <div>
            <label className="form-label mb-1">Payment Proof</label>
            <Upload
              accept="image/*,.pdf"
              maxCount={1}
              beforeUpload={() => false}
              fileList={paymentForm.payment_proof ? [{ uid: '-1', name: paymentForm.payment_proof.name, status: 'done' }] : []}
              onChange={(info) => setPaymentForm((prev) => ({ ...prev, payment_proof: info.fileList[0]?.originFileObj || null }))}
              onRemove={() => setPaymentForm((prev) => ({ ...prev, payment_proof: null }))}
            >
              <Button icon={<UploadOutlined size="1em" className="app-icon" />}>Select File</Button>
            </Upload>
          </div>
        </div>
      </Modal>
    </>
  );
}
