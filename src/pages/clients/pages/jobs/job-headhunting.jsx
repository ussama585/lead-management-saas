import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Table, Button, Upload, message, Modal, Input, Select, Row, Col, Tooltip, Spin, DatePicker, Tabs, Divider, Popconfirm, Pagination, Switch } from 'antd';
import dayjs from 'dayjs';
import { MessageSquare as MessageOutlined, MessageCircle as CommentOutlined, MessageCircle as WhatsAppOutlined, Link as LinkOutlined, Share2 as ShareAltOutlined, FileText as FilePdfOutlined, Clock as ClockCircleOutlined, History as HistoryOutlined, User as UserOutlined } from 'lucide-react';
import ProfileImagePlaceholder from '../../../../assets/images/user-card-icons/user-placeholder.svg';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { Upload as UploadOutlined, Plus as PlusOutlined, Pencil as EditOutlined, LoaderCircle as LoadingOutlined, Trash2 as DeleteOutlined } from 'lucide-react';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import { formatSalaryNum } from '../../../shared/utils/formatters.js';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  createHeadhuntingBatch,
  getJobResumeBatchList,
  addResumes,
  getJobDetails,
  updateResumeStatusFormData,
  getClientDetails,
  updateHeadhuntingClientJSON,
  updateJob,
  getAvailableScreenings,
  updateJobScreeningForm,
  generateScreeningFormLink,
  getPublicResumeList,
  getJobScreeningResponses,
  publicResumeShare,
  jobResumeShare,
  getJobResumeHistoryTrack,
  getJobBatchesList,
  shiftPublicResumeToBatch,
  deleteBatchResume,
  addPublicResume,
  deleteBatch,
  getSaasJobApplications,
  getSaasApplicantCv,
  getSaasApplicantProfile,
  shiftSaasApplicationToPublicCv,
  updateScreeningResponse,
  getProjectInformation,
  updateBatchResumeName,
  updatePublicResumeName,
  getRecruiterScreeningForm,
  submitRecruiterScreeningForm,
} from '../../../shared/services/headhunting.js';
import { ShareModal, ConfirmationModal, ShowRemarksLead } from '../../components/LazyModals.jsx';
import RemarksModal from '../../components/RemarksModal.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import { API_URL } from '../../../shared/utils/api.js';
import '../../../../assets/styles/legacy/project-detail-page.css';
import '../../../../assets/styles/legacy/job-headhunting-page.css';
import ProjectDetailCard from '../../../../components/project-detail-card.component.jsx';
import JobDetailsStatsCard from '../../../../components/job-details-stats-card.jsx';
import StatusHistoryModal from '../../../../components/status-history-modal.jsx';
import ResumeDetailModal from '../../../resume/components/ResumeDetailModal.jsx';
import SaasAiProfileAnalysisModal from './SaasAiProfileAnalysisModal.jsx';
import {
  generateProfileCvPdfBlob,
  sanitizeCandidateDownloadName,
} from '../../../resume/utils/profileCvPdf.js';

const getApplicantEmail = (record) =>
  record?.profile_email ?? record?.email ?? record?.candidate_email ?? '';

const getResumeIdentifier = (record) => {
  const candidates = [
    record?.resume_id,
    record?.profile_id,
    record?.candidate_id,
    record?.resume,
  ];
  for (const value of candidates) {
    if (value == null || value === '') continue;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string' && /^\d+$/.test(value)) return value;
  }
  return '';
};

// Response Analysis Content Component for Modal
const ResponseAnalysisContent = forwardRef(({ jobId, email, resumeId, onEditStateChange }, ref) => {
  // editValues shape: { [question_id]: string | string[] }
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: responsesData, isLoading, error } = useQuery(
    ['jobScreeningResponses', jobId, email, resumeId],
    () => getJobScreeningResponses(jobId, email, resumeId),
    { enabled: !!jobId, refetchOnWindowFocus: false }
  );

  const editingIds = new Set(Object.keys(editValues).map(Number));
  const hasEdits = editingIds.size > 0;

  React.useEffect(() => {
    onEditStateChange?.(hasEdits);
  }, [hasEdits]);

  // Splits stored value and normalizes each item to choice value key
  // handles mixed "Testing 2, testing_1" → ["testing_2", "testing_1"]
  const parseCheckboxValues = (storedValue, choices = []) => {
    if (!storedValue) return [];
    const items = Array.isArray(storedValue)
      ? storedValue
      : storedValue.split(',').map(s => s.trim()).filter(Boolean);
    return items.map(item => {
      // already a value key
      const byValue = choices.find(c => c.value === item);
      if (byValue) return byValue.value;
      // stored as label
      const byLabel = choices.find(c => c.label === item);
      if (byLabel) return byLabel.value;
      return item;
    });
  };

  const handleEditClick = (answer) => {
    if (answer.question_type === 'file_upload') return;
    const choices = answer.choices ?? [];
    let initValue;
    if (answer.question_type === 'checkboxes') {
      initValue = parseCheckboxValues(answer.value, choices);
    } else if (answer.question_type === 'multiple_choice' || answer.question_type === 'dropdown') {
      // stored value may be label or value key — normalize to value key
      const byValue = choices.find(c => c.value === answer.value);
      const byLabel = choices.find(c => c.label === answer.value);
      initValue = byValue?.value ?? byLabel?.value ?? answer.value ?? '';
    } else {
      initValue = answer.value ?? '';
    }
    setEditValues(prev => ({ ...prev, [answer.question_id]: initValue }));
  };

  const handleCancelEdit = () => setEditValues({});

  const handleSave = async () => {
    if (!hasEdits) return;

    // eslint-disable-next-line no-console
    console.log('[handleSave] editValues:', editValues);

    // Validate required fields
    const invalidQuestions = [];
    Object.entries(editValues).forEach(([qId, val]) => {
      const answerMeta = responsesData?.answers?.find(a => a.question_id === Number(qId));
      // eslint-disable-next-line no-console
      console.log('[handleSave] checking qId', qId, 'val:', val, 'required:', answerMeta?.question_required);
      if (!answerMeta?.question_required) return;
      const isEmpty = Array.isArray(val) ? val.length === 0 : !val?.trim();
      // eslint-disable-next-line no-console
      console.log('[handleSave] isEmpty:', isEmpty);
      if (isEmpty) invalidQuestions.push(answerMeta.question_text);
    });

    if (invalidQuestions.length > 0) {
      message.error(`Required fields cannot be empty: ${invalidQuestions.join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      const answers = Object.entries(editValues).map(([qId, val]) => {
        const qIdNum = Number(qId);
        const answerMeta = responsesData?.answers?.find(a => a.question_id === qIdNum);
        let finalValue = val;
        if (answerMeta?.question_type === 'checkboxes') {
          finalValue = Array.isArray(val)
            ? val
            : parseCheckboxValues(val, answerMeta.choices ?? []);
        } else {
          finalValue = Array.isArray(val) ? val.join(', ') : (val ?? '');
        }
        return { question_id: qIdNum, value: finalValue };
      });
      await updateScreeningResponse(responsesData.id, answers);
      message.success('Answers updated');
      queryClient.invalidateQueries(['jobScreeningResponses', jobId, email, resumeId]);
      setEditValues({});
    } catch (err) {
      message.error('Failed to update answers');
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    hasEdits: () => hasEdits,
    save: handleSave,
    cancel: handleCancelEdit,
    saving,
  }));

  const noAnswer = (
    <div style={{ padding: '8px 12px', backgroundColor: '#fff2f0', borderRadius: '4px', border: '1px solid #ffccc7', color: '#cf1322', fontSize: '14px' }}>
      No answer provided
    </div>
  );

  const displayBox = (text) => (
    <div style={{ padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #e8e8e8', fontSize: '14px' }}>
      {text}
    </div>
  );

  const renderAnswer = (answer) => {
    const qType = answer.question_type;
    const choices = answer.choices ?? [];
    const val = answer.value;
    const isEditing = answer.question_id in editValues;
    const editVal = editValues[answer.question_id];

    // FILE UPLOAD — never editable
    if (qType === 'file_upload') {
      return (
        <div style={{ padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {val ? (
            <FilePdfOutlined size="1em" className="app-icon"
              style={{ cursor: 'pointer', fontSize: '18px', color: '#ff4d4f' }}
              onClick={() => {
                const finalUrl = val.startsWith('http') ? val : `${API_URL}${val}`;
                const w = window.open(finalUrl, '_blank', 'noopener,noreferrer');
                if (w) w.opener = null;
              }}
              title="Click to open file in new tab"
            />
          ) : (
            <span style={{ color: '#cf1322', fontSize: '14px' }}>No file uploaded</span>
          )}
        </div>
      );
    }

    // CHECKBOXES — stored as "testing_2, testing_3" (comma-separated value keys)
    if (qType === 'checkboxes') {
      if (isEditing) {
        const checkedValues = editVal ?? [];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #e8e8e8' }}>
            {choices.map(c => (
              <label key={c.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={checkedValues.includes(c.value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...checkedValues, c.value]
                      : checkedValues.filter(v => v !== c.value);
                    setEditValues(prev => ({ ...prev, [answer.question_id]: next }));
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3E6A9F' }}
                />
                {c.label}
              </label>
            ))}
          </div>
        );
      }
      // Display: map value keys → labels
      if (!val) return noAnswer;
      const selectedLabels = parseCheckboxValues(val, choices)
        .map(v => choices.find(c => c.value === v)?.label ?? v)
        .join(', ');
      return displayBox(selectedLabels);
    }

    // MULTIPLE CHOICE — radio buttons
    if (qType === 'multiple_choice') {
      if (isEditing) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #e8e8e8' }}>
            {choices.map(c => (
              <label key={c.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name={`mc_${answer.question_id}`}
                  value={c.value}
                  checked={editVal === c.value}
                  onChange={() => setEditValues(prev => ({ ...prev, [answer.question_id]: c.value }))}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3E6A9F' }}
                />
                {c.label}
              </label>
            ))}
          </div>
        );
      }
      const displayLabel = choices.find(c => c.value === val || c.label === val)?.label ?? val;
      return val ? displayBox(displayLabel) : noAnswer;
    }

    // DROPDOWN — Select
    if (qType === 'dropdown') {
      if (isEditing) {
        return (
          <Select
            value={editVal ?? undefined}
            onChange={(v) => setEditValues(prev => ({ ...prev, [answer.question_id]: v }))}
            style={{ width: '100%' }}
            options={choices.map(c => ({ label: c.label, value: c.value }))}
          />
        );
      }
      const displayLabel = choices.find(c => c.value === val || c.label === val)?.label ?? val;
      return val ? displayBox(displayLabel) : noAnswer;
    }

    // PARAGRAPH
    if (qType === 'paragraph') {
      if (isEditing) {
        return (
          <Input.TextArea
            value={editVal ?? ''}
            onChange={e => setEditValues(prev => ({ ...prev, [answer.question_id]: e.target.value }))}
            rows={4}
            autoFocus
          />
        );
      }
      return val
        ? <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #e8e8e8', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>{val}</div>
        : noAnswer;
    }

    // SHORT TEXT / OTHER
    if (isEditing) {
      return (
        <Input
          value={editVal ?? ''}
          onChange={e => setEditValues(prev => ({ ...prev, [answer.question_id]: e.target.value }))}
          autoFocus
        />
      );
    }
    return val ? displayBox(val) : noAnswer;
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin" style={{ fontSize: 32 }}  />} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#b3261e' }}>
        <h6>Unable to load response analysis</h6>
        <p>{error?.message || 'Something went wrong.'}</p>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <Text strong style={{ fontSize: '16px', color: '#3E6A9F' }}>
          Screening Questionnaire Response
        </Text>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Card size="small" style={{ border: '1px solid #f0f0f0' }}>
          <Text strong>Submitted At:</Text>
          <div style={{ color: '#666', marginTop: '4px' }}>
            {responsesData?.created_at ? new Date(responsesData.created_at).toLocaleString() : 'N/A'}
          </div>
        </Card>

        {responsesData?.answers?.length > 0 ? (
          responsesData.answers.map((answer, index) => {
            const isEditing = answer.question_id in editValues;
            // eslint-disable-next-line no-console
            if (index === 0) console.log('[ResponseAnalysis] answer sample:', answer);
            return (
              <Card key={answer.question_id} size="small" style={{ border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <Text strong style={{ color: '#3E6A9F', fontSize: '14px' }}>
                      Question {index + 1}:
                      {answer.question_required && (
                        <span style={{ color: '#ff4d4f', marginLeft: 4, fontWeight: 700 }}>*</span>
                      )}
                    </Text>
                    <div style={{ marginTop: '4px', color: '#333', fontWeight: 500 }}>
                      {answer.question_text}
                    </div>
                  </div>
                  {!isEditing && answer.question_type !== 'file_upload' && (
                    <Tooltip title="Edit answer">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined size="1em" className="app-icon" />}
                        onClick={() => handleEditClick(answer)}
                        style={{ color: '#3E6A9F', flexShrink: 0 }}
                      />
                    </Tooltip>
                  )}
                </div>
                <div>
                  <Text strong style={{ fontSize: '13px', color: '#666' }}>Answer:</Text>
                  <div style={{ marginTop: '4px' }}>{renderAnswer(answer)}</div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card size="small" style={{ border: '1px solid #f0f0f0', textAlign: 'center' }}>
            <Text type="secondary">No answers found for this response.</Text>
          </Card>
        )}
      </div>
    </div>
  );
});

// Recruiter Screening Form Content Component for Modal
// Fetches the questionnaire (questions) for a job/candidate and lets the recruiter fill + submit answers
const RecruiterScreeningFormContent = forwardRef(({ jobId, email, resumeId, onSubmitted, onSubmittingChange }, ref) => {
  const [answers, setAnswers] = useState({});

  const { data: formData, isLoading, error } = useQuery(
    ['recruiterScreeningForm', jobId, email, resumeId],
    () => getRecruiterScreeningForm(jobId, email, resumeId),
    { enabled: !!jobId, refetchOnWindowFocus: false }
  );

  const submitMutation = useMutation(
    (payload) => submitRecruiterScreeningForm(payload),
    {
      onMutate: () => {
        onSubmittingChange?.(true);
      },
      onSuccess: (response) => {
        message.success(response?.message || 'Questionnaire submitted successfully');
        onSubmitted?.();
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to submit questionnaire');
      },
      onSettled: () => {
        onSubmittingChange?.(false);
      },
    }
  );

  const questions = formData?.questions || [];

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const missing = questions
      .filter((q) => q.is_required)
      .filter((q) => {
        const val = answers[q.id];
        if (q.question_type === 'file_upload') return !(val instanceof File);
        return Array.isArray(val) ? val.length === 0 : !val?.toString().trim();
      });

    if (missing.length > 0) {
      message.error(`Required fields cannot be empty: ${missing.map((q) => q.question_text).join(', ')}`);
      return;
    }

    const payloadAnswers = questions.map((q) => {
      const val = answers[q.id];
      if (q.question_type === 'file_upload') {
        return { question_id: q.id, file: val instanceof File ? val : undefined };
      }
      // Checkboxes send their selected values as a JSON-stringified array
      const finalValue = Array.isArray(val) ? JSON.stringify(val) : (val ?? '');
      return { question_id: q.id, value: finalValue };
    });

    submitMutation.mutate({ jobId, email, resumeId, answers: payloadAnswers });
  };

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
    submitting: submitMutation.isLoading,
  }));

  const renderQuestion = (question) => {
    const qType = question.question_type;
    const options = question.options ?? [];
    const val = answers[question.id];

    if (qType === 'checkboxes') {
      const checkedValues = val ?? [];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {options.map((o) => (
            <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={checkedValues.includes(o.value)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...checkedValues, o.value]
                    : checkedValues.filter((v) => v !== o.value);
                  handleChange(question.id, next);
                }}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3E6A9F' }}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }

    if (qType === 'multiple_choice') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {options.map((o) => (
            <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="radio"
                name={`recruiter_mc_${question.id}`}
                value={o.value}
                checked={val === o.value}
                onChange={() => handleChange(question.id, o.value)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3E6A9F' }}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }

    if (qType === 'dropdown') {
      return (
        <Select
          value={val ?? undefined}
          onChange={(v) => handleChange(question.id, v)}
          style={{ width: '100%' }}
          options={options.map((o) => ({ label: o.label, value: o.value }))}
          placeholder="Select an option"
        />
      );
    }

    if (qType === 'paragraph') {
      return (
        <Input.TextArea
          value={val ?? ''}
          onChange={(e) => handleChange(question.id, e.target.value)}
          rows={4}
        />
      );
    }

    if (qType === 'file_upload') {
      return (
        <Upload
          beforeUpload={(file) => {
            handleChange(question.id, file);
            return false;
          }}
          onRemove={() => handleChange(question.id, undefined)}
          fileList={val instanceof File ? [{ uid: question.id, name: val.name }] : []}
          maxCount={1}
        >
          <Button icon={<UploadOutlined size="1em" className="app-icon" />}>Select File</Button>
        </Upload>
      );
    }

    // SHORT TEXT / OTHER
    return (
      <Input
        value={val ?? ''}
        onChange={(e) => handleChange(question.id, e.target.value)}
      />
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin" style={{ fontSize: 32 }}  />} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#b3261e' }}>
        <h6>Unable to load questionnaire</h6>
        <p>{error?.message || 'Something went wrong.'}</p>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      {formData?.title && (
        <div style={{ marginBottom: '4px' }}>
          <Text strong style={{ fontSize: '16px', color: '#3E6A9F' }}>{formData.title}</Text>
        </div>
      )}
      {formData?.description && (
        <div style={{ marginBottom: '16px', color: '#666' }}>{formData.description}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <Card key={question.id} size="small" style={{ border: '1px solid #f0f0f0' }}>
              <div style={{ marginBottom: '8px' }}>
                <Text strong style={{ color: '#3E6A9F', fontSize: '14px' }}>
                  Question {index + 1}:
                  {question.is_required && (
                    <span style={{ color: '#ff4d4f', marginLeft: 4, fontWeight: 700 }}>*</span>
                  )}
                </Text>
                <div style={{ marginTop: '4px', color: '#333', fontWeight: 500 }}>
                  {question.question_text}
                </div>
                {question.help_text && (
                  <div style={{ marginTop: '2px', color: '#999', fontSize: '12px' }}>{question.help_text}</div>
                )}
              </div>
              <div>{renderQuestion(question)}</div>
            </Card>
          ))
        ) : (
          <Card size="small" style={{ border: '1px solid #f0f0f0', textAlign: 'center' }}>
            <Text type="secondary">No questions found for this questionnaire.</Text>
          </Card>
        )}
      </div>
    </div>
  );
});


const { TextArea } = Input;
const { Text } = Typography;

// Central status list for CV statuses
const STATUS_LIST = [
  'Pending',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Conducted',
  'Interview Not Conducted By Client',
  'Candidate Did Not Appear In Interview',
  'On Hold',
  'Offer Made',
  'Offer Rejected',
  'Joined',
  'Rejected After CV Review With Valid Reason',
  'Rejected After CV Review With Invalid Reason',
  'Rejected After CV Review Without Reason',
  'Rejected After Interview With Valid Reason',
  'Rejected After Interview With Invalid Reason',
  'Rejected After Interview Without Reason',
  'Candidate Resigned',
  'Terminated By Company',
];

const statusColors = {
  // Job / client statuses (existing)
  Pending: '#faad14', // Orange
  Active: '#52c41a', // Green
  Completed: '#1890ff', // Blue
  Terminated: '#ff4d4f', // Red
  'Potential Client': '#faad14', // Orange
  Lost: '#ff4d4f', // Red
  Inactive: '#8c8c8c', // Gray
  'In Pipeline': '#1890ff', // Blue

  // CV statuses (new list)
  Pending: '#faad14',
  Shortlisted: '#1890ff',
  'Interview Scheduled': '#1890ff',
  'Interview Conducted': '#1890ff',
  'Interview Not Conducted By Client': '#ff4d4f',
  'Candidate Did Not Appear In Interview': '#ff4d4f',
  'On Hold': '#faad14',
  'Offer Made': '#52c41a',
  'Offer Rejected': '#ff4d4f',
  Joined: '#52c41a',
  'Rejected After CV Review With Valid Reason': '#ff4d4f',
  'Rejected After CV Review With Invalid Reason': '#ff4d4f',
  'Rejected After CV Review Without Reason': '#ff4d4f',
  'Rejected After Interview With Valid Reason': '#ff4d4f',
  'Rejected After Interview With Invalid Reason': '#ff4d4f',
  'Rejected After Interview Without Reason': '#ff4d4f',
  'Candidate Resigned': '#ff4d4f',
  'Terminated By Company': '#ff4d4f',
};

const { Title } = Typography;
const { Option } = Select;


const statusOptions = STATUS_LIST.map((status) => ({
  label: status,
  value: status,
}));

export default function JobHeadhunting() {
  const batchFileInputRef = useRef(null);
  const editBatchFileInputRef = useRef(null);
  const publicResumeFileInputRef = useRef(null);
  const { jobId } = useParams();

  const navigate = useNavigate();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [remarksModal, setRemarksModal] = useState({
    visible: false,
    resumeId: null,
    batchId: null,
    currentRemarks: '',
    isEditing: false
  });
  const [statusModal, setStatusModal] = useState({
    visible: false,
    resume: null,
    batchId: null,
    oldStatus: '',
    newStatus: '',
    remarks: '' // Add remarks field
  });
  const userType = user?.user_type;
  const isProjectManagerUser = userType === 'project_manager';
  const canManageBatches =
    userType !== 'sales_manager' &&
    userType !== 'sales_executive' &&
    !isProjectManagerUser;

  // Check if user is recruitment manager or executive
  const isRecruitmentUser = userType === 'recruitment_manager' || userType === 'recruitment_executive';
  const canViewSaasApplications =
    userType === 'recruitment_manager' ||
    userType === 'recruitment_executive' ||
    userType === 'sales_manager' ||
    userType === 'sales_executive' ||
    userType === 'super_admin';

  const isSaasApplicationsReadOnly =
    userType === 'super_admin' ||
    userType === 'sales_manager' ||
    userType === 'sales_executive';

  const goBack = () => {

    navigate(-1);
  }

  // Batch list server-side pagination
  const [batchPage, setBatchPage] = useState(1);
  const [batchPageSize, setBatchPageSize] = useState(10);

  useEffect(() => {
    setBatchPage(1);
  }, [jobId]);

  // Fetch batches data using the API (server-side paginated)
  const { data: batchesData, isLoading: batchesLoading, refetch: refetchBatches } = useQuery(
    ['jobResumeBatches', jobId, batchPage, batchPageSize],
    () => getJobResumeBatchList(jobId, batchPage, batchPageSize),
    {
      enabled: !!jobId,
      refetchOnWindowFocus: false,
    }
  );

  // Check if batch operations should be disabled (for recruitment users when job is not Active)
  // This must be after batchesData is defined
  const jobStatus = batchesData?.job_status ?? batchesData?.status;
  const hasScreeningFormAttached = Boolean(batchesData?.screening_form && batchesData?.screening_form !== '');

  // Fetch project approval status (RM + Recruiter approval must both be Approved to unlock batch / job-portal actions)
  const { data: projectInfo } = useQuery(
    ['projectInformation', batchesData?.project_id],
    () => getProjectInformation(batchesData?.project_id),
    {
      enabled: !!batchesData?.project_id,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  const isProjectApprovalPending =
    (projectInfo?.recruitment_manager_approval ?? 'Pending') !== 'Approved' ||
    (projectInfo?.recruiter_approval ?? 'Pending') !== 'Approved';

  const isBatchOperationDisabled = (isRecruitmentUser && jobStatus !== 'Active') || isProjectApprovalPending;

  const showBatchDisabledMessage = () => {
    if (isProjectApprovalPending) {
      message.error('This project must be approved by both the Recruitment Manager and Recruiter before batches can be managed.');
    } else {
      message.error('Job status must be "Active" to manage batches.');
    }
  };

  // Fetch client details using the API
  const { data: clientData, isLoading: clientLoading, refetch: refetchClient } = useQuery(
    ['clientDetails', batchesData?.client_id],
    () => getClientDetails(batchesData?.client_id),
    {
      enabled: !!batchesData?.client_id,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch available screenings for recruitment users
  const { data: availableScreenings, isLoading: screeningsLoading } = useQuery(
    ['availableScreenings'],
    () => getAvailableScreenings(),
    {
      enabled: isRecruitmentUser,
      refetchOnWindowFocus: false,
    }
  );

  // Public CV server-side pagination
  const [publicResumePage, setPublicResumePage] = useState(1);
  const [publicResumePageSize, setPublicResumePageSize] = useState(10);

  // SaaS applications server-side pagination & sorting
  const [saasApplicationsPage, setSaasApplicationsPage] = useState(1);
  const [saasApplicationsPageSize, setSaasApplicationsPageSize] = useState(10);
  const [saasApplicationsSorting, setSaasApplicationsSorting] = useState([]);

  const [publicResumeModal, setPublicResumeModal] = useState(false);
  const [publicResumeFiles, setPublicResumeFiles] = useState([]);

  // Local edits to the fallback `name` field (used when profile_name is missing), synced via updatePublicResumeNameMutation
  const [publicResumeNameEdits, setPublicResumeNameEdits] = useState({});
  // Record id currently in edit mode for the public resume fallback name field
  const [editingPublicResumeNameId, setEditingPublicResumeNameId] = useState(null);

  // Local edits to the fallback `name` field for batch CVs, synced via updateBatchResumeNameMutation
  const [batchResumeNameEdits, setBatchResumeNameEdits] = useState({});
  // Record id currently in edit mode for the batch resume fallback name field
  const [editingBatchResumeNameId, setEditingBatchResumeNameId] = useState(null);

  const saasApplicationsSortField =
    saasApplicationsSorting.length > 0 && saasApplicationsSorting[0]?.id
      ? saasApplicationsSorting[0].id
      : null;
  const saasApplicationsSortDirection =
    saasApplicationsSorting.length > 0 && saasApplicationsSorting[0]?.desc !== undefined
      ? saasApplicationsSorting[0].desc
      : null;

  // Reset page when job changes
  useEffect(() => {
    setPublicResumePage(1);
    setSaasApplicationsPage(1);
    setSaasApplicationsSorting([]);
  }, [jobId]);

  // Fetch public resume list (server-side paginated)
  const {
    data: publicResumeData,
    isLoading: publicResumeLoading,
    refetch: refetchPublicResumes,
  } = useQuery(
    ['publicResumeList', jobId, publicResumePage, publicResumePageSize],
    () => getPublicResumeList(jobId, publicResumePage, publicResumePageSize),
    {
      enabled: !!jobId,
      refetchOnWindowFocus: false,
    }
  );

  const {
    data: saasApplicationsData,
    isLoading: saasApplicationsLoading,
    isFetching: saasApplicationsFetching,
    isError: saasApplicationsError,
    error: saasApplicationsErrorData,
  } = useQuery(
    [
      'saasJobApplications',
      jobId,
      saasApplicationsPage,
      saasApplicationsPageSize,
      saasApplicationsSortField,
      saasApplicationsSortDirection,
    ],
    () => getSaasJobApplications(
      jobId,
      saasApplicationsPage,
      saasApplicationsPageSize,
      saasApplicationsSorting
    ),
    {
      enabled: !!jobId && canViewSaasApplications,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  const breadcrumbClientStatus =
    clientData?.status ||
    batchesData?.client_status ||
    batchesData?.project_status ||
    'Client';

  // State for batches and CVs
  const [batches, setBatches] = useState([]);
  const [cvSubmissionDeadline, setCvSubmissionDeadline] = useState(null);
  const [editBatchModal, setEditBatchModal] = useState({
    visible: false,
    batchId: null,
    batchName: '',
  });
  const [selectedScreeningForm, setSelectedScreeningForm] = useState(null);
  const [addBatchModal, setAddBatchModal] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]); // For new batch upload
  const [editBatchFiles, setEditBatchFiles] = useState([]); // For editing batch upload
  const [uploadFiles, setUploadFiles] = useState({}); // { batchId: [File, ...] }
  const [clientRemarksModal, setClientRemarksModal] = useState({ visible: false });
  const [jobRemarksModal, setJobRemarksModal] = useState({ visible: false, remarks: '' });
  // Sales remarks modal (per CV)
  const [pmRemarksModal, setPmRemarksModal] = useState({
    visible: false,
    resumeId: null,
    batchId: null,
    currentRemarks: '',
  });
  const [salesRemarksModal, setSalesRemarksModal] = useState({
    visible: false,
    resumeId: null,
    batchId: null,
    currentRemarks: '',
  });
  const [remarksSaving, setRemarksSaving] = useState(false);

  // Response analysis modal state
  const [responseAnalysisModal, setResponseAnalysisModal] = useState({
    visible: false,
    jobId: null,
    email: null,
    resumeId: null,
  });
  const responseAnalysisRef = useRef(null);
  const [responseAnalysisHasEdits, setResponseAnalysisHasEdits] = useState(false);

  // Recruiter screening (questionnaire) fill-in modal state
  const [recruiterScreeningModal, setRecruiterScreeningModal] = useState({
    visible: false,
    jobId: null,
    email: null,
    resumeId: null,
  });
  const recruiterScreeningRef = useRef(null);
  const [recruiterScreeningSubmitting, setRecruiterScreeningSubmitting] = useState(false);

  // Status history modal (admin only)
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });

  // Share modal state
  const [shareModal, setShareModal] = useState({
    visible: false,
    loading: false,
    link: null,
    title: '',
    resumeName: '',
  });

  // Batch share link modal (Show Link / Hide Link) — reuses ShareModal with a placeholder public URL
  const [batchShareModal, setBatchShareModal] = useState({
    visible: false,
    link: null,
    title: '',
  });

  const [shiftingSaasApplicationKey, setShiftingSaasApplicationKey] = useState(null);

  // Shift public resume to batch modal
  const [shiftToBatchModal, setShiftToBatchModal] = useState({
    visible: false,
    publicResumeId: null,
    resumeName: '',
    selectedBatchId: null,
  });

  // SaaS application CV detail modal (profile / custom CV — same as Resume page)
  const [saasCvModal, setSaasCvModal] = useState({
    visible: false,
    applicantEmail: null,
  });
  const [saasCvDetails, setSaasCvDetails] = useState(null);
  const [saasInterviewModal, setSaasInterviewModal] = useState({ visible: false, record: null });
  const [saasRatingRemarksModal, setSaasRatingRemarksModal] = useState({ visible: false, record: null });
  const [saasAiProfileModal, setSaasAiProfileModal] = useState({
    visible: false,
    applicationId: null,
    record: null,
  });

  const { data: saasCvDetailData, isLoading: loadingSaasCvDetail, isError: saasCvDetailError } = useQuery(
    ['saasApplicationCvDetail', saasCvModal.applicantEmail],
    () => getSaasApplicantCv(saasCvModal.applicantEmail),
    {
      enabled: saasCvModal.visible && !!saasCvModal.applicantEmail,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  React.useEffect(() => {
    if (!saasCvDetailData) return;
    setSaasCvDetails({
      ...saasCvDetailData,
      source_type: 'profile',
    });
  }, [saasCvDetailData]);

  const {
    data: saasApplicantProfileData,
    isLoading: saasApplicantProfileLoading,
    isError: saasApplicantProfileError,
  } = useQuery(
    ['saasApplicantProfile', saasAiProfileModal.applicationId],
    () => getSaasApplicantProfile(saasAiProfileModal.applicationId),
    {
      enabled: saasAiProfileModal.visible && !!saasAiProfileModal.applicationId,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  // Fetch job batches list for "Shift to Batch" modal (after state so enabled can use shiftToBatchModal)
  const { data: jobBatchesList = [], isLoading: jobBatchesListLoading } = useQuery(
    ['jobBatchesList', jobId],
    () => getJobBatchesList(jobId),
    {
      enabled: !!jobId && !!shiftToBatchModal.visible,
      refetchOnWindowFocus: false,
    }
  );

  // Status change confirmation modal state


  // Update batches state when API data is available (normalize project_manager_remarks for fetch/display)
  React.useEffect(() => {
    if (batchesData?.results) {
      setBatches(
        batchesData.results.map((batch) => ({
          ...batch,
          resumes: (batch.resumes || []).map((r) => ({
            ...r,
            project_manager_remarks: r.project_manager_remarks ?? null,
          })),
        }))
      );
    }
  }, [batchesData]);

  // Create batch mutation
  const createBatchMutation = useMutation(createHeadhuntingBatch, {
    onSuccess: (response) => {
      message.destroy('batch-toast');
      message.success({ content: response?.message, key: 'batch-toast' });
      setAddBatchModal(false);
      setBatchFiles([]); // clear filenames after success
      // Clear the file input
      if (batchFileInputRef.current) {
        batchFileInputRef.current.value = '';
      }
      // Refetch batches data to get the latest data
      refetchBatches();
    },
    onError: (error) => {
      message.destroy('batch-toast');
      message.error({ content: error?.response?.data?.message || error?.message, key: 'batch-toast' });
    },
  });

  React.useEffect(() => {
    if (batchesData?.cv_submission_deadline && batches.length === 0) {
      setCvSubmissionDeadline(dayjs(batchesData.cv_submission_deadline));
    }
  }, [batchesData, batches.length]);


  // Status change mutation
  const statusMutation = useMutation(
    async ({ resumeId, status, remarks }) => {
      console.log('Updating resume status:', { resumeId, status, remarks });
      const formData = new FormData();
      formData.append('status', status);
      if (remarks) {
        formData.append('remarks', remarks);
      }
      const response = await updateResumeStatusFormData(resumeId, formData);
      return response;
    },
    {
      onSuccess: (response) => {
        console.log('Resume status update success:', response);
        message.success(response?.message || 'CV status updated successfully');
        setStatusModal({ visible: false, resume: null, batchId: null, oldStatus: '', newStatus: '', remarks: '' });
        refetchBatches();
      },
      onError: (error) => {
        console.log('Resume status update error:', error);
        message.error(error?.response?.data?.message || error?.message || 'Failed to update CV status');
      },
    }
  );

  // Delete batch mutation
  const deleteBatchMutation = useMutation(deleteBatch, {
    onSuccess: (response) => {
      message.success(response?.message || 'Batch deleted successfully');
      refetchBatches();
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || 'Failed to delete batch');
    },
  });

  const handleDeleteBatch = (batch) => {
    // Conditions: 
    // 1. Only Batch without cv can be deleted
    if (batch.resumes && batch.resumes.length > 0) {
      message.error('Batch with CVs cannot be deleted');
      return;
    }

    // 2. Batch 1 cannot be deleted
    // Use a robust check for "Batch 1" (case insensitive and account for potential whitespace)
    const isBatchOne = batch.batch_name && /^batch\s*1$/i.test(batch.batch_name.trim());
    if (isBatchOne) {
      message.error('Batch 1 cannot be deleted');
      return;
    }

    // 3. User confirmation on batch deletion
    Modal.confirm({
      title: 'Delete Batch',
      icon: <DeleteOutlined size="1em" className="app-icon" style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to delete ${batch.batch_name}? This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      okButtonProps: {
        loading: deleteBatchMutation.isLoading,
      },
      onOk: () => {
        deleteBatchMutation.mutate(batch.id);
      },
    });
  };

  // Add resumes to batch mutation
  const addResumesToBatchMutation = useMutation(
    async ({ batchId, resumes }) => {
      return addResumes(batchId, resumes);
    },
    {
      onSuccess: (data) => {
        message.success(data?.message || 'CVs added to batch successfully');
        setUploadFiles(prev => ({ ...prev, [statusModal.batchId]: [] }));
        setEditBatchFiles([]); // clear filenames after success
        // Clear the file input after successful update
        if (editBatchFileInputRef.current) {
          editBatchFileInputRef.current.value = '';
        }
        refetchBatches();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to add CVs to batch');
      },
    }
  );

  const updateClientRemarksMutation = useMutation(
    async (newRemarks) => {
      if (!batchesData?.client_id) return null;
      const payload = { remarks: newRemarks || '' };
      return updateHeadhuntingClientJSON(batchesData.client_id, payload);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message);
        setClientRemarksModal({ visible: false });
        refetchClient();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to update client remarks');
      },
    }
  );

  // Job remarks update mutation
  const updateJobRemarksMutation = useMutation(
    async (remarks) => {
      if (!jobId) return null;
      return updateJob(jobId, { remarks: remarks || '' });
    },
    {
      onSuccess: async (response) => {
        message.success(response?.message);
        // Invalidate and refetch batches data to get latest remarks
        await queryClient.invalidateQueries(['jobResumeBatches', jobId]);
        await refetchBatches();
        setJobRemarksModal({ visible: false, remarks: '' });
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to update job remarks');
      },
    }
  );

  // Screening form update mutation
  const updateScreeningFormMutation = useMutation(
    async ({ jobId, screeningFormId }) => {
      return updateJobScreeningForm(jobId, screeningFormId);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Screening questionnaire updated successfully');
        setSelectedScreeningForm(null);
        // Refetch batches data to get updated screening questionnaire info
        refetchBatches();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to update screening questionnaire');
      },
    }
  );

  // State to store generated screening links
  const [screeningLinks, setScreeningLinks] = useState({});

  // State for tabs - initialize from URL params
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromParams = searchParams.get('tab');
    if (tabFromParams === 'saas' && !canViewSaasApplications) {
      return 'batches';
    }
    if (tabFromParams === 'public' || tabFromParams === 'batches' || tabFromParams === 'saas') {
      return tabFromParams;
    }
    return 'batches';
  });

  useEffect(() => {
    if (!canViewSaasApplications && activeTab === 'saas') {
      setActiveTab('batches');
    }
  }, [canViewSaasApplications, activeTab]);

  // Update URL params when tab changes
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== activeTab) {
      const newSearchParams = new URLSearchParams(searchParams);
      if (activeTab) {
        newSearchParams.set('tab', activeTab);
      } else {
        newSearchParams.delete('tab');
      }
      setSearchParams(newSearchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Generate screening questionnaire link mutation
  const generateLinkMutation = useMutation(
    async ({ jobId, resumeInstanceId, email, resumeId }) => {
      return generateScreeningFormLink(jobId, resumeInstanceId, email, resumeId);
    },
    {
      onSuccess: (response, { email, title }) => {
        if (response?.token) {
          const screeningUrl = `https://www.searchopal.com/screening-form?token=${response.token}`;
          setScreeningLinks(prev => ({
            ...prev,
            [email]: screeningUrl
          }));

          // Show share modal instead of just message
          setShareModal({
            visible: true,
            loading: false,
            link: screeningUrl,
            title: title || 'Unknown'
          });
        } else {
          setShareModal(prev => ({ ...prev, loading: false }));
          message.error('No token received from server');
        }
      },
      onError: (error) => {
        setShareModal(prev => ({ ...prev, loading: false }));
        message.error(error?.response?.data?.message || error?.message || 'Failed to generate screening link');
      },
    }
  );

  // Job resume share mutation
  const jobResumeShareMutation = useMutation(
    async ({ batchId, resumeId }) => {
      return jobResumeShare(batchId, { resume_id: resumeId });
    },
    {
      onSuccess: (response) => {
        if (response?.resume_url) {
          window.open(response.resume_url, '_blank', 'noopener,noreferrer');
        } else {
          message.error('CV URL not available');
        }
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to access CV');
      },
    }
  );

  // Public resume share mutation
  const publicResumeShareMutation = useMutation(
    async ({ resumeId, record }) => {
      return publicResumeShare(resumeId);
    },
    {
      onSuccess: (response, variables) => {
        const { record } = variables;
        if (response?.resume_url) {
          // Show share modal with resume URL
          setShareModal({
            visible: true,
            loading: false,
            link: response.resume_url,
            title: record?.profile_name || record?.resume_name || 'Unknown',
            resumeName: record?.profile_name || record?.resume_name || 'Unknown'
          });
        } else {
          message.error('CV URL not available');
        }
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to access CV');
      },
    }
  );

  const shiftSaasToPublicCvMutation = useMutation(
    ({ job_id, email }) => shiftSaasApplicationToPublicCv({ job_id, email }),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Application shifted to Public CV successfully');
        queryClient.invalidateQueries(['saasJobApplications', jobId]);
        queryClient.invalidateQueries(['publicResumeList', jobId]);
        refetchPublicResumes();
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to shift to Public CV');
      },
      onSettled: () => {
        setShiftingSaasApplicationKey(null);
      },
    }
  );

  // Shift public resume to batch mutation
  const shiftToBatchMutation = useMutation(
    async ({ publicResumeId, batchId }) => {
      return shiftPublicResumeToBatch(publicResumeId, batchId);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Resume shifted to batch successfully');
        setShiftToBatchModal({ visible: false, publicResumeId: null, resumeName: '', selectedBatchId: null });
        refetchPublicResumes();
        refetchBatches();
      },
      onError: (error) => {
        const msg = error?.message || error?.response?.data?.message || 'Failed to shift resume to batch';
        message.error(msg);
      },
    }
  );

  // Save fallback name for a public CV (only used when profile_name is missing)
  const updatePublicResumeNameMutation = useMutation(
    async ({ id, name }) => {
      return updatePublicResumeName(id, name);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Name updated successfully');
        refetchPublicResumes();
      },
      onError: (error) => {
        const msg = error?.response?.data?.message || error?.message || 'Failed to update name';
        message.error(msg);
      },
    }
  );

  // Save fallback name for a batch CV (only used when profile_name is missing)
  const updateBatchResumeNameMutation = useMutation(
    async ({ id, name }) => {
      return updateBatchResumeName(id, name);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Name updated successfully');
        refetchBatches();
      },
      onError: (error) => {
        const msg = error?.response?.data?.message || error?.message || 'Failed to update name';
        message.error(msg);
      },
    }
  );

  // Delete batch resume (move back to Public CV list)
  const deleteBatchResumeMutation = useMutation(
    async (resumeId) => {
      return deleteBatchResume(resumeId);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Resume moved back to Public successfully');
        refetchBatches();
        refetchPublicResumes();
      },
      onError: (error) => {
        const msg = error?.response?.data?.message || error?.message || 'Failed to move resume back to Public';
        message.error(msg);
      },
    }
  );

  // Add public CVs (recruitment manager/executive)
  const addPublicResumeMutation = useMutation(
    async ({ jobId, resumes }) => {
      return addPublicResume(jobId, resumes);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'CVs added to Public CV successfully');
        if (publicResumeFileInputRef.current) {
          publicResumeFileInputRef.current.value = '';
        }
        setPublicResumeFiles([]);
        setPublicResumeModal(false);
        refetchPublicResumes();
      },
      onError: (error) => {
        const msg = error?.response?.data?.message || error?.message || 'Failed to add CVs to Public CV';
        message.error(msg);
      },
    }
  );

  // Function to generate link for a specific CV
  const handleGenerateLink = (record, isPublic = false) => {
    const resumeInstanceId = record.id;
    const email = getApplicantEmail(record);
    const resumeId = getResumeIdentifier(record);

    const title = record.profile_name || record.resume_name || 'Unknown';

    // Show loading modal
    setShareModal({
      visible: true,
      loading: true,
      link: null,
      title: title,
      resumeName: record.profile_name || record.resume_name || record.resume || 'Unknown'
    });

    generateLinkMutation.mutate({
      jobId,
      resumeInstanceId,
      email,
      resumeId,
      title,
    });
  };

  // Calculate statistics
  const totalBatches = batches.length;
  const totalResumes = batches.reduce((total, batch) => total + batch.resumes.length, 0);
  const pendingResumes = batches.reduce((total, batch) =>
    total + batch.resumes.filter(resume => resume.status === 'Pending').length, 0);
  const hiredResumes = batches.reduce((total, batch) =>
    total + batch.resumes.filter(resume => resume.status === 'Hired').length, 0);
  const rejectedResumes = batches.reduce((total, batch) =>
    total + batch.resumes.filter(resume => resume.status === 'Rejected').length, 0);

  // Add new batch with multiple CVs
  const handleAddBatch = () => {
    // Check if batch operation is disabled for recruitment users
    if (isBatchOperationDisabled) {
      showBatchDisabledMessage();
      return;
    }

    // Validation: At least 1 resume must be selected
    if (!cvSubmissionDeadline) {
      message.error('CV Submission Deadline is required');
      return;
    }


    // Prepare payload for API
    const payload = {
      job: Number(jobId),
      cv_submission_deadline: cvSubmissionDeadline.format('YYYY-MM-DD HH:mm:ss'),
      // Resumes are now optional
      ...(batchFiles.length > 0 && { resumes: batchFiles })
    };

    // Call the API
    createBatchMutation.mutate(payload);
    setBatchFiles([]);
  };


  const truncateFileName = (name, max = 30) => {
    if (!name) return '';
    if (name.length <= max) return name;
    const parts = name.split('.');
    if (parts.length < 2) return name.slice(0, max - 3) + '...';
    const ext = parts.pop();
    const base = parts.join('.');
    const keep = Math.max(5, max - (ext.length + 4));
    return base.slice(0, keep) + '...' + '.' + ext;
  };

  // Add CVs to existing batch (multiple)
  const handleUpload = (batchId, files) => {
    // Check if batch operation is disabled for recruitment users
    if (isBatchOperationDisabled) {
      showBatchDisabledMessage();
      return;
    }

    if (!files || files.length === 0) {
      message.error('Please select files to upload');
      return;
    }

    addResumesToBatchMutation.mutate({
      batchId: batchId,
      resumes: Array.from(files)
    });
  };

  // Handle edit batch modal open
  const handleEditBatch = (batch) => {
    // Check if batch operation is disabled for recruitment users
    if (isBatchOperationDisabled) {
      showBatchDisabledMessage();
      return;
    }

    // Clear all state when opening the modal
    setEditBatchFiles([]);
    if (editBatchFileInputRef.current) {
      editBatchFileInputRef.current.value = '';
    }

    setEditBatchModal({
      visible: true,
      batchId: batch.id,
      batchName: batch.batch_name,
    });
  };


  // Handle edit batch submit
  const handleEditBatchSubmit = async () => {
    // Check if batch operation is disabled for recruitment users
    if (isBatchOperationDisabled) {
      showBatchDisabledMessage();
      return;
    }

    // Validation: deadline is mandatory

    try {
      // If there are CVs to add
      if (editBatchFiles.length > 0) {
        await addResumesToBatchMutation.mutateAsync({
          batchId: editBatchModal.batchId,
          resumes: Array.from(editBatchFiles)
        });
      }

      // Update deadline (you'll need to create this API call)
      // Assuming you have an updateBatchDeadline function


      message.success('Batch updated successfully');
      setEditBatchModal({ visible: false, batchId: null, batchName: '', deadline: null });
      setEditBatchFiles([]);
      // Clear the file input after successful update
      if (editBatchFileInputRef.current) {
        editBatchFileInputRef.current.value = '';
      }
      refetchBatches();
    } catch (error) {
      // Don't show generic error message if the specific mutation error has already been handled
      // The addResumesToBatchMutation onError handler will show the specific error message
      console.error('Batch update error:', error);
    }
  };

  // Change CV status
  const handleStatusChange = (batchId, resumeId, value) => {
    const batch = batches.find(b => b.id === batchId);
    const resume = batch?.resumes.find(r => r.id === resumeId);

    if (resume) {
      setStatusModal({
        visible: true,
        resume,
        batchId,
        oldStatus: resume.status || 'No Status',
        newStatus: value,
        remarks: resume.remarks || '' // Populate with existing remarks
      });
    }
  };

  // Handle screening questionnaire update
  const handleUpdateScreeningForm = () => {
    if (!selectedScreeningForm) {
      message.warning('Please select a screening questionnaire');
      return;
    }
    updateScreeningFormMutation.mutate({
      jobId,
      screeningFormId: selectedScreeningForm
    });
  };

  // Handle view screening questionnaire responses (job-level list)
  const handleViewScreeningResponses = () => {
    const userType = user?.user_type;
    const basePath = userType === 'super_admin' ? '/super_admin' : userType === 'recruitment_manager' ? '/recruitment-manager' : userType === 'recruitment_executive' ? '/recruitment-executive' : '';
    if (basePath) navigate(`${basePath}/response-analysis/${jobId}?type=jobResponse`);
  };

  const handleViewBatchScreeningResponses = (batchIdOrEvent) => {
    if (!hasScreeningFormAttached) return;

    // Guard: no arg or click event must not be used as batch_id (would become [object Object])
    let batchId;
    if (batchIdOrEvent != null && typeof batchIdOrEvent === 'object' && !('target' in batchIdOrEvent) && 'id' in batchIdOrEvent) {
      const id = batchIdOrEvent.id;
      if (typeof id === 'number' || (typeof id === 'string' && id !== '')) batchId = id;
    } else if (typeof batchIdOrEvent === 'number' || (typeof batchIdOrEvent === 'string' && batchIdOrEvent !== '')) {
      batchId = batchIdOrEvent;
    }
    const userType = user?.user_type;
    let basePath = '';

    if (userType === 'super_admin') {
      basePath = '/admin';
    } else if (userType === 'recruitment_manager') {
      basePath = '/recruitment-manager';
    } else if (userType === 'recruitment_executive') {
      basePath = '/recruitment-executive';
    }

    if (!basePath) return;

    const params = new URLSearchParams();
    if (batchId != null && batchId !== '') params.set('batch_id', String(batchId));
    params.set('type', 'batchResponse');
    const query = params.toString() ? `?${params.toString()}` : '';
    navigate(`${basePath}/response-analysis/${jobId}${query}`);
  };

  // Handle view screening questionnaire response for specific CV (opens modal)
  const handleViewScreeningResponse = (record) => {
    const email = getApplicantEmail(record);
    const resumeId = getResumeIdentifier(record);
    setResponseAnalysisModal({
      visible: true,
      jobId: jobId,
      email,
      resumeId,
    });
  };

  const handleFillRecruiterScreeningForm = (record) => {
    const email = getApplicantEmail(record);
    const resumeId = getResumeIdentifier(record);
    setRecruiterScreeningModal({
      visible: true,
      jobId: jobId,
      email,
      resumeId,
    });
  };

  const handleNavigateToResponseAnalysis = (record) => {
    const email = getApplicantEmail(record);
    const resumeId = getResumeIdentifier(record);
    const userType = user?.user_type;
    let basePath = '';
    if (userType === 'super_admin') basePath = '/super_admin';
    else if (userType === 'recruitment_manager') basePath = '/recruitment-manager';
    else if (userType === 'recruitment_executive') basePath = '/recruitment-executive';
    if (!basePath) return;
    const params = new URLSearchParams({
      email: email || '',
      resume_id: resumeId || '',
    });
    navigate(`${basePath}/response-analysis/${jobId}?${params.toString()}`);
  };

  const handleDeleteBatchResume = (record) => {
    if (isBatchOperationDisabled) {
      showBatchDisabledMessage();
      return;
    }

    const resumeId = record?.id;
    if (!resumeId) return;

    Modal.confirm({
      title: 'Move CV back to Public?',
      content: 'This will remove the CV from this batch and move it back to the Public CV list.',
      okText: 'Yes, Move',
      cancelText: 'Cancel',
      okButtonProps: {
        style: { background: '#3E6A9F', borderColor: '#3E6A9F', color: '#ffffff' },
        loading: deleteBatchResumeMutation.isLoading,
      },
      onOk: () => {
        deleteBatchResumeMutation.mutate(resumeId);
      },
    });
  };

  const handlePublicResumeUpload = () => {
    if (!publicResumeFiles || publicResumeFiles.length === 0) {
      message.error('Please select one or more CV files');
      return;
    }

    // Same conditions as Add New Batch: no add when job not Active (recruitment) or otherwise disabled
    if (isBatchOperationDisabled) {
      showBatchDisabledMessage();
      return;
    }

    addPublicResumeMutation.mutate({ jobId, resumes: publicResumeFiles });
  };

  const handleStatusConfirm = () => {
    // If changing to non-Pending status, remarks are required
    if (statusModal.newStatus !== 'Pending' && !statusModal.remarks?.trim()) {
      message.error('Remarks are required when changing status');
      return;
    }

    statusMutation.mutate({
      resumeId: statusModal.resume.id,
      status: statusModal.newStatus,
      remarks: statusModal.remarks
    });
  };




  const handleViewRemarks = (resume, batchId) => {
    setRemarksModal({
      visible: true,
      resumeId: resume.id,
      batchId: batchId,
      // Use resume remarks from batches API response
      currentRemarks: resume.remarks || '',
      isEditing: false
    });
  };

  // View / edit Sales Remarks for a single CV
  const handleViewSalesRemarks = (resume, batchId) => {
    setSalesRemarksModal({
      visible: true,
      resumeId: resume.id,
      batchId,
      currentRemarks: resume.sales_remarks || '',
    });
  };

  const handleSaveSalesRemarks = async () => {
    if (!salesRemarksModal.currentRemarks?.trim()) {
      message.error('Sales remarks cannot be empty');
      return;
    }

    try {
      const formData = new FormData();

      // Get the current resume to fetch its status
      const batch = batches.find(b => b.id === salesRemarksModal.batchId);
      const resume = batch?.resumes.find(r => r.id === salesRemarksModal.resumeId);

      // Include the current status to avoid null status error
      if (resume?.status) {
        formData.append('status', resume.status);
      }
      formData.append('sales_remarks', salesRemarksModal.currentRemarks);

      await updateResumeStatusFormData(salesRemarksModal.resumeId, formData);
      message.success('Sales remarks updated successfully');
      setSalesRemarksModal({ visible: false, resumeId: null, batchId: null, currentRemarks: '' });
      refetchBatches();
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to update sales remarks');
    }
  };

  const handleViewPmRemarks = (resume, batchId) => {
    setPmRemarksModal({
      visible: true,
      resumeId: resume.id,
      batchId: batchId,
      currentRemarks: resume.project_manager_remarks ?? '',
    });
  };

  const handleSavePmRemarks = async () => {
    if (!pmRemarksModal.currentRemarks?.trim()) {
      message.error('PM remarks cannot be empty');
      return;
    }

    try {
      const formData = new FormData();
      const batch = batches.find(b => b.id === pmRemarksModal.batchId);
      const resume = batch?.resumes.find(r => r.id === pmRemarksModal.resumeId);

      if (resume?.status) {
        formData.append('status', resume.status);
      }
      // Use key project_manager_remarks for updating (send string; backend may store null when empty)
      formData.append('project_manager_remarks', pmRemarksModal.currentRemarks ?? '');

      await updateResumeStatusFormData(pmRemarksModal.resumeId, formData);
      message.success('PM remarks updated successfully');
      setPmRemarksModal({ visible: false, resumeId: null, batchId: null, currentRemarks: '' });
      refetchBatches();
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to update PM remarks');
    }
  };

  const handleSaveRemarks = async () => {
    if (!remarksModal.currentRemarks?.trim()) {
      message.error('Remarks cannot be empty');
      return;
    }

    try {
      setRemarksSaving(true);

      const formData = new FormData();

      // Get the current resume to fetch its status
      const batch = batches.find(b => b.id === remarksModal.batchId);
      const resume = batch?.resumes.find(r => r.id === remarksModal.resumeId);

      // Include the current status to avoid null status error
      if (resume?.status) {
        formData.append('status', resume.status);
      }
      formData.append('remarks', remarksModal.currentRemarks);

      await updateResumeStatusFormData(remarksModal.resumeId, formData);
      message.success(`Remarks updated successfully${remarksModal.currentRemarks ? `: ${remarksModal.currentRemarks}` : ''}`);
      setRemarksModal({ visible: false, resumeId: null, batchId: null, currentRemarks: '', isEditing: false });
      refetchBatches();
    } catch (error) {
      message.error(error?.response?.data?.message || 'Failed to update remarks');
    } finally {
      setRemarksSaving(false);
    }
  };


  // Update CV columns to add remarks column
  const resumeColumns = batchId => [
    {
      title: 'CV Name',
      dataIndex: 'profile_name',
      key: 'profile_name',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val, record) => {
        if (record.profile_name) {
          return (
            <span style={{ fontWeight: 500, color: '#3E6A9F' }}>
              {record.profile_name}
            </span>
          );
        }

        // profile_name missing — fall back to the temporary `name` field, and allow editing it
        const editedValue = batchResumeNameEdits[record.id] ?? record.name ?? '';

        const saveName = () => {
          const trimmed = editedValue.trim();
          if (trimmed && trimmed !== record.name) {
            updateBatchResumeNameMutation.mutate({ id: record.id, name: trimmed });
          }
          setEditingBatchResumeNameId(null);
        };

        if (editingBatchResumeNameId !== record.id) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span>{record.name || <span style={{ color: '#ccc' }}>-</span>}</span>
              <EditOutlined size="1em" className="app-icon"
                style={{ cursor: 'pointer', color: '#3E6A9F', fontSize: 13 }}
                onClick={() => setEditingBatchResumeNameId(record.id)}
              />
            </span>
          );
        }

        return (
          <Input
            size="small"
            autoFocus
            value={editedValue}
            placeholder="Enter name"
            style={{ width: 220 }}
            onChange={(e) =>
              setBatchResumeNameEdits((prev) => ({ ...prev, [record.id]: e.target.value }))
            }
            onBlur={saveName}
            onPressEnter={(e) => e.target.blur()}
          />
        );
      },
    },
    {
      title: 'CV',
      dataIndex: 'resume',
      key: 'resume',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val, record) => {
        if (val) {
          const resumeUrl = val.startsWith('http') ? val : `${API_URL}${val}`;

          return (
            <FilePdfOutlined size="1em" className="app-icon"
              style={{
                cursor: 'pointer',
                color: '#ff4d4f',
                fontSize: '24px',
              }}
              onClick={() => {
                window.open(resumeUrl, '_blank', 'noopener,noreferrer');
              }}
              title="Click to view PDF"
            />
          );
        }

        const email = record?.profile_email ?? null;
        if (!email) return <span style={{ color: '#ccc' }}>-</span>;

        return (
          <FilePdfOutlined size="1em" className="app-icon"
            style={{
              cursor: 'pointer',
              color: '#3E6A9F',
              fontSize: '24px',
            }}
            onClick={() => handleViewSaasApplicationCv(record)}
            title="View applicant CV"
          />
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val, record) => {
        if (jobStatus !== 'Active') {
          return <span style={{
            color: statusColors[val] || '#666',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#f0f0f0'
          }}>
            {val || '-'}
          </span>;
        }


        const canEditStatus = canManageBatches;

        if (!canEditStatus) {
          return <span style={{
            color: statusColors[val] || '#666',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#f0f0f0'
          }}>
            {val || '-'}
          </span>;
        }

        return (
          <Select
            style={{ width: "fit-content" }}
            value={val}
            onChange={value => handleStatusChange(batchId, record.id, value)}
            popupMatchSelectWidth={false}
          >
            {statusOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: 'Sales Remarks',
      dataIndex: 'sales_remarks',
      key: 'sales_remarks',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val, record) => {
        const canEditSalesRemarks =
          (userType === 'super_admin' || userType === 'sales_manager' || userType === 'sales_executive') &&
          jobStatus === 'Active';

        return (
          <Tooltip title={val || (canEditSalesRemarks ? 'Click to add/view sales remarks' : 'No sales remarks')}>
            <MessageOutlined size="1em" className="app-icon"
              style={{
                cursor: canEditSalesRemarks ? 'pointer' : 'default',
                color: val ? '#3E6A9F' : '#d9d9d9',
                fontSize: '18px',
              }}
              onClick={
                canEditSalesRemarks
                  ? () => handleViewSalesRemarks(record, batchId)
                  : undefined
              }
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Recruiter Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val, record) => (
        <Tooltip title={val || 'Click to add/view recruiter remarks'}>
          <MessageOutlined size="1em" className="app-icon"
            style={{
              cursor: 'pointer',
              color: val ? '#3E6A9F' : '#d9d9d9',
              fontSize: '18px',
            }}
            onClick={() => handleViewRemarks(record, batchId)}
          />
        </Tooltip>
      ),
    },
    {
      title: 'PM Remarks',
      dataIndex: 'project_manager_remarks',
      key: 'project_manager_remarks',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val, record) => (
        <Tooltip title={val || (isProjectManagerUser ? 'Click to add/view PM remarks' : 'View PM remarks')}>
          <MessageOutlined size="1em" className="app-icon"
            style={{
              cursor: 'pointer',
              color: val ? '#3E6A9F' : '#d9d9d9',
              fontSize: '18px',
            }}
            onClick={() => handleViewPmRemarks(record, batchId)}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Uploaded At',
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val) => (
        <span>
          {formatDateUniversal(val, true)}
        </span>
      )
    },
    // Status History - admin only (placeholder until API is provided)
    ...(userType === 'super_admin' ? [{
      title: 'Status History',
      key: 'status_history',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, record) => (
        <Button
          type="link"
          icon={<HistoryOutlined size="1em" className="app-icon" />}
          onClick={() => setStatusHistoryModal({ visible: true, entity: record })}
          style={{ padding: 0 }}
          title="View Status History"
        />
      ),
    }] : []),
    {
      title: 'Questionnaire Link',
      dataIndex: 'is_form_shared',
      key: 'is_form_shared',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val) => (
        <span style={{
          color: val ? '#52c41a' : '#ff4d4f',
          fontWeight: 500
        }}>
          {val ? 'Shared' : 'Not Shared'}
        </span>
      ),
    },
    {
      title: 'Questionnaire',
      key: 'questionnaire',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, record) => {
        // Use is_submitted as the single source of truth:
        // - If not submitted -> allow generating/sending the questionnaire
        // - If submitted     -> allow viewing the response
        const canViewResponse = !!record.is_submitted;
        const canGenerate = !record.is_submitted;

        if (canGenerate) {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => handleGenerateLink(record)}
              style={{
                padding: '0 8px',
                height: 24,
                background: '#3E6A9F',
                borderColor: '#3E6A9F',
              }}
            >
              Generate
            </Button>
          );
        }

        if (canViewResponse) {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => handleViewScreeningResponse(record)}
              style={{
                padding: '0 8px',
                height: 24,
                background: '#52c41a',
                borderColor: '#52c41a',
              }}
            >
              View Response
            </Button>
          );
        }

        return <span style={{ color: '#999' }}>-</span>;
      },
    },
    {
      title: 'Recruiter Questionnaire',
      key: 'recruiter_questionnaire',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, record) => {
        const hasEmail = !!getApplicantEmail(record);
        const isDisabled = !!record.is_submitted || !hasEmail;
        const button = (
          <Button
            type="default"
            size="small"
            disabled={isDisabled}
            onClick={() => handleFillRecruiterScreeningForm(record)}
            style={{
              padding: '0 8px',
              height: 24,
              color: isDisabled ? undefined : '#3E6A9F',
              borderColor: isDisabled ? undefined : '#3E6A9F',
            }}
          >
            Fill Questionnaire
          </Button>
        );
        if (!hasEmail && !record.is_submitted) {
          return <Tooltip title="No email available for this CV">{button}</Tooltip>;
        }
        return button;
      },
    },
    // Actions column - recruitment manager & executive
    ...(isRecruitmentUser
      ? [{
        title: 'Actions',
        key: 'actions',
        align: 'center',
        responsive: ['xs', 'sm'],
        render: (_, record) => (
          <Tooltip title="Remove from batch and move to Public CVs">
            <Popconfirm
              title="Move CV to Public CVs?"
              description="This will remove the CV from this batch and add it to the Public CVs list."
              okText="Yes"
              cancelText="No"
              onConfirm={() => {
                if (isBatchOperationDisabled) {
                  showBatchDisabledMessage();
                  return;
                }
                deleteBatchResumeMutation.mutate(record.id);
              }}
            >
              <DeleteOutlined size="1em" className="app-icon"
                style={{
                  cursor: 'pointer',
                  color: '#ff4d4f',
                  fontSize: '18px',
                }}
              />
            </Popconfirm>
          </Tooltip>
        ),
      }]
      : []),
  ];

  const normalizeSaasApplicationRecord = (item) => ({
    ...item,
    id: item.id ?? item.application_id,
    hiring_status: item.hiring_status ?? item.status ?? null,
    candidate: item.candidate ?? item.candidate_name ?? item.name ?? null,
    email: item.email ?? item.candidate_email ?? null,
    profile_pic: item.profile_pic ?? item.profile_picture ?? null,
    score: item.score ?? item.ai_score ?? item.ai_match_score ?? null,
    applied_on: item.applied_on ?? item.applied_at ?? item.created_at ?? null,
    rating: item.rating ?? null,
    remarks: item.remarks ?? null,
    interview_rating: item.interview_rating ?? item.rating ?? null,
    interview_remarks: item.interview_remarks ?? item.remarks ?? null,
    source_type: item.source_type ?? 'profile',
    profile_id: item.profile_id ?? item.candidate_id ?? null,
    resume_id: item.resume_id ?? null,
    candidate_details_id: item.candidate_details_id ?? null,
    file: item.file ?? item.resume_url ?? item.resume ?? null,
    interview: item.interview ?? null,
    ai_profile_analysis: item.ai_profile_analysis ?? item.ai_analysis ?? null,
    is_saas_shift: item.is_saas_shift ?? false,
  });

  const saasApplicationsRows = (saasApplicationsData?.results ?? []).map(normalizeSaasApplicationRecord);

  const handleCloseSaasCvModal = () => {
    setSaasCvModal({
      visible: false,
      applicantEmail: null,
    });
    setSaasCvDetails(null);
  };

  const handleOpenSaasApplicantCvPdf = async (details) => {
    if (!details) {
      message.warning('CV details are not available');
      return;
    }
    try {
      message.loading({ content: 'Opening CV…', key: 'saasApplicantCvOpen' });
      const blob = await generateProfileCvPdfBlob(details);
      message.destroy('saasApplicantCvOpen');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (err) {
      message.destroy('saasApplicantCvOpen');
      message.error(err?.message || 'Could not open CV');
    }
  };

  const handleDownloadSaasApplicantCvPdf = async (details) => {
    if (!details) {
      message.warning('CV details are not available');
      return;
    }
    try {
      const blob = await generateProfileCvPdfBlob(details);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeCandidateDownloadName(details?.name)}_profile_cv.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err?.message || 'Download failed');
    }
  };

  const handleViewSaasApplicationCv = (record) => {
    const email = record?.email ?? record?.candidate_email ?? record?.profile_email ?? null;
    if (!email) {
      message.warning('Applicant email is not available for this application');
      return;
    }

    setSaasCvModal({
      visible: true,
      applicantEmail: email,
    });
    setSaasCvDetails(null);
  };

  const handleShiftSaasToPublicCv = (record) => {
    const email = record?.email ?? record?.candidate_email ?? null;
    if (!email) {
      message.warning('Applicant email is not available for this application');
      return;
    }
    if (!jobId) return;

    const rowKey = record?.id ?? record?.application_id ?? email;
    setShiftingSaasApplicationKey(rowKey);
    shiftSaasToPublicCvMutation.mutate({
      job_id: Number(jobId),
      email,
    });
  };

  const handleOpenSaasInterviewModal = (record) => {
    setSaasInterviewModal({ visible: true, record });
  };

  const handleOpenSaasRatingRemarksModal = (record) => {
    setSaasRatingRemarksModal({ visible: true, record });
  };

  const normalizeSaasApplicantProfile = (data, listRecord = {}) => {
    if (!data) return listRecord;

    const aiProfile = data?.ai_profile ?? {};
    const aiData = aiProfile?.data ?? {};
    const explanations = aiData?.explanations ?? {};
    const candidateProfile = data?.candidate_profile ?? {};
    const baseProfile = candidateProfile?.profile ?? {};

    const stripHtml = (value) => {
      if (!value) return '';
      return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const formatDateRange = (start, end) => {
      const startStr = start ? formatDateUniversal(start, false) : '';
      const endStr = end ? formatDateUniversal(end, false) : 'Present';
      if (!startStr && !endStr) return '';
      return `${startStr}${startStr && endStr ? ' - ' : ''}${endStr}`;
    };

    const mapDescriptionItems = (items) =>
      (Array.isArray(items) ? items : [])
        .map((item) => {
          if (typeof item === 'string') return item.trim();
          const text = stripHtml(item?.description ?? item?.text ?? '');
          return text || null;
        })
        .filter(Boolean);

    const mapPreferredJobTypes = (types) => {
      if (!Array.isArray(types) || !types.length) return [];
      const item = types[0];
      if (typeof item === 'string') return types;
      const labels = [];
      if (item.full_time) labels.push('Full time');
      if (item.part_time) labels.push('Part time');
      if (item.temporary) labels.push('Temporary');
      if (item.contract) labels.push('Contract');
      if (item.internship) labels.push('Internship');
      return labels;
    };

    const mapSkillRecency = (lastUsed) => {
      if (lastUsed == null || lastUsed === '' || lastUsed === '0') return 'Not specified';
      const years = Number(lastUsed);
      if (Number.isNaN(years)) return String(lastUsed);
      if (years <= 1) return 'Less than 1 year ago';
      if (years < 3) return 'Less than 3 years ago';
      return `${years} years ago`;
    };

    const formatSalaryExpectations = (expectations) => {
      if (!Array.isArray(expectations) || !expectations.length) return '-';
      const item = expectations[0];
      const range = [item.min_salary, item.max_salary]
        .filter((value) => value != null && value !== '')
        .map((value) => formatSalaryNum(value))
        .join(' - ');
      return [item.currency, range].filter(Boolean).join(' ') || '-';
    };

    const buildMatch = (score, summary) => ({
      score: score ?? 0,
      summary: summary || '-',
    });

    const candidateName = listRecord?.candidate ?? baseProfile?.name ?? '-';
    const candidateEmail = baseProfile?.email ?? listRecord?.email ?? listRecord?.candidate_email ?? '-';
    const candidateLocation = [baseProfile?.city, baseProfile?.country].filter(Boolean).join(', ') || '-';
    const finalScore = aiProfile?.final_score ?? listRecord?.score ?? 0;

    return {
      ...listRecord,
      score: finalScore,
      profile_pic: baseProfile?.profile_picture ?? listRecord?.profile_pic ?? null,
      candidate: candidateName,
      ai_profile_analysis: {
        ai_match_score: finalScore,
        profile: {
          name: candidateName,
          email: candidateEmail,
          phone: baseProfile?.phone ?? '-',
          location: candidateLocation,
          salary: formatSalaryExpectations(candidateProfile?.salary_expectations),
          about_me: baseProfile?.about_me ?? '',
          designation: baseProfile?.designation ?? '',
          gender: baseProfile?.gender ?? '',
          open_to_job_types: mapPreferredJobTypes(candidateProfile?.preferred_job_types),
          work_experience: (candidateProfile?.work_experience ?? []).map((item) => ({
            role: item?.role ?? '-',
            company: item?.company ?? '-',
            location: [item?.city, item?.country].filter(Boolean).join(', ') || '-',
            duration: formatDateRange(item?.start_date, item?.end_date),
            description: item?.description ?? '',
            status: item?.status ?? '',
          })),
          education: (candidateProfile?.education ?? []).map((edu) => ({
            degree: [edu?.category, edu?.degree].filter(Boolean).join(' - ') || edu?.degree || '-',
            university: edu?.institute ?? '-',
            duration: formatDateRange(edu?.start_date, edu?.end_date),
            location: [edu?.city, edu?.country].filter(Boolean).join(', ') || '-',
          })),
          skills: (candidateProfile?.skills ?? []).map((skill) => ({
            name: skill?.skill ?? skill?.name ?? '-',
            years: skill?.experience ?? skill?.years ?? '',
            recency: mapSkillRecency(skill?.last_used),
          })),
          projects: (candidateProfile?.projects ?? []).map((project) => ({
            title: project?.title ?? '-',
            description: stripHtml(project?.description),
            responsibilities: stripHtml(project?.responsibilities),
            skills: (project?.skills ?? [])
              .map((skill) => skill?.skill ?? skill?.name ?? '')
              .filter(Boolean)
              .join(', '),
          })),
          certifications: (candidateProfile?.certifications ?? []).map((cert) => ({
            name: cert?.name ?? '-',
            organization: cert?.organization ?? '-',
            duration: formatDateRange(cert?.issue_date, cert?.expiry_date),
          })),
          trainings: (candidateProfile?.trainings ?? []).map((training) => ({
            title: training?.name ?? '-',
            institution: training?.organization ?? '-',
            duration: formatDateRange(training?.start_date, training?.end_date),
            description: stripHtml(training?.description),
          })),
          extra_curricular: mapDescriptionItems(candidateProfile?.extra_curricular),
          publications: mapDescriptionItems(candidateProfile?.publications),
          references: mapDescriptionItems(candidateProfile?.references),
          achievements: mapDescriptionItems(candidateProfile?.achievements),
          volunteer_work: mapDescriptionItems(candidateProfile?.volunteer_work),
          languages: (candidateProfile?.languages ?? []).map((lang) => ({
            name: lang?.language_name ?? lang?.name ?? '-',
            proficiency: lang?.proficiency ?? '',
          })),
        },
        job_type_match: buildMatch(aiData?.job_type_match_percentage, explanations?.job_type),
        location_match: buildMatch(aiData?.location_match_percentage, explanations?.location),
        experience_match: buildMatch(aiData?.experience_match_percentage, explanations?.experience),
        education_match: buildMatch(aiData?.education_match_percentage, explanations?.education),
        skills_match: buildMatch(aiData?.skills_match_percentage, explanations?.skills),
      },
    };
  };

  const saasAiProfileModalRecord = React.useMemo(
    () => normalizeSaasApplicantProfile(saasApplicantProfileData, saasAiProfileModal.record),
    [saasApplicantProfileData, saasAiProfileModal.record]
  );

  const handleOpenSaasAiProfileModal = (record) => {
    const applicationId = record?.id ?? record?.application_id;
    if (!applicationId) {
      message.warning('Application ID is not available for this row');
      return;
    }
    setSaasAiProfileModal({ visible: true, applicationId, record });
  };

  const saasActionButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 4,
    background: '#3E6A9F',
    color: '#fff',
    cursor: 'pointer',
  };

  // Public CV table columns
  const getSaasColumnSortOrder = (columnKey) => {
    const activeSort = saasApplicationsSorting?.[0];
    if (!activeSort || activeSort.id !== columnKey) return null;
    return activeSort.desc ? 'descend' : 'ascend';
  };

  const handleSaasApplicationsTableChange = (pagination, _filters, sorter) => {
    if (pagination?.current != null && pagination.current !== saasApplicationsPage) {
      setSaasApplicationsPage(pagination.current);
    }
    if (pagination?.pageSize != null && pagination.pageSize !== saasApplicationsPageSize) {
      setSaasApplicationsPageSize(pagination.pageSize);
      setSaasApplicationsPage(1);
    }

    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const sortField = activeSorter?.field || activeSorter?.columnKey || null;
    const sortOrder = activeSorter?.order || null;
    const nextSorting = sortField && sortOrder
      ? [{ id: sortField, desc: sortOrder === 'descend' }]
      : [];

    const currentSort = saasApplicationsSorting[0];
    const nextSort = nextSorting[0];
    const sortingChanged =
      (currentSort?.id || null) !== (nextSort?.id || null) ||
      Boolean(currentSort?.desc) !== Boolean(nextSort?.desc);

    if (sortingChanged) {
      setSaasApplicationsSorting(nextSorting);
      setSaasApplicationsPage(1);
    }
  };

  const getAiScoreColor = (score) => {
    const value = Number(score);
    if (Number.isNaN(value)) return '#8c8c8c';
    if (value < 50) return '#ff4d4f';
    if (value < 75) return '#faad14';
    return '#52c41a';
  };

  const saasApplicationsColumns = [
    {
      title: '#',
      key: 'row_index',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, __, index) => (
        <span>{(saasApplicationsPage - 1) * saasApplicationsPageSize + index + 1}</span>
      ),
    },
    {
      title: 'Hiring Status',
      dataIndex: 'hiring_status',
      key: 'hiring_status',
      align: 'left',
      responsive: ['xs', 'sm'],
      sorter: true,
      sortOrder: getSaasColumnSortOrder('hiring_status'),
      render: (val) => (
        <span style={{
          color: statusColors[val] || '#666',
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: '#f0f0f0',
        }}>
          {val || '-'}
        </span>
      ),
    },
    {
      title: 'Candidate',
      dataIndex: 'candidate',
      key: 'candidate',
      align: 'left',
      responsive: ['xs', 'sm'],
      sorter: true,
      sortOrder: getSaasColumnSortOrder('candidate'),
      render: (val, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={record.profile_pic || ProfileImagePlaceholder}
            alt={val || 'Candidate'}
            style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ fontWeight: 500, color: '#3E6A9F' }}>
            {val || '-'}
          </span>
        </div>
      ),
    },
    {
      title: 'AI Score',
      dataIndex: 'score',
      key: 'score',
      align: 'left',
      responsive: ['xs', 'sm'],
      sorter: true,
      sortOrder: getSaasColumnSortOrder('score'),
      render: (val) => {
        if (val == null || val === '') return <span>-</span>;
        const color = getAiScoreColor(val);
        return (
          <span style={{
            display: 'inline-block',
            minWidth: 48,
            padding: '2px 8px',
            borderRadius: 12,
            backgroundColor: `${color}20`,
            color,
            fontWeight: 600,
            textAlign: 'center',
          }}>
            {`${val}%`}
          </span>
        );
      },
    },
    {
      title: 'AI Profile Summary',
      key: 'ai_profile_summary',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, record) => (
        <span
          style={saasActionButtonStyle}
          title="AI Profile Summary"
          role="button"
          tabIndex={0}
          onClick={() => handleOpenSaasAiProfileModal(record)}
          onKeyDown={(e) => e.key === 'Enter' && handleOpenSaasAiProfileModal(record)}
        >
          <UserOutlined size="1em" className="app-icon" />
        </span>
      ),
    },
    {
      title: 'Applied On',
      dataIndex: 'applied_on',
      key: 'applied_on',
      align: 'left',
      responsive: ['xs', 'sm'],
      sorter: true,
      sortOrder: getSaasColumnSortOrder('applied_on'),
      render: (val) => (
        <span>{val ? formatDateUniversal(val, false) : '-'}</span>
      ),
    },
    {
      title: 'CV',
      key: 'cv',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, record) => {
        const email = record?.email ?? record?.candidate_email ?? null;
        if (!email) return <span style={{ color: '#ccc' }}>-</span>;

        return (
          <FilePdfOutlined size="1em" className="app-icon"
            style={{
              cursor: 'pointer',
              color: '#3E6A9F',
              fontSize: '24px',
            }}
            onClick={() => handleViewSaasApplicationCv(record)}
            title="View applicant CV"
          />
        );
      },
    },
    {
      title: 'Shift to Public CV',
      key: 'shift_to_public_cv',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, record) => {
        if (record?.is_saas_shift) {
          return <span style={{ color: '#52c41a', fontWeight: 500 }}>Converted</span>;
        }

        if (isSaasApplicationsReadOnly) {
          return <span style={{ color: '#8c8c8c', fontWeight: 500 }}>Not Converted</span>;
        }
    
        const rowKey = record?.id ?? record?.application_id ?? record?.email ?? record?.candidate_email;
        const isShifting =
          shiftSaasToPublicCvMutation.isLoading && shiftingSaasApplicationKey === rowKey;
    
        return (
          <Button
            type="primary"
            size="small"
            onClick={() => handleShiftSaasToPublicCv(record)}
            loading={isShifting}
            disabled={shiftSaasToPublicCvMutation.isLoading && !isShifting}
            style={{
              background: '#3E6A9F',
              color: '#fff',
              borderColor: '#3E6A9F',
            }}
          >
            Shift to Public CV
          </Button>
        );
      },
    },
  ];

  const publicResumeColumns = [
    {
      title: 'CV Name',
      dataIndex: 'profile_name',
      key: 'profile_name',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val, record) => {
        if (record.profile_name) {
          return (
            <span style={{ fontWeight: 500, color: '#3E6A9F' }}>
              {record.profile_name}
            </span>
          );
        }

        // profile_name missing — fall back to the temporary `name` field, and allow editing it
        const editedValue = publicResumeNameEdits[record.id] ?? record.name ?? '';

        const saveName = () => {
          const trimmed = editedValue.trim();
          if (trimmed && trimmed !== record.name) {
            updatePublicResumeNameMutation.mutate({ id: record.id, name: trimmed });
          }
          setEditingPublicResumeNameId(null);
        };

        if (editingPublicResumeNameId !== record.id) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span>{record.name || <span style={{ color: '#ccc' }}>-</span>}</span>
              <EditOutlined size="1em" className="app-icon"
                style={{ cursor: 'pointer', color: '#3E6A9F', fontSize: 13 }}
                onClick={() => setEditingPublicResumeNameId(record.id)}
              />
            </span>
          );
        }

        return (
          <Input
            size="small"
            autoFocus
            value={editedValue}
            placeholder="Enter name"
            style={{ width: 220 }}
            onChange={(e) =>
              setPublicResumeNameEdits((prev) => ({ ...prev, [record.id]: e.target.value }))
            }
            onBlur={saveName}
            onPressEnter={(e) => e.target.blur()}
          />
        );
      },
    },
    {
      title: 'CV File',
      dataIndex: 'profile_email',
      key: 'profile_email',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, record) => {
        const email = record?.profile_email ?? null;
        const resumeUrl = record?.resume_url ?? null;

        if (email) {
          return (
            <FilePdfOutlined size="1em" className="app-icon"
              style={{
                cursor: 'pointer',
                color: '#3E6A9F',
                fontSize: '24px',
              }}
              onClick={() => handleViewSaasApplicationCv(record)}
              title="View applicant CV"
            />
          );
        }

        if (resumeUrl) {
          const fullUrl = resumeUrl.startsWith('http') ? resumeUrl : `${API_URL}${resumeUrl}`;

          return (
            <FilePdfOutlined size="1em" className="app-icon"
              style={{
                cursor: 'pointer',
                color: '#ff4d4f',
                fontSize: '24px',
              }}
              onClick={() => {
                window.open(fullUrl, '_blank', 'noopener,noreferrer');
              }}
              title="Click to view PDF"
            />
          );
        }

        return <span style={{ color: '#ccc' }}>-</span>;
      },
    },
    {
      title: 'Uploaded At',
      dataIndex: 'created_at',
      key: 'created_at',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val) => (
        <span>
          {formatDateUniversal(val, true)}
        </span>
      )
    },
    {
      title: 'Questionnaire Link',
      dataIndex: 'is_form_shared',
      key: 'is_form_shared',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val) => (
        <span style={{
          color: val ? '#52c41a' : '#ff4d4f',
          fontWeight: 500
        }}>
          {val ? 'Shared' : 'Not Shared'}
        </span>
      ),
    },
    {
      title: 'Questionnaire',
      key: 'questionnaire',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, record) => {

        const canViewResponse = !!record.is_submitted;
        const canGenerate = !record.is_submitted;

        if (canGenerate) {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => handleGenerateLink(record, true)}
              style={{
                padding: '0 8px',
                height: 24,
                background: '#3E6A9F',
                borderColor: '#3E6A9F',
              }}
            >
              Generate
            </Button>
          );
        }

        if (canViewResponse) {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => handleViewScreeningResponse(record)}
              style={{
                padding: '0 8px',
                height: 24,
                background: '#52c41a',
                borderColor: '#52c41a',
              }}
            >
              View Response
            </Button>
          );
        }

        return <span style={{ color: '#999' }}>-</span>;
      },
    },
    {
      title: 'Recruiter Questionnaire',
      key: 'recruiter_questionnaire',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, record) => {
        const hasEmail = !!getApplicantEmail(record);
        const isDisabled = !!record.is_submitted || !hasEmail;
        const button = (
          <Button
            type="default"
            size="small"
            disabled={isDisabled}
            onClick={() => handleFillRecruiterScreeningForm(record)}
            style={{
              padding: '0 8px',
              height: 24,
              color: isDisabled ? undefined : '#3E6A9F',
              borderColor: isDisabled ? undefined : '#3E6A9F',
            }}
          >
            Fill Questionnaire
          </Button>
        );
        if (!hasEmail && !record.is_submitted) {
          return <Tooltip title="No email available for this CV">{button}</Tooltip>;
        }
        return button;
      },
    },

    {
      title: 'Shift to Batch',
      key: 'shift_to_batch',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (_, record) =>

        <Button
          type="primary"
          size="small"
          onClick={() => setShiftToBatchModal({
            visible: true,
            publicResumeId: record.id,
            resumeName: record.profile_name || 'N/A',
            selectedBatchId: null,
          })}
          style={{
            background: '#3E6A9F',
            color: '#fff',
            borderColor: '#3E6A9F',
          }}
        >
          Shift to Batch
        </Button>

    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      align: 'left',
      responsive: ['xs', 'sm'],
      render: (val) => (
        <span>
          {val || '-'}
        </span>
      ),
    },
  ];


  const mainContentLoading = batchesLoading || clientLoading;

  return (
    <>
      <BreadCrumb
        goBack={goBack}
        linkText={`${breadcrumbClientStatus} > Projects > Jobs > CV Batches`}
      />

      <Spin
        spinning={mainContentLoading}
        indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />}
        size="large"
        style={{ minHeight: 320 }}
      >
        <>
          {/* Three Cards Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            marginBottom: 24,
            margin: '16px',
            padding: '0 8px'
          }}>
            <ProjectDetailCard
              projectData={batchesData}
              clientData={clientData}
              currentUser={user}
              projectId={batchesData?.project_id}
              onStatusChange={() => {
                refetchBatches();
              }}
              wrapInGrid={false}
            />

            <JobDetailsStatsCard
              batchesData={batchesData}
              jobId={jobId}
              isRecruitmentUser={isRecruitmentUser}
              showSaasJobStatus={true}
              isReadOnly={isProjectManagerUser}
              pendingResumes={pendingResumes}
              hiredResumes={hiredResumes}
              rejectedResumes={rejectedResumes}
              availableScreenings={availableScreenings}
              screeningsLoading={screeningsLoading}
              selectedScreeningForm={selectedScreeningForm}
              setSelectedScreeningForm={setSelectedScreeningForm}
              handleUpdateScreeningForm={handleUpdateScreeningForm}
              handleViewScreeningResponses={handleViewScreeningResponses}
              updateScreeningFormMutation={updateScreeningFormMutation}
              setJobRemarksModal={setJobRemarksModal}
              jobActive={jobStatus === 'Active'}
              isProjectApprovalPending={isProjectApprovalPending}
              onSettingsUpdated={refetchBatches}
            />

          </div>

          <div style={{ margin: '16px', padding: '0 8px' }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              className="job-headhunting-tabs"
              style={{ marginBottom: '16px' }}
              tabBarStyle={{
                background: 'white',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <Tabs.TabPane tab="CV Batches" key="batches">
                {batchesLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text>Loading batches...</Text>
                  </div>
                ) : batches.length === 0 ? (
                  <>
                    <Text>No batches found for this job.</Text><br />
                    {canManageBatches && !isBatchOperationDisabled && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined size="1em" className="app-icon" />}
                        style={{
                          marginBottom: '16px',
                          marginRight: '16px',
                          background: '#3E6A9F',
                          borderColor: '#3E6A9F',
                          width: '100%',
                          maxWidth: '200px',
                        }}
                        onClick={() => setAddBatchModal(true)}
                      >
                        Add New Batch
                      </Button>
                    )}
                    {isBatchOperationDisabled && (
                      <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                        {isProjectApprovalPending
                          ? 'This project must be approved by both the Recruitment Manager and Recruiter before batches can be managed.'
                          : 'Cannot add batches. Job status must be "Active".'}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    {canManageBatches && !isBatchOperationDisabled && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                        <Button
                          type="primary"
                          icon={<PlusOutlined size="1em" className="app-icon" />}
                          style={{
                            marginRight: '0px',
                            background: '#3E6A9F',
                            borderColor: '#3E6A9F',
                            width: '100%',
                            maxWidth: '200px',
                          }}
                          onClick={() => setAddBatchModal(true)}
                        >
                          Add New Batch
                        </Button>
                        <Tooltip
                          title={
                            hasScreeningFormAttached
                              ? 'View screening questionnaire responses for batch CVs'
                              : 'No screening questionnaire attached. Add one in Job Settings first.'
                          }
                        >
                          <span style={{ display: 'inline-block' }}>
                            <Button
                              type="default"
                              size="medium"
                              disabled={!hasScreeningFormAttached}
                              onClick={() => handleViewBatchScreeningResponses()}
                              style={{
                                borderColor: '#3E6A9F',
                                color: hasScreeningFormAttached ? '#3E6A9F' : undefined,
                                minWidth: '120px',
                              }}
                            >
                              View Batch CV Responses
                            </Button>
                          </span>
                        </Tooltip>

                      </div>
                    )}
                    {batchesData?.count > batchPageSize && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                        <Pagination
                          current={batchPage}
                          pageSize={batchPageSize}
                          total={batchesData?.count || 0}
                          onChange={(page) => setBatchPage(page)}
                          showSizeChanger={false}
                          size="small"
                        />
                      </div>
                    )}
                    {batches.map(batch => (
                      <Card
                        key={batch.id}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{batch.batch_name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {batch.cv_submission_deadline && (
                                <span>
                                  CV Submission Deadline: {formatDateUniversal(batch.cv_submission_deadline, false)}
                                </span>
                              )}
                              {false && canManageBatches && !isBatchOperationDisabled && (
                                <Tooltip title="Add CVs to this batch">
                                  <Button
                                    type="primary"
                                    icon={<PlusOutlined size="1em" className="app-icon" />}
                                    onClick={() => handleEditBatch(batch)}
                                    style={{
                                      background: '#3E6A9F',
                                      borderColor: '#3E6A9F',
                                      borderRadius: '4px',
                                      padding: '4px 8px',
                                      height: 'auto',
                                    }}
                                  >
                                    Add CVs
                                  </Button>
                                </Tooltip>
                              )}
                              {canManageBatches && !isBatchOperationDisabled && !/^batch\s*1$/i.test(batch.batch_name?.trim()) && (
                                <Tooltip title="Delete Batch">
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined size="1em" className="app-icon" />}
                                    onClick={() => handleDeleteBatch(batch)}
                                    style={{
                                      padding: '4px 8px',
                                      height: 'auto',
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        }
                        style={{
                          marginBottom: 24,
                          border: '1px solid #3E6A9F',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(62, 106, 159, 0.15)'
                        }}
                        headStyle={{
                          backgroundColor: '#f8f9fa',
                          borderBottom: '1px solid #3E6A9F'
                        }}
                      >
                        <Text type="secondary">
                          Created At: {formatDateUniversal(batch.created_at, true)}
                        </Text>
                        <div style={{ overflowX: 'auto' }}>
                          <Table
                            columns={resumeColumns(batch.id)}
                            dataSource={batch.resumes.map((r) => ({ ...r, key: r.id }))}
                            pagination={{
                              pageSize: 10,
                              showSizeChanger: false,
                              showQuickJumper: false,
                              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} CVs`,
                            }}
                            locale={{ emptyText: 'No CVs in this batch.' }}
                            style={{ marginTop: 12, minWidth: 600 }}
                            size="small"
                            className="resume-table"
                            scroll={{ x: 600 }}
                          />
                        </div>
                      </Card>
                    ))}
                    {batchesData?.count > batchPageSize && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, marginBottom: 8 }}>
                        <Pagination
                          current={batchPage}
                          pageSize={batchPageSize}
                          total={batchesData?.count || 0}
                          onChange={(page) => setBatchPage(page)}
                          showSizeChanger={false}
                          size="small"
                        />
                      </div>
                    )}
                  </>
                )}
              </Tabs.TabPane>

              {!isProjectManagerUser && (
                <Tabs.TabPane tab="Public CV" key="public">
                  {batchesData?.screening_form && batchesData?.screening_form !== '' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                      <Button
                        type="default"
                        onClick={handleViewScreeningResponses}
                        style={{
                          borderColor: '#3E6A9F',
                          color: '#3E6A9F',
                          minWidth: '120px'
                        }}
                      >
                        View Public CV Responses
                      </Button>
                    </div>
                  )}
                  <Spin
                    spinning={publicResumeLoading}
                    indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin" style={{ fontSize: 32 }}  />}
                    style={{ minHeight: 200 }}
                  >
                    <Card
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{`Public CV (${publicResumeData?.count || 0})`}</span>
                          {canManageBatches && !isBatchOperationDisabled && (
                            <Button
                              type="primary"
                              onClick={() => {
                                if (addPublicResumeMutation.isLoading) return;
                                if (isBatchOperationDisabled) {
                                  showBatchDisabledMessage();
                                  return;
                                }
                                setPublicResumeModal(true);
                              }}
                              style={{
                                background: '#3E6A9F',
                                borderColor: '#3E6A9F',
                              }}
                              loading={addPublicResumeMutation.isLoading}
                            >
                              Add CVs
                            </Button>
                          )}
                        </div>
                      }
                      style={{
                        border: '1px solid #3E6A9F',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(62, 106, 159, 0.15)'
                      }}
                      headStyle={{
                        backgroundColor: '#f8f9fa',
                        borderBottom: '1px solid #3E6A9F'
                      }}
                    >
                      <Text type="secondary" style={{ marginBottom: '12px', display: 'block' }}>
                        Public CVs submitted for this job position
                      </Text>
                      <div style={{ overflowX: 'auto' }}>
                        <Table
                          columns={publicResumeColumns}
                          dataSource={publicResumeData?.results?.map((r) => ({ ...r, key: r.id })) || []}
                          pagination={{
                            current: publicResumeData?.current_page ?? publicResumePage,
                            total: publicResumeData?.count ?? 0,
                            pageSize: publicResumeData?.size ?? publicResumePageSize,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                            showQuickJumper: false,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} CVs`,
                          }}
                          onChange={(pagination) => {
                            if (pagination?.current !== undefined && pagination.current !== publicResumePage) {
                              setPublicResumePage(pagination.current);
                            }
                            if (pagination?.pageSize !== undefined && pagination.pageSize !== publicResumePageSize) {
                              setPublicResumePageSize(pagination.pageSize);
                              setPublicResumePage(1);
                            }
                          }}
                          locale={{ emptyText: 'No public CVs found for this job.' }}
                          style={{ marginTop: 12, minWidth: 600 }}
                          size="small"
                          className="resume-table"
                          scroll={{ x: 600 }}
                        />
                      </div>
                    </Card>
                  </Spin>
                </Tabs.TabPane>
              )}

              {canViewSaasApplications && (
                <Tabs.TabPane tab="Job Portal Applications" key="saas">
                  <Spin
                    spinning={saasApplicationsLoading || saasApplicationsFetching}
                    indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin" style={{ fontSize: 32 }}  />}
                    style={{ minHeight: 200 }}
                  >
                    {saasApplicationsError && (
                      <div style={{
                        margin: '16px 0',
                        padding: '16px 20px',
                        background: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: 8,
                        color: '#cf1322',
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                        <span style={{ fontSize: 18 }}>⚠</span>
                        <span>
                          {saasApplicationsErrorData?.message ||
                            saasApplicationsErrorData?.details?.message ||
                            'Failed to load Job Portal applications.'}
                        </span>
                      </div>
                    )}
                    <Card
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{`Job Portal Applications (${saasApplicationsData?.count ?? 0})`}</span>
                        </div>
                      }
                      style={{
                        border: '1px solid #3E6A9F',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(62, 106, 159, 0.15)',
                      }}
                      headStyle={{
                        backgroundColor: '#f8f9fa',
                        borderBottom: '1px solid #3E6A9F',
                      }}
                    >
                      
                      <div style={{ overflowX: 'auto' }}>
                        <Table
                          columns={saasApplicationsColumns}
                          dataSource={saasApplicationsRows.map((r, index) => ({ ...r, key: r.id ?? index }))}
                          pagination={{
                            current: saasApplicationsPage,
                            total: saasApplicationsData?.count ?? 0,
                            pageSize: saasApplicationsPageSize,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                            showQuickJumper: false,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} applications`,
                          }}
                          onChange={handleSaasApplicationsTableChange}
                          locale={{ emptyText: 'No Job Portal applications found for this job.' }}
                          style={{ marginTop: 12, minWidth: 600 }}
                          size="small"
                          className="resume-table"
                          scroll={{ x: 1200 }}
                        />
                      </div>
                    </Card>
                  </Spin>
                </Tabs.TabPane>
              )}
            </Tabs>
          </div>

          <Modal
            title="Add New Batch"
            open={addBatchModal}
            onOk={handleAddBatch}
            onCancel={() => {
              setAddBatchModal(false);
              setBatchFiles([]);
              setCvSubmissionDeadline(batchesData?.cv_submission_deadline ? dayjs(batchesData.cv_submission_deadline) : null);
              if (batchFileInputRef.current) {
                batchFileInputRef.current.value = '';
              }
            }}
            okText="Add"
            cancelText="Cancel"
            width="90%"
            style={{ maxWidth: '500px' }}
            okButtonProps={{
              style: { background: '#3E6A9F', color: '#fff', border: 'none' },
              loading: createBatchMutation.isLoading
            }}
            cancelButtonProps={{
              style: { borderColor: '#3E6A9F', color: '#3E6A9F' }
            }}
          >
            {/* CV Submission Deadline Field - Mandatory */}
            <div style={{ marginBottom: '16px' }}>
              <p>CV Submission Deadline*</p>
              <DatePicker
                style={{ width: "100%" }}
                value={cvSubmissionDeadline}
                onChange={setCvSubmissionDeadline}
                format={(value) => value ? formatDateUniversal(value.toISOString(), false) : ''}
                disabled={batches.length === 0}
                showTime={false}
              />
            </div>

            {false && (
              <>
                <p>Upload CV</p>
                {createBatchMutation.isLoading && (
                  <div style={{ marginBottom: 8 }}>
                    <Spin size="small" indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} />
                  </div>
                )}
                <input
                  ref={batchFileInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  style={{ width: '100%' }}
                  onChange={e => setBatchFiles(Array.from(e.target.files))}
                  disabled={createBatchMutation.isLoading}
                />
                {batchFiles.length > 0 && (
                  <div style={{ marginTop: 8, color: '#3E6A9F', wordBreak: 'break-word' }}>
                    <strong>Selected files:</strong><br />
                    {batchFiles.map((f, index) => (
                      <div key={index} style={{ fontSize: '12px', marginTop: '4px' }}>
                        {truncateFileName(f.name)}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Modal>

          {/* Add Public CVs Modal */}
          <Modal
            title="Add CVs to Public CV"
            open={publicResumeModal}
            onCancel={() => {
              setPublicResumeModal(false);
              setPublicResumeFiles([]);
              if (publicResumeFileInputRef.current) {
                publicResumeFileInputRef.current.value = '';
              }
            }}
            onOk={handlePublicResumeUpload}
            okText="Add"
            cancelText="Cancel"
            width="90%"
            style={{ maxWidth: '500px' }}
            okButtonProps={{
              style: { background: '#3E6A9F', color: '#fff', border: 'none' },
              loading: addPublicResumeMutation.isLoading,
              disabled: !publicResumeFiles.length,
            }}
            cancelButtonProps={{
              style: { borderColor: '#3E6A9F', color: '#3E6A9F' },
              disabled: addPublicResumeMutation.isLoading,
            }}
          >
            <p>Upload CVs (PDF)</p>
            {addPublicResumeMutation.isLoading && (
              <div style={{ marginBottom: 8 }}>
                <Spin size="small" indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} />
              </div>
            )}
            <input
              ref={publicResumeFileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              style={{ width: '100%' }}
              onChange={(e) => setPublicResumeFiles(Array.from(e.target.files || []))}
              disabled={addPublicResumeMutation.isLoading}
            />
            {publicResumeFiles.length > 0 && (
              <div style={{ marginTop: 8, color: '#3E6A9F', wordBreak: 'break-word' }}>
                <strong>Selected files:</strong><br />
                {publicResumeFiles.map((f, index) => (
                  <div key={index} style={{ fontSize: '12px', marginTop: '4px' }}>
                    {truncateFileName(f.name)}
                  </div>
                ))}
              </div>
            )}
          </Modal>

          {/* Shift public resume to batch modal */}
          <Modal
            title={`Shift to Batch${shiftToBatchModal.resumeName ? `: ${shiftToBatchModal.resumeName}` : ''}`}
            open={shiftToBatchModal.visible}
            onCancel={() => setShiftToBatchModal({ visible: false, publicResumeId: null, resumeName: '', selectedBatchId: null })}
            onOk={() => {
              if (!shiftToBatchModal.selectedBatchId || !shiftToBatchModal.publicResumeId) return;
              shiftToBatchMutation.mutate({
                publicResumeId: shiftToBatchModal.publicResumeId,
                batchId: shiftToBatchModal.selectedBatchId,
              });
            }}
            okText="Shift"
            cancelText="Cancel"
            okButtonProps={{
              disabled: !shiftToBatchModal.selectedBatchId,
              loading: shiftToBatchMutation.isLoading,
              style: { background: '#3E6A9F', borderColor: '#3E6A9F', color: '#ffffff' },
            }}
            cancelButtonProps={{ style: { borderColor: '#3E6A9F', color: '#3E6A9F' } }}
          >
            <div style={{ marginBottom: 16 }}>
              <span style={{ display: 'block', marginBottom: 8 }}>Choose batch:</span>
              <Select
                placeholder="Select batch"
                value={shiftToBatchModal.selectedBatchId}
                onChange={(batchId) => setShiftToBatchModal((prev) => ({ ...prev, selectedBatchId: batchId }))}
                style={{ width: '100%' }}
                loading={jobBatchesListLoading}
                allowClear
              >
                {(Array.isArray(jobBatchesList) ? jobBatchesList : []).map((b) => (
                  <Option key={b.id} value={b.id}>
                    {b.batch_name || `Batch ${b.id}`}
                  </Option>
                ))}
              </Select>
            </div>
          </Modal>

          {/* Edit Batch Modal */}
          <Modal
            title={editBatchModal.batchName ? `Edit Batch • ${editBatchModal.batchName}` : 'Edit Batch'}
            open={editBatchModal.visible}
            onCancel={() => {
              setEditBatchModal({ visible: false, batchId: null, batchName: '', deadline: null });
              setEditBatchFiles([]);
              // Clear the file input when modal closes
              if (editBatchFileInputRef.current) {
                editBatchFileInputRef.current.value = '';
              }
            }}
            width="90%"
            style={{ maxWidth: '500px' }}
            footer={[
              <Button
                key="cancel"
                onClick={() => {
                  setEditBatchModal({ visible: false, batchId: null, batchName: '', deadline: null });
                  setEditBatchFiles([]);
                  if (editBatchFileInputRef.current) {
                    editBatchFileInputRef.current.value = '';
                  }
                }}
                style={{ borderColor: '#3E6A9F', color: '#3E6A9F' }}
                disabled={addResumesToBatchMutation.isLoading}
              >
                Cancel
              </Button>,
              ...(
                // For recruitment manager/executive: hide Update when no file chosen
                (!isRecruitmentUser || editBatchFiles.length > 0)
                  ? [
                    <Button
                      key="update"
                      type="primary"
                      onClick={handleEditBatchSubmit}
                      style={{ background: '#3E6A9F', color: '#fff', border: 'none' }}
                      loading={addResumesToBatchMutation.isLoading}
                    >
                      Update
                    </Button>,
                  ]
                  : []
              ),
            ]}
          >
            {/* CV Submission Deadline Field - Mandatory */}


            <p>Upload CVs</p>
            {addResumesToBatchMutation.isLoading && (
              <div style={{ marginBottom: 8 }}><Spin size="small" indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} /></div>
            )}
            <input
              ref={editBatchFileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              style={{ width: '100%' }}
              onChange={e => setEditBatchFiles(Array.from(e.target.files || []))}
              disabled={addResumesToBatchMutation.isLoading}
            />
            {editBatchFiles.length > 0 && (
              <div style={{ marginTop: 8, color: '#3E6A9F', wordBreak: 'break-word' }}>
                <strong>Selected files:</strong><br />
                {editBatchFiles.map((f, index) => (
                  <div key={index} style={{ fontSize: '12px', marginTop: '4px' }}>
                    {truncateFileName(f.name)}
                  </div>
                ))}
              </div>
            )}
          </Modal>

          {/* CV Remarks Modal */}
          <Modal
            title="Remarks"
            open={remarksModal.visible}
            onCancel={() => setRemarksModal({ visible: false, resumeId: null, batchId: null, currentRemarks: '', isEditing: false })}
            footer={[
              <Button
                key="cancel"
                onClick={() => setRemarksModal({ visible: false, resumeId: null, batchId: null, currentRemarks: '', isEditing: false })}
              >
                Close
              </Button>,
              canManageBatches && jobStatus === 'Active' && (
                <Button
                  key="save"
                  type="primary"
                  onClick={handleSaveRemarks}
                  style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
                  loading={remarksSaving}
                >
                  Save
                </Button>
              )
            ]}
            width="90%"
            style={{ maxWidth: '600px' }}
          >
            {canManageBatches && jobStatus === 'Active' ? (
              <TextArea
                value={remarksModal.currentRemarks}
                onChange={(e) => setRemarksModal(prev => ({ ...prev, currentRemarks: e.target.value }))}
                rows={6}
                placeholder="Enter remarks..."
                maxLength={1000}
                showCount
                style={{
                  marginTop: 12,
                  marginBottom: 24,
                  // add space below char count and above footer buttons
                }}
              />
            ) : (
              <div style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                minHeight: '100px',
                whiteSpace: 'pre-wrap'
              }}>
                {remarksModal.currentRemarks || 'No remarks available'}
              </div>
            )}
          </Modal>

          {/* Sales Remarks Modal */}
          <Modal
            title="Sales Remarks"
            open={salesRemarksModal.visible}
            onCancel={() =>
              setSalesRemarksModal({
                visible: false,
                resumeId: null,
                batchId: null,
                currentRemarks: '',
              })
            }
            footer={[
              <Button
                key="cancel"
                onClick={() =>
                  setSalesRemarksModal({
                    visible: false,
                    resumeId: null,
                    batchId: null,
                    currentRemarks: '',
                  })
                }
              >
                Close
              </Button>,
              (userType === 'super_admin' || userType === 'sales_manager' || userType === 'sales_executive') &&
              jobStatus === 'Active' && (
                <Button
                  key="save"
                  type="primary"
                  onClick={handleSaveSalesRemarks}
                  style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
                >
                  Save
                </Button>
              ),
            ]}
            width="90%"
            style={{ maxWidth: '600px' }}
          >
            {(userType === 'super_admin' || userType === 'sales_manager' || userType === 'sales_executive') &&
              jobStatus === 'Active' ? (
              <TextArea
                value={salesRemarksModal.currentRemarks}
                onChange={(e) =>
                  setSalesRemarksModal(prev => ({ ...prev, currentRemarks: e.target.value }))
                }
                rows={6}
                placeholder="Enter sales remarks..."
                maxLength={1000}
                showCount
                style={{
                  marginTop: 12,
                  marginBottom: 24,
                }}
              />
            ) : (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  minHeight: '100px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {salesRemarksModal.currentRemarks || 'No sales remarks available'}
              </div>
            )}
          </Modal>

          {/* PM Remarks Modal - visible to everyone; only PM can edit */}
          <Modal
            title="PM Remarks"
            open={pmRemarksModal.visible}
            onCancel={() =>
              setPmRemarksModal({
                visible: false,
                resumeId: null,
                batchId: null,
                currentRemarks: '',
              })
            }
            footer={[
              <Button
                key="cancel"
                onClick={() =>
                  setPmRemarksModal({
                    visible: false,
                    resumeId: null,
                    batchId: null,
                    currentRemarks: '',
                  })
                }
              >
                Close
              </Button>,
              isProjectManagerUser && jobStatus === 'Active' && (
                <Button
                  key="save"
                  type="primary"
                  onClick={handleSavePmRemarks}
                  style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
                >
                  Save
                </Button>
              ),
            ]}
            width="90%"
            style={{ maxWidth: '600px' }}
          >
            {isProjectManagerUser && jobStatus === 'Active' ? (
              <TextArea
                value={pmRemarksModal.currentRemarks}
                onChange={(e) =>
                  setPmRemarksModal(prev => ({ ...prev, currentRemarks: e.target.value }))
                }
                rows={6}
                placeholder="Enter PM remarks for this CV..."
                maxLength={1000}
                showCount
                style={{
                  marginTop: 12,
                  marginBottom: 24,
                }}
              />
            ) : (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  minHeight: '100px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {pmRemarksModal.currentRemarks || 'No PM remarks available'}
              </div>
            )}
          </Modal>

          {/* Status Change Confirmation Modal */}

          <Suspense fallback={null}>
            <ConfirmationModal
              showModal={statusModal.visible}
              setShowModal={(visible) => setStatusModal(prev => ({ ...prev, visible }))}
              mutation={statusMutation}
              oldStatus={statusModal.oldStatus}
              newStatus={statusModal.newStatus}
              details={statusModal.resume ? {
                'CV File': statusModal.resume.resume ? truncateFileName(statusModal.resume.resume.split('/').pop(), 10) : 'CV',
                'Batch': batches.find(b => b.id === statusModal.batchId)?.batch_name || 'Unknown Batch',
                'Uploaded At': statusModal.resume.created_at ? formatDateUniversal(statusModal.resume.created_at, true) : '-',
                ...(statusModal.newStatus !== 'Pending' && {
                  'Remarks': (
                    <TextArea
                      value={statusModal.remarks}
                      onChange={(e) => setStatusModal(prev => ({ ...prev, remarks: e.target.value }))}
                      rows={4}
                      placeholder={statusModal.resume.remarks ? `Current: ${statusModal.resume.remarks}` : "Enter remarks (required)*"}
                      maxLength={1000}
                      showCount
                      style={{ marginTop: 8, marginBottom: 24 }}
                    />
                  )
                })
              } : null}
              onConfirm={handleStatusConfirm}
            />
          </Suspense>

          <Suspense fallback={null}>
            <ConfirmationModal
              showModal={statusModal.visible}
              setShowModal={(visible) => setStatusModal(prev => ({ ...prev, visible }))}
              mutation={statusMutation}
              oldStatus={statusModal.oldStatus}
              newStatus={statusModal.newStatus}
              details={statusModal.resume ? {
                'CV File': statusModal.resume.resume ? truncateFileName(statusModal.resume.resume.split('/').pop(), 10) : 'CV',
                'Batch': batches.find(b => b.id === statusModal.batchId)?.batch_name || 'Unknown Batch',
                'Uploaded At': statusModal.resume.created_at ? formatDateUniversal(statusModal.resume.created_at, true) : '-',
                ...(statusModal.newStatus !== 'Pending' && {
                  'Remarks': (
                    <TextArea
                      value={statusModal.remarks}
                      onChange={(e) => setStatusModal(prev => ({ ...prev, remarks: e.target.value }))}
                      rows={4}
                      placeholder="Enter remarks (required)*"
                      maxLength={1000}
                      showCount
                      style={{ marginTop: 8, marginBottom: 24 }}
                    />
                  )
                })
              } : null}
              onConfirm={handleStatusConfirm}
            />
          </Suspense>

          {/* Client Remarks Modal (using ShowRemarksLead) */}
          <Suspense fallback={null}>
            <ShowRemarksLead
              visible={clientRemarksModal.visible}
              onClose={() => setClientRemarksModal({ visible: false })}
              lead={clientData}
              onSave={(updatedRemarks) => {
                if (!canManageBatches || jobStatus !== 'Active') {
                  setClientRemarksModal({ visible: false });
                  return;
                }
                updateClientRemarksMutation.mutate(updatedRemarks);
              }}
              loading={updateClientRemarksMutation.isLoading}
              showContractFields={false}
              proposalRequired={false}
              isProposalAttached={false}
              remarksRequired={false}
              saveButtonText="Update"
              viewOnlyMode={!canManageBatches || jobStatus !== 'Active'}
            />
          </Suspense>

          {/* Job-level Sales Person Remarks (compact reusable modal) */}
          <RemarksModal
            visible={jobRemarksModal.visible}
            title="Sales Person Remarks"
            remarks={jobRemarksModal.remarks}
            loading={updateJobRemarksMutation.isLoading}
            canEdit={
              jobStatus === 'Active' &&
              userType !== 'recruitment_executive' &&
              userType !== 'recruitment_manager'
            }
            okText="Update"
            placeholder="Enter Sales Person Remarks..."
            rows={4}
            maxLength={1000}
            showCount
            onRemarksChange={(e) =>
              setJobRemarksModal((prev) => ({ ...prev, remarks: e.target.value }))
            }
            onSave={() => {
              updateJobRemarksMutation.mutate(jobRemarksModal.remarks?.trim() ?? '');
            }}
            onCancel={() => setJobRemarksModal({ visible: false, remarks: '' })}
          />

          {/* Response Analysis Modal */}
          <Modal
            title={`Screening Questionnaire Response - ${responseAnalysisModal.email || ''}`}
            open={responseAnalysisModal.visible}
            onCancel={() => {
              setResponseAnalysisModal({ visible: false, jobId: null, email: null, resumeId: null });
              setResponseAnalysisHasEdits(false);
            }}
            width="90%"
            style={{ maxWidth: '1200px' }}
            destroyOnClose
            footer={[
              responseAnalysisHasEdits && (
                <Button key="cancel" onClick={() => responseAnalysisRef.current?.cancel()}>
                  Cancel
                </Button>
              ),
              responseAnalysisHasEdits && (
                <Button
                  key="update"
                  type="primary"
                  style={{ backgroundColor: '#3E6A9F', borderColor: '#3E6A9F' }}
                  onClick={() => responseAnalysisRef.current?.save()}
                >
                  Update
                </Button>
              ),
              <Button
                key="close"
                onClick={() => {
                  setResponseAnalysisModal({ visible: false, jobId: null, email: null, resumeId: null });
                  setResponseAnalysisHasEdits(false);
                }}
              >
                Close
              </Button>
            ]}
          >
            {responseAnalysisModal.visible && (
              <ResponseAnalysisContent
                ref={responseAnalysisRef}
                jobId={responseAnalysisModal.jobId}
                email={responseAnalysisModal.email}
                resumeId={responseAnalysisModal.resumeId}
                onEditStateChange={setResponseAnalysisHasEdits}
              />
            )}
          </Modal>

          {/* Recruiter Screening Questionnaire Fill-in Modal */}
          <Modal
            title={`Recruiter Screening Questionnaire - ${recruiterScreeningModal.email || ''}`}
            open={recruiterScreeningModal.visible}
            onCancel={() => setRecruiterScreeningModal({ visible: false, jobId: null, email: null, resumeId: null })}
            width="90%"
            style={{ maxWidth: '1200px' }}
            destroyOnClose
            maskClosable={!recruiterScreeningSubmitting}
            closable={!recruiterScreeningSubmitting}
            footer={[
              <Button
                key="cancel"
                disabled={recruiterScreeningSubmitting}
                onClick={() => setRecruiterScreeningModal({ visible: false, jobId: null, email: null, resumeId: null })}
              >
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                style={{ backgroundColor: '#3E6A9F', borderColor: '#3E6A9F' }}
                loading={recruiterScreeningSubmitting}
                onClick={() => recruiterScreeningRef.current?.submit()}
              >
                Submit
              </Button>,
            ]}
          >
            {recruiterScreeningModal.visible && (
              <RecruiterScreeningFormContent
                ref={recruiterScreeningRef}
                jobId={recruiterScreeningModal.jobId}
                email={recruiterScreeningModal.email}
                resumeId={recruiterScreeningModal.resumeId}
                onSubmitted={() => {
                  setRecruiterScreeningSubmitting(false);
                  setRecruiterScreeningModal({ visible: false, jobId: null, email: null, resumeId: null });
                }}
                onSubmittingChange={setRecruiterScreeningSubmitting}
              />
            )}
          </Modal>

          {/* Share Modal */}
          <Suspense fallback={null}>
            <ShareModal
              visible={shareModal.visible}
              loading={shareModal.loading}
              link={shareModal.link}
              title={shareModal.title}
              resumeName={shareModal.resumeName}
              onCancel={() => setShareModal({ visible: false, loading: false, link: null, title: '', resumeName: '' })}
            />
          </Suspense>
          <Suspense fallback={null}>
            <ShareModal
              visible={batchShareModal.visible}
              loading={false}
              link={batchShareModal.link}
              title={batchShareModal.title}
              shareDescription="Share this batch's CV link"
              scanDescription="Scan QR code to open the batch"
              onCancel={() => setBatchShareModal({ visible: false, link: null, title: '' })}
            />
          </Suspense>
          {userType === 'super_admin' && (
            <StatusHistoryModal
              open={statusHistoryModal.visible}
              entity={statusHistoryModal.entity}
              onClose={() => setStatusHistoryModal({ visible: false, entity: null })}
              fetchHistoryApi={getJobResumeHistoryTrack}
              getTitleFromEntity={(entity) => entity?.profile_name || entity?.resume_name || 'CV'}
              queryKeyPrefix="resumeStatusHistory"
              emptyMessage="No status history available."
            />
          )}

          <Modal
            title={<span style={{ color: '#3E6A9F', fontWeight: 600 }}>Set Interview</span>}
            open={saasInterviewModal.visible}
            onCancel={() => setSaasInterviewModal({ visible: false, record: null })}
            footer={[
              <Button
                key="close"
                onClick={() => setSaasInterviewModal({ visible: false, record: null })}
              >
                Cancel
              </Button>,
            ]}
            width="90%"
            style={{ maxWidth: 720 }}
            destroyOnClose
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>
                  Interview Date<span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <Input
                  value={
                    saasInterviewModal.record?.interview?.interview_date
                      ? formatDateUniversal(saasInterviewModal.record.interview.interview_date, false)
                      : ''
                  }
                  placeholder="Date for Interview"
                  disabled
                />
              </Col>
              <Col xs={24} sm={12}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>
                  Start Time<span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <Input
                  value={saasInterviewModal.record?.interview?.start_time || ''}
                  placeholder="--:-- --"
                  disabled
                />
              </Col>
              <Col xs={24} sm={12}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>
                  End Time<span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <Input
                  value={saasInterviewModal.record?.interview?.end_time || ''}
                  placeholder="--:-- --"
                  disabled
                />
              </Col>
              <Col xs={24} sm={12}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>
                  Mode<span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <Select
                  value={saasInterviewModal.record?.interview?.mode || undefined}
                  placeholder="Select mode"
                  style={{ width: '100%' }}
                  disabled
                  options={[
                    { label: 'Remote', value: 'Remote' },
                    { label: 'On-site', value: 'On-site' },
                    { label: 'Hybrid', value: 'Hybrid' },
                  ]}
                />
              </Col>
              <Col xs={24} sm={12}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>
                  Platform<span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <Input
                  value={saasInterviewModal.record?.interview?.platform || ''}
                  placeholder="Enter Meeting Platform"
                  disabled
                />
              </Col>
              <Col xs={24} sm={12}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>
                  Meeting Link<span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <Input
                  value={saasInterviewModal.record?.interview?.meeting_link || ''}
                  placeholder="https://www.meetinglink.com/..."
                  disabled
                />
              </Col>
              <Col span={24}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>
                  Message<span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <TextArea
                  value={saasInterviewModal.record?.interview?.message || ''}
                  placeholder="Enter Message Here"
                  rows={4}
                  disabled
                />
              </Col>
            </Row>
          </Modal>

          <Modal
            title={<span style={{ color: '#3E6A9F', fontWeight: 600 }}>Interview Remarks</span>}
            open={saasRatingRemarksModal.visible}
            onCancel={() => setSaasRatingRemarksModal({ visible: false, record: null })}
            footer={[
              <Button
                key="close"
                onClick={() => setSaasRatingRemarksModal({ visible: false, record: null })}
              >
                Cancel
              </Button>,
            ]}
            width="90%"
            style={{ maxWidth: 560 }}
            destroyOnClose
          >
            <div style={{ marginBottom: 16 }}>
              <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>
                Rating (1-10)
              </label>
              <Select
                value={saasRatingRemarksModal.record?.interview_rating ?? saasRatingRemarksModal.record?.rating ?? undefined}
                placeholder="Select Rating..."
                style={{ width: '100%' }}
                disabled
                options={Array.from({ length: 10 }, (_, i) => ({
                  label: String(i + 1),
                  value: i + 1,
                }))}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>
                Remarks
              </label>
              <TextArea
                value={saasRatingRemarksModal.record?.interview_remarks ?? saasRatingRemarksModal.record?.remarks ?? ''}
                placeholder="Write some details about your degree here"
                rows={5}
                disabled
              />
            </div>
            <Text type="secondary">
              <strong>Note:</strong> These Remarks will not be shown to candidates
            </Text>
          </Modal>

          <SaasAiProfileAnalysisModal
            open={saasAiProfileModal.visible}
            onClose={() => setSaasAiProfileModal({ visible: false, applicationId: null, record: null })}
            record={saasAiProfileModalRecord}
            loading={saasApplicantProfileLoading}
            error={saasApplicantProfileError}
          />

          <ResumeDetailModal
            open={saasCvModal.visible}
            onClose={handleCloseSaasCvModal}
            details={saasCvDetails}
            loading={loadingSaasCvDetail}
            error={saasCvDetailError}
            cvSourceVariant="profile"
            onViewResume={handleOpenSaasApplicantCvPdf}
            onDownload={handleDownloadSaasApplicantCvPdf}
          />
        </>
      </Spin>
    </>
  );
}
