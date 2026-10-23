import React, { useState, useRef, useEffect } from 'react';
import { Button, Row, Col, message, Spin, Tooltip } from 'antd';
import { Plus as PlusOutlined, LoaderCircle as LoadingOutlined } from 'lucide-react';

import { Save as SaveIcon } from 'lucide-react';
import { Formik, Form } from 'formik';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import FormHeader from '../../../components/FormHeader.jsx';
import PredefinedQuestions from '../../../components/PredefinedQuestions.jsx';
import QuestionCard from '../../../components/QuestionCard.jsx';
import { buildDefaultQuestionnaireQuestions } from '../../../components/DefaultQuestionnaireButton.jsx';
import useUserStore from '../../shared/store/user-store.js';
import { googleFormSchema } from '../../shared/schemas/google-form.schema.js';
import { createScreeningForm, updateScreeningForm, getScreeningForm } from '../../shared/services/screen-listing.js';
import ErrorCard from '../../../components/error-card.jsx';
import '../../../assets/styles/legacy/google-form.css';

const STORAGE_KEY = 'screening-form-draft';

const CHOICE_QUESTION_TYPES = ['multiple_choice', 'checkboxes', 'dropdown'];

/** One Google Forms–style starter question (valid under googleFormSchema). */
function createGoogleStyleBlankQuestion() {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  return {
    id,
    question_text: 'Untitled Question',
    question_type: 'multiple_choice',
    is_required: true,
    options: [
      { id: id + 1, label: 'Option 1', value: 'option_1' },
      { id: id + 2, label: 'Option 2', value: 'option_2' },
    ],
    help_text: '',
    is_editable: true,
    date_value: null,
    time_value: null,
  };
}

const screeningFormsPathForUser = (userType) => {
  if (userType === 'super_admin') return '/super_admin/screening-forms';
  if (userType === 'recruitment_manager') return '/recruitment-manager/screening-forms';
  return '/recruitment-executive/screening-forms';
};

function getInitialFormState(mode, searchParams, location) {
  if (mode !== 'create') return { formTitle: '', questions: [] };
  const blankQuestion = () => [createGoogleStyleBlankQuestion()];
  if (location?.state?.intent === 'new') {
    return { formTitle: '', questions: blankQuestion() };
  }
  if (location?.state?.intent === 'template' && location?.state?.templateData) {
    const template = location.state.templateData;
    const qs = Array.isArray(template.questions) ? template.questions : [];
    return {
      formTitle: template.formTitle || '',
      questions: qs.length > 0 ? qs : blankQuestion(),
    };
  }
  if (searchParams?.get('default') === 'true') {
    const questions = buildDefaultQuestionnaireQuestions(Date.now());
    return {
      formTitle: 'Default Screening Questionnaire',
      questions
    };
  }
  return { formTitle: '', questions: blankQuestion() };
}

function mapApiQuestionToForm(q) {
  return {
    id: q.id ?? Date.now(),
    question_text: q.question_text ?? '',
    question_type: q.question_type ?? 'multiple_choice',
    is_required: q.is_required !== undefined ? q.is_required : true,
    options: q.options ?? [],
    help_text: q.help_text ?? '',
    is_editable: q.is_editable !== undefined ? q.is_editable : true,
    date_value: null,
    time_value: null
  };
}

function defaultOptionPair() {
  const t = Date.now();
  return [
    { id: t, label: '', value: '' },
    { id: t + 1, label: '', value: '' }
  ];
}

const GoogleFormBuilder = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [initialFormState] = useState(() => getInitialFormState(mode, searchParams, location));
  const [questions, setQuestions] = useState(initialFormState.questions);
  const [focusedQuestion, setFocusedQuestion] = useState(
    () => initialFormState.questions[0]?.id ?? null
  );
  const [draggedQuestion, setDraggedQuestion] = useState(null);
  const [dragOverQuestion, setDragOverQuestion] = useState(null);
  const [predefinedModalVisible, setPredefinedModalVisible] = useState(false);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const formikSetValuesRef = useRef(null);

  const clearFormState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing form state from localStorage:', error);
    }
  };

  // Clear draft when leaving the add form page (unmount)
  useEffect(() => {
    return () => {
      clearFormState();
    };
  }, []);

  // Remove default param from URL after consuming it (cleaner address bar)
  useEffect(() => {
    if (mode === 'create' && searchParams.get('default') === 'true') {
      const next = new URLSearchParams(searchParams);
      next.delete('default');
      setSearchParams(next, { replace: true });
    }
  }, [mode, searchParams, setSearchParams]);

  const { data: existingFormData, isLoading: isLoadingForm, isError, error } = useQuery(
    ['screeningForm', id],
    () => getScreeningForm(parseInt(id)),
    { 
      enabled: mode === 'edit' && !!id,
      staleTime: Infinity,
      refetchOnWindowFocus: false
    }
  );

  useEffect(() => {
    if (mode !== 'edit' || !existingFormData) return;
    if (existingFormData.questions?.length) {
      const mapped = existingFormData.questions.map(mapApiQuestionToForm);
      setQuestions(mapped);
      setFocusedQuestion(mapped[0].id);
    }
  }, [mode, existingFormData]);

  const createFormMutation = useMutation(createScreeningForm, {
    onSuccess: () => {
      message.success('Screening questionnaire created successfully!');
      clearFormState();
      queryClient.invalidateQueries('screeningForms');
      if (location?.state?.intent === 'template') {
        navigate(screeningFormsPathForUser(user?.user_type), { replace: true });
      } else {
        navigate(-1);
      }
    },
    onError: (error) => {
      message.error(`Failed to create screening questionnaire: ${error?.response?.data?.message ?? error.message}`);
    },
  });

  const updateFormMutation = useMutation(
    ({ id, data }) => updateScreeningForm(id, data),
    {
      onSuccess: () => {
        message.success('Screening questionnaire updated successfully!');
        clearFormState();
        queryClient.invalidateQueries('screeningForms');
        navigate(-1);
      },
      onError: (error) => {
        message.error(`Failed to update screening questionnaire: ${error?.response?.data?.message ?? error.message}`);
      },
    }
  );

  useEffect(() => {
    if (mode === 'edit' && existingFormData && !isLoadingForm && formikSetValuesRef.current) {
      formikSetValuesRef.current({
        formTitle: existingFormData.title ?? '',
        questions: existingFormData.questions?.length ? existingFormData.questions.map(mapApiQuestionToForm) : []
      });
    }
  }, [mode, existingFormData, isLoadingForm]);

  useEffect(() => {
    if (mode !== 'create' || !formikSetValuesRef.current) return;
    const { formTitle: t, questions: q } = initialFormState;
    if (t || (q && q.length > 0)) {
      formikSetValuesRef.current({ formTitle: t, questions: q });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addQuestion = (setFieldValue, currentQuestions) => {
    const newQuestion = createGoogleStyleBlankQuestion();
    const next = [...currentQuestions, newQuestion];
    setQuestions(next);
    setFieldValue('questions', next);
    setFocusedQuestion(newQuestion.id);
  };

  const addPredefinedQuestion = (questionData, setFieldValue, currentQuestions) => {
    const next = [...currentQuestions, questionData];
    setQuestions(next);
    setFieldValue('questions', next);
    setFocusedQuestion(questionData.id);
    setPredefinedModalVisible(false);
  };

  const duplicateQuestion = (questionId, setFieldValue, currentQuestions) => {
    const source = currentQuestions.find(q => q.id === questionId);
    if (!source) return;
    const newQuestion = {
      ...source,
      id: Date.now(),
      options: source.options?.map((opt, i) => ({ ...opt, id: Date.now() + i })) ?? [],
      date_value: null,
      time_value: null
    };
    const idx = currentQuestions.findIndex(q => q.id === questionId);
    const next = [...currentQuestions];
    next.splice(idx + 1, 0, newQuestion);
    setQuestions(next);
    setFieldValue('questions', next);
    setFocusedQuestion(newQuestion.id);
  };

  const deleteQuestion = (questionId, setFieldValue, currentQuestions) => {
    if (currentQuestions.length <= 1) {
      message.error('At least one question is required in the form');
      return;
    }
    const idx = currentQuestions.findIndex((q) => q.id === questionId);
    const next = currentQuestions.filter((q) => q.id !== questionId);
    setQuestions(next);
    setFieldValue('questions', next);
    if (focusedQuestion === questionId) {
      const fallback = next[idx] ?? next[idx - 1] ?? next[0];
      if (fallback) setFocusedQuestion(fallback.id);
    }
  };

  const updateQuestion = (questionId, field, value) => {
    setQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const updateQuestionType = (questionId, newType, setFieldValue) => {
    setQuestions(prev => {
      const updated = prev.map(q => {
        if (q.id !== questionId) return q;
        const next = { ...q, question_type: newType };
        const isChoice = CHOICE_QUESTION_TYPES.includes(newType);
        next.options = isChoice ? (q.options?.length ? q.options : defaultOptionPair()) : [];
        next.date_value = newType === 'date' ? q.date_value : null;
        next.time_value = newType === 'time' ? q.time_value : null;
        return next;
      });
      const idx = updated.findIndex(q => q.id === questionId);
      if (idx >= 0) {
        const q = updated[idx];
        setFieldValue(`questions.${idx}.options`, q.options ?? []);
        setFieldValue(`questions.${idx}.date_value`, q.date_value);
        setFieldValue(`questions.${idx}.time_value`, q.time_value);
      }
      return updated;
    });
  };



  const addOption = (questionId, setFieldValue) => {
    setQuestions(prev => {
      const updatedQuestions = prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [...(q.options || []), {
              id: Date.now(),
              label: '',
              value: ''
            }]
          };
        }
        return q;
      });
      setFieldValue('questions', updatedQuestions);
      return updatedQuestions;
    });
  };

  const updateOption = (questionId, optionId, label, setFieldValue) => {
    setQuestions(prev => {
      const updatedQuestions = prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: (q.options || []).map(opt =>
              opt.id === optionId ? { ...opt, label, value: label.toLowerCase().replace(/\s+/g, '_') } : opt
            )
          };
        }
        return q;
      });
      setFieldValue('questions', updatedQuestions);
      return updatedQuestions;
    });
  };

  const removeOption = (questionId, optionId, setFieldValue) => {
    setQuestions(prev => {
      const updatedQuestions = prev.map(q => {
        if (q.id === questionId && (q.options?.length ?? 0) > 2) {
          return {
            ...q,
            options: q.options.filter(opt => opt.id !== optionId)
          };
        }
        return q;
      });
      setFieldValue('questions', updatedQuestions);
      return updatedQuestions;
    });
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    setDraggedQuestion(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
    setDragOverQuestion(index);
  };

  const handleDragEnd = (setFieldValue) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      const draggedItemContent = newQuestions[dragItem.current];
      newQuestions.splice(dragItem.current, 1);
      newQuestions.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setDraggedQuestion(null);
      setDragOverQuestion(null);
      setFieldValue('questions', newQuestions);
      return newQuestions;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };


  const goBack = () => {
    window.history.back();
  };

  const initialValues = {
    formTitle: initialFormState.formTitle,
    questions: initialFormState.questions
  };

  const handleFormikSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      // Validate using Yup schema
      await googleFormSchema.validate(values, { abortEarly: false });

      // Build maps of existing question/option IDs so we only send IDs
      // for entities that already exist in the backend. New questions/options
      // (those without an original ID) are sent without an `id` so the API
      // can treat them as new.
      const existingQuestions = existingFormData?.questions ?? [];
      const existingQuestionIdSet = new Set(existingQuestions.map(q => q.id));
      const existingOptionIdMap = existingQuestions.reduce((acc, q) => {
        if (!q?.id) return acc;
        acc[q.id] = new Set((q.options ?? []).map(opt => opt.id));
        return acc;
      }, {});

      // Transform form data for API
      const formData = {
        title: values.formTitle,
        description: '',
        status: 'active', // Default status
        questions: values.questions.map((question, questionIndex) => {
          const baseQuestion = {
            question_text: question.question_text,
            question_type: question.question_type,
            is_required: question.is_required,
            help_text: question.help_text || '',
            // position is 1-based index in the list
            position: questionIndex + 1
          };

          // Only send an ID for questions that already exist in the backend.
          if (mode === 'edit' && existingQuestionIdSet.has(question.id)) {
            baseQuestion.id = question.id;
          }

          if (CHOICE_QUESTION_TYPES.includes(question.question_type)) {
            const existingOptionIdSet =
              existingOptionIdMap[question.id] ?? new Set();

            baseQuestion.options = (question.options ?? []).map(
              (option, optionIndex) => {
                const baseOption = {
                  label: option.label,
                  value: option.value,
                  // 1-based index of option inside its question
                  position: optionIndex + 1
                };

                // Only send an ID for options that already exist in backend.
                if (
                  mode === 'edit' &&
                  option.id &&
                  existingOptionIdSet.has(option.id)
                ) {
                  baseOption.id = option.id;
                }

                return baseOption;
              }
            );
          }

          return baseQuestion;
        })
      };

      // Use appropriate API based on mode
      if (mode === 'edit' && id) {
        await updateFormMutation.mutateAsync({ id: parseInt(id), data: formData });
      } else {
        await createFormMutation.mutateAsync(formData);
      }

    } catch (validationErrors) {
      if (validationErrors.inner && Array.isArray(validationErrors.inner)) {
        const formikErrors = {};
        validationErrors.inner.forEach(error => {
          const pathParts = error.path.split('.');
          if (pathParts[0] === 'questions') {
            const questionIndex = parseInt(pathParts[1]);
            const field = pathParts.slice(2).join('.');
            if (!formikErrors.questions) formikErrors.questions = [];
            if (!formikErrors.questions[questionIndex]) formikErrors.questions[questionIndex] = {};
            formikErrors.questions[questionIndex][field] = error.message;
          } else {
            formikErrors[error.path] = error.message;
          }
        });
        setErrors(formikErrors);
        message.error('Please fix the validation errors below');
      } else {
        // Handle API errors
        const action = mode === 'edit' ? 'update' : 'create';
        message.error(`Failed to ${action} screening questionnaire: ${validationErrors?.response?.data?.message || validationErrors.message}`);
      }
    }
    setSubmitting(false);
  };

  if (mode === 'edit' && isError) {
    return (
      <ErrorCard 
        message={error?.response?.data?.detail || 'The screening form could not be found.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (mode === 'edit' && isLoadingForm) {
    return (
      <div className="lead-job-page" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" />
          <div style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>
            Loading form data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={googleFormSchema}
        onSubmit={handleFormikSubmit}
        enableReinitialize={false}
      >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, setValues }) => {
        formikSetValuesRef.current = setValues;
        const saveLoading =
          isSubmitting || createFormMutation.isLoading || updateFormMutation.isLoading;

        return (
        <Form>
          <div className="lead-job-page" style={{
            backgroundColor: '#F3F4F6',
            minHeight: '100vh'
          }}>
            <BreadCrumb goBack={goBack} linkText={mode === 'edit' ? "Edit Screening Questionnaire" : "Add Screening Questionnaire"} />

            <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
              <div className="google-form-sticky-save-wrap">
                <Button
                  htmlType="submit"
                  disabled={saveLoading}
                  loading={saveLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    height: 'auto',
                    cursor: saveLoading ? 'not-allowed' : 'pointer',
                    opacity: saveLoading ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!saveLoading) {
                      e.currentTarget.style.backgroundColor = '#2563EB';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saveLoading) {
                      e.currentTarget.style.backgroundColor = '#3B82F6';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  <SaveIcon size="1em" className="app-icon" style={{ fontSize: '18px' }} />
                  <span className="button-text">
                    {mode === 'edit' ? 'Update Screening Questionnaire' : 'Add Screening Questionnaire'}
                  </span>
                </Button>
              </div>

              <FormHeader
                formTitle={values.formTitle}
                onTitleChange={(value) => {
                  setFieldValue('formTitle', value);
                }}
                errors={errors}
                touched={touched}
              />

              {/* Questions Section */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Questions
                    <span style={{
                      backgroundColor: '#DBEAFE',
                      color: '#3B82F6',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '9999px'
                    }}>
                      {questions.length}
                    </span>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Button
                      type="default"
                      onClick={() => setPredefinedModalVisible(true)}
                      style={{
                        borderColor: '#3E6A9F',
                        color: '#3E6A9F',
                        fontSize: '12px'
                      }}
                    >
                      Add Predefined Questions
                    </Button>
                  <span style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>Drag to reorder</span>
                  </span>
                  </div>
                </div>

                <Row gutter={[24, 24]}>
                  {values.questions.map((question, index) => (
                    <Col xs={24} key={question.id}>
                      <div className="google-form-question-row">
                        <div className="google-form-question-row__card">
                          <QuestionCard
                            wrapInCol={false}
                            question={question}
                            index={index}
                            isFocused={focusedQuestion === question.id}
                            isDragged={draggedQuestion === index}
                            isDragOver={dragOverQuestion === index}
                            onQuestionClick={setFocusedQuestion}
                            onQuestionUpdate={(questionId, field, value) => {
                              setFieldValue(`questions.${index}.${field}`, value);
                              updateQuestion(questionId, field, value);
                            }}
                            onQuestionTypeChange={(questionId, newType) => {
                              if (values.questions?.[index]?.is_editable === false) return;
                              setFieldValue(`questions.${index}.question_type`, newType);
                              updateQuestionType(questionId, newType, setFieldValue);
                            }}
                            onAddOption={(questionId) => addOption(questionId, setFieldValue)}
                            onUpdateOption={(questionId, optionId, label) => updateOption(questionId, optionId, label, setFieldValue)}
                            onRemoveOption={(questionId, optionId) => removeOption(questionId, optionId, setFieldValue)}
                            onDuplicateQuestion={(questionId) => duplicateQuestion(questionId, setFieldValue, values.questions)}
                            onDeleteQuestion={(questionId) => deleteQuestion(questionId, setFieldValue, values.questions)}
                            onDragStart={handleDragStart}
                            onDragEnter={handleDragEnter}
                            onDragEnd={() => handleDragEnd(setFieldValue)}
                            onDragOver={handleDragOver}
                            formik={{ values, errors, touched, handleChange, handleBlur, setFieldValue }}
                          />
                        </div>
                        {focusedQuestion === question.id && (
                          <div className="google-form-question-row__add">
                            <Tooltip title="Add question" placement="left">
                              <button
                                type="button"
                                className="google-form-add-sidebar__btn"
                                aria-label="Add question"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addQuestion(setFieldValue, values.questions);
                                }}
                              >
                                <PlusOutlined size="1em" className="app-icon" style={{ fontSize: '20px' }} />
                              </button>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Helper text for empty questions */}
              {questions.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '24px' }}>
                  <small style={{ color: '#6B7280', fontSize: '14px' }}>
                    Start building your form by adding your first question
                  </small>
                </div>
              )}

              {/* Bottom action bar — commented out; use sticky save at top (google-form-sticky-save-wrap)
              <div
                className="floating-action-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '32px',
                  paddingTop: '24px',
                  borderTop: '1px solid #E5E7EB'
                }}
              >
                <button
                  type="button"
                  onClick={() => addQuestion(setFieldValue, values.questions)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10B981';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <AddIcon style={{ fontSize: '18px' }} />
                  <span className="button-text">Add New Question</span>
                </button>

                <div
                  className="action-divider"
                  style={{
                    height: '32px',
                    width: '1px',
                    backgroundColor: '#E5E7EB'
                  }}
                />

                <Button
                  htmlType="submit"
                  disabled={saveLoading}
                  loading={saveLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    height: 'auto',
                    cursor: saveLoading ? 'not-allowed' : 'pointer',
                    opacity: saveLoading ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!saveLoading) {
                      e.currentTarget.style.backgroundColor = '#2563EB';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saveLoading) {
                      e.currentTarget.style.backgroundColor = '#3B82F6';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  <SaveIcon style={{ fontSize: '18px' }} />
                  <span className="button-text">
                    {mode === 'edit' ? 'Update Screening Questionnaire' : 'Add Screening Questionnaire'}
                  </span>
                </Button>
              </div>
              */}
            </div>
          </div>

          {/* Predefined Questions Modal */}
          <PredefinedQuestions
            visible={predefinedModalVisible}
            onClose={() => setPredefinedModalVisible(false)}
            onAddQuestion={(questionData) => addPredefinedQuestion(questionData, setFieldValue, values.questions)}
          />
        </Form>
        );
      }}
    </Formik>

    </>
  );
};

export default GoogleFormBuilder;
