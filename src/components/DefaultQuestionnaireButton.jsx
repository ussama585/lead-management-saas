import { Button } from './ui/app-controls.jsx';
import React from 'react';


export const buildDefaultQuestionnaireQuestions = (baseTime) => ([
  {
    id: baseTime,
    question_text: 'Full Name',
    question_type: 'short_answer',
    is_required: true,
    options: [],
    help_text: 'Enter your full name as per official documents',
    date_value: null,
    time_value: null
  },
  {
    id: baseTime + 1,
    question_text: 'Contact Number',
    question_type: 'short_answer',
    is_required: true,
    options: [],
    help_text: 'Include country code if applicable',
    date_value: null,
    time_value: null
  },
  {
    id: baseTime + 2,
    question_text: 'Email Address',
    question_type: 'short_answer',
    is_required: true,
    options: [],
    help_text: 'Use an email address you actively check',
    date_value: null,
    time_value: null
  },
  {
    id: baseTime + 3,
    question_text: 'Current Location',
    question_type: 'short_answer',
    is_required: true,
    options: [],
    help_text: 'City and state (and country if applicable)',
    date_value: null,
    time_value: null
  },
  {
    id: baseTime + 4,
    question_text: 'Are you comfortable working at [Job Location]?',
    question_type: 'multiple_choice',
    is_required: true,
    options: [
      { id: baseTime + 41, label: 'Yes', value: 'yes' },
      { id: baseTime + 42, label: 'No', value: 'no' },
      { id: baseTime + 43, label: 'Maybe / Depends on details', value: 'maybe' }
    ],
    help_text: 'You can edit [Job Location] text before sharing the form',
    date_value: null,
    time_value: null
  },
  {
    id: baseTime + 5,
    question_text: 'Are you available for the [Shift Timing]?',
    question_type: 'multiple_choice',
    is_required: true,
    options: [
      { id: baseTime + 51, label: 'Yes', value: 'yes' },
      { id: baseTime + 52, label: 'No', value: 'no' },
      { id: baseTime + 53, label: 'Maybe / Depends on shift', value: 'maybe' }
    ],
    help_text: 'You can edit [Shift Timing] text before sharing the form',
    date_value: null,
    time_value: null
  },
  {
    id: baseTime + 6,
    question_text: 'Notice period / When can you start?',
    question_type: 'short_answer',
    is_required: true,
    options: [],
    help_text: 'Mention your exact or approximate joining date / notice period',
    date_value: null,
    time_value: null
  },
  {
    id: baseTime + 7,
    question_text: 'Last Job Title',
    question_type: 'short_answer',
    is_required: true,
    options: [],
    help_text: 'Your most recent role/designation',
    date_value: null,
    time_value: null
  },
  {
    id: baseTime + 8,
    question_text: 'Last Company Name',
    question_type: 'short_answer',
    is_required: true,
    options: [],
    help_text: 'Full legal name of your last employer',
    date_value: null,
    time_value: null
  },
  {
    id: baseTime + 9,
    question_text: 'Current salary',
    question_type: 'short_answer',
    is_required: false,
    options: [],
    help_text: 'Mention currency and whether monthly or annual',
    date_value: null,
    time_value: null
  },
  {
    id: baseTime + 10,
    question_text: 'Expected salary',
    question_type: 'short_answer',
    is_required: true,
    options: [],
    help_text: 'Mention currency and whether monthly or annual',
    date_value: null,
    time_value: null
  }
]);

const DefaultQuestionnaireButton = ({ onAddQuestions }) => {
  const handleClick = () => {
    const baseTime = Date.now();
    const questions = buildDefaultQuestionnaireQuestions(baseTime);
    if (typeof onAddQuestions === 'function') {
      onAddQuestions(questions);
    }
  };

  return (
    <Button
      type="primary"
      onClick={handleClick}
      style={{
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      Add Default Questionnaire
    </Button>
  );
};

export default DefaultQuestionnaireButton;

