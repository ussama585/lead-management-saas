import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Row, Col, Input, Typography } from 'antd';
import '../assets/styles/legacy/input-field.css';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/default-questionnaire-preview-modal.css';
import './DefaultQuestionnairePreviewModal.css';

const { Text, Paragraph, Title } = Typography;

const QUESTION_TYPE_LABELS = {
  short_answer: 'Short Answer',
  paragraph: 'Paragraph',
  multiple_choice: 'Multiple Choice',
  checkboxes: 'Checkboxes',
  dropdown: 'Dropdown',
  file_upload: 'File Upload',
  date: 'Date',
  time: 'Time',
};

const DefaultQuestionnairePreviewModal = ({
  visible,
  questions = [],
  onCancel,
  onConfirm,
  modalTitle = 'Default Questionnaire Preview',
  confirmLabel = 'Use This Template',
  formTitle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    if (!visible) setSearchTerm('');
  }, [visible]);
  const renderQuestionTypeLabel = (type) =>
    QUESTION_TYPE_LABELS[type] || type;

  const filteredQuestions = questions.filter((q) => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return true;
    const text = q.question_text || '';
    const help = q.help_text || '';
    return (
      text.toLowerCase().includes(needle) ||
      help.toLowerCase().includes(needle)
    );
  });

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onCancel}
      width={1200}
      className="default-questionnaire-preview-modal questionnaire-preview-modal--offset"
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={onConfirm}
          className="preview-modal-confirm-btn"
        >
          {confirmLabel}
        </Button>,
      ]}
    >
      {formTitle && (
        <div className="questionnaire-preview__form-title-wrap">
          <Title level={5} className="questionnaire-preview__form-title">
            {formTitle}
          </Title>
        </div>
      )}
      <Input.Search
        placeholder="Search questions"
        allowClear
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="custom-input questionnaire-preview__search"
      />
      <Row gutter={[16, 16]}>
        {filteredQuestions.map((question, index) => (
          <Col xs={24} sm={12} lg={8} key={question.id}>
            <Card hoverable className="questionnaire-preview__card">
              <div className="questionnaire-preview__card-content">
                <div className="questionnaire-preview__section">
                  <Text strong className="questionnaire-preview__question-label">
                    Question {index + 1}:
                  </Text>
                  <Paragraph className="questionnaire-preview__question-text">
                    &quot;{question.question_text}
                    {question.is_required ? ' *' : ''}&quot;
                  </Paragraph>
                </div>
                <div className="questionnaire-preview__section">
                  <Text strong className="questionnaire-preview__type-label">
                    Type:{' '}
                    <span className="questionnaire-preview__type-value">
                      {renderQuestionTypeLabel(question.question_type)}
                    </span>
                  </Text>
                </div>
                {question.help_text && (
                  <div className="questionnaire-preview__section">
                    <Text strong className="questionnaire-preview__help-label">
                      Help:
                    </Text>
                    <Paragraph className="questionnaire-preview__help-text">
                      {question.help_text}
                    </Paragraph>
                  </div>
                )}
                {question.options && question.options.length > 0 && (
                  <div className="questionnaire-preview__section">
                    <Text strong className="questionnaire-preview__options-label">
                      Options:
                    </Text>
                    <div className="questionnaire-preview__options-box">
                      {question.options.map((option, idx) => (
                        <div
                          key={option.id}
                          className="questionnaire-preview__option-item"
                          style={{
                            '--option-item-mb':
                              idx < question.options.length - 1 ? '4px' : 0,
                          }}
                        >
                          • {option.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Modal>
  );
};

export default DefaultQuestionnairePreviewModal;
