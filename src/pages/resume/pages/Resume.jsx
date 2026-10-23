import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Box, Button, Chip, IconButton } from '@mui/material';
import { Download } from 'lucide-react';
import { message } from 'antd';
import { FileText as FilePdfOutlined } from 'lucide-react';
import { useQuery } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getParsedCVs, getSkillsList, getCitiesList, getDesignationsList, getCandidateProfileDetails, getResumeProfileDetail, getProfileResumeDetail, getResumeUsage, getCountriesList, getUniversitiesList, getCompaniesList, getLanguagesList, resolveCandidateDetailsId } from '../../shared/services/resume.js';
import CvFilters from '../components/CvFilters.jsx';
import ResumePageTopSection from '../components/ResumePageTopSection.jsx';
import ResumeTableSection from '../components/ResumeTableSection.jsx';
import ResumeModalsSection from '../components/ResumeModalsSection.jsx';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import appTheme from '../../../components/providers/theme.jsx';
import { API_URL } from '../../shared/utils/api.js';
import '../../../assets/styles/legacy/global.generated.css';
import '../../../assets/styles/legacy/resume-filters.css';
import useUserStore from '../../shared/store/user-store.js';
import useDebouncedCallback from '../../../components/hooks/useDebouncedCallback.js';
import {
  isProfileSourcedRow,
  canPoolGeneratedCv,
  resolveProfileDetailForCv,
  generateProfileCvPdfBlob,
  sanitizeCandidateDownloadName,
} from '../utils/profileCvPdf.js';
import {
  formatOverallExperienceFilterDisplay,
  formatStoredMonthsAsExperience,
  storedMonthsToYearsDisplay,
} from '../utils/experienceFilterUnits.js';

// ─── Module-level constants & pure helpers ────────────────────────────────────

// P4: Defined outside component so reference is stable across renders.
const OVERALL_EXPERIENCE_OPTIONS = [
  { label: 'Fresher', value: '0' },
  { label: '6 months', value: '6' },
  { label: '1 year', value: '12' },
  { label: '1.5 years', value: '18' },
  { label: '2 years', value: '24' },
  { label: '2.5 years', value: '30' },
  { label: '3 years', value: '36' },
  { label: '4 years', value: '48' },
  { label: '5 years', value: '60' },
  { label: '6 years', value: '72' },
  { label: '7 years', value: '84' },
  { label: '8 years', value: '96' },
  { label: '9 years', value: '108' },
  { label: '10 years', value: '120' },
];

const FILTER_LABELS = {
  skills: 'Skills',
  designation: 'Designation',
  designationsMode: 'Designations Mode',
  city: 'City',
  country: 'Country',
  category: 'Education',
  company: 'Company',
  language: 'Language',
  university: 'University',
  skillsMode: 'Skills Mode',
  gender: 'Gender',
  overallExperience: 'Experience (Overall)',
  skillsExperience: 'Experience (Skills)',
  designationsExperience: 'Experience (Designation)',
  searchType: 'Search Type',
  general: 'Search',
};

const getFilterLabel = (key) => FILTER_LABELS[key] || key;

const stripDesignationsCoveredByExperience = (designationList, experienceList) => {
  const withExperience = new Set(
    (Array.isArray(experienceList) ? experienceList : [])
      .map((x) => String(x?.designation || '').toLowerCase())
      .filter(Boolean)
  );
  return (Array.isArray(designationList) ? designationList : []).filter(
    (d) => !withExperience.has(String(d).toLowerCase())
  );
};

// P5: Pure function — derives active filter chips (structured filters + text search) for the CV list query.
const computeActiveFilters = (filters, searchChipText) => {
  const items = [];

  if (filters.skills?.length > 0)
    items.push({ key: 'skills', label: 'Skills', value: filters.skills.join(', ') });

  const strippedDesignation = stripDesignationsCoveredByExperience(
    filters.designation, filters.designationsExperience
  );
  if (strippedDesignation.length > 0)
    items.push({ key: 'designation', label: 'Designation', value: strippedDesignation.join(', ') });

  for (const key of ['city', 'country', 'category', 'company', 'language', 'university']) {
    if (filters[key]?.length > 0)
      items.push({ key, label: getFilterLabel(key), value: filters[key].join(', ') });
  }

  if (filters.gender && filters.gender !== 'Both')
    items.push({ key: 'gender', label: 'Gender', value: filters.gender });

  if (filters.skillsMode === 'all')
    items.push({ key: 'skillsMode', label: 'Skills Mode', value: 'All' });

  if (filters.designationsMode === 'all')
    items.push({ key: 'designationsMode', label: 'Designations Mode', value: 'All' });

  if (filters.overallExperience) {
    const display = formatOverallExperienceFilterDisplay(
      filters.overallExperience,
      filters.overallExperienceMode,
      OVERALL_EXPERIENCE_OPTIONS
    );
    items.push({ key: 'overallExperience', label: 'Experience (Overall)', value: display });
  }

  if (filters.skillsExperience?.length > 0) {
    const display = filters.skillsExperience
      .map((item) => {
        if (!item?.skill) return null;
        const yrStr = storedMonthsToYearsDisplay(item.years);
        const label = yrStr === '1' ? 'year' : 'years';
        return `${item.skill}: ${yrStr === '' ? '0' : yrStr} ${label}`;
      })
      .filter(Boolean)
      .join(', ');
    if (display) items.push({ key: 'skillsExperience', label: 'Experience (Skills)', value: display });
  }

  if (filters.designationsExperience?.length > 0) {
    const display = filters.designationsExperience
      .map((item) => {
        if (!item?.designation) return null;
        const yrStr = storedMonthsToYearsDisplay(item.years);
        const label = yrStr === '1' ? 'year' : 'years';
        return `${item.designation}: ${yrStr === '' ? '0' : yrStr} ${label}`;
      })
      .filter(Boolean)
      .join(', ');
    if (display) items.push({ key: 'designationsExperience', label: 'Experience (Designation)', value: display });
  }

  const q = (searchChipText || '').trim();
  if (q) {
    const modeLabel = filters.searchType === 'exact' ? 'Exact' : 'Broad';
    items.push({ key: 'general', label: 'Search', value: `${q} (${modeLabel})` });
  } else if (filters.searchType && filters.searchType !== 'broad') {
    items.push({ key: 'searchType', label: 'Search Type', value: 'Exact' });
  }

  return items;
};

const normalizeCvDetailSourceType = (sourceType) => {
  const s = String(sourceType ?? '').toLowerCase().trim();
  return s === 'profile' ? 'profile' : 'resume';
};

/** Same id used for detail modal and usage API (profile row id vs candidate_details_id). */
const resolveResumeDetailId = (resume) => {
  const isProfile = normalizeCvDetailSourceType(resume?.source_type) === 'profile';
  const candidateDetailsId =
    resolveCandidateDetailsId(resume) ?? (!isProfile && resume?.id != null ? resume.id : null);
  if (isProfile) return resume?.id ?? null;
  return candidateDetailsId;
};

// P7: Stable helper — no state deps, can live outside component.
const buildDownloadUrl = (filePath) => {
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const baseUrl = API_URL.replace(/\/$/, '').replace(/\/api$/, '');
  return `${baseUrl}${filePath}`;
};

const DEFAULT_FILTERS = {
  skills: [],
  designation: [],
  designationsMode: 'any',
  city: [],
  country: [],
  category: [],
  company: [],
  language: [],
  university: [],
  skillsMode: 'any',
  gender: 'Both',
  overallExperience: '',
  overallExperienceMode: 'exact',
  skillsExperience: [],
  designationsExperience: [],
  searchType: 'broad',
};

// ─── Component ────────────────────────────────────────────────────────────────

const Resume = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const userType = user?.user_type;
  const [selectedRows, setSelectedRows] = useState({});

  const [searchParams, setSearchParams] = useSearchParams();
  const initialPageFromUrl = Number(searchParams.get('page'));
  const initialPageSizeFromUrl = Number(searchParams.get('pageSize'));
  const initialPageIndex =
    !Number.isNaN(initialPageFromUrl) && initialPageFromUrl > 0 ? initialPageFromUrl - 1 : 0;
  const initialPageSize =
    !Number.isNaN(initialPageSizeFromUrl) && initialPageSizeFromUrl > 0 ? initialPageSizeFromUrl : 10;

  const [pagination, setPagination] = useState({ pageIndex: initialPageIndex, pageSize: initialPageSize });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI filter state (immediate)
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // API filter state (debounced — only updated via syncApiFilters or direct reset)
  const [debouncedFilters, setDebouncedFilters] = useState({ general: '', ...DEFAULT_FILTERS });

  // P5: Derived — no separate useState for activeFilters (includes text search so combined criteria match the query).
  const searchChipText = (searchQuery || '').trim() || (debouncedFilters.general || '').trim();
  const activeFilters = useMemo(
    () => computeActiveFilters(filters, searchChipText),
    [filters, searchChipText]
  );

  const [skillExpInput, setSkillExpInput] = useState({ skill: '', years: '' });
  const [designationExpInput, setDesignationExpInput] = useState({ designation: '', years: '' });

  // Dropdown search text states (for debounced API calls to list endpoints)
  const [skillsSearchText, setSkillsSearchText] = useState('');
  const [designationsSearchText, setDesignationsSearchText] = useState('');
  const [citiesSearchText, setCitiesSearchText] = useState('');
  const [countriesSearchText, setCountriesSearchText] = useState('');
  const [companiesSearchText, setCompaniesSearchText] = useState('');
  const [languagesSearchText, setLanguagesSearchText] = useState('');
  const [universitiesSearchText, setUniversitiesSearchText] = useState('');

  const debouncedSetSkillsSearchText = useDebouncedCallback((val) => setSkillsSearchText(val), 300);
  const debouncedSetDesignationsSearchText = useDebouncedCallback((val) => setDesignationsSearchText(val), 300);
  const debouncedSetCitiesSearchText = useDebouncedCallback((val) => setCitiesSearchText(val), 300);
  const debouncedSetCountriesSearchText = useDebouncedCallback((val) => setCountriesSearchText(val), 300);
  const debouncedSetCompaniesSearchText = useDebouncedCallback((val) => setCompaniesSearchText(val), 300);
  const debouncedSetLanguagesSearchText = useDebouncedCallback((val) => setLanguagesSearchText(val), 300);
  const debouncedSetUniversitiesSearchText = useDebouncedCallback((val) => setUniversitiesSearchText(val), 300);

  // Merges partial filter updates across the debounce window. A plain debounced(partial) would drop
  // earlier keys when several filters change within the delay (e.g. skill rows + city), or lose
  // intermediate skillsExperience updates if something else calls syncApiFilters between adds.
  const debouncedFilterPatchRef = useRef({});
  const flushDebouncedFilterPatches = useDebouncedCallback(() => {
    const patch = debouncedFilterPatchRef.current;
    debouncedFilterPatchRef.current = {};
    if (Object.keys(patch).length === 0) return;
    setDebouncedFilters((prev) => ({ ...prev, ...patch }));
  }, 300);

  /** Pull queued `syncApiFilters` updates, cancel the flush timer, and return the patch (so callers can merge then apply other edits). */
  const takePendingFilterPatch = useCallback(() => {
    const patch = { ...debouncedFilterPatchRef.current };
    debouncedFilterPatchRef.current = {};
    flushDebouncedFilterPatches.cancel();
    return patch;
  }, [flushDebouncedFilterPatches]);

  const syncApiFilters = useCallback(
    (partial) => {
      debouncedFilterPatchRef.current = {
        ...debouncedFilterPatchRef.current,
        ...partial,
      };
      flushDebouncedFilterPatches();
    },
    [flushDebouncedFilterPatches]
  );

  // General text search has a longer debounce (500ms) to avoid excessive calls while typing.
  const debouncedSetGeneralFilter = useDebouncedCallback(
    (val) => setDebouncedFilters((prev) => ({ ...prev, general: val })),
    500
  );

  // Modal state
  const [confirmDownloadModalVisible, setConfirmDownloadModalVisible] = useState(false);
  const [pendingDownloadResumes, setPendingDownloadResumes] = useState([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(() => {
    return sessionStorage.getItem('resumeDetailsModalVisible') === 'true';
  });
  const [selectedResumeDetails, setSelectedResumeDetails] = useState(() => {
    const saved = sessionStorage.getItem('selectedResumeDetails');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  /** When set, profile detail loads from `/profile-resume/{profileId}/{resumeId}` instead of profile-detail. */
  const [detailLinkedResumeId, setDetailLinkedResumeId] = useState(null);
  const [detailSourceType, setDetailSourceType] = useState('resume');
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [usageResumeId, setUsageResumeId] = useState(null);
  const [usageResumeName, setUsageResumeName] = useState('');
  const [singleDownloadModalVisible, setSingleDownloadModalVisible] = useState(false);
  const [pendingSingleDownload, setPendingSingleDownload] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shiftToJobModalOpen, setShiftToJobModalOpen] = useState(false);
  const [shiftToJobRecord, setShiftToJobRecord] = useState(null);
  const [shiftToJobSession, setShiftToJobSession] = useState(0);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerFiles, setPdfViewerFiles] = useState([]);

  // P3: Only write sessionStorage when modal visibility changes, not on every data update.
  useEffect(() => {
    sessionStorage.setItem('resumeDetailsModalVisible', String(detailsModalVisible));
    if (!detailsModalVisible) {
      sessionStorage.removeItem('selectedResumeDetails');
    }
  }, [detailsModalVisible]);

  // Reset page to 0 when general filter text changes (debounced).
  const prevDebouncedGeneralRef = useRef(undefined);
  useEffect(() => {
    const next = debouncedFilters.general;
    if (prevDebouncedGeneralRef.current === undefined) {
      prevDebouncedGeneralRef.current = next;
      return;
    }
    if (prevDebouncedGeneralRef.current !== next) {
      prevDebouncedGeneralRef.current = next;
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [debouncedFilters.general]);

  // Sync pagination to URL.
  useEffect(() => {
    const params = {};
    if (pagination.pageIndex !== 0) params.page = String(pagination.pageIndex + 1);
    if (pagination.pageSize !== 10) params.pageSize = String(pagination.pageSize);
    setSearchParams(params, { replace: true });
  }, [pagination.pageIndex, pagination.pageSize, setSearchParams]);

  const queryParams = useMemo(() => {
    const sortBy = sorting.length > 0 ? sorting[0].id : '';
    const order = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : '';
    return {
      filters: {
        general: debouncedFilters.general,
        skills: Array.isArray(debouncedFilters.skills) ? debouncedFilters.skills : [],
        skillsMode: debouncedFilters.skillsMode,
        designation: Array.isArray(debouncedFilters.designation) ? debouncedFilters.designation : [],
        designationsMode: debouncedFilters.designationsMode,
        city: Array.isArray(debouncedFilters.city) ? debouncedFilters.city : [],
        country: Array.isArray(debouncedFilters.country) ? debouncedFilters.country : [],
        category: Array.isArray(debouncedFilters.category) ? debouncedFilters.category : [],
        company: Array.isArray(debouncedFilters.company) ? debouncedFilters.company : [],
        language: Array.isArray(debouncedFilters.language) ? debouncedFilters.language : [],
        university: Array.isArray(debouncedFilters.university) ? debouncedFilters.university : [],
        gender: debouncedFilters.gender,
        overallExperience: debouncedFilters.overallExperience,
        overallExperienceMode: debouncedFilters.overallExperienceMode,
        skillsExperience: debouncedFilters.skillsExperience,
        designationsExperience: debouncedFilters.designationsExperience,
        searchType: debouncedFilters.searchType,
      },
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      sortBy,
      order,
    };
  }, [debouncedFilters, pagination.pageIndex, pagination.pageSize, sorting]);

  const { data: resumesData, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['resumes', queryParams],
    queryFn: () => getParsedCVs(queryParams.filters, queryParams.page, queryParams.pageSize, queryParams.sortBy, queryParams.order),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const LOOKUP_STALE_TIME = 30 * 1000;
  const LOOKUP_CACHE_TIME = 5 * 60 * 1000;
  const lookupQueryCommon = { staleTime: LOOKUP_STALE_TIME, cacheTime: LOOKUP_CACHE_TIME, refetchOnWindowFocus: false };

  const { data: skillsData } = useQuery({ queryKey: ['skills', skillsSearchText], queryFn: () => getSkillsList(skillsSearchText), ...lookupQueryCommon });
  const { data: citiesData, isLoading: loadingCities } = useQuery({ queryKey: ['cities', citiesSearchText], queryFn: () => getCitiesList(citiesSearchText), ...lookupQueryCommon });
  const { data: designationsData } = useQuery({ queryKey: ['designations', designationsSearchText], queryFn: () => getDesignationsList(designationsSearchText), ...lookupQueryCommon });
  const { data: countriesData, isLoading: loadingCountries } = useQuery({ queryKey: ['countries', countriesSearchText], queryFn: () => getCountriesList(countriesSearchText), ...lookupQueryCommon });
  const { data: universitiesData, isLoading: loadingUniversities } = useQuery({ queryKey: ['universities', universitiesSearchText], queryFn: () => getUniversitiesList(universitiesSearchText), ...lookupQueryCommon });
  const { data: companiesData, isLoading: loadingCompanies } = useQuery({ queryKey: ['companies', companiesSearchText], queryFn: () => getCompaniesList(companiesSearchText), ...lookupQueryCommon });
  const { data: languagesData, isLoading: loadingLanguages } = useQuery({ queryKey: ['languages', languagesSearchText], queryFn: () => getLanguagesList(languagesSearchText), ...lookupQueryCommon });

  const { data: detailedResumeData, isLoading: loadingDetailedResume, isError: detailedResumeError } = useQuery({
    queryKey: ['resumeDetail', selectedResumeId, detailSourceType, detailLinkedResumeId],
    queryFn: () => {
      if (detailSourceType === 'profile') {
        if (detailLinkedResumeId != null && detailLinkedResumeId !== '') {
          return getProfileResumeDetail(selectedResumeId, detailLinkedResumeId);
        }
        return getResumeProfileDetail(selectedResumeId);
      }
      return getCandidateProfileDetails(selectedResumeId);
    },
    enabled: !!selectedResumeId && detailsModalVisible,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!detailedResumeData) return;
    setSelectedResumeDetails((prev) => {
      const linked =
        detailLinkedResumeId != null && detailLinkedResumeId !== ''
          ? detailLinkedResumeId
          : prev?.resume_id;
      return {
        ...detailedResumeData,
        ...(linked != null && linked !== '' ? { resume_id: linked } : {}),
        candidate_details_id:
          prev?.candidate_details_id ??
          detailedResumeData?.candidate_details_id ??
          selectedResumeId,
        source_type: prev?.source_type ?? detailedResumeData?.source_type,
      };
    });
  }, [detailedResumeData, detailLinkedResumeId]);

  const { data: resumeUsageData, isLoading: loadingResumeUsage, isError: resumeUsageError } = useQuery({
    queryKey: ['resumeUsage', usageResumeId],
    queryFn: () => getResumeUsage(usageResumeId),
    enabled: !!usageResumeId && usageModalVisible,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const totalCount = resumesData?.count || 0;

  const selectedCount = useMemo(
    () => Object.keys(selectedRows).filter((id) => selectedRows[id]).length,
    [selectedRows]
  );

  // ─── Download helpers ────────────────────────────────────────────────────────

  /** All uploaded resume file paths for a candidate row (dedup'd), independent of the generated CV. */
  const collectUploadedFiles = useCallback((resume) => {
    const allFiles = Array.isArray(resume?.all_files) ? resume.all_files.filter(Boolean) : [];
    const singleFile = resume?.file;
    const seen = new Set(allFiles);
    return [...allFiles, ...(singleFile && !seen.has(singleFile) ? [singleFile] : [])];
  }, []);

  /** Downloads every file for one candidate — uploaded resume(s) + generated CV — as a single file when
   *  there's only one, or zipped together when there's more than one. */
  const downloadAllCvsForResume = useCallback(async (resume) => {
    const uploadedFiles = collectUploadedFiles(resume);
    const hasGeneratedCv = canPoolGeneratedCv(resume);

    const parts = [];
    for (const filePath of uploadedFiles) {
      const response = await fetch(buildDownloadUrl(filePath));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      parts.push({
        blob: await response.blob(),
        name: `${sanitizeCandidateDownloadName(resume?.name)}_uploaded${uploadedFiles.length > 1 ? `_${parts.length + 1}` : ''}.pdf`,
      });
    }

    let detail = null;
    if (hasGeneratedCv) {
      detail = await resolveProfileDetailForCv(resume);
      parts.push({
        blob: await generateProfileCvPdfBlob(detail),
        name: `${sanitizeCandidateDownloadName(resume?.name, detail?.name)}_generated_cv.pdf`,
      });
    }

    if (parts.length === 0) {
      throw new Error('No CV files available for this candidate');
    }

    if (parts.length === 1) {
      const url = window.URL.createObjectURL(parts[0].blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = parts[0].name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }

    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    parts.forEach((part) => zip.file(part.name, part.blob));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeCandidateDownloadName(resume?.name)}_cvs.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [collectUploadedFiles]);

  const handleSingleDownload = useCallback(async (resume) => {
    try {
      if (!canPoolGeneratedCv(resume) && collectUploadedFiles(resume).length === 0) {
        message.warning('No CV files available for this candidate');
        return;
      }
      await downloadAllCvsForResume(resume);
    } catch (err) {
      message.error(err?.message || 'Download failed');
    }
  }, [downloadAllCvsForResume, collectUploadedFiles]);

  // P7: JSZip lazy-loaded only when bulk download is triggered.
  const handleMultipleDownload = useCallback(async (resumes) => {
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      let downloadCount = 0;
      let errorCount = 0;
      for (const resume of resumes) {
        try {
          const uploadedFiles = collectUploadedFiles(resume);
          const hasGeneratedCv = canPoolGeneratedCv(resume);
          if (uploadedFiles.length === 0 && !hasGeneratedCv) {
            errorCount++;
            continue;
          }
          const folder = zip.folder(sanitizeCandidateDownloadName(resume.name));
          for (let i = 0; i < uploadedFiles.length; i++) {
            const response = await fetch(buildDownloadUrl(uploadedFiles[i]));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            folder.file(
              `${sanitizeCandidateDownloadName(resume.name)}_uploaded${uploadedFiles.length > 1 ? `_${i + 1}` : ''}.pdf`,
              await response.blob()
            );
          }
          if (hasGeneratedCv) {
            const detail = await resolveProfileDetailForCv(resume);
            folder.file(
              `${sanitizeCandidateDownloadName(resume.name, detail.name)}_generated_cv.pdf`,
              await generateProfileCvPdfBlob(detail)
            );
          }
          downloadCount++;
        } catch {
          errorCount++;
        }
      }
      if (downloadCount > 0) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resumes_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        if (errorCount === 0) {
          message.success(`Successfully downloaded ${downloadCount} resume(s) in a zip file.`);
        } else {
          message.warning(`Downloaded ${downloadCount} resume(s) in a zip file. ${errorCount} failed.`);
        }
      } else {
        message.error('Failed to download any resumes.');
      }
    } catch {
      message.error('Zip download failed.');
    }
  }, [collectUploadedFiles]);

  const handleViewUploadedResume = useCallback((resume) => {
    if (!resume?.file) {
      message.warning('Resume file not available');
      return;
    }
    window.open(buildDownloadUrl(resume.file), '_blank', 'noopener,noreferrer');
  }, []);

  const handleViewProfileCv = useCallback(async (resume) => {
    if (!canPoolGeneratedCv(resume)) {
      message.warning('Custom CV is not available for this candidate');
      return;
    }
    try {
      message.loading({ content: 'Opening profile CV…', key: 'profileCvOpen' });
      const detail = await resolveProfileDetailForCv(resume);
      const blob = await generateProfileCvPdfBlob(detail);
      message.destroy('profileCvOpen');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (err) {
      message.destroy('profileCvOpen');
      message.error(err?.message || 'Could not open profile CV');
    }
  }, []);

  /** Opens the "Resume Preview" modal (same as Details → Preview CV): uploaded resume(s) + generated CV, side by side. */
  const handleOpenCvPreview = useCallback(async (resume) => {
    const uploadedFiles = collectUploadedFiles(resume);
    const hasGeneratedCv = canPoolGeneratedCv(resume);
    if (uploadedFiles.length === 0 && !hasGeneratedCv) {
      message.warning('No CV files available for this candidate');
      return;
    }
    try {
      const files = uploadedFiles.map((path, i) => ({
        url: buildDownloadUrl(path),
        label: `Uploaded Resume ${i + 1}`,
      }));
      if (hasGeneratedCv) {
        const detail = await resolveProfileDetailForCv(resume);
        const blob = await generateProfileCvPdfBlob(detail);
        files.push({ url: URL.createObjectURL(blob), label: 'Generated CV' });
      }
      setPdfViewerFiles(files);
      setPdfViewerOpen(true);
    } catch (err) {
      message.error(err?.message || 'Could not open CV preview');
    }
  }, [collectUploadedFiles]);

  /** Prefer uploaded file in a new tab, else open generated profile PDF (detail modal / legacy). */
  const handleViewResume = useCallback(
    async (resume) => {
      if (resume?.file) {
        handleViewUploadedResume(resume);
        return;
      }
      if (isProfileSourcedRow(resume)) {
        await handleViewProfileCv(resume);
        return;
      }
      message.warning('Resume file not available');
    },
    [handleViewUploadedResume, handleViewProfileCv]
  );

  const handleDirectDownload = useCallback(async (resumes) => {
    setIsDownloading(true);
    try {
      if (resumes.length === 1) {
        await handleSingleDownload(resumes[0]);
      } else {
        await handleMultipleDownload(resumes);
      }
    } finally {
      setIsDownloading(false);
      setSelectedRows({});
      setConfirmDownloadModalVisible(false);
      setPendingDownloadResumes([]);
      setSingleDownloadModalVisible(false);
      setPendingSingleDownload(null);
    }
  }, [handleSingleDownload, handleMultipleDownload]);

  useEffect(() => { setSelectedRows({}); }, [resumesData]);

  // ─── Filter logic ────────────────────────────────────────────────────────────

  const resetToFirstPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // P1: handleFilterChange only updates UI state and schedules ONE debounced API sync.
  const handleFilterChange = useCallback((key, value) => {
    resetToFirstPage();

    setFilters((prev) => {
      if (key === 'designationsExperience') {
        return {
          ...prev,
          designationsExperience: value,
          designation: stripDesignationsCoveredByExperience(prev.designation, value),
        };
      }
      if (key === 'designation') {
        return {
          ...prev,
          designation: stripDesignationsCoveredByExperience(
            Array.isArray(value) ? value : [],
            prev.designationsExperience
          ),
        };
      }
      return { ...prev, [key]: value };
    });

    if (key === 'designationsExperience') {
      syncApiFilters({
        designationsExperience: value,
        designation: stripDesignationsCoveredByExperience(
          filters.designation, value
        ),
      });
    } else if (key === 'designation') {
      syncApiFilters({
        designation: stripDesignationsCoveredByExperience(
          Array.isArray(value) ? value : [],
          filters.designationsExperience
        ),
      });
    } else {
      syncApiFilters({ [key]: value });
    }
  }, [filters.designation, filters.designationsExperience, resetToFirstPage, syncApiFilters]);

  const clearAllFilters = useCallback(() => {
    resetToFirstPage();
    takePendingFilterPatch();
    debouncedSetGeneralFilter.cancel();
    setFilters(DEFAULT_FILTERS);
    setDebouncedFilters({ general: '', ...DEFAULT_FILTERS });
    setSearchQuery('');
  }, [resetToFirstPage, takePendingFilterPatch, debouncedSetGeneralFilter]);

  const removeFilter = useCallback(
    (key) => {
      resetToFirstPage();
      if (key === 'general') {
        debouncedSetGeneralFilter.cancel();
        const patch = takePendingFilterPatch();
        setDebouncedFilters((prev) => {
          const merged = Object.keys(patch).length ? { ...prev, ...patch } : prev;
          return { ...merged, general: '' };
        });
        setSearchQuery('');
        return;
      }
      const defaultValue =
        key === 'skillsMode' || key === 'designationsMode'
          ? 'any'
          : key === 'gender'
            ? 'Both'
            : key === 'overallExperience'
              ? ''
              : key === 'searchType'
                ? 'broad'
                : [];
      setFilters((prev) => ({ ...prev, [key]: defaultValue }));
      const patch = takePendingFilterPatch();
      setDebouncedFilters((prev) => {
        const merged = Object.keys(patch).length ? { ...prev, ...patch } : prev;
        return { ...merged, [key]: defaultValue };
      });
    },
    [resetToFirstPage, takePendingFilterPatch, debouncedSetGeneralFilter]
  );

  // ─── Modal handlers ──────────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  const handleDownloadResumes = useCallback(() => {
    const selectedIds = Object.keys(selectedRows).filter((id) => selectedRows[id]);
    if (!selectedIds.length) return;
    const safeResults = Array.isArray(resumesData?.results) ? resumesData.results : [];
    const selectedResumes = safeResults
      .filter((row) => selectedIds.includes(String(row.id)))
      .filter(canPoolGeneratedCv);
    if (!selectedResumes.length) {
      message.warning('No selected rows have a custom CV available');
      return;
    }
    setPendingDownloadResumes(selectedResumes);
    setConfirmDownloadModalVisible(true);
  }, [selectedRows, resumesData]);

  const handleConfirmDownload = useCallback(() => {
    if (pendingDownloadResumes.length > 0) handleDirectDownload(pendingDownloadResumes);
  }, [pendingDownloadResumes, handleDirectDownload]);

  const handleViewDetails = useCallback((resume) => {
    const isProfile = normalizeCvDetailSourceType(resume?.source_type) === 'profile';
    const detailId = resolveResumeDetailId(resume);
    const candidateDetailsId =
      resolveCandidateDetailsId(resume) ?? (!isProfile && resume?.id != null ? resume.id : null);

    if (!isProfile && detailId == null) {
      message.warning('Candidate details are not available for this row');
      return;
    }

    setSelectedResumeId(detailId);
    const linked = resume?.resume_id;
    setDetailLinkedResumeId(linked != null && linked !== '' ? linked : null);
    setDetailSourceType(normalizeCvDetailSourceType(resume?.source_type));
    setSelectedResumeDetails({
      ...resume,
      candidate_details_id: candidateDetailsId ?? resume?.candidate_details_id,
    });
    setDetailsModalVisible(true);
    sessionStorage.setItem('resumeDetailsModalVisible', 'true');
    try { sessionStorage.setItem('selectedResumeDetails', JSON.stringify(resume)); } catch (_) {}
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setDetailsModalVisible(false);
    setSelectedResumeDetails(null);
    setSelectedResumeId(null);
    setDetailLinkedResumeId(null);
    setDetailSourceType('resume');
    sessionStorage.removeItem('resumeDetailsModalVisible');
    sessionStorage.removeItem('selectedResumeDetails');
  }, []);

  const handleOpenUsageModal = useCallback((resume) => {
    const usageId = resolveResumeDetailId(resume);
    if (usageId == null) return;
    setUsageResumeId(usageId);
    setUsageResumeName(resume.name || '');
    setUsageModalVisible(true);
  }, []);

  const handleCloseUsageModal = useCallback(() => {
    setUsageModalVisible(false);
    setUsageResumeId(null);
    setUsageResumeName('');
  }, []);

  const handleDownloadSingle = useCallback((resume) => {
    if (!canPoolGeneratedCv(resume) && collectUploadedFiles(resume).length === 0) {
      message.warning('No CV files available for this candidate');
      return;
    }
    setPendingSingleDownload({ ...resume, _cvDownloadMode: 'all_cvs' });
    setSingleDownloadModalVisible(true);
  }, [collectUploadedFiles]);

  const handleConfirmSingleDownload = useCallback(async () => {
    if (!pendingSingleDownload) return;
    setIsDownloading(true);
    try {
      await downloadAllCvsForResume(pendingSingleDownload);
      message.success('CV downloaded');
    } catch (err) {
      message.error(err?.message || 'Failed to download CV');
    } finally {
      setIsDownloading(false);
      setSingleDownloadModalVisible(false);
      setPendingSingleDownload(null);
    }
  }, [pendingSingleDownload, downloadAllCvsForResume]);

  const handleOpenShiftToJobModal = useCallback((resume) => {
    if (!canPoolGeneratedCv(resume)) {
      message.warning('This CV cannot be shifted to a job');
      return;
    }
    setShiftToJobRecord(resume);
    setShiftToJobSession((prev) => prev + 1);
    setShiftToJobModalOpen(true);
  }, []);

  const handleCloseShiftToJobModal = useCallback(() => {
    setShiftToJobModalOpen(false);
    setShiftToJobRecord(null);
  }, []);

  const handleShiftToJobSuccess = useCallback((response) => {
    message.success(response?.message || 'CV shifted to Public CV successfully');
    refetch();
  }, [refetch]);

  // ─── Table config ─────────────────────────────────────────────────────────────

  // P2: columns is stable as long as action handlers don't change.
  const columns = useMemo(() => [
    { accessorKey: 'name', header: 'Name', size: 120 },
    { accessorKey: 'email', header: 'Email', size: 120, minSize: 120, maxSize: 120 },
    { accessorKey: 'phone', header: 'Phone', size: 150 },
    {
      accessorKey: 'gender',
      header: 'Gender',
      size: 100,
      sortDescFirst: false,
      enableSortingRemoval: true,
      Cell: ({ cell }) => {
        const val = cell.getValue();
        if (!val) return '-';
        const lower = String(val).toLowerCase();
        if (lower === 'male') return 'Male';
        if (lower === 'female') return 'Female';
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
      },
    },
    {
      accessorKey: 'cities',
      header: 'City',
      size: 160,
      sortDescFirst: false,
      enableSortingRemoval: true,
      Cell: ({ cell }) => {
        const cities = cell.getValue();
        if (!cities || !Array.isArray(cities) || cities.length === 0) return '-';
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {cities.map((city, i) => {
              const label =
                typeof city === 'string' ? city : city?.title || city?.name || String(city);
              return (
                <Chip
                  key={i}
                  label={label}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: appTheme.palette.primary.main,
                    color: appTheme.palette.primary.main,
                    fontSize: '11px',
                    height: '22px',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              );
            })}
          </Box>
        );
      },
    },
    {
      accessorKey: 'universities',
      header: 'University',
      size: 240,
      minSize: 180,
      sortDescFirst: false,
      enableSortingRemoval: true,
      Cell: ({ cell }) => {
        const universities = cell.getValue();
        if (!universities || !Array.isArray(universities) || universities.length === 0) return '-';
        return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{universities.join(', ')}</span>;
      },
    },
    {
      accessorKey: 'experience',
      header: 'Experience',
      size: 120,
      enableSortingRemoval: true,
      Cell: ({ cell }) => formatStoredMonthsAsExperience(cell.getValue()),
    },
    {
      accessorKey: 'cv_used_count',
      header: 'View Usage',
      size: 120,
      enableSorting: false,
      Cell: ({ row }) => {
        const resume = row.original;
        const count = resume?.cv_used_count ?? 0;
        if (!count) return <span style={{ color: '#ccc' }}>-</span>;
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleOpenUsageModal(resume)}
            sx={{ fontSize: '10px', padding: '2px 6px', minWidth: 'auto', borderColor: '#3e6a9f', color: '#3e6a9f', '&:hover': { borderColor: '#2d5a8a', backgroundColor: 'rgba(62, 106, 159, 0.04)' } }}
          >
            View Usage ({count})
          </Button>
        );
      },
    },
    {
      accessorKey: 'view_details',
      header: 'View Details',
      size: 120,
      enableSorting: false,
      Cell: ({ row }) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleViewDetails(row.original)}
          sx={{ fontSize: '10px', padding: '4px 12px', minWidth: 'auto', borderColor: '#3e6a9f', color: '#3e6a9f', '&:hover': { borderColor: '#2d5a8a', backgroundColor: 'rgba(62, 106, 159, 0.04)' } }}
        >
          Details
        </Button>
      ),
    },
    {
      accessorKey: 'view_resume',
      header: 'Preview CV',
      size: 140,
      enableSorting: false,
      Cell: ({ row }) => {
        const resume = row.original;
        if (!canPoolGeneratedCv(resume) && collectUploadedFiles(resume).length === 0) {
          return <span style={{ color: '#ccc' }}>-</span>;
        }
        return (
          <IconButton
            size="small"
            onClick={() => handleOpenCvPreview(resume)}
            sx={{
              color: '#3e6a9f',
              '&:hover': {
                backgroundColor: 'rgba(62, 106, 159, 0.1)',
                color: '#2d5a8a',
              },
            }}
            title="Preview CV"
          >
            <FilePdfOutlined size="1em" className="app-icon" style={{ fontSize: '18px', color: '#3e6a9f' }} />
          </IconButton>
        );
      },
    },
    ...(userType !== 'admin'
      ? [
          {
            accessorKey: 'shift_to_job',
            header: 'Shift to Job',
            size: 130,
            enableSorting: false,
            Cell: ({ row }) => {
              const resume = row.original;
              const canShift = canPoolGeneratedCv(resume);
              return (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleOpenShiftToJobModal(resume)}
                  disabled={!canShift}
                  sx={{
                    fontSize: '10px',
                    padding: '4px 10px',
                    minWidth: 'auto',
                    bgcolor: '#3e6a9f',
                    color: '#fff',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#2d5a8a', boxShadow: 'none' },
                    '&.Mui-disabled': { bgcolor: '#ccc', color: '#fff' },
                  }}
                >
                  Shift to Job
                </Button>
              );
            },
          },
        ]
      : []),
    {
      accessorKey: 'download',
      header: 'Download CV',
      size: 140,
      enableSorting: false,
      Cell: ({ row }) => {
        const resume = row.original;
        const canDownload = canPoolGeneratedCv(resume) || collectUploadedFiles(resume).length > 0;
        return (
          <IconButton
            size="small"
            onClick={() => handleDownloadSingle(resume)}
            disabled={!canDownload}
            title={canDownload ? 'Download CV (uploaded + generated)' : 'No CV files available'}
            sx={{
              color: '#3e6a9f',
              '&:hover': { backgroundColor: 'rgba(62, 106, 159, 0.1)', color: '#2d5a8a' },
              '&.Mui-disabled': { color: '#ccc' },
            }}
          >
            <Download size="1em" className="app-icon"  style={{ ...({ fontSize: 18 }) }} />
          </IconButton>
        );
      },
    },
  ], [
    userType,
    handleOpenUsageModal,
    handleViewDetails,
    handleViewProfileCv,
    handleOpenCvPreview,
    handleDownloadSingle,
    handleOpenShiftToJobModal,
    collectUploadedFiles,
  ]);

  const tableRows = useMemo(() => {
    if (!Array.isArray(resumesData?.results)) return [];
    return resumesData.results.map((row) => ({
      ...row,
      name: row?.name || '-',
      email: row?.email || '-',
      phone: row?.phone || '-',
    }));
  }, [resumesData?.results]);

  return (
    <>
      <BreadCrumb linkText="CV Pool" />
      <Box sx={{ p: 3, backgroundColor: 'white', minHeight: '100vh' }}>
        <ResumePageTopSection
          onUploadBulkCv={() => navigate('/resume-upload')}
          {...(userType === 'super_admin' && {
            onViewCvListing: () => navigate('/cv-listing'),
            onViewProfileListing: () => navigate('/profile-listing'),
          })}
          isError={isError}
          errorMessage={error?.message}
          onRetry={handleRefresh}
        />

        <CvFilters
          filters={filters}
          activeFilters={activeFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          removeFilter={removeFilter}
          clearAllFilters={clearAllFilters}
          handleFilterChange={handleFilterChange}
          resetToFirstPage={resetToFirstPage}
          overallExperienceOptions={OVERALL_EXPERIENCE_OPTIONS}
          debouncedSetGeneralFilter={debouncedSetGeneralFilter}
          debouncedSetCitiesSearchText={debouncedSetCitiesSearchText}
          debouncedSetCountriesSearchText={debouncedSetCountriesSearchText}
          debouncedSetCompaniesSearchText={debouncedSetCompaniesSearchText}
          debouncedSetLanguagesSearchText={debouncedSetLanguagesSearchText}
          debouncedSetUniversitiesSearchText={debouncedSetUniversitiesSearchText}
          debouncedSetSkillsSearchText={debouncedSetSkillsSearchText}
          debouncedSetDesignationsSearchText={debouncedSetDesignationsSearchText}
          citiesData={citiesData}
          countriesData={countriesData}
          companiesData={companiesData}
          languagesData={languagesData}
          universitiesData={universitiesData}
          skillsData={skillsData}
          designationsData={designationsData}
          loadingCities={loadingCities}
          loadingCountries={loadingCountries}
          loadingCompanies={loadingCompanies}
          loadingLanguages={loadingLanguages}
          loadingUniversities={loadingUniversities}
          skillExpInput={skillExpInput}
          setSkillExpInput={setSkillExpInput}
          designationExpInput={designationExpInput}
          setDesignationExpInput={setDesignationExpInput}
        />

        <ResumeTableSection
          selectedCount={selectedCount}
          isAdmin={userType === 'super_admin'}
          onDownloadSelected={handleDownloadResumes}
          totalCount={totalCount}
          columns={columns}
          tableRows={tableRows}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          isLoading={isLoading || isFetching}
          selectedRows={selectedRows}
          onRowSelectionChange={setSelectedRows}
        />

        <ResumeModalsSection
          confirmDownloadModalVisible={confirmDownloadModalVisible}
          setConfirmDownloadModalVisible={setConfirmDownloadModalVisible}
          handleConfirmDownload={handleConfirmDownload}
          isDownloading={isDownloading}
          pendingDownloadResumes={pendingDownloadResumes}
          isProfileSourcedRow={isProfileSourcedRow}
          detailsModalVisible={detailsModalVisible}
          handleCloseDetailsModal={handleCloseDetailsModal}
          selectedResumeDetails={selectedResumeDetails}
          loadingDetailedResume={loadingDetailedResume}
          detailedResumeError={detailedResumeError}
          detailSourceType={detailSourceType}
          selectedResumeId={selectedResumeId}
          handleViewResume={handleViewResume}
          handleViewProfileCv={handleViewProfileCv}
          handleDownloadSingle={handleDownloadSingle}
          usageModalVisible={usageModalVisible}
          handleCloseUsageModal={handleCloseUsageModal}
          loadingResumeUsage={loadingResumeUsage}
          resumeUsageError={resumeUsageError}
          resumeUsageData={resumeUsageData}
          usageResumeName={usageResumeName}
          pendingSingleDownload={pendingSingleDownload}
          singleDownloadModalVisible={singleDownloadModalVisible}
          setSingleDownloadModalVisible={setSingleDownloadModalVisible}
          handleConfirmSingleDownload={handleConfirmSingleDownload}
          customCvOnly
          shiftToJobModalOpen={shiftToJobModalOpen}
          shiftToJobRecord={shiftToJobRecord}
          shiftToJobSession={shiftToJobSession}
          onCloseShiftToJobModal={handleCloseShiftToJobModal}
          onShiftToJobSuccess={handleShiftToJobSuccess}
          pdfViewerOpen={pdfViewerOpen}
          pdfViewerFiles={pdfViewerFiles}
          onClosePdfViewer={() => setPdfViewerOpen(false)}
          onOpenPdfViewer={(files) => { setPdfViewerFiles(files); setPdfViewerOpen(true); }}
          onGenerateProfileCvUrl={async (resume) => {
            const detail = await resolveProfileDetailForCv(resume);
            const blob = await generateProfileCvPdfBlob(detail);
            return URL.createObjectURL(blob);
          }}
        />
      </Box>
    </>
  );
};

export default Resume;

