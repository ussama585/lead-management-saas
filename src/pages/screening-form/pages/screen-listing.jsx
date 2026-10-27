import { message } from '../../../components/ui/notifications.jsx';
import { Button, Spin, Tooltip } from '../../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useCallback } from 'react';
import { Switch, ConfigProvider } from 'antd';
import { Plus as PlusOutlined, Pencil as EditOutlined, ClipboardPen as FormOutlined, LoaderCircle as LoadingOutlined } from 'lucide-react';
import { useQuery, useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../shared/store/user-store.js';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../components/tables/new-table.jsx';
import { getScreeningForms } from '../../shared/services/screen-listing.js';
import { updateGlobalFormPublish } from '../../shared/services/global-screening-forms.js';
import { formatDateUniversal } from '../../shared/utils/formatDate.js';
import { buildDefaultQuestionnaireQuestions } from '../../../components/DefaultQuestionnaireButton.jsx';
import DefaultQuestionnairePreviewModal from '../../../components/DefaultQuestionnairePreviewModal.jsx';
import '../../../assets/styles/legacy/table-client-actions.css';

/** Same as `--sop-brand` in `table-client-actions.css` (Ant theme token needs a concrete color). */
const THEME_PRIMARY = '#3e6a9f';

const ScreenListing = () => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [updatingPrivacyId, setUpdatingPrivacyId] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);

  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  const activeSort = sorting && sorting.length > 0 && sorting[0]?.id ? sorting[0] : null;
  const sortField = activeSort?.id || null;
  const sortDirection = activeSort?.desc !== undefined ? activeSort.desc : null;
  const sortBy = sortField || '';
  const sortOrder = sortField ? (sortDirection === true ? 'desc' : 'asc') : 'asc';

  const { data: screeningFormsResponse, isLoading, isFetching, error, refetch } = useQuery(
    ['screeningForms', pagination.pageIndex, pagination.pageSize, sortField, sortDirection, globalFilter],
    () =>
      getScreeningForms({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: globalFilter,
        sort_by: sortBy,
        order: sortOrder,
      }),
    {
      staleTime: 3 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const togglePrivacyMutation = useMutation(
    async ({ id }) => updateGlobalFormPublish(id),
    {
      onSuccess: (payload) => {
        const responseMessage =
          payload?.message ||
          payload?.data?.message ||
          payload?.detail ||
          payload?.data?.detail ||
          '';
        const text =
          typeof responseMessage === 'string' && responseMessage.trim()
            ? responseMessage.trim()
            : 'Questionnaire publish status updated';
        message.success(text);
        refetch();
      },
      onError: (err) => {
        message.error(err?.message || 'Failed to update questionnaire publish status');
      },
      onSettled: () => {
        setUpdatingPrivacyId(null);
      },
    }
  );
  const isTogglingPrivacy = togglePrivacyMutation.isLoading;
  const togglePrivacy = togglePrivacyMutation.mutate;

  const screeningFormsForTable = useMemo(() => {
    if (!screeningFormsResponse?.results) return [];
    return screeningFormsResponse.results.map((form, idx) => ({
      ...form,
      created_at_formatted: form.created_at ? formatDateUniversal(form.created_at) : '-',
      updated_at_formatted: form.updated_at ? formatDateUniversal(form.updated_at) : '-',
      question_count:
        typeof form.questions_count === 'number' ? form.questions_count : form.questions ? form.questions.length : 0,
      form_used_count: typeof form.form_used_count === 'number' ? form.form_used_count : 0,
      index: idx + 1 + pagination.pageIndex * pagination.pageSize,
    }));
  }, [screeningFormsResponse, pagination.pageIndex, pagination.pageSize]);

  const handleNavigateToEditForm = useCallback(
    (formId) => {
      let editFormRoute;
      if (user?.user_type === 'admin') {
        editFormRoute = `/admin/edit-google-form/${formId}`;
      } else if (user?.user_type === 'recruitment_manager') {
        editFormRoute = `/recruitment-manager/edit-google-form/${formId}`;
      } else {
        editFormRoute = `/recruitment-executive/edit-google-form/${formId}`;
      }
      navigate(editFormRoute);
    },
    [navigate, user?.user_type]
  );

  const handleNavigateToAvailableQuestionnaires = useCallback(() => {
    let path;
    if (user?.user_type === 'admin') {
      path = '/admin/available-questionnaires';
    } else if (user?.user_type === 'recruitment_manager') {
      path = '/recruitment-manager/available-questionnaires';
    } else {
      path = '/recruitment-executive/available-questionnaires';
    }
    navigate(path);
  }, [navigate, user?.user_type]);

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        id: 'id',
        accessorKey: 'id',
        size: 60,
        minSize: 50,
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Title',
        id: 'title',
        accessorKey: 'title',
        size: 150,
        minSize: 120,
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Description',
        id: 'description',
        accessorKey: 'description',
        size: 200,
        minSize: 150,
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => (
          <span title={cell.getValue()}>
            {cell.getValue()
              ? cell.getValue().length > 50
                ? `${cell.getValue().substring(0, 50)}...`
                : cell.getValue()
              : '-'}
          </span>
        ),
      },
      {
        header: 'Questions',
        id: 'question_count',
        accessorKey: 'question_count',
        size: 80,
        minSize: 60,
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Form Used',
        id: 'form_used_count',
        accessorKey: 'form_used_count',
        size: 100,
        minSize: 80,
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Created At',
        id: 'created_at',
        accessorKey: 'created_at_formatted',
        size: 120,
        minSize: 100,
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Updated At',
        id: 'updated_at',
        accessorKey: 'updated_at_formatted',
        size: 120,
        minSize: 100,
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Form Status',
        id: 'is_private',
        accessorKey: 'is_private',
        enableSorting: false,
        size: 130,
        minSize: 120,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ConfigProvider theme={{ token: { colorPrimary: THEME_PRIMARY } }}>
              <Switch
                size="small"
                checked={!row.original?.is_private}
                loading={updatingPrivacyId === row.original?.id && isTogglingPrivacy}
                onChange={() => {
                  setUpdatingPrivacyId(row.original?.id);
                  togglePrivacy({
                    id: row.original?.id,
                  });
                }}
              />
            </ConfigProvider>
            <span style={{ fontSize: 12, color: '#666', minWidth: 60 }}>
              {row.original?.is_private ? 'Draft' : 'Published'}
            </span>
          </div>
        ),
      },
      {
        header: 'Actions',
        id: 'actions',
        accessorKey: 'actions',
        enableSorting: false,
        Cell: ({ row }) => {
          if (row.original.is_editable === false) {
            return <span style={{ color: '#999' }}>-</span>;
          }
          return (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Tooltip title="Edit questionnaire">
                <EditOutlined size="1em"
                  className={["app-icon", "table-icon-action table-icon-action--edit"].filter(Boolean).join(' ')}
                  onClick={() => handleNavigateToEditForm(row.original.id)}
                  aria-label="Edit questionnaire"
                />
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [handleNavigateToEditForm, isTogglingPrivacy, togglePrivacy, updatingPrivacyId]
  );

  const handleSortingChange = (newSorting) => {
    setSorting(newSorting);
  };

  const handleNavigateToAddForm = () => {
    try {
      localStorage.removeItem('screening-form-draft');
    } catch (error) {
      console.error('Error clearing form state from localStorage:', error);
    }

    let addFormRoute;
    if (user?.user_type === 'admin') {
      addFormRoute = '/admin/add-google-form';
    } else if (user?.user_type === 'recruitment_manager') {
      addFormRoute = '/recruitment-manager/add-google-form';
    } else {
      addFormRoute = '/recruitment-executive/add-google-form';
    }
    navigate(addFormRoute, { state: { intent: 'new' } });
  };

  const handleShowDefaultQuestionnairePreview = () => {
    const baseTime = Date.now();
    const questions = buildDefaultQuestionnaireQuestions(baseTime);
    setPreviewQuestions(questions);
    setPreviewModalVisible(true);
  };

  const handleConfirmDefaultQuestionnaire = () => {
    setPreviewModalVisible(false);
    let addFormRoute;
    if (user?.user_type === 'admin') {
      addFormRoute = '/admin/add-google-form';
    } else if (user?.user_type === 'recruitment_manager') {
      addFormRoute = '/recruitment-manager/add-google-form';
    } else {
      addFormRoute = '/recruitment-executive/add-google-form';
    }
    navigate(`${addFormRoute}?default=true`);
  };

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Error loading screening questionnaires: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="lead-job-page" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <BreadCrumb linkText="Screening Questionnaires" />

      <div className="container">
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button
            type="default"
            icon={<PlusOutlined size="1em" className="app-icon" />}
            onClick={handleNavigateToAddForm}
            className="sop-brand-outline"
          >
            Add New Questionnaire
          </Button>
          <Button
            type="default"
            className="sop-brand-outline"
            icon={<FormOutlined size="1em" className="app-icon" />}
            onClick={handleShowDefaultQuestionnairePreview}
          >
            Add Default Questionnaire
          </Button>
          <Button
            type="default"
            className="sop-brand-outline"
            icon={<FormOutlined size="1em" className="app-icon" />}
            onClick={handleNavigateToAvailableQuestionnaires}
          >
            Available Questionnaires
          </Button>
        </div>

        <DefaultQuestionnairePreviewModal
          visible={previewModalVisible}
          questions={previewQuestions}
          onCancel={() => setPreviewModalVisible(false)}
          onConfirm={handleConfirmDefaultQuestionnaire}
        />

        <div className="table-container">
          {isLoading ? (
            <div className="sop-branded-spin-wrap">
              <Spin
                size="large"
                indicator={<LoadingOutlined size="1em" className={["app-icon app-icon-spin", "sop-branded-spin-icon"].filter(Boolean).join(' ')}  aria-hidden />}
              />
              <p className="sop-branded-spin-text">Loading screening questionnaires...</p>
            </div>
          ) : (
            <NewTableComponent
              columns={columns}
              data={screeningFormsForTable}
              totalCount={screeningFormsResponse?.count || 0}
              heading={`Screening Questionnaires ${screeningFormsResponse ? `(${screeningFormsResponse.count || 0})` : ''}`}
              initialState={pagination}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              enableRowSelection={false}
              globalFilter={globalFilter}
              onGlobalFilterChange={(val) => setGlobalFilter(val || '')}
              isLoading={isFetching}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenListing;
