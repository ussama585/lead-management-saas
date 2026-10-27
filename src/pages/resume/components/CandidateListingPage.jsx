import { message } from '../../../components/ui/notifications.jsx';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Box, Button, IconButton, Alert } from '@mui/material';
import { FileText as FilePdfOutlined } from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import ConfirmationModal from '../../../components/confirmation-modal.component.jsx';
import NewTableComponent from '../../../components/tables/new-table.jsx';
import ResumeDetailModal from './ResumeDetailModal.jsx';
import ResumePdfViewer from '../../../components/resume-pdf-viewer.component.jsx';
import SelectedRowsActions from './SelectedRowsActions.jsx';
import {
  getCandidateResumeList,
  getCandidateProfileList,
  getResumeDetail,
  getResumeProfileDetail,
  markResumesUnprocessed,
} from '../../shared/services/resume.js';
import { formatStoredMonthsAsExperience } from '../utils/experienceFilterUnits.js';
import useUserStore from '../../shared/store/user-store.js';
import {
  CV_POOL_PATH_BY_ROLE,
  buildDownloadUrl,
  formatSkillsCell,
  mapListingRows,
  resolveMarkUnprocessedResumeId,
  resolveCandidateListSortField,
} from '../utils/candidateListingShared.js';
import {
  generateProfileCvPdfBlob,
  resolveProfileDetailForCv,
  sanitizeCandidateDownloadName,
} from '../utils/profileCvPdf.js';
import '../../../assets/styles/legacy/global.generated.css';
import '../../../assets/styles/legacy/admin-dashboard-page.css';

/**
 * @param {'resume'|'profile'} listKind
 * @param {string} breadcrumbText
 * @param {string} tableHeadingLabel e.g. "CV Listing"
 */
const CandidateListingPage = ({ listKind, breadcrumbText, tableHeadingLabel }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const userType = user?.user_type;
  const isCvListing = listKind === 'resume';
  const cvPoolPath = CV_POOL_PATH_BY_ROLE[userType] || '/admin/resumes';

  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [selectedRows, setSelectedRows] = useState({});
  const [markUnprocessedModalVisible, setMarkUnprocessedModalVisible] = useState(false);
  const [pendingUnprocessedIds, setPendingUnprocessedIds] = useState([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);
  const [selectedRowPreview, setSelectedRowPreview] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerFiles, setPdfViewerFiles] = useState([]);

  const searchTerm = (globalFilter || '').trim();

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchTerm, sorting]);

  const listQuery = useQuery({
    queryKey:
      listKind === 'resume'
        ? ['candidateResumeList', pagination.pageIndex, pagination.pageSize, searchTerm, sorting]
        : ['candidateProfileList', pagination.pageIndex, pagination.pageSize, searchTerm, sorting],
    queryFn: () => {
      const activeSort = sorting.length > 0 ? sorting[0] : null;
      const sortId = activeSort?.id ?? activeSort?.accessorKey ?? '';
      const sortBy = resolveCandidateListSortField(sortId);
      const order = activeSort ? (activeSort.desc ? 'desc' : 'asc') : '';
      return listKind === 'resume'
        ? getCandidateResumeList(
            pagination.pageIndex + 1,
            pagination.pageSize,
            searchTerm,
            sortBy,
            order
          )
        : getCandidateProfileList(
            pagination.pageIndex + 1,
            pagination.pageSize,
            searchTerm,
            sortBy,
            order
          );
    },
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (isCvListing) setSelectedRows({});
  }, [listQuery.data, isCvListing]);

  const markUnprocessedMutation = useMutation((ids) => markResumesUnprocessed(ids), {
    onSuccess: (response) => {
      message.success(response?.data?.message || 'Successfully marked as unprocessed');
      queryClient.invalidateQueries(['candidateResumeList']);
      queryClient.invalidateQueries(['resumes']);
      setMarkUnprocessedModalVisible(false);
      setPendingUnprocessedIds([]);
      setSelectedRows({});
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || 'Failed to mark as unprocessed');
      setMarkUnprocessedModalVisible(false);
      setPendingUnprocessedIds([]);
    },
  });

  const selectedCount = useMemo(
    () => Object.keys(selectedRows).filter((id) => selectedRows[id]).length,
    [selectedRows]
  );

  const handleMarkUnprocessed = useCallback(() => {
    const selectedKeys = Object.keys(selectedRows).filter((id) => selectedRows[id]);
    if (!selectedKeys.length) return;
    const safeResults = Array.isArray(listQuery.data?.results) ? listQuery.data.results : [];
    const apiIds = [
      ...new Set(
        selectedKeys
          .map((key) => {
            const row = safeResults.find((r) => String(r.id) === key);
            return row ? resolveMarkUnprocessedResumeId(row) : key;
          })
          .filter(Boolean)
      ),
    ];
    if (!apiIds.length) return;
    setPendingUnprocessedIds(apiIds);
    setMarkUnprocessedModalVisible(true);
  }, [selectedRows, listQuery.data?.results]);

  const { data: detailData, isLoading: loadingDetail, isError: detailError } = useQuery({
    queryKey: ['candidateDetails', listKind, selectedDetailsId],
    queryFn: () =>
      listKind === 'profile'
        ? getResumeProfileDetail(selectedDetailsId)
        : getResumeDetail(selectedDetailsId),
    enabled: !!selectedDetailsId && detailsModalVisible,
    staleTime: 5 * 60 * 1000,
  });

  const handleViewDetails = useCallback((row) => {
    const detailId = row?.id ?? null;
    if (detailId == null) {
      message.warning('Candidate details are not available for this row');
      return;
    }
    setSelectedDetailsId(detailId);
    setSelectedRowPreview(row);
    setDetailsModalVisible(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsModalVisible(false);
    setSelectedDetailsId(null);
    setSelectedRowPreview(null);
  }, []);

  const resolveDetailForPdf = useCallback(
    async (details) => {
      if (
        details &&
        (Array.isArray(details.educations) ||
          Array.isArray(details.work_experiences) ||
          Array.isArray(details.skills))
      ) {
        return details;
      }
      const row = {
        id: details?.id ?? selectedDetailsId,
        source_type: listKind === 'profile' ? 'profile' : details?.source_type,
        resume_id: details?.resume_id ?? selectedRowPreview?.resume_id,
        candidate_details_id:
          details?.candidate_details_id ??
          selectedRowPreview?.candidate_details_id,
      };
      return resolveProfileDetailForCv(row);
    },
    [listKind, selectedDetailsId, selectedRowPreview]
  );

  const handleGenerateProfileCvUrl = useCallback(
    async (details) => {
      const payload = await resolveDetailForPdf(details);
      const blob = await generateProfileCvPdfBlob(payload);
      return URL.createObjectURL(blob);
    },
    [resolveDetailForPdf]
  );

  const handleOpenPdfViewer = useCallback((files) => {
    setPdfViewerFiles(files);
    setPdfViewerOpen(true);
  }, []);

  const handleClosePdfViewer = useCallback(() => {
    setPdfViewerOpen(false);
    setPdfViewerFiles([]);
  }, []);

  const handleViewFile = useCallback(
    async (row) => {
      const allFiles = Array.isArray(row?.all_files) ? row.all_files.filter(Boolean) : [];
      const singleFile = row?.file;
      const seen = new Set(allFiles);
      const uploadedFiles = [...allFiles, ...(singleFile && !seen.has(singleFile) ? [singleFile] : [])];

      if (uploadedFiles.length === 0) {
        message.warning('Resume file not available');
        return;
      }

      const files = uploadedFiles.map((url, i) => ({
        url: buildDownloadUrl(url),
        label: `Uploaded Resume ${i + 1}`,
      }));
      handleOpenPdfViewer(files);
    },
    [handleOpenPdfViewer]
  );

  const handleOpenCv = useCallback(
    async (details) => {
      if (!details) return;
      const file = details.file ?? selectedRowPreview?.file;
      if (listKind === 'resume' && file) {
        window.open(buildDownloadUrl(file), '_blank', 'noopener,noreferrer');
        return;
      }
      try {
        message.loading({ content: 'Opening CV…', key: 'listingCv' });
        const payload = await resolveDetailForPdf(details);
        const blob = await generateProfileCvPdfBlob(payload);
        message.destroy('listingCv');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 120000);
      } catch (err) {
        message.destroy('listingCv');
        message.error(err?.message || 'Could not open CV');
      }
    },
    [listKind, selectedRowPreview, resolveDetailForPdf]
  );

  const handleDownloadCv = useCallback(
    async (details) => {
      if (!details) return;
      const file = details.file ?? selectedRowPreview?.file;
      if (listKind === 'resume' && file) {
        try {
          const response = await fetch(buildDownloadUrl(file));
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${sanitizeCandidateDownloadName(details.name)}_resume.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          message.success('CV downloaded');
        } catch {
          message.error('Download failed');
        }
        return;
      }
      try {
        message.loading({ content: 'Generating CV…', key: 'listingCvDownload' });
        const payload = await resolveDetailForPdf(details);
        const blob = await generateProfileCvPdfBlob(payload);
        message.destroy('listingCvDownload');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizeCandidateDownloadName(details.name, payload?.name)}_profile_cv.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        message.success('CV downloaded');
      } catch (err) {
        message.destroy('listingCvDownload');
        message.error(err?.message || 'Download failed');
      }
    },
    [listKind, selectedRowPreview, resolveDetailForPdf]
  );

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name', size: 140 },
      { accessorKey: 'email', header: 'Email', size: 160 },
      { accessorKey: 'phone', header: 'Phone', size: 130 },
      {
        id: 'gender',
        accessorKey: 'gender',
        header: 'Gender',
        size: 90,
        sortDescFirst: false,
        sortUndefined: 'last',
        Cell: ({ cell }) => {
          const val = cell.getValue();
          if (!val) return '-';
          const lower = String(val).toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        },
      },
      {
        accessorKey: 'experience',
        header: 'Experience',
        size: 110,
        Cell: ({ cell }) => formatStoredMonthsAsExperience(cell.getValue()),
      },
      {
        id: 'current_designation',
        accessorKey: 'current_designation',
        header: 'Designation',
        size: 140,
        sortDescFirst: false,
        sortUndefined: 'last',
        Cell: ({ cell }) => cell.getValue() || '-',
      },
      ...(listKind === 'profile'
        ? [
            {
              accessorKey: 'id',
              header: 'ID',
              size: 110,
              Cell: ({ cell }) => cell.getValue() ?? '-',
            },
          ]
        : []),
      {
        accessorKey: 'skills',
        header: 'Skills',
        size: 180,
        enableSorting: false,
        Cell: ({ cell }) => formatSkillsCell(cell.getValue()),
      },
      {
        id: 'view_file',
        header: 'View CV',
        size: 90,
        enableSorting: false,
        Cell: ({ row }) => {
          const file = row.original?.file;
          if (!file) return <span style={{ color: '#ccc' }}>-</span>;
          return (
            <IconButton
              size="small"
              onClick={() => handleViewFile(row.original)}
              title="View uploaded resume PDF"
              sx={{ color: '#ff4d4f' }}
            >
              <FilePdfOutlined size="1em" className="app-icon" style={{ fontSize: 18, color: '#ff4d4f' }} />
            </IconButton>
          );
        },
      },
      {
        id: 'details',
        header: 'Details',
        size: 100,
        enableSorting: false,
        Cell: ({ row }) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleViewDetails(row.original)}
            sx={{
              fontSize: '10px',
              padding: '4px 12px',
              minWidth: 'auto',
              borderColor: '#3e6a9f',
              color: '#3e6a9f',
              '&:hover': { borderColor: '#2d5a8a', backgroundColor: 'rgba(62, 106, 159, 0.04)' },
            }}
          >
            Details
          </Button>
        ),
      },
    ],
    [listKind, handleViewDetails, handleViewFile]
  );

  const tableRows = useMemo(
    () => mapListingRows(listQuery.data?.results),
    [listQuery.data?.results]
  );

  const modalDetails = detailData
    ? { ...detailData, file: detailData.file ?? selectedRowPreview?.file }
    : selectedRowPreview;

  const totalCount = listQuery.data?.count ?? 0;

  return (
    <>
      <BreadCrumb linkText={breadcrumbText} goBack={() => navigate(cvPoolPath)} />
      <Box sx={{ p: 3, backgroundColor: 'white', minHeight: '100vh' }}>
        {listQuery.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load listings: {listQuery.error?.message || 'Unknown error'}
          </Alert>
        )}

        {isCvListing && (
          <SelectedRowsActions
            selectedCount={selectedCount}
            isAdmin={userType === 'super_admin'}
            onMarkUnprocessed={handleMarkUnprocessed}
          />
        )}

        <NewTableComponent
          totalCount={totalCount}
          columns={columns}
          data={tableRows}
          heading={`${tableHeadingLabel} (${totalCount})`}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          enableMultiSort={false}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          isLoading={listQuery.isLoading || listQuery.isFetching}
          enableRowSelection={isCvListing}
          rowSelection={isCvListing ? selectedRows : {}}
          onRowSelectionChange={isCvListing ? setSelectedRows : undefined}
          getRowId={(row, index) => row.id?.toString() || `row-${index}`}
          columnVisibility={{ id: false }}
        />

        {isCvListing && userType === 'super_admin' && (
          <ConfirmationModal
            showModal={markUnprocessedModalVisible}
            setShowModal={setMarkUnprocessedModalVisible}
            mutation={markUnprocessedMutation}
            value={pendingUnprocessedIds}
            isLoading={markUnprocessedMutation.isLoading}
            message={`Are you sure you want to mark ${pendingUnprocessedIds.length || 0} resume(s) as unprocessed?`}
          />
        )}

        <ResumeDetailModal
          open={detailsModalVisible}
          onClose={handleCloseDetails}
          details={modalDetails}
          loading={loadingDetail}
          error={detailError}
          cvSourceVariant={listKind === 'profile' ? 'profile' : 'cv'}
          onViewResume={handleOpenCv}
          onDownload={handleDownloadCv}
          onOpenPdfViewer={handleOpenPdfViewer}
          onGenerateProfileCvUrl={handleGenerateProfileCvUrl}
        />

        <ResumePdfViewer
          open={pdfViewerOpen}
          onClose={handleClosePdfViewer}
          files={pdfViewerFiles}
        />
      </Box>
    </>
  );
};

export default CandidateListingPage;

