import { Input } from './ui/app-controls.jsx';
import React from 'react';
import { DatePicker, TimePicker } from 'antd';
import { Calendar as CalendarOutlined, Clock as ClockCircleOutlined } from 'lucide-react';
import { Square as CheckBoxOutlineBlankIcon } from 'lucide-react';
import { Circle as RadioButtonUncheckedIcon } from 'lucide-react';
import { CircleMinus as RemoveCircleOutlineIcon } from 'lucide-react';
import { FileUp as UploadFileIcon } from 'lucide-react';
import { Calendar as CalendarTodayIcon } from 'lucide-react';
import { Clock as ScheduleIcon } from 'lucide-react';
import dayjs from 'dayjs';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/question-options.css';

const { TextArea } = Input;

const QuestionOptions = ({
  question,
  index,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
  onUpdateQuestion,
  /** 'google' = Google Forms–style options list (no section label, underline inputs) */
  visualVariant = 'default',
  formik: { values, errors, touched, handleChange, handleBlur, setFieldValue }
}) => {
  const isGoogle = visualVariant === 'google';

  if (['multiple_choice', 'checkboxes', 'dropdown'].includes(question.question_type)) {
    // Check for duplicate options
    const optionLabels = question.options?.map(opt => opt.label?.trim()?.toLowerCase()).filter(Boolean) || [];
    const hasDuplicates = optionLabels.length !== new Set(optionLabels).size;

    return (
      <div className={isGoogle ? 'gf-qcard-options' : undefined}>
        {hasDuplicates && (
          <div className="question-options__duplicate-warning">
            ⚠️ Duplicate options detected. All options must be unique.
          </div>
        )}

        {!isGoogle && (
          <label className="question-options__label">
            Options
          </label>
        )}

        <div className="question-options__list" style={{ '--options-list-gap': isGoogle ? '4px' : '12px' }}>
          {question.options?.map((option, optionIndex) => {
            if (!option || !option.id) return null;
            const isEmpty = !option.label || option.label.trim() === '';
            const formikOptionIndex = values.questions?.[index]?.options?.findIndex(opt => opt && opt.id === option.id) ?? -1;

            return (
              <div key={option.id} className="question-options__option-row" style={{ '--option-row-gap': isGoogle ? '10px' : '12px' }}>
                {question.question_type === 'multiple_choice' && (
                  <RadioButtonUncheckedIcon size="1em"
                    className={["app-icon", "question-options__choice-icon"].filter(Boolean).join(' ')}
                    style={{ '--choice-icon-size': isGoogle ? '22px' : '20px', '--choice-icon-color': isGoogle ? '#5f6368' : '#D1D5DB' }}
                  />
                )}
                {question.question_type === 'checkboxes' && (
                  <CheckBoxOutlineBlankIcon size="1em"
                    className={["app-icon", "question-options__choice-icon"].filter(Boolean).join(' ')}
                    style={{ '--choice-icon-size': isGoogle ? '22px' : '20px', '--choice-icon-color': isGoogle ? '#5f6368' : '#D1D5DB' }}
                  />
                )}
                {question.question_type === 'dropdown' && (
                  <span className="question-options__dropdown-index">
                    {optionIndex + 1}.
                  </span>
                )}
                
                <input
                  type="text"
                  value={values.questions?.[index]?.options?.[formikOptionIndex]?.label || ''}
                  onChange={(e) => {
                    handleChange(e);
                    onUpdateOption(question.id, option.id, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder={`Option ${optionIndex + 1}`}
                  className={
                    isGoogle
                      ? `question-options__option-input--google${isEmpty ? ' question-options__option-input--empty' : ''}`
                      : `question-options__option-input${isEmpty ? ' question-options__option-input--empty' : ''}`
                  }
                  onFocus={(e) => {
                    if (isGoogle) {
                      e.target.style.borderBottomColor = '#1a73e8';
                      return;
                    }
                    if (!isEmpty) {
                      e.target.style.borderColor = '#3e6a9f';
                      e.target.style.boxShadow = '0 0 0 3px rgba(62, 106, 159, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    if (handleBlur) {
                      handleBlur(e);
                    }
                    if (isGoogle) {
                      e.target.style.borderBottomColor = isEmpty ? '#d93025' : '#e8eaed';
                      return;
                    }
                    if (!isEmpty) {
                      e.target.style.borderColor = '#D1D5DB';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                  name={formikOptionIndex >= 0 ? `questions[${index}].options[${formikOptionIndex}].label` : undefined}
                />
                
                {question.options && question.options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveOption(question.id, option.id)}
                    className="question-options__remove-btn"
                    onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                  >
                    <RemoveCircleOutlineIcon size="1em" className={["app-icon", "question-options__remove-icon"].filter(Boolean).join(' ')} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        <button
          type="button"
          onClick={() => onAddOption(question.id)}
          className={`question-options__add-btn${isGoogle ? ' question-options__add-btn--google' : ''}`}
          style={{
            '--add-btn-color': isGoogle ? '#1a73e8' : '#3e6a9f',
            '--add-btn-font-size': isGoogle ? '14px' : '13px',
            '--add-btn-font-weight': isGoogle ? '400' : '500',
            '--add-btn-margin-top': isGoogle ? '8px' : '12px',
            '--add-btn-padding': isGoogle ? '8px 0' : '0',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = isGoogle ? '#174ea6' : '#2d5a8a';
            if (isGoogle) e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isGoogle ? '#1a73e8' : '#3e6a9f';
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          {isGoogle ? 'Add option' : '+ Add Option'}
        </button>
      </div>
    );
  }

  if (question.question_type === 'short_answer') {
    return (
      <div
        className={`question-options__text-preview${isGoogle ? ' question-options__text-preview--google' : ''}`}
        style={{
          '--preview-bg': isGoogle ? 'transparent' : '#F9FAFB',
          '--preview-padding': isGoogle ? '8px 0' : '12px',
          '--preview-radius': isGoogle ? 0 : '6px',
          '--preview-border': isGoogle ? 'none' : '1px dashed #D1D5DB',
        }}
      >
        <input
          type="text"
          placeholder="Short answer text field"
          disabled={true}
          className="question-options__short-answer-input"
          style={{ '--short-answer-color': isGoogle ? '#70757a' : '#9CA3AF' }}
        />
      </div>
    );
  }

  if (question.question_type === 'paragraph') {
    return (
      <div
        className={`question-options__text-preview${isGoogle ? ' question-options__text-preview--google' : ''}`}
        style={{
          '--preview-bg': isGoogle ? 'transparent' : '#F9FAFB',
          '--preview-padding': isGoogle ? '8px 0' : '12px',
          '--preview-radius': isGoogle ? 0 : '6px',
          '--preview-border': isGoogle ? 'none' : '1px dashed #D1D5DB',
        }}
      >
        <TextArea
          placeholder="Long answer text field"
          rows={3}
          disabled={true}
          className="question-options__paragraph-textarea"
        />
      </div>
    );
  }

  if (question.question_type === 'file_upload') {
    return (
      <div className="question-options__file-upload">
        <UploadFileIcon size="1em" className={["app-icon", "question-options__file-upload-icon"].filter(Boolean).join(' ')} />
        <div className="question-options__file-upload-title">
          File upload (Preview only)
        </div>
        <div className="question-options__file-upload-subtitle">
          Supported: PDF, DOCX, JPG (Max: 10MB)
        </div>
      </div>
    );
  }

  if (question.question_type === 'date') {
    const hasError = errors.questions?.[index]?.date_value && touched.questions?.[index]?.date_value;
    const selectedDate = values.questions?.[index]?.date_value;

    return (
      <div>
        <label className="question-options__label--dark">
          Date Selection
        </label>

        <div className="question-options__picker-wrap">
          <DatePicker
            value={selectedDate ? dayjs(selectedDate) : null}
            placeholder="Click to select a date"
            className="custom-date-picker question-options__picker"
            style={{ '--picker-border': hasError ? '1px solid #EF4444' : '1px solid #D1D5DB' }}
            name={`questions[${index}].date_value`}
            onChange={(date) => {
              const dayjsDate = date ? dayjs(date) : null;
              setFieldValue(`questions[${index}].date_value`, dayjsDate);
              onUpdateQuestion(question.id, 'date_value', dayjsDate);
            }}
            onBlur={handleBlur}
            format="MMM DD, YYYY"
            allowClear
            disabled={true}
            suffixIcon={
              <CalendarOutlined size="1em"
                className={["app-icon", "question-options__picker-suffix-icon"].filter(Boolean).join(' ')}
                style={{ '--suffix-icon-color': hasError ? '#EF4444' : '#6B7280' }}
              />
            }
            popupStyle={{
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}
            inputReadOnly
            showToday={true}
            showNow={false}
          />

          {/* Preview of selected date */}
          {selectedDate && (
            <div className="question-options__picker-preview">
              {dayjs(selectedDate).format('MMM DD, YYYY')}
            </div>
          )}
        </div>

        {/* Helper text */}
        <div className="question-options__helper-text">
          <CalendarTodayIcon size="1em" className={["app-icon", "question-options__helper-icon"].filter(Boolean).join(' ')} />
          Date picker is disabled
        </div>

        {hasError && (
          <div className="question-options__error-text">
            <span className="question-options__error-icon">⚠️</span>
            {typeof errors.questions[index].date_value === 'string'
              ? errors.questions[index].date_value
              : errors.questions[index].date_value?.message || 'Invalid date'}
          </div>
        )}

        <style jsx>{`
          .custom-date-picker .ant-picker-input input {
            cursor: pointer !important;
            font-weight: 500;
          }
          .custom-date-picker:hover {
            border-color: #3e6a9f !important;
            box-shadow: 0 0 0 3px rgba(62, 106, 159, 0.1) !important;
            transform: translateY(-1px);
          }
          .custom-date-picker.ant-picker-focused {
            border-color: #3e6a9f !important;
            box-shadow: 0 0 0 3px rgba(62, 106, 159, 0.1) !important;
            transform: translateY(-1px);
          }
          .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before {
            border-color: #3e6a9f !important;
          }
          .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner {
            color: #3e6a9f !important;
            font-weight: 600;
          }
          .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
            background-color: #3e6a9f !important;
            color: white !important;
          }
          .ant-picker-dropdown .ant-picker-header {
            border-bottom: 1px solid #E5E7EB;
            padding: 12px 16px;
          }
          .ant-picker-dropdown .ant-picker-body {
            padding: 16px;
          }
        `}</style>
      </div>
    );
  }

  if (question.question_type === 'time') {
    const hasError = errors.questions?.[index]?.time_value && touched.questions?.[index]?.time_value;
    const selectedTime = values.questions?.[index]?.time_value;

    return (
      <div>
        <label className="question-options__label--dark">
          Time Selection
        </label>

        <div className="question-options__picker-wrap">
          <TimePicker
            value={selectedTime ? dayjs(selectedTime) : null}
            placeholder="Click to select a time"
            className="custom-time-picker question-options__picker"
            style={{ '--picker-border': hasError ? '1px solid #EF4444' : '1px solid #D1D5DB' }}
            name={`questions[${index}].time_value`}
            onChange={(time) => {
              const dayjsTime = time ? dayjs(time) : null;
              setFieldValue(`questions[${index}].time_value`, dayjsTime);
              onUpdateQuestion(question.id, 'time_value', dayjsTime);
            }}
            onBlur={handleBlur}
            format="HH:mm"
            allowClear
            disabled={true}
            suffixIcon={
              <ClockCircleOutlined size="1em"
                className={["app-icon", "question-options__picker-suffix-icon"].filter(Boolean).join(' ')}
                style={{ '--suffix-icon-color': hasError ? '#EF4444' : '#6B7280' }}
              />
            }
            popupStyle={{
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB'
            }}
            inputReadOnly
            showNow={false}
            minuteStep={15}
            hourStep={1}
            use12Hours={false}
          />

          {/* Preview of selected time */}
          {selectedTime && (
            <div className="question-options__picker-preview">
              {dayjs(selectedTime).format('HH:mm')}
            </div>
          )}
        </div>

        {/* Helper text */}
        <div className="question-options__helper-text">
          <ScheduleIcon size="1em" className={["app-icon", "question-options__helper-icon"].filter(Boolean).join(' ')} />
          Time picker is disabled
        </div>

        {hasError && (
          <div className="question-options__error-text">
            <span className="question-options__error-icon">⚠️</span>
            {typeof errors.questions[index].time_value === 'string'
              ? errors.questions[index].time_value
              : errors.questions[index].time_value?.message || 'Invalid time'}
          </div>
        )}

        <style jsx>{`
          .custom-time-picker .ant-picker-input input {
            cursor: pointer !important;
            font-weight: 500;
          }
          .custom-time-picker:hover {
            border-color: #3e6a9f !important;
            box-shadow: 0 0 0 3px rgba(62, 106, 159, 0.1) !important;
            transform: translateY(-1px);
          }
          .custom-time-picker.ant-picker-focused {
            border-color: #3e6a9f !important;
            box-shadow: 0 0 0 3px rgba(62, 106, 159, 0.1) !important;
            transform: translateY(-1px);
          }
          .ant-picker-dropdown .ant-picker-time-panel {
            border-radius: 8px;
          }
          .ant-picker-dropdown .ant-picker-time-panel .ant-picker-content {
            border-radius: 8px;
          }
          .ant-picker-time-panel-column > li.ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner {
            background-color: #3e6a9f !important;
            color: white !important;
            font-weight: 600;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="question-options__not-implemented">
      <div className="question-options__not-implemented-text">
        Question type not yet implemented
      </div>
    </div>
  );
};

export default QuestionOptions;