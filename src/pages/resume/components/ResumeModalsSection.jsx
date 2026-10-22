import React from 'react';
import ConfirmationModal from '../../../components/confirmation-modal.component.jsx';
import DownloadConfirmationContent from './DownloadConfirmationContent.jsx';
import ResumeDetailModal from './ResumeDetailModal.jsx';
import ResumeUsageModal from './ResumeUsageModal.jsx';
import ShiftToJobModal from './ShiftToJobModal.jsx';
import ResumePdfViewer from '../../../components/resume-pdf-viewer.component.jsx';

const ResumeModalsSection = (props) => {
  const {
    confirmDownloadModalVisible,
    setConfirmDownloadModalVisible,
    handleConfirmDownload,
    isDownloading,
    pendingDownloadResumes,
    isProfileSourcedRow,
    detailsModalVisible,
    handleCloseDetailsModal,
    selectedResumeDetails,
    loadingDetailedResume,
    detailedResumeError,
    detailSourceType,
    selectedResumeId,
    handleViewResume,
    handleViewProfileCv,
    handleDownloadSingle,
    usageModalVisible,
    handleCloseUsageModal,
    loadingResumeUsage,
    resumeUsageError,
    resumeUsageData,
    usageResumeName,
    pendingSingleDownload,
    singleDownloadModalVisible,
    setSingleDownloadModalVisible,
    handleConfirmSingleDownload,
    customCvOnly = false,
    shiftToJobModalOpen = false,
    shiftToJobRecord = null,
    shiftToJobSession = 0,
    onCloseShiftToJobModal,
    onShiftToJobSuccess,
    pdfViewerOpen = false,
    pdfViewerFiles = [],
    onClosePdfViewer,
    onOpenPdfViewer,
    onGenerateProfileCvUrl,
  } = props;

  return (
    <>
      <ConfirmationModal
        showModal={confirmDownloadModalVisible}
        setShowModal={setConfirmDownloadModalVisible}
        onConfirm={handleConfirmDownload}
        value={null}
        isLoading={isDownloading}
        message={
          <DownloadConfirmationContent
            mode="bulk"
            pendingDownloadResumes={pendingDownloadResumes}
            isProfileSourcedRow={isProfileSourcedRow}
            customCvOnly={customCvOnly}
          />
        }
      />

      <ResumeDetailModal
        open={detailsModalVisible}
        onClose={handleCloseDetailsModal}
        details={selectedResumeDetails}
        loading={loadingDetailedResume}
        error={detailedResumeError}
        cvSourceVariant={detailSourceType}
        customCvOnly={customCvOnly}
        onOpenPdfViewer={onOpenPdfViewer}
        onGenerateProfileCvUrl={onGenerateProfileCvUrl}
        onViewResume={(d) => {
          const merged = {
            ...d,
            id: selectedResumeId ?? d.id,
            candidate_details_id:
              d.candidate_details_id ?? selectedResumeId ?? d.id,
            source_type: detailSourceType === 'profile' ? 'profile' : 'resume',
          };
          if (customCvOnly) {
            handleViewProfileCv(merged);
            return;
          }
          if (detailSourceType === 'profile') {
            handleViewProfileCv(merged);
          } else {
            handleViewResume(merged);
          }
        }}
        onDownload={(d) => {
          const merged = {
            ...d,
            id: selectedResumeId ?? d.id,
            candidate_details_id:
              d.candidate_details_id ?? selectedResumeId ?? d.id,
            source_type: detailSourceType === 'profile' ? 'profile' : 'resume',
          };
          handleDownloadSingle(merged);
        }}
      />

      <ResumeUsageModal
        open={usageModalVisible}
        onClose={handleCloseUsageModal}
        loading={loadingResumeUsage}
        error={resumeUsageError}
        usages={Array.isArray(resumeUsageData) ? resumeUsageData : (resumeUsageData?.data || resumeUsageData?.results || [])}
        resumeName={usageResumeName}
      />

      {pendingSingleDownload && (
        <ConfirmationModal
          showModal={singleDownloadModalVisible}
          setShowModal={setSingleDownloadModalVisible}
          onConfirm={handleConfirmSingleDownload}
          value={null}
          isLoading={isDownloading}
          message={
            <DownloadConfirmationContent
              mode="single"
              pendingSingleDownload={pendingSingleDownload}
            />
          }
        />
      )}

      <ShiftToJobModal
        key={`shift-to-job-${shiftToJobSession}`}
        open={shiftToJobModalOpen}
        onClose={onCloseShiftToJobModal}
        record={shiftToJobRecord}
        onSuccess={onShiftToJobSuccess}
      />

      <ResumePdfViewer
        open={pdfViewerOpen}
        onClose={onClosePdfViewer}
        files={pdfViewerFiles}
      />
    </>
  );
};

export default ResumeModalsSection;
