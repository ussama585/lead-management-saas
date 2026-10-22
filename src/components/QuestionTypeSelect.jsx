import React from 'react';
import { Text as ShortTextIcon } from 'lucide-react';
import { AlignLeft as NotesIcon } from 'lucide-react';
import { SquareCheck as CheckBoxIcon } from 'lucide-react';
import { CircleChevronDown as ArrowDropDownCircleIcon } from 'lucide-react';
import { CloudUpload as CloudUploadIcon } from 'lucide-react';
import { Calendar as CalendarTodayIcon } from 'lucide-react';
import { Clock as ScheduleIcon } from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'short_answer', label: 'Short Answer', icon: <ShortTextIcon size="1em" className="app-icon" style={{ fontSize: '18px' }} /> },
  { value: 'paragraph', label: 'Paragraph', icon: <NotesIcon size="1em" className="app-icon" style={{ fontSize: '18px' }} /> },
  { value: 'multiple_choice', label: 'Multiple choice', icon: <CheckBoxIcon size="1em" className="app-icon" style={{ fontSize: '18px' }} /> },
  { value: 'checkboxes', label: 'Checkboxes', icon: <CheckBoxIcon size="1em" className="app-icon" style={{ fontSize: '18px' }} /> },
  { value: 'dropdown', label: 'Dropdown', icon: <ArrowDropDownCircleIcon size="1em" className="app-icon" style={{ fontSize: '18px' }} /> },
  { value: 'file_upload', label: 'File Upload', icon: <CloudUploadIcon size="1em" className="app-icon" style={{ fontSize: '18px' }} /> },
  { value: 'date', label: 'Date', icon: <CalendarTodayIcon size="1em" className="app-icon" style={{ fontSize: '18px' }} /> },
  { value: 'time', label: 'Time', icon: <ScheduleIcon size="1em" className="app-icon" style={{ fontSize: '18px' }} /> },
];

const QuestionTypeSelect = ({
  value,
  onChange,
  questionId,
  questionIndex,
  setFieldValue,
  disabled = false,
  hideLabel = false,
  /** Narrow select for Google Forms–style header row */
  compact = false,
}) => {
  const selectedQuestionType = QUESTION_TYPES.find(t => t.value === value);

  return (
    <div className={compact ? 'gf-qcard-type-wrap' : undefined}>
      {!hideLabel && (
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '500',
          color: '#6B7280',
          marginBottom: '4px'
        }}>
          Question Type
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          style={{
            width: compact ? 'auto' : '100%',
            minWidth: compact ? '200px' : undefined,
            maxWidth: compact ? '280px' : undefined,
            height: '42px',
            borderRadius: '4px',
            border: '1px solid #dadce0',
            backgroundColor: disabled ? '#f1f3f4' : '#fff',
            fontSize: '13px',
            padding: '8px 32px 8px 36px',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            opacity: disabled ? 0.7 : 1,
            color: '#3c4043',
            boxShadow: 'none',
          }}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const newValue = e.target.value;
            if (setFieldValue) {
              setFieldValue(`questions[${questionIndex}].question_type`, newValue);
            }
            if (onChange) {
              onChange(questionId, newValue);
            }
          }}
          onFocus={(e) => {
            if (disabled) return;
            e.target.style.borderColor = '#3e6a9f';
            e.target.style.boxShadow = '0 0 0 3px rgba(62, 106, 159, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D1D5DB';
            e.target.style.boxShadow = 'none';
          }}
        >
          {QUESTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          zIndex: 1
        }}>
          {selectedQuestionType?.icon}
        </div>
        <div style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          zIndex: 1
        }}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="#6B7280"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default QuestionTypeSelect;

