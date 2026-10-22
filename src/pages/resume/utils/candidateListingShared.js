import { API_URL } from '../../shared/utils/api.js';
import { formatStoredMonthsAsExperience } from './experienceFilterUnits.js';

export const CV_POOL_PATH_BY_ROLE = {
  admin: '/admin/resumes',
  recruitment_manager: '/recruitment-manager/resumes',
  recruitment_executive: '/recruitment-executive/resumes',
};

export const buildDownloadUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const baseUrl = API_URL.replace(/\/$/, '').replace(/\/api$/, '');
  return `${baseUrl}${filePath}`;
};

export const formatSkillsCell = (skills) => {
  if (!Array.isArray(skills) || skills.length === 0) return '-';
  const names = skills
    .map((s) => (typeof s === 'string' ? s : s?.name))
    .filter(Boolean);
  if (!names.length) return '-';
  return names.slice(0, 3).join(', ') + (names.length > 3 ? '…' : '');
};

/** Map table column sort ids to API `sort_by` field names. */
export const CANDIDATE_LIST_SORT_FIELD_MAP = {
  current_designation: 'customer_designation',
  designation: 'designation',
};

export const resolveCandidateListSortField = (sortId) =>
  CANDIDATE_LIST_SORT_FIELD_MAP[sortId] ?? sortId ?? '';

export const mapListingRows = (results) =>
  (Array.isArray(results) ? results : []).map((row) => ({
    ...row,
    name: row?.name || '-',
    email: row?.email || '-',
    phone: row?.phone || '-',
  }));

/** Resume id for mark-unprocessed API: use linked `resume_id` when set, else row `id`. */
export const resolveMarkUnprocessedResumeId = (row) => {
  if (!row) return null;
  const { resume_id: resumeId, id } = row;
  if (resumeId != null && resumeId !== '') return String(resumeId);
  if (id != null && id !== '') return String(id);
  return null;
};
