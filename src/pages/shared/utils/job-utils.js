import moment from 'moment';

// Helper functions for job-related operations

export function normalizeJobId(job) {
  const rawId = job?.id ?? job?.job_id ?? job?.jobId ?? job?.identifier;
  if (rawId === undefined || rawId === null) {
    console.warn('[normalizeJobId] Job missing ID fields:', job);
    return null;
  }
  return String(rawId);
}

export function getJobLabel(job) {
  return job?.job_title || job?.title || job?.name || `Job #${job?.id ?? job?.job_id ?? ''}`;
}

// Map API salary type to display format
export function mapApiSalaryTypeToDisplay(apiSalaryType) {
  if (!apiSalaryType) {
   return 'Average Salary';
  }

  const type = String(apiSalaryType).trim();
  
  // Handle display format: "Minimum Salary", "Average Salary", "Maximum Salary"
  if (type === 'Minimum Salary' || type === 'Minimum. Salary') {
    return 'Minimum Salary';
  }
  if (type === 'Average Salary' || type === 'Average. Salary') {
    return 'Average Salary';
  }
  if (type === 'Maximum Salary' || type === 'Maximum. Salary') {
    return 'Maximum Salary';
  }

  // Handle API format: minimum_salary, average_salary, maximum_salary
  const lowerType = type.toLowerCase();
  if (lowerType === 'minimum_salary' || lowerType.includes('minimum')) {
  return 'Minimum Salary';
  }
  if (lowerType === 'average_salary' || lowerType.includes('average')) {
    return 'Average Salary';
  }
  if (lowerType === 'maximum_salary' || lowerType.includes('maximum')) {
    return 'Maximum Salary';
  }
  
  // Default to Average Salary for unexpected values (like "Fixed Price")
  
  return 'Average Salary';
}

// Smart default salary type based on available salary data
export function getDefaultSalaryType(job, rowData) {
  // First check if API explicitly provides contract_salary_type
  if (job?.contract_salary_type) {
    const result = mapApiSalaryTypeToDisplay(job.contract_salary_type);
   
    return result;
  }

  // Next, honor other salary type fields the API might send
  const apiSalaryType =
    job?.salary_type ||
    job?.salaryType ||
    job?.salary_type_label ||
    job?.salary_type_label_display ||
    job?.salary_type_display;
  if (apiSalaryType) {
    const result = mapApiSalaryTypeToDisplay(apiSalaryType);
    return result;
  }

  // Determine based on available salary data
  const minSalary = rowData?.minSalary ?? job?.min_salary ?? null;
  const maxSalary = rowData?.maxSalary ?? job?.max_salary ?? null;

  const hasMin = minSalary !== null && minSalary !== undefined && minSalary > 0;
  const hasMax = maxSalary !== null && maxSalary !== undefined && maxSalary > 0;

  let result;
  if (hasMin && hasMax) {
    // Both available - default to Average Salary (makes sense with range)
    result = 'Average Salary';
  } else if (hasMin && !hasMax) {
    // Only min available - default to Minimum Salary
    result = 'Minimum Salary';
  } else if (!hasMin && hasMax) {
    // Only max available - default to Maximum Salary
    result = 'Maximum Salary';
  } else {
    // Neither available - fallback to Average Salary
    result = 'Average Salary';
  }

  

  return result;
}

// Calculate salary based on salary type and min/max values
export function calculateSalaryFromType(salaryType, minSalary, maxSalary) {
  const min = minSalary !== null && minSalary !== undefined ? Number(minSalary) : null;
  const max = maxSalary !== null && maxSalary !== undefined ? Number(maxSalary) : null;

  if (!min && !max) {
   return null;
  }

  // If no salaryType provided, determine smart default based on available data
  let effectiveSalaryType = salaryType;
  if (!salaryType || salaryType.trim() === '') {
    const hasMin = min !== null && min > 0;
    const hasMax = max !== null && max > 0;

    if (hasMin && hasMax) {
      effectiveSalaryType = 'Average Salary'; // Both available - use average
    } else if (hasMin && !hasMax) {
      effectiveSalaryType = 'Minimum Salary'; // Only min available - use minimum
    } else if (!hasMin && hasMax) {
      effectiveSalaryType = 'Maximum Salary'; // Only max available - use maximum
    } else {
      effectiveSalaryType = 'Average Salary'; // Fallback
    }

   
  }

  const type = (effectiveSalaryType || '').toLowerCase();
  let result;

  if (type.includes('average')) {
    // Average Salary: (min + max) / 2
    if (min !== null && max !== null) {
      result = (min + max) / 2;
    } else if (min !== null) {
      result = min; // Fallback to min if max is missing
    } else if (max !== null) {
      result = max; // Fallback to max if min is missing
    }
  } else if (type.includes('maximum')) {
    // Maximum Salary: use max, fallback to min
    result = max !== null ? max : min;
  } else if (type.includes('minimum')) {
    // Minimum Salary: use min, fallback to max
    result = min !== null ? min : max;
  }

  // Final fallback: try average if both available, otherwise use available value
  if (result === undefined) {
    if (min !== null && max !== null) {
      result = (min + max) / 2;
    } else {
      result = min !== null ? min : max;
    }
  }

 

  return result;
}

// Function to format number with commas
export function formatNumber(value) {
  if (value === '' || value === null || value === undefined) return '';
  const cleanValue = value.toString().replace(/[^\d.]/g, '');
  const parts = cleanValue.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimalPart = parts[1] ? `.${parts[1].slice(0, 2)}` : '';
  return integerPart + decimalPart;
}

export function parseNumber(value) {
  if (!value) return '';
  return value.toString().replace(/,/g, '');
}

export function toNumericValue(value) {
  const raw = parseFloat(parseNumber(value));
  return Number.isFinite(raw) ? raw : 0;
}

export function formatCurrencyInput(value) {
  if (!value) return '';
  // Remove currency symbol and any other non-numeric characters except decimal point
  let cleanValue = value.toString();
  // Remove currency symbol (Rs., PKR, etc.) and spaces - be more aggressive
  // Include all currency symbols and codes
  cleanValue = cleanValue.replace(/Rs\.|PKR|USD|EUR|₹|\$|€|৳|E£|RM|₦|₽|S\$|R|₺|PKR|USD|EUR|SAR|AED|GBP|CAD|CNY|AUD|JPY|CHF|INR|MYR|NGN|RUB|SGD|ZAR|TRY|\s+/gi, '');
  // Remove all non-numeric characters except decimal point
  cleanValue = cleanValue.replace(/[^\d.]/g, '');
  // Prevent multiple decimal points - keep only first decimal point
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }
  // If empty after cleaning, return empty string
  if (!cleanValue || cleanValue === '.') return '';
  // Format with commas - formatNumber will handle the rest
  return formatNumber(cleanValue);
}

// Get currency symbol from selected currency
export function getCurrencySymbol(contractCurrency) {
  // Map common currencies to their symbols
  const currencySymbolMap = {
    'Pakistani Rupee (PKR)': 'Rs. ',
    'US Dollar (USD)': '$ ',
    'Euro (EUR)': '€ ',
    'British Pound (GBP)': '£ ',
    'Indian Rupee (INR)': '₹ ',
    'Canadian Dollar (CAD)': 'C$ ',
    'Australian Dollar (AUD)': 'A$ ',
    'Japanese Yen (JPY)': '¥ ',
    'Chinese Yuan (CNY)': '¥ ',
    'Swiss Franc (CHF)': 'CHF ',
    'Saudi Riyal (SAR)': 'SR ',
    'UAE Dirham (AED)': 'AED ',
    'Bangladeshi Taka (BDT)': '৳ ',
    'Egyptian Pound (EGP)': 'E£ ',
    'Malaysian Ringgit (MYR)': 'RM ',
    'Nigerian Naira (NGN)': '₦ ',
    'Russian Ruble (RUB)': '₽ ',
    'Singapore Dollar (SGD)': 'S$ ',
    'South African Rand (ZAR)': 'R ',
    'Turkish Lira (TRY)': '₺ ',
  };

  return currencySymbolMap[contractCurrency] || 'Rs. ';
}

function parseCommaSeparatedToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseWorkingDays(workingDaysStr) {
  if (!workingDaysStr || typeof workingDaysStr !== 'string') {
    return { from: null, to: null };
  }
  const parts = workingDaysStr.split(' - ');
  return {
    from: parts[0]?.trim() || null,
    to: parts[1]?.trim() || null,
  };
}

function toMomentOrNull(value) {
  if (!value) return null;
  const parsed = moment(value);
  return parsed.isValid() ? parsed : null;
}

function serializeFormDate(value) {
  if (!value) return null;
  if (moment.isMoment(value)) return value.toISOString();
  return value;
}

export function normalizeEmploymentType(value) {
  if (!value) return value;
  const employmentTypeMap = {
    'office-based': 'Office-Based',
    remote: 'Remote',
    hybrid: 'Hybrid',
  };
  return employmentTypeMap[String(value).toLowerCase()] || value;
}

export function unwrapApiJobResponse(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.id != null || data.job_title != null) return data;
  return data.data ?? data.job ?? data.result ?? null;
}

export function mapApiJobToFormInitialValues(job) {
  const source = unwrapApiJobResponse(job) ?? job;
  if (!source || typeof source !== 'object') return null;

  const workingDaysParsed = parseWorkingDays(source.working_days);

  return {
    number_of_vacancies:
      source.number_of_vacancies != null ? Number(source.number_of_vacancies) : null,
    job_title: source.job_title ?? null,
    job_type: source.job_type ?? null,
    employment_type: normalizeEmploymentType(source.employment_type) ?? null,
    department: parseCommaSeparatedToArray(source.department),
    job_description: source.job_description ?? null,
    job_responsibilities: source.job_responsibilities ?? null,
    job_requirements: source.job_requirements ?? null,
    key_skills_required: source.key_skills_required ?? null,
    educational_qualification: source.educational_qualification ?? null,
    currency: source.currency ?? null,
    other_benefits: source.other_benefits ?? null,
    languages_required: parseCommaSeparatedToArray(source.languages_required),
    gender_preference: source.gender_preference ?? null,
    nationality_preference: parseCommaSeparatedToArray(source.nationality_preference),
    notes: source.notes ?? null,
    min_salary: source.min_salary != null ? String(source.min_salary) : null,
    max_salary: source.max_salary != null ? String(source.max_salary) : null,
    payment_term: source.payment_term ?? null,
    location_city: source.location_city ?? null,
    location_country: source.location_country ?? null,
    address: source.address ?? null,
    cv_submission_deadline: toMomentOrNull(source.cv_submission_deadline),
    expected_joining_date: toMomentOrNull(source.expected_joining_date),
    working_hours: source.working_hours != null ? String(source.working_hours) : null,
    timezone: source.timezone ?? null,
    working_days: source.working_days ?? null,
    working_days_from: workingDaysParsed.from,
    working_days_to: workingDaysParsed.to,
    min_experience: source.min_experience ?? null,
    max_experience: source.max_experience ?? null,
    degree_level: source.degree_level ?? null,
    job_shift: source.job_shift ?? null,
    hours_per_week: source.hours_per_week ?? null,
    contract_length:
      source.contract_length != null ? String(source.contract_length) : null,
    contract_period: source.contract_period ?? null,
    degrees: normalizeJobDegrees(source.degrees),
    skills: normalizeJobSkills(source.skills),
  };
}

export function normalizeJobDegrees(degrees) {
  if (!Array.isArray(degrees)) return [];
  return degrees
    .map((item) => {
      if (typeof item === 'string') return { degree_name: item.trim() };
      const degreeName = item?.degree_name ?? item?.name ?? null;
      if (!degreeName) return null;
      return {
        ...(item?.id != null ? { id: item.id } : {}),
        degree_name: String(degreeName).trim(),
      };
    })
    .filter(Boolean);
}

export function normalizeJobSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((item) => {
      if (!item) return null;
      const name = item.name ?? item.skill_name ?? item.skill ?? null;
      if (!name) return null;
      const skillName = String(name).trim();
      return {
        ...(item.id != null ? { id: item.id } : {}),
        skill_name: skillName,
        experience: item.experience != null ? String(item.experience) : null,
      };
    })
    .filter(Boolean);
}

/** Shape JobForm values for headhunting create/update API payload */
export function buildJobFormSubmitPayload(values, { remarksFallback } = {}) {
  const {
    working_days_from,
    working_days_to,
    key_skills_required,
    ...rest
  } = values;

  const toCommaString = (value) => {
    if (Array.isArray(value)) return value.join(', ');
    return value || null;
  };

  const payload = {
    ...rest,
    project: rest.project ? parseInt(rest.project, 10) : rest.project,
    languages_required: toCommaString(rest.languages_required),
    department: toCommaString(rest.department),
    nationality_preference: toCommaString(rest.nationality_preference),
    cv_submission_deadline: serializeFormDate(rest.cv_submission_deadline),
    expected_joining_date: serializeFormDate(rest.expected_joining_date),
    working_days:
      rest.working_days ||
      (working_days_from && working_days_to
        ? `${working_days_from} - ${working_days_to}`
        : null),
    degree_level: rest.degree_level || null,
    job_shift: rest.job_shift || null,
    contract_period: rest.contract_period || null,
    contract_length:
      rest.contract_length != null && rest.contract_length !== ''
        ? String(rest.contract_length)
        : null,
    hours_per_week:
      rest.hours_per_week != null && rest.hours_per_week !== ''
        ? Number(rest.hours_per_week)
        : null,
    degrees: normalizeJobDegrees(rest.degrees),
    skills: normalizeJobSkills(rest.skills),
  };

  if (remarksFallback && !payload.remarks) {
    payload.remarks = remarksFallback;
  }

  return payload;
}

