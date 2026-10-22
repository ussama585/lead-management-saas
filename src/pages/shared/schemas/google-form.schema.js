import * as Yup from 'yup';

// Question option schema
const questionOptionSchema = Yup.object().shape({
  id: Yup.mixed().required(),
  label: Yup.string()
    .required('Please fill in option text')
    .trim()
    .min(1, 'Option cannot be empty'),
  value: Yup.string().required()
});

// Individual question schema
const questionSchema = Yup.object().shape({
  id: Yup.mixed().required(),
  question_text: Yup.string()
    .required('Please add question text')
    .min(3, 'Question must be at least 3 characters')
    .max(500, 'Question must be less than 500 characters'),
  question_type: Yup.string()
    .required('Question type is required')
    .oneOf([
      'short_answer',
      'paragraph',
      'multiple_choice',
      'checkboxes',
      'dropdown',
      'file_upload',
      'date',
      'time'
    ], 'Invalid question type'),
  is_required: Yup.boolean().default(true),
  options: Yup.array().when('question_type', {
    is: (questionType) => ['multiple_choice', 'checkboxes', 'dropdown'].includes(questionType),
    then: (schema) => schema
      .of(questionOptionSchema)
      .min(2, 'At least 2 options are required')
      .max(50, 'Maximum 50 options allowed')
      .test('non-empty-options', 'All options must have a value', function(options) {
        if (!options || !Array.isArray(options)) return false;
        const emptyOptions = options.filter(opt => !opt.label || opt.label.trim() === '');
        if (emptyOptions.length > 0) {
          return this.createError({
            message: `All options must have a value. ${emptyOptions.length} empty option(s) found.`
          });
        }
        return true;
      })
      .test('unique-options', 'Duplicate options are not allowed. Each option must be unique.', function(options) {
        if (!options || !Array.isArray(options)) return true;
        const labels = options.map(opt => (opt.label || '').trim().toLowerCase()).filter(Boolean);
        const uniqueLabels = new Set(labels);
        if (labels.length !== uniqueLabels.size) {
          return this.createError({
            message: 'Duplicate options are not allowed. Each option must be unique.'
          });
        }
        return true;
      }),
    otherwise: (schema) => schema.optional()
  }),
  date_value: Yup.mixed().when('question_type', (questionType, schema) => {
    return questionType === 'date'
      ? schema.required('Please select a date')
      : schema.nullable();
  }),
  time_value: Yup.mixed().when('question_type', (questionType, schema) => {
    return questionType === 'time'
      ? schema.required('Please select a time')
      : schema.nullable();
  }),
  help_text: Yup.string().max(200, 'Help text must be less than 200 characters')
});

// Main form schema
export const googleFormSchema = Yup.object().shape({
  formTitle: Yup.string()
    .required('Please add a form title')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  questions: Yup.array()
    .of(questionSchema)
    .min(1, 'At least one question is required')
    .max(100, 'Maximum 100 questions allowed')
});

// Schema for individual question updates
export const questionUpdateSchema = Yup.object().shape({
  question_text: Yup.string()
    .required('Question text is required')
    .min(3, 'Question must be at least 3 characters')
    .max(500, 'Question must be less than 500 characters'),
  question_type: Yup.string().required('Question type is required'),
  is_required: Yup.boolean(),
  options: Yup.array().when('question_type', {
    is: (questionType) => ['multiple_choice', 'checkboxes', 'dropdown'].includes(questionType),
    then: (schema) => schema
      .of(questionOptionSchema)
      .min(2, 'At least 2 options are required')
      .test('non-empty-options', 'All options must have a value', function(options) {
        if (!options) return false;
        const emptyOptions = options.filter(opt => !opt.label || opt.label.trim() === '');
        if (emptyOptions.length > 0) {
          return this.createError({
            message: `All options must have a value. ${emptyOptions.length} empty option(s) found.`
          });
        }
        return true;
      })
      .test('unique-options', 'All options must be unique', function(options) {
        if (!options) return false;
        const labels = options.map(opt => opt.label?.trim()?.toLowerCase()).filter(Boolean);
        const uniqueLabels = new Set(labels);
        if (labels.length !== uniqueLabels.size) {
          return this.createError({
            message: 'Duplicate options found. All options must be unique.'
          });
        }
        return true;
      }),
    otherwise: (schema) => schema.optional()
  })
});

// Schema for form header updates
export const formHeaderSchema = Yup.object().shape({
  formTitle: Yup.string()
    .required('Form title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
});


export default googleFormSchema;