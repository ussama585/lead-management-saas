import React from 'react';
import { Box, Typography } from '@mui/material';

const DownloadConfirmationContent = ({
  mode = 'bulk',
  pendingSingleDownload = null,
  pendingDownloadResumes = [],
  isProfileSourcedRow = () => false,
  customCvOnly = false,
}) => {
  if (mode === 'single') {
    if (!pendingSingleDownload) return null;

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, color: '#3e6a9f', fontWeight: 'bold' }}>
          Download Confirmation
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to download the resume for:
        </Typography>
        <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Name:</strong> {pendingSingleDownload.name}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Email:</strong> {pendingSingleDownload.email}
          </Typography>
          <Typography variant="body2">
            <strong>Designation:</strong> {pendingSingleDownload.designations?.join(', ') || '-'}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#666' }}>
          {pendingSingleDownload._cvDownloadMode === 'all_cvs'
            ? 'All available CVs for this candidate will be downloaded — the uploaded resume(s) and the profile-generated CV, zipped together if there’s more than one file.'
            : customCvOnly || pendingSingleDownload._cvDownloadMode === 'profile_generated'
              ? 'A PDF will be generated from this candidate’s profile data.'
              : pendingSingleDownload._cvDownloadMode === 'uploaded_file'
                ? 'The uploaded resume file will be downloaded as a PDF.'
                : 'The resume will be downloaded as a PDF file.'}
        </Typography>
      </Box>
    );
  }

  if (!pendingDownloadResumes.length) {
    return 'Do you want to download the selected resumes?';
  }

  return (
    <>
      <div
        style={{
          marginBottom: 12,
          maxHeight: 250,
          overflowY: 'auto',
        }}
      >
        {pendingDownloadResumes.map((resume, idx) => (
          <div
            key={resume.id || idx}
            style={{
              marginBottom: 8,
              padding: 8,
              border: '1px solid #eee',
              borderRadius: 4,
            }}
          >
            <div>
              <strong>Name:</strong> {resume.name || '-'}
            </div>
            <div>
              <strong>Email:</strong> {resume.email || '-'}
            </div>
            <div>
              <strong>Designation:</strong> {resume.designations?.join(', ') || '-'}
            </div>
            <div>
              <strong>Experience:</strong> {resume.experience ? `${resume.experience} years` : '-'}
            </div>
            <div>
              <strong>File:</strong>{' '}
              {resume.file && isProfileSourcedRow(resume)
                ? 'Uploaded PDF + profile-generated CV (both included in zip)'
                : resume.file
                  ? 'Uploaded PDF'
                  : isProfileSourcedRow(resume)
                    ? 'Profile — PDF will be generated'
                    : 'Not available'}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontWeight: 500 }}>
        Are you sure you want to download these {pendingDownloadResumes.length} resume(s)?
      </div>
    </>
  );
};

export default DownloadConfirmationContent;
