import React from 'react';
import { Modal, Checkbox, Input, Button, Spin, Empty } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { useFormik } from 'formik';
import { useQuery, useQueryClient } from 'react-query';
import dayjs from 'dayjs';
import { followUpModalSchema } from '../pages/shared/schemas/follow-up.js';
import DatePickerField from './DatePickerField.jsx';
import api from '../pages/shared/services/api.js';
import '../assets/styles/legacy/follow-up-modal.css';

const THEME_COLOR = '#3E6A9F';
const UTC_PLUS_FIVE_TZ = 'Asia/Karachi';

const getPartsInUtcPlusFive = (raw) => {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: UTC_PLUS_FIVE_TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);

  const pick = (type) => parts.find((p) => p.type === type)?.value || '';
  return {
    month: pick('month'),
    day: pick('day'),
    year: pick('year'),
    hour: pick('hour'),
    minute: pick('minute'),
    dayPeriod: pick('dayPeriod'),
  };
};

const formatBackendDateTimeUtcPlusFive = (raw) => {
  const parts = getPartsInUtcPlusFive(raw);
  if (!parts) return '-';
  return `${parts.hour}:${parts.minute} ${parts.dayPeriod}, ${parts.month} ${parts.day}, ${parts.year}`;
};

const formatBackendDateUtcPlusFive = (raw) => {
  const parts = getPartsInUtcPlusFive(raw);
  if (!parts) return '-';
  return `${parts.month} ${parts.day}, ${parts.year}`;
};

const formatBackendTimeUtcPlusFive = (raw) => {
  const parts = getPartsInUtcPlusFive(raw);
  if (!parts) return '-';
  return `${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
};

const getNextFollowUpDateTimePartsUtcPlusFive = (row) => {
  const required = !!row?.is_next_followup_required;
  if (!required) return { dateText: 'Not Required', timeText: '-' };

  const nextDateRaw = row?.next_followup_date;
  const explicitTime =
    row?.next_followup_time_only ??
    row?.next_followup_time ??
    row?.next_followup_time_str;

  const dateText = nextDateRaw ? formatBackendDateUtcPlusFive(nextDateRaw) : '-';

  if (explicitTime != null && String(explicitTime).trim() !== '') {
    const explicit = String(explicitTime).trim();
    if (/[ap]m\b/i.test(explicit)) {
      return { dateText, timeText: explicit };
    }

    const datePrefix = nextDateRaw && String(nextDateRaw).includes('T')
      ? String(nextDateRaw).split('T')[0]
      : String(nextDateRaw || '').slice(0, 10);
    const isoCandidate = /^\d{4}-\d{2}-\d{2}$/.test(datePrefix)
      ? `${datePrefix}T${explicit.length === 5 ? `${explicit}:00` : explicit}`
      : explicit;
    return { dateText, timeText: formatBackendTimeUtcPlusFive(isoCandidate) || explicit };
  }

  return { dateText, timeText: formatBackendTimeUtcPlusFive(nextDateRaw) };
};

const FollowUpModal = ({ open, onClose, lead, onSubmit, leadType = 'website', readOnlyMode = false }) => {
  const leadId = lead?.id ?? lead?.object_id ?? lead?.lead_id ?? null;
  const queryClient = useQueryClient();

  const initialValues = {
    addFollowUp: false,
    remarks: '',
    followUpDate: null,
  };

  const formik = useFormik({
    initialValues,
    validationSchema: followUpModalSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      if (readOnlyMode) {
        resetForm({ values: initialValues });
        onClose?.();
        return;
      }

      setSubmitting(true);
      try {
        if (onSubmit) {
          const maybePromise = onSubmit(values, lead);
          if (maybePromise != null && typeof maybePromise.then === 'function') {
            const outcome = await maybePromise;
            if (outcome === false) return;
          }
        }

        resetForm({ values: initialValues });

        await queryClient.refetchQueries(['leadFollowUpListing', leadType, leadId], {
          active: true,
        });
      } catch {
        // Errors surfaced by parent mutation onError / toast
      } finally {
        setSubmitting(false);
      }
    },
  });

  const closeModal = () => {
    formik.resetForm({ values: initialValues });
    onClose?.();
  };

  const { data: followUpListingData, isLoading: loadingFollowUpListing } = useQuery(
    ['leadFollowUpListing', leadType, leadId],
    async () => {
      const source = leadType === 'meta' ? 'meta' : leadType === 'data' ? 'data' : 'website';
      const response = await api.get(`/followups-list/${leadId}/${source}`);
      return response.data;
    },
    {
      enabled: open && Boolean(leadId),
      refetchOnWindowFocus: false,
    },
  );

  const followUpRows = React.useMemo(() => {
    const rows = Array.isArray(followUpListingData?.results)
      ? followUpListingData.results
      : Array.isArray(followUpListingData)
        ? followUpListingData
        : [];
    const currentLeadId = String(leadId ?? '');

    return rows
      .filter((row) => {
        if (leadType === 'meta' || leadType === 'data' || leadType === 'website') return true;
        return String(row?.object_id ?? row?.lead_id ?? '') === currentLeadId;
      })
      .map((row) => {
        const nextParts = getNextFollowUpDateTimePartsUtcPlusFive(row);
        return {
          id: row?.id,
          isNextFollowupRequired: !!row?.is_next_followup_required,
          currentFollowupDate: row?.current_followup_date
            ? formatBackendDateTimeUtcPlusFive(row.current_followup_date)
            : '-',
          nextFollowupDate: nextParts.dateText,
          nextFollowupTime: nextParts.timeText,
          remarks: row?.remarks || '-',
        };
      });
  }, [followUpListingData, leadId, leadType]);

  return (
    <Modal
      title="Follow Ups and Remarks"
      open={open}
      onCancel={closeModal}
      footer={null}
      width={500}
      destroyOnClose={false}
      centered={false}
      style={{ top: 'max(24px, 6vh)' }}
      maskClosable={!formik.isSubmitting}
    >
      <form
        className="follow-up-theme"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          formik.handleSubmit(e);
        }}
      >
        <DatePickerField
          label="Follow-up Date"
          name="currentDate"
          value={new Date()}
          disabled
          allowClear={false}
          showTime
          showTimeConfig={{ format: 'h:mm A', minuteStep: 5, use12Hours: true }}
          format="DD MMM YYYY h:mm A"
        />

        <div style={{ marginBottom: 12 }}>
          <Checkbox
            className="follow-up-theme-checkbox"
            checked={formik.values.addFollowUp}
            disabled={readOnlyMode}
            onChange={(e) => {
              formik.setFieldValue('addFollowUp', e.target.checked);
              formik.setFieldTouched('addFollowUp', true, false);
            }}
            style={{ color: THEME_COLOR }}
          >
            Next Follow-up not required
          </Checkbox>
        </div>

        {!formik.values.addFollowUp ? (
          <DatePickerField
            label="Next Follow-up"
            name="followUpDate"
            value={formik.values.followUpDate}
            onChange={(value) => formik.setFieldValue('followUpDate', value ? value.toDate() : null)}
            onBlur={() => formik.setFieldTouched('followUpDate', true, true)}
            disabled={readOnlyMode}
            showTime
            showTimeConfig={{ format: 'h:mm A', minuteStep: 5, use12Hours: true }}
            format="DD MMM YYYY h:mm A"
            disabledDate={(current) => current && current.startOf('day').isBefore(dayjs().startOf('day'))}
            error={formik.errors.followUpDate}
            touched={formik.touched.followUpDate}
          />
        ) : null}

        <div style={{ marginBottom: 8 }}>
          <Input.TextArea
            rows={4}
            placeholder="Enter remarks"
            value={formik.values.remarks}
            disabled={readOnlyMode}
            onChange={(e) => formik.setFieldValue('remarks', e.target.value)}
            onBlur={() => formik.setFieldTouched('remarks', true, true)}
          />
          {formik.touched.remarks && formik.errors.remarks ? (
            <div className="text-red">{formik.errors.remarks}</div>
          ) : null}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, color: THEME_COLOR, marginBottom: 8 }}>
            Follow-ups Listing
          </div>
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              maxHeight: 180,
              overflowY: 'auto',
              padding: 10,
              backgroundColor: '#fafafa',
            }}
          >
            {loadingFollowUpListing ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="small" />
              </div>
            ) : followUpRows.length > 0 ? (
              followUpRows.map((item, index) => (
                <div
                  key={item.id || `${index}-${item.currentFollowupDate}`}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: 8,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#595959' }}>
                    <strong>Last Follow-up:</strong> {item.currentFollowupDate}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>
                    <strong>Next Follow-up Required:</strong> {item.isNextFollowupRequired ? 'Yes' : 'Not Required'}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>
                    <strong>Next Follow-up Date:</strong> {item.nextFollowupDate}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>
                    <strong>Next Follow-up Time:</strong> {item.nextFollowupTime}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>
                    <strong>Old Remarks:</strong> {item.remarks}
                  </div>
                </div>
              ))
            ) : (
              <Empty description="No follow-ups found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {readOnlyMode ? (
            <Button className="default-btn-look" onClick={closeModal}>Close</Button>
          ) : (
            <>
              <Button className="default-btn-look" onClick={closeModal}>Close</Button>
              <Button
                className="project-button"
                type="primary"
                htmlType="button"
                loading={formik.isSubmitting}
                style={{ backgroundColor: THEME_COLOR, borderColor: THEME_COLOR }}
                onClick={() => formik.submitForm()}
              >
                Save
              </Button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default FollowUpModal;
