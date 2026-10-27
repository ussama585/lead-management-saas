import { Tooltip } from './ui/app-controls.jsx';
import React from 'react';
import { Col, Switch } from 'antd';
import { Copy as CopyOutlined, Trash2 as DeleteOutlined } from 'lucide-react';
import { GripHorizontal as DragHandleIcon } from 'lucide-react';
import QuestionOptions from './QuestionOptions.jsx';
import QuestionTextInput from './QuestionTextInput.jsx';
import QuestionTypeSelect from './QuestionTypeSelect.jsx';

const QuestionCard = ({
  question,
  index,
  isFocused,
  isDragged,
  isDragOver,
  wrapInCol = true,
  onQuestionClick,
  onQuestionUpdate,
  onQuestionTypeChange,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onDuplicateQuestion,
  onDeleteQuestion,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDragOver,
  formik: { values, errors, touched, handleChange, handleBlur, setFieldValue },
}) => {
  const cardShell = (
    <div className={`gf-qcard-shell ${isDragged ? 'gf-qcard-shell--dragged' : ''}`}>
      <div
        className={`gf-qcard ${isDragOver ? 'gf-qcard--dragover' : ''} ${isFocused ? 'gf-qcard--focused' : ''}`}
        onClick={() => onQuestionClick(question.id)}
        onDragEnter={(e) => onDragEnter(e, index)}
        onDragOver={onDragOver}
        role="presentation"
      >
        {isFocused && <div className="gf-qcard-accent" aria-hidden />}

        <div className="gf-qcard-inner">
          <div className="gf-qcard-drag-row">
            <button
              type="button"
              className="gf-qcard-drag"
              draggable
              onDragStart={(e) => onDragStart(e, index)}
              onDragEnd={onDragEnd}
              onClick={(e) => e.stopPropagation()}
              aria-label="Drag to reorder"
            >
              <DragHandleIcon size="1em" className={["app-icon", "gf-qcard-drag-icon"].filter(Boolean).join(' ')} />
            </button>
          </div>

          <div className="gf-qcard-body">
            <div className="gf-qcard-title-row">
              <div className="gf-qcard-title-grow" onClick={(e) => e.stopPropagation()}>
                <QuestionTextInput
                  variant="google"
                  value={values.questions?.[index]?.question_text || ''}
                  onChange={(e) => {
                    handleChange(e);
                    onQuestionUpdate(question.id, 'question_text', e.target.value);
                  }}
                  onBlur={handleBlur}
                  placeholder="Untitled Question"
                  name={`questions[${index}].question_text`}
                  error={Boolean(errors.questions?.[index]?.question_text && touched.questions?.[index]?.question_text)}
                  errorMessage={
                    errors.questions?.[index]?.question_text && touched.questions?.[index]?.question_text
                      ? errors.questions[index].question_text
                      : undefined
                  }
                />
              </div>
              <div className="gf-qcard-type-slot" onClick={(e) => e.stopPropagation()}>
                <QuestionTypeSelect
                  value={question.question_type}
                  onChange={onQuestionTypeChange}
                  questionId={question.id}
                  questionIndex={index}
                  setFieldValue={setFieldValue}
                  disabled={question?.is_editable === false}
                  hideLabel
                  compact
                />
              </div>
            </div>

            <div className="gf-qcard-options-slot" onClick={(e) => e.stopPropagation()}>
              <QuestionOptions
                question={question}
                index={index}
                onUpdateOption={onUpdateOption}
                onAddOption={onAddOption}
                onRemoveOption={onRemoveOption}
                onUpdateQuestion={onQuestionUpdate}
                visualVariant="google"
                formik={{ values, errors, touched, handleChange, handleBlur, setFieldValue }}
              />
              {errors.questions?.[index]?.options && touched.questions?.[index]?.options && (
                <div className="gf-qcard-options-error">
                  {typeof errors.questions[index].options === 'string'
                    ? errors.questions[index].options
                    : errors.questions[index].options?.message || 'Invalid options'}
                </div>
              )}
            </div>
          </div>

          <div className="gf-qcard-footer">
            <div className="gf-qcard-footer-spacer" />
            <div className="gf-qcard-footer-actions">
              <Tooltip title="Duplicate">
                <button
                  type="button"
                  className="gf-qcard-footer-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateQuestion(question.id);
                  }}
                  aria-label="Duplicate"
                >
                  <CopyOutlined size="1em" className={["app-icon", "gf-qcard-footer-icon-svg"].filter(Boolean).join(' ')} />
                </button>
              </Tooltip>
              <Tooltip title="Delete">
                <button
                  type="button"
                  className="gf-qcard-footer-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuestion(question.id);
                  }}
                  aria-label="Delete"
                >
                  <DeleteOutlined size="1em" className={["app-icon", "gf-qcard-footer-icon-svg"].filter(Boolean).join(' ')} />
                </button>
              </Tooltip>
              <span className="gf-qcard-footer-divider" />
              <span className="gf-qcard-required-label">Required</span>
              <div className="gf-qcard-switch-wrap" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
                <Switch
                  checked={values.questions?.[index]?.is_required}
                  onChange={(checked) => {
                    setFieldValue(`questions[${index}].is_required`, checked);
                    onQuestionUpdate(question.id, 'is_required', checked);
                  }}
                  size="small"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!wrapInCol) {
    return cardShell;
  }

  return (
    <Col xs={24} lg={12}>
      {cardShell}
    </Col>
  );
};

export default QuestionCard;
