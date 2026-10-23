// Job form options and constants

// Language options
export const languageOptions = [
  { label: 'English', value: 'English' },
  { label: 'Urdu', value: 'Urdu' },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'Arabic', value: 'Arabic' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'French', value: 'French' },
  { label: 'German', value: 'German' },
  { label: 'Italian', value: 'Italian' },
  { label: 'Portuguese', value: 'Portuguese' },
  { label: 'Russian', value: 'Russian' },
  { label: 'Chinese (Mandarin)', value: 'Chinese (Mandarin)' },
  { label: 'Chinese (Cantonese)', value: 'Chinese (Cantonese)' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Korean', value: 'Korean' },
  { label: 'Bengali', value: 'Bengali' },
  { label: 'Punjabi', value: 'Punjabi' },
  { label: 'Pashto', value: 'Pashto' },
  { label: 'Turkish', value: 'Turkish' },
  { label: 'Persian (Farsi)', value: 'Persian (Farsi)' },
  { label: 'Dutch', value: 'Dutch' },
  { label: 'Swedish', value: 'Swedish' },
  { label: 'Norwegian', value: 'Norwegian' },
  { label: 'Danish', value: 'Danish' },
  { label: 'Finnish', value: 'Finnish' },
  { label: 'Polish', value: 'Polish' },
  { label: 'Czech', value: 'Czech' },
  { label: 'Greek', value: 'Greek' },
  { label: 'Hebrew', value: 'Hebrew' },
  { label: 'Thai', value: 'Thai' },
  { label: 'Vietnamese', value: 'Vietnamese' },
  { label: 'Indonesian', value: 'Indonesian' },
  { label: 'Malay', value: 'Malay' },
  { label: 'Tagalog (Filipino)', value: 'Tagalog (Filipino)' },
  { label: 'Tamil', value: 'Tamil' },
  { label: 'Telugu', value: 'Telugu' },
  { label: 'Marathi', value: 'Marathi' },
  { label: 'Gujarati', value: 'Gujarati' },
  { label: 'Kannada', value: 'Kannada' },
  { label: 'Malayalam', value: 'Malayalam' },
  { label: 'Sinhala', value: 'Sinhala' },
  { label: 'Nepali', value: 'Nepali' },
  { label: 'Swahili', value: 'Swahili' },
  { label: 'Afrikaans', value: 'Afrikaans' },
  { label: 'Romanian', value: 'Romanian' },
  { label: 'Hungarian', value: 'Hungarian' },
  { label: 'Bulgarian', value: 'Bulgarian' },
  { label: 'Croatian', value: 'Croatian' },
  { label: 'Serbian', value: 'Serbian' },
  { label: 'Slovak', value: 'Slovak' },
  { label: 'Slovenian', value: 'Slovenian' },
  { label: 'Lithuanian', value: 'Lithuanian' },
  { label: 'Latvian', value: 'Latvian' },
  { label: 'Estonian', value: 'Estonian' },
  { label: 'Ukrainian', value: 'Ukrainian' },
  { label: 'Belarusian', value: 'Belarusian' },
];

// Nationality options
export const nationalityOptions = [
  { label: 'Afghan', value: 'Afghan' },
  { label: 'Pakistani', value: 'Pakistani' },
  { label: 'Indian', value: 'Indian' },
  { label: 'Bangladeshi', value: 'Bangladeshi' },
  { label: 'Sri Lankan', value: 'Sri Lankan' },
  { label: 'Nepali', value: 'Nepali' },
  { label: 'American', value: 'American' },
  { label: 'British', value: 'British' },
  { label: 'Canadian', value: 'Canadian' },
  { label: 'Australian', value: 'Australian' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'South Korean', value: 'South Korean' },
  { label: 'Filipino', value: 'Filipino' },
  { label: 'Thai', value: 'Thai' },
  { label: 'Vietnamese', value: 'Vietnamese' },
  { label: 'Malaysian', value: 'Malaysian' },
  { label: 'Singaporean', value: 'Singaporean' },
  { label: 'Indonesian', value: 'Indonesian' },
  { label: 'Emirati', value: 'Emirati' },
  { label: 'Saudi Arabian', value: 'Saudi Arabian' },
  { label: 'Egyptian', value: 'Egyptian' },
  { label: 'South African', value: 'South African' },
  { label: 'Nigerian', value: 'Nigerian' },
  { label: 'Kenyan', value: 'Kenyan' },
  { label: 'European', value: 'European' },
];

// Department options
const departmentLabels = [
  'Accounting and Finance',
  'C-Level',
  'Content Writing and Editing',
  'Customer Service and Support',
  'Data Analysis and BI (Business Intelligence)',
  'Designing (Figma / UI UX / Graphic Designer)',
  'DevOps',
  'E-commerce',
  'Education and Training',
  'Engineering (Chemical / Mechanical / Civil)',
  'Healthcare and Medical',
  'HR and Administration',
  'Internships',
  'Labour (Office Boy / Driver / Electrician)',
  'Legal and Compliance',
  'Machine Learning',
  'Project Management',
  'Public Relations (PR)',
  'Sales and Marketing',
  'Software Development (Mobile and Web Development)',
  'SQA (Software Quality Assurance)',
  'Supply Chain',
  'Support and Technical Assistance',
  'Telecommunications',
  'Translation and Localization',
  'Travel, Tourism, and Hospitality',
  'Virtual Assistance',
  'Writing and Journalism',
  'Testd',
  'New Category',
];

export const departmentOptions = departmentLabels.map((label) => ({
  label,
  value: label,
}));

// Timezone options- exact sequence as provided
export const timezoneOptions = [
  { label: "(UTC+05:00) Ekaterinburg, Islamabad, Karachi, Tashkent", value: "(UTC+05:00) Ekaterinburg, Islamabad, Karachi, Tashkent" },
  { label: "(UTC-12:00) Eniwetok, Kwajalein", value: "(UTC-12:00) Eniwetok, Kwajalein" },
  { label: "(UTC-11:00) Midway Island, Samoa", value: "(UTC-11:00) Midway Island, Samoa" },
  { label: "(UTC-10:00) Hawaii", value: "(UTC-10:00) Hawaii" },
  { label: "(UTC-09:30) Taiohae", value: "(UTC-09:30) Taiohae" },
  { label: "(UTC-09:00) Alaska", value: "(UTC-09:00) Alaska" },
  { label: "(UTC-08:00) Pacific Time (US & Canada)", value: "(UTC-08:00) Pacific Time (US & Canada)" },
  { label: "(UTC-07:00) Mountain Time (US & Canada)", value: "(UTC-07:00) Mountain Time (US & Canada)" },
  { label: "(UTC-06:00) Central Time (US & Canada), Mexico City", value: "(UTC-06:00) Central Time (US & Canada), Mexico City" },
  { label: "(UTC-05:00) Eastern Time (US & Canada), Bogota, Lima", value: "(UTC-05:00) Eastern Time (US & Canada), Bogota, Lima" },
  { label: "(UTC-04:30) Caracas", value: "(UTC-04:30) Caracas" },
  { label: "(UTC-04:00) Atlantic Time (Canada), Caracas, La Paz", value: "(UTC-04:00) Atlantic Time (Canada), Caracas, La Paz" },
  { label: "(UTC-03:30) Newfoundland", value: "(UTC-03:30) Newfoundland" },
  { label: "(UTC-03:00) Brazil, Buenos Aires, Georgetown", value: "(UTC-03:00) Brazil, Buenos Aires, Georgetown" },
  { label: "(UTC-02:00) Mid-Atlantic", value: "(UTC-02:00) Mid-Atlantic" },
  { label: "(UTC-01:00) Azores, Cape Verde Islands", value: "(UTC-01:00) Azores, Cape Verde Islands" },
  { label: "(UTC+00:00) Western Europe Time, London, Lisbon, Casablanca", value: "(UTC+00:00) Western Europe Time, London, Lisbon, Casablanca" },
  { label: "(UTC+01:00) Brussels, Copenhagen, Madrid, Paris", value: "(UTC+01:00) Brussels, Copenhagen, Madrid, Paris" },
  { label: "(UTC+02:00) Kaliningrad, South Africa", value: "(UTC+02:00) Kaliningrad, South Africa" },
  { label: "(UTC+03:00) Baghdad, Riyadh, Moscow, St. Petersburg", value: "(UTC+03:00) Baghdad, Riyadh, Moscow, St. Petersburg" },
  { label: "(UTC+03:30) Tehran", value: "(UTC+03:30) Tehran" },
  { label: "(UTC+04:00) Abu Dhabi, Muscat, Baku, Tbilisi", value: "(UTC+04:00) Abu Dhabi, Muscat, Baku, Tbilisi" },
  { label: "(UTC+04:30) Kabul", value: "(UTC+04:30) Kabul" },
  { label: "(UTC+05:30) Bombay, Calcutta, Madras, New Delhi", value: "(UTC+05:30) Bombay, Calcutta, Madras, New Delhi" },
  { label: "(UTC+05:45) Kathmandu, Pokhara", value: "(UTC+05:45) Kathmandu, Pokhara" },
  { label: "(UTC+06:00) Almaty, Dhaka, Colombo", value: "(UTC+06:00) Almaty, Dhaka, Colombo" },
  { label: "(UTC+06:30) Yangon, Mandalay", value: "(UTC+06:30) Yangon, Mandalay" },
  { label: "(UTC+07:00) Bangkok, Hanoi, Jakarta", value: "(UTC+07:00) Bangkok, Hanoi, Jakarta" },
  { label: "(UTC+08:00) Beijing, Perth, Singapore, Hong Kong", value: "(UTC+08:00) Beijing, Perth, Singapore, Hong Kong" },
  { label: "(UTC+08:45) Eucla", value: "(UTC+08:45) Eucla" },
  { label: "(UTC+09:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk", value: "(UTC+09:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk" },
  { label: "(UTC+09:30) Adelaide, Darwin", value: "(UTC+09:30) Adelaide, Darwin" },
  { label: "(UTC+10:00) Eastern Australia, Guam, Vladivostok", value: "(UTC+10:00) Eastern Australia, Guam, Vladivostok" },
  { label: "(UTC+10:30) Lord Howe Island", value: "(UTC+10:30) Lord Howe Island" },
  { label: "(UTC+11:00) Magadan, Solomon Islands, New Caledonia", value: "(UTC+11:00) Magadan, Solomon Islands, New Caledonia" },
  { label: "(UTC+11:30) Norfolk Island", value: "(UTC+11:30) Norfolk Island" },
  { label: "(UTC+12:00) Auckland, Wellington, Fiji, Kamchatka", value: "(UTC+12:00) Auckland, Wellington, Fiji, Kamchatka" },
  { label: "(UTC+12:45) Chatham Islands", value: "(UTC+12:45) Chatham Islands" },
  { label: "(UTC+13:00) Apia, Nukualofa", value: "(UTC+13:00) Apia, Nukualofa" },
  { label: "(UTC+14:00) Line Islands, Tokelau", value: "(UTC+14:00) Line Islands, Tokelau" },
];

// Working days options
export const workingDaysOptions = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
];

// Job type options
export const jobTypeOptions = [
  { label: "Full-Time", value: "Full-Time" },
  { label: "Part-Time", value: "Part-Time" },
  { label: "Contract", value: "Contract" },
  { label: "Internship", value: "Internship" },
];

// Employment type options
export const employmentTypeOptions = [
  { label: "Office-Based", value: "Office-Based" },
  { label: "Remote", value: "Remote" },
  { label: "Hybrid", value: "Hybrid" },
];

// Gender options
export const genderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "No Preference", value: "No Preference" },
];

// Vacancy options
export const getVacancyOptions = () => {
  return Array.from({ length: 100 }, (_, i) => ({
    label: i + 1,
    value: i + 1,
  })).concat({ label: "100+", value: 101 });
};
export const degreeNameOptions = [
  'Software Engineering', 'Information Technology', 'Mechanical Engineering',
  'Electrical Engineering', 'Chemical Engineering', 'Aerospace Engineering',
  'Biomedical Engineering', 'Environmental Engineering', 'Pharmacy', 'Business Administration',
].map(name => ({ label: name, value: name }));

