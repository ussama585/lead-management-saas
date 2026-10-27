import { Modal } from '../../../components/ui/app-modal.jsx';
import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { Download } from 'lucide-react';

import useUserStore from '../../shared/store/user-store.js';
import ResumeCvDetailGrid from './ResumeCvDetailGrid.jsx';
import { buildDownloadUrl } from '../utils/candidateListingShared.js';

const MODAL_HEADER_BY_VARIANT = {
  profile: { title: 'Profile details', subtitle: 'Profile information' },
  cv: { title: 'CV details', subtitle: 'Candidate information' },
  resume: { title: 'Resume details', subtitle: 'Candidate information' },
};

function ResumeDetailModal({
  open,
  onClose,
  details,
  loading,
  error,
  onViewResume,
  onDownload,
  cvSourceVariant = 'resume',
  customCvOnly = false,
  onOpenPdfViewer,
  onGenerateProfileCvUrl,
}) {
  const { user } = useUserStore();
  const showAdditionalFields = user?.user_type === 'admin';

  const [expanded, setExpanded] = useState({});
  const [generatingPdfViewer, setGeneratingPdfViewer] = useState(false);
  const toggleSection = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const isProfileGeneratedCv =
    customCvOnly ||
    ((cvSourceVariant === 'profile' || cvSourceVariant === 'cv') && !details?.file);
  const { title: modalTitle, subtitle: modalSubtitle } =
    MODAL_HEADER_BY_VARIANT[cvSourceVariant] ?? MODAL_HEADER_BY_VARIANT.resume;

  const personalFooter = (
    <>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {(() => {
          const allFiles = Array.isArray(details?.all_files) ? details.all_files.filter(Boolean) : [];
          const singleFile = details?.file;
          const seen = new Set(allFiles);
          const uploadedFiles = [...allFiles, ...(singleFile && !seen.has(singleFile) ? [singleFile] : [])];
          const hasProfileCv = !!onGenerateProfileCvUrl && (customCvOnly || cvSourceVariant === 'profile' || cvSourceVariant === 'cv');
          if (!onOpenPdfViewer || (uploadedFiles.length === 0 && !hasProfileCv)) return null;
          const handleOpen = async () => {
            setGeneratingPdfViewer(true);
            try {
              const files = uploadedFiles.map((url, i) => ({ url: buildDownloadUrl(url), label: `Uploaded Resume ${i + 1}` }));
              if (hasProfileCv) {
                const blobUrl = await onGenerateProfileCvUrl(details);
                files.push({ url: blobUrl, label: 'Generated CV' });
              }
              onOpenPdfViewer(files);
            } finally {
              setGeneratingPdfViewer(false);
            }
          };
          return (
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpen}
              disabled={loading || generatingPdfViewer}
              sx={{ borderColor: '#3e6a9f', color: '#3e6a9f', fontWeight: 600, px: 1.75, py: 0.5, fontSize: '11px', borderRadius: '6px', minWidth: 'auto', '&:hover': { borderColor: '#2d5a8a', bgcolor: '#2d5a8a', color: '#fff' } }}
            >
              Preview CV
            </Button>
          );
        })()}
        <Button
          variant="outlined"
          size="small"
          startIcon={<Download size="1em" className="app-icon" />}
          onClick={() => onDownload(details)}
          disabled={loading}
          sx={{ borderColor: '#0d9488', color: '#0d9488', fontWeight: 600, px: 1.75, py: 0.5, fontSize: '11px', borderRadius: '6px', minWidth: 'auto', '&:hover': { borderColor: '#0d9488', bgcolor: '#0d9488', color: '#fff' } }}
        >
          {isProfileGeneratedCv ? 'Download CV (PDF)' : 'Download'}
        </Button>
      </Box>
    </>
  );

  return (
    <Modal
      title={
        <div style={{
          background: 'linear-gradient(135deg, #3e6a9f 0%, #2d5a8a 100%)',
          color: 'white',
          padding: '14px 24px',
          margin: '-24px -24px 20px -24px',
          borderRadius: '6px 6px 0 0',
          fontWeight: 600,
          fontSize: '16px',
          letterSpacing: '0.02em',
        }}>
          {modalTitle}
          <div style={{ fontSize: '12px', opacity: 0.92, marginTop: '4px', fontWeight: 400 }}>{modalSubtitle}</div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="92vw"
      style={{ maxWidth: '1200px', top: '4vh' }}
      centered
      closeIcon={
        <span
          style={{
            color: '#ffffff',
            fontSize: '18px',
          }}
        >
          ×
        </span>
      }
    >
      <Box sx={{ px: 0, pb: 0, pt: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" sx={{ ml: 1, color: '#666', fontSize: '13px' }}>Loading...</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>Failed to load full details. Showing basic information.</Alert>
        )}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(92vh - 120px)' }}>
          <ResumeCvDetailGrid
            details={details}
            expanded={expanded}
            onToggleSection={toggleSection}
            personalFooter={personalFooter}
            profileDateLabel={isProfileGeneratedCv ? 'Profile' : 'Uploaded'}
            showAdditionalFields={showAdditionalFields}
            onOpenPdfViewer={onOpenPdfViewer}
          />
        </Box>
      </Box>
    </Modal>
  );
}

export default ResumeDetailModal;
