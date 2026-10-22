import React from 'react';
import { Alert, Box, Button } from '@mui/material';

const listingButtonSx = {
  bgcolor: '#3e6a9f',
  color: '#fff',
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': {
    bgcolor: '#2d5a8a',
    boxShadow: 'none',
  },
};

const ResumePageTopSection = ({
  onUploadBulkCv,
  onViewCvListing,
  onViewProfileListing,
  isError,
  errorMessage,
  onRetry,
}) => {
  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onUploadBulkCv}
          sx={{
            borderColor: '#3e6a9f',
            color: '#3e6a9f',
            fontWeight: 600,
            '&:hover': {
              borderColor: '#2d5a8a',
              backgroundColor: 'rgba(62,106,159,0.08)',
            },
          }}
        >
          Upload Bulk CV
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {onViewCvListing && (
            <Button variant="contained" onClick={onViewCvListing} sx={listingButtonSx}>
              CV Listing
            </Button>
          )}
          {onViewProfileListing && (
            <Button variant="contained" onClick={onViewProfileListing} sx={listingButtonSx}>
              Profile Listing
            </Button>
          )}
        </Box>
      </Box>

      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          }
        >
          Failed to load resumes: {errorMessage || 'Unknown error occurred'}
        </Alert>
      )}
    </>
  );
};

export default ResumePageTopSection;
