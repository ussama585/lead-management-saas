/**
 * Helpers for lead conversion job validation errors from the API.
 */

export const getLeadJobEditUrl = (leadId, jobId, leadType, userType) => {
  if (!leadId || !jobId) return null;

  if (leadType === 'data-leads') {
    return `/data-leads/${leadId}/edit/${jobId}`;
  }

  let prefix = '/sales-manager';
  if (userType === 'super_admin') prefix = '/super-admin';
  else if (userType === 'sales_executive') prefix = '/sales-executive';

  if (leadType === 'meta-leads') {
    return `${prefix}/meta-leads/${leadId}/job/${jobId}`;
  }

  return `${prefix}/leads/${leadId}/job/${jobId}`;
};

/**
 * createOrUpdateConversionToPotential throws error.response.data directly,
 * so error may be the payload itself or a full axios error.
 */
export const parseConversionJobValidationError = (error) => {
  const errorData = error?.response?.data ?? error;
  const errors = Array.isArray(errorData?.errors) ? errorData.errors : [];

  if (errors.length === 0) {
    return null;
  }

  return {
    message: errorData?.message || 'Some jobs have missing required fields',
    errors,
  };
};
