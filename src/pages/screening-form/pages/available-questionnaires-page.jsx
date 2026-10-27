import { message } from '../../../components/ui/notifications.jsx';
import { Modal } from '../../../components/ui/app-modal.jsx';
import { Button } from '../../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useCallback } from 'react';
import { ConfigProvider, Space, Table, Tag, Typography } from 'antd';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../shared/store/user-store.js';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import DefaultQuestionnairePreviewModal from '../../../components/DefaultQuestionnairePreviewModal.jsx';
import NewTableComponent from '../../../components/tables/new-table.jsx';
import {
  getGlobalFormsList,
  getGlobalFormQuestionDetails,
} from '../../shared/services/global-screening-forms.js';
import { formatDateUniversal } from '../../shared/utils/formatDate.js';

const THEME_PRIMARY = '#3E6A9F';

const screeningFormsPathForUser = (userType) => {
  if (userType === 'super_admin') return '/super_admin/screening-forms';
  if (userType === 'recruitment_manager') return '/recruitment-manager/screening-forms';
  return '/recruitment-executive/screening-forms';
};

const addGoogleFormPathForUser = (userType) => {
  if (userType === 'super_admin') return '/super_admin/add-google-form';
  if (userType === 'recruitment_manager') return '/recruitment-manager/add-google-form';
  return '/recruitment-executive/add-google-form';
};

const normalizeQuestionType = (rawType) => {
  const normalized = String(rawType || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');

  if (normalized === 'multiplechoice') return 'multiple_choice';
  if (normalized === 'multiple_choice') return 'multiple_choice';
  if (normalized === 'checkbox') return 'checkboxes';
  if (normalized === 'checkboxes') return 'checkboxes';
  if (normalized === 'drop_down') return 'dropdown';
  if (normalized === 'dropdown') return 'dropdown';
  if (normalized === 'shortanswer') return 'short_answer';
  if (normalized === 'short_answer') return 'short_answer';
  return normalized || 'multiple_choice';
};

const getQuestionOptions = (question) => {
  if (Array.isArray(question?.options)) return question.options;
  if (Array.isArray(question?.choices)) return question.choices;
  if (Array.isArray(question?.question_options)) return question.question_options;
  if (Array.isArray(question?.answer_options)) return question.answer_options;
  return [];
};

const getOptionLabel = (option) => {
  if (typeof option === 'string' || typeof option === 'number') return String(option).trim();
  if (!option || typeof option !== 'object') return '';
  const labelLike =
    option.label ??
    option.text ??
    option.option_text ??
    option.title ??
    option.value;
  return String(labelLike ?? '').trim();
};

const mapQuestionToTemplateQuestion = (question, idx) => {
  const choiceTypes = ['multiple_choice', 'checkboxes', 'dropdown'];
  const normalizedQuestionType = normalizeQuestionType(question?.question_type);
  const rawOptions = getQuestionOptions(question);
  const mappedOptions = choiceTypes.includes(normalizedQuestionType)
    ? rawOptions
      .map((opt, optIdx) => {
        const label = getOptionLabel(opt);
        if (!label) return null;
        return {
          id: opt?.id ?? Date.now() + idx * 100 + optIdx,
          label,
          value: label.toLowerCase().replace(/\s+/g, '_'),
        };
      })
      .filter(Boolean)
    : [];

  return {
    id: Date.now() + idx,
    question_text: question?.question_text ?? '',
    question_type: normalizedQuestionType,
    is_required: question?.is_required !== false,
    options: mappedOptions,
    help_text: question?.help_text ?? '',
    is_editable: true,
    date_value: null,
    time_value: null,
  };
};

const AvailableQuestionnairesPage = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [usingTemplateId, setUsingTemplateId] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewTemplateData, setPreviewTemplateData] = useState(null);
  const [jobsModalVisible, setJobsModalVisible] = useState(false);
  const [jobsModalRows, setJobsModalRows] = useState([]);
  const [jobsModalTemplateTitle, setJobsModalTemplateTitle] = useState('');

  const backPath = screeningFormsPathForUser(user?.user_type);
  const handleBack = useCallback(() => navigate(backPath), [navigate, backPath]);

  const activeSort = sorting?.[0]?.id ? sorting[0] : null;
  const sortBy = activeSort?.id || '';
  const sortOrder = activeSort ? (activeSort?.desc ? 'desc' : 'asc') : 'asc';

  const { data, isLoading } = useQuery(
    ['availableQuestionnaires', pagination.pageIndex, pagination.pageSize, sortBy, sortOrder, globalFilter],
    () =>
      getGlobalFormsList({
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        search: globalFilter,
        sort_by: sortBy,
        order: sortOrder,
      }),
    {
      keepPreviousData: true,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const closeTemplatePreview = useCallback(() => {
    setPreviewVisible(false);
    setPreviewTemplateData(null);
  }, []);

  const closeJobsModal = useCallback(() => {
    setJobsModalVisible(false);
    setJobsModalRows([]);
    setJobsModalTemplateTitle('');
  }, []);

  const openJobsModal = useCallback((jobs = [], templateTitle = '') => {
    const normalizedRows = (Array.isArray(jobs) ? jobs : []).map((job, index) => ({
      key: job?.id ?? `${templateTitle || 'template'}-${index}`,
      job_id: job?.id ?? '-',
      title: job?.job_title?.trim() || '-',
      status: job?.status || '-',
      created_at: job?.created_at ? formatDateUniversal(job.created_at) : '-',
    }));
    setJobsModalRows(normalizedRows);
    setJobsModalTemplateTitle(templateTitle || 'Template');
    setJobsModalVisible(true);
  }, []);

  const handleOpenTemplatePreview = useCallback(
    async (form) => {
      setUsingTemplateId(form.id);
      try {
        const details = await getGlobalFormQuestionDetails(form.id);
        const templateQuestions = Array.isArray(details?.questions)
          ? details.questions.map(mapQuestionToTemplateQuestion)
          : [];
        const templateData = {
          formTitle: `${details?.form_title || form?.title || 'Questionnaire'} (Copy)`,
          questions: templateQuestions,
        };
        setPreviewTemplateData(templateData);
        setPreviewVisible(true);
      } catch (err) {
        message.error(err?.message || 'Failed to load template questionnaire');
      } finally {
        setUsingTemplateId(null);
      }
    },
    []
  );

  const handleConfirmTemplatePreview = useCallback(() => {
    if (!previewTemplateData) return;
    const addFormRoute = addGoogleFormPathForUser(user?.user_type);
    navigate(addFormRoute, { state: { intent: 'template', templateData: previewTemplateData } });
    closeTemplatePreview();
  }, [navigate, user?.user_type, previewTemplateData, closeTemplatePreview]);

  const rows = useMemo(() => {
    const list = data?.results || [];
    return list.map((item, index) => ({
      ...item,
      serial_number: pagination.pageIndex * pagination.pageSize + index + 1,
      id: item?.id ?? null,
      title: item?.title || item?.form_title || 'Untitled',
      description: item?.description || item?.form_description || '-',
      recruiter_name:
        item?.recruiter_name || item?.recruiter?.full_name || item?.recruiter?.name || '-',
      is_active: typeof item?.is_active === 'boolean' ? item.is_active : item?.status === 'Active',
      status_label:
        typeof item?.is_active === 'boolean' ? (item.is_active ? 'Active' : 'Inactive') : item?.status || '-',
      form_used_count:
        typeof item?.form_used_count === 'number'
          ? item.form_used_count
          : typeof item?.used_count === 'number'
            ? item.used_count
            : 0,
      created_at: item?.created_at || item?.createdAt || null,
      created_at_formatted:
        item?.created_at || item?.createdAt
          ? formatDateUniversal(item?.created_at || item?.createdAt)
          : '-',
      updated_at: item?.updated_at || item?.updatedAt || null,
      updated_at_formatted:
        item?.updated_at || item?.updatedAt
          ? formatDateUniversal(item?.updated_at || item?.updatedAt)
          : '-',
      questions_count:
        typeof item?.questions_count === 'number'
          ? item.questions_count
          : Array.isArray(item?.questions)
            ? item.questions.length
            : 0,
      jobs: Array.isArray(item?.jobs) ? item.jobs : [],
      jobs_count: typeof item?.jobs_count === 'number' ? item.jobs_count : 0,
    }));
  }, [data, pagination.pageIndex, pagination.pageSize]);

  const columns = useMemo(
    () => [
      {
        header: 'S.No',
        accessorKey: 'serial_number',
        id: 'serial_number',
        enableSorting: false,
        size: 70,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Title',
        accessorKey: 'title',
        id: 'title',
        sortDescFirst: false,
        size: 220,
        Cell: ({ row }) => (
          <Space direction="vertical" size={2}>
            <Typography.Text strong>{row.original?.title || 'Untitled'}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {row.original?.description || '-'}
            </Typography.Text>
          </Space>
        ),
      },
      {
        header: 'Recruiter',
        accessorKey: 'recruiter_name',
        id: 'recruiter_name',
        sortDescFirst: false,
        size: 130,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Questions',
        accessorKey: 'questions_count',
        id: 'questions_count',
        sortDescFirst: false,
        size: 90,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Form Used',
        accessorKey: 'form_used_count',
        id: 'form_used_count',
        sortDescFirst: false,
        size: 100,
        Cell: ({ cell }) => <span>{cell.getValue() ?? 0}</span>,
      },
      {
        header: 'Job count',
        accessorKey: 'jobs_count',
        id: 'jobs_count',
        sortDescFirst: false,
        size: 88,
        minSize: 72,
        Cell: ({ cell }) => <span>{cell.getValue() ?? 0}</span>,
      },
      {
        header: 'Job titles',
        id: 'job_titles',
        accessorFn: (row) => row.jobs,
        enableSorting: false,
        size: 220,
        minSize: 160,
        Cell: ({ row }) => {
          const jobs = row.original?.jobs || [];
          if (!jobs.length) {
            return (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                —
              </Typography.Text>
            );
          }
          return (
            <Space size={[6, 6]} wrap style={{ maxWidth: 280 }}>
              {jobs.slice(0, 1).map((job, idx) => {
                const title = job?.job_title?.trim() || '—';
                const tip = [title, job?.status].filter(Boolean).join(' · ');
                return (
                  <Tag
                    key={job?.id ?? `${row.original?.id}-${idx}`}
                    title={tip}
                    style={{
                      margin: 0,
                      fontSize: 11,
                      lineHeight: '18px',
                      borderColor: THEME_PRIMARY,
                      color: THEME_PRIMARY,
                      background: 'rgba(62, 106, 159, 0.08)',
                    }}
                  >
                    {title}
                  </Tag>
                );
              })}
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: 'auto' }}
                onClick={() => openJobsModal(jobs, row.original?.title)}
              >
                See all ({jobs.length})
              </Button>
            </Space>
          );
        },
      },
      {
        header: 'Created',
        accessorKey: 'created_at_formatted',
        id: 'created_at',
        sortDescFirst: false,
        size: 130,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Updated',
        accessorKey: 'updated_at_formatted',
        id: 'updated_at',
        sortDescFirst: false,
        size: 130,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Action',
        id: 'action',
        enableSorting: false,
        size: 120,
        Cell: ({ row }) => (
          <Button
            type="primary"
            style={{ background: THEME_PRIMARY, borderColor: THEME_PRIMARY }}
            loading={usingTemplateId === row.original?.id}
            onClick={() => handleOpenTemplatePreview(row.original)}
          >
            Preview Template
          </Button>
        ),
      },
    ],
    [handleOpenTemplatePreview, openJobsModal, usingTemplateId]
  );

  return (
    <div className="lead-job-page" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <BreadCrumb goBack={handleBack} linkText="Available Questionnaires" />

      <div className="container">
        <DefaultQuestionnairePreviewModal
          visible={previewVisible}
          questions={previewTemplateData?.questions ?? []}
          formTitle={previewTemplateData?.formTitle}
          modalTitle="Template preview"
          confirmLabel="Continue with this template"
          onCancel={closeTemplatePreview}
          onConfirm={handleConfirmTemplatePreview}
        />
        <Modal
          title={`All Jobs${jobsModalTemplateTitle ? ` - ${jobsModalTemplateTitle}` : ''}`}
          open={jobsModalVisible}
          onCancel={closeJobsModal}
          footer={null}
          width={760}
          destroyOnClose
        >
          <Table
            columns={[
              { title: 'Job ID', dataIndex: 'job_id', key: 'job_id', width: 110 },
              { title: 'Title', dataIndex: 'title', key: 'title' },
              { title: 'Status', dataIndex: 'status', key: 'status', width: 140 },
              { title: 'Created At', dataIndex: 'created_at', key: 'created_at', width: 160 },
            ]}
            dataSource={jobsModalRows}
            pagination={false}
            size="small"
            scroll={{ y: 360 }}
            locale={{ emptyText: 'No jobs found' }}
          />
        </Modal>
        <div className="table-container">
          <ConfigProvider
            theme={{
              token: {
                colorLink: THEME_PRIMARY,
                colorLinkHover: '#2d5a8a',
                colorLinkActive: '#254a73',
              },
            }}
          >
            <NewTableComponent
              columns={columns}
              data={rows}
              totalCount={data?.count || 0}
              heading={`Templates (${data?.count || 0})`}
              headingSx={{ fontSize: 16 }}
              initialState={pagination}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={setSorting}
              enableRowSelection={false}
              globalFilter={globalFilter}
              onGlobalFilterChange={(val) => setGlobalFilter(val || '')}
              isLoading={isLoading}
              denseCells
              enableStickyHeader
              muiTableContainerProps={{
                sx: {
                  maxHeight: 'calc(100vh - 280px)',
                  overflowY: 'auto',
                },
              }}
            />
          </ConfigProvider>
        </div>
      </div>
    </div>
  );
};

export default AvailableQuestionnairesPage;
