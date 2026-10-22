import React, { useState } from 'react';
import { Modal, Button, Card, Row, Col, Typography, message, Input } from 'antd';
import '../assets/styles/legacy/input-field.css';
import { Plus as PlusOutlined } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

// Predefined question templates (showing only 10 selected questions)
const QUESTION_TEMPLATES = [
  {
    id: 'total_professional_experience',
    title: 'Total Professional Experience',
    question: {
      question_text: 'How many years of total professional experience do you have?',
      question_type: 'multiple_choice',
      is_required: true,
      options: [
        { id: 1, label: '0-1 years', value: '0-1_years' },
        { id: 2, label: '1-3 years', value: '1-3_years' },
        { id: 3, label: '3-5 years', value: '3-5_years' },
        { id: 4, label: '5-8 years', value: '5-8_years' },
        { id: 5, label: '8-10 years', value: '8-10_years' },
        { id: 6, label: '10+ years', value: '10+_years' }
      ],
      help_text: 'Select the option that best describes your total professional experience'
    }
  },
  {
    id: 'field_specific_experience',
    title: 'Field-Specific Experience',
    question: {
      question_text: 'How many years of experience do you have in this specific field/role?',
      question_type: 'short_answer',
      is_required: true,
      options: [],
      help_text: 'Enter the number of years (e.g., 3.5 or 3 years 6 months)'
    }
  },
  {
    id: 'current_company',
    title: 'Current Company',
    question: {
      question_text: 'What is the name of your current company?',
      question_type: 'short_answer',
      is_required: true,
      options: [],
      help_text: 'Enter the full name of your current employer'
    }
  },
  {
    id: 'current_salary',
    title: 'Current Salary',
    question: {
      question_text: 'What is your current monthly/annual salary?',
      question_type: 'short_answer',
      is_required: false,
      options: [],
      help_text: 'Specify if monthly or annual, and include currency (e.g., 50,000 PKR monthly)'
    }
  },
  {
    id: 'expected_salary',
    title: 'Expected Salary',
    question: {
      question_text: 'What is your expected salary?',
      question_type: 'short_answer',
      is_required: true,
      options: [],
      help_text: 'Enter your expected salary range (e.g., 60,000-80,000 PKR monthly)'
    }
  },
  {
    id: 'current_work_schedule',
    title: 'Current Work Schedule',
    question: {
      question_text: 'What are your current working days and timings?',
      question_type: 'short_answer',
      is_required: false,
      options: [],
      help_text: 'Describe your current work schedule (e.g., Monday-Friday, 9 AM - 6 PM)'
    }
  },
  {
    id: 'location_feasibility',
    title: 'Location Feasibility',
    question: {
      question_text: '___ is our location, is it feasible for you?',
      question_type: 'multiple_choice',
      is_required: true,
      options: [
        { id: 1, label: 'Yes, very convenient', value: 'yes_convenient' },
        { id: 2, label: 'Yes, manageable commute', value: 'yes_manageable' },
        { id: 3, label: 'No, too far', value: 'no_too_far' },
        { id: 4, label: 'Maybe, depends on work arrangement', value: 'maybe_flexible' },
        { id: 5, label: 'Prefer remote work', value: 'prefer_remote' }
      ],
      help_text: 'Select your preference regarding the work location'
    }
  },
  {
    id: 'reason_for_leaving',
    title: 'Reason for Leaving',
    question: {
      question_text: 'What is your reason for leaving your previous/current company?',
      question_type: 'paragraph',
      is_required: false,
      options: [],
      help_text: 'Briefly explain your reasons for seeking a new opportunity'
    }
  },
  {
    id: 'immediate_joining',
    title: 'Immediate Joining Availability',
    question: {
      question_text: 'Are you available to join immediately? (Yes/No)',
      question_type: 'multiple_choice',
      is_required: true,
      options: [
        { id: 1, label: 'Yes, I can join immediately', value: 'yes_immediate' },
        { id: 2, label: 'No, I need to serve notice period', value: 'no_notice_period' },
        { id: 3, label: 'Depends on the offer', value: 'depends_on_offer' }
      ],
      help_text: 'Select your availability to start work immediately'
    }
  },
  {
    id: 'notice_period',
    title: 'Notice Period',
    question: {
      question_text: 'If not, what is your notice period?',
      question_type: 'multiple_choice',
      is_required: false,
      options: [
        { id: 1, label: 'Immediate (within 1 week)', value: 'immediate' },
        { id: 2, label: '1-2 weeks', value: '1-2_weeks' },
        { id: 3, label: '1 month', value: '1_month' },
        { id: 4, label: '2 months', value: '2_months' },
        { id: 5, label: '3 months or more', value: '3+_months' }
      ],
      help_text: 'How much notice do you need to give your current employer?'
    }
  }
];

const PredefinedQuestions = ({ visible, onClose, onAddQuestion }) => {

  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = QUESTION_TEMPLATES.filter((template) => {
    const text = template.question.question_text || '';
    const title = template.title || '';
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return true;
    return (
      text.toLowerCase().includes(needle) ||
      title.toLowerCase().includes(needle)
    );
  });

  const handleAddQuestion = (template) => {
    const newQuestion = {
      ...template.question,
      id: Date.now(),
      options: template.question.options?.map(opt => ({ ...opt, id: Date.now() + Math.random() }))
    };

    onAddQuestion(newQuestion);
    message.success(`Added "${template.title}" question to your form`);
  };

  return (
    <Modal
      title="Predefined Questions"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      style={{ top: 20 }}
    >
      <Input.Search
        placeholder="Search questions"
        allowClear
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="custom-input"
        style={{ marginBottom: 16 }}
      />
      <Row gutter={[16, 16]}>
        {filteredTemplates.map((template) => (
          <Col xs={24} sm={12} lg={8} key={template.id}>
            <Card
              hoverable
              style={{
                height: '100%',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              bodyStyle={{
                padding: '20px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ flex: 1 }}>
                {/* Question Text */}
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '13px', color: '#374151', marginBottom: '4px', display: 'block' }}>
                    Question:
                  </Text>
                <Paragraph
                  style={{
                    fontSize: '12px',
                      color: '#4b5563',
                      margin: 0,
                      fontStyle: 'italic'
                  }}
                >
                    "{template.question.question_text}"
                </Paragraph>
                </div>

                {/* Question Type */}
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '11px', color: '#6b7280' }}>
                    Type: <span style={{ color: '#3E6A9F' }}>{template.question.question_type.replace('_', ' ')}</span>
                  </Text>
                </div>

                {/* Options */}
                {template.question.options && template.question.options.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', display: 'block' }}>
                      Options:
                    </Text>
                    <div style={{
                      padding: '8px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {template.question.options.map((option, index) => (
                        <div
                          key={option.id}
                          style={{
                            fontSize: '11px',
                            color: '#4b5563',
                            marginBottom: index < template.question.options.length - 1 ? '4px' : 0,
                            padding: '2px 0'
                          }}
                        >
                          • {option.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="primary"
                icon={<PlusOutlined size="1em" className="app-icon" />}
                onClick={() => handleAddQuestion(template)}
                style={{
                  width: '100%',
                  background: '#3E6A9F',
                  borderColor: '#3E6A9F',
                  borderRadius: '8px',
                  marginTop: 'auto',
                  fontWeight: '500'
                }}
                size="middle"
              >
                Add to Form
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </Modal>
  );
};

export default PredefinedQuestions;