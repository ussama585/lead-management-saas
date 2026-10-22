import React from 'react';
import { Box, Button } from '@mui/material';
import { Download } from 'lucide-react';

const SelectedRowsActions = ({
  selectedCount,
  isAdmin,
  onDownloadSelected,
  onMarkUnprocessed,
}) => {
  if (!selectedCount) return null;
  if (!onDownloadSelected && !onMarkUnprocessed) return null;

  return (
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      {onDownloadSelected && (
        <Button
          variant="contained"
          startIcon={<Download size="1em" className="app-icon" />}
          onClick={onDownloadSelected}
          sx={{
            backgroundColor: '#3e6a9f',
            '&:hover': {
              backgroundColor: '#2d5a8a',
            },
          }}
        >
          Download Selected ({selectedCount})
        </Button>
      )}

      {isAdmin && onMarkUnprocessed && (
        <Button
          variant="outlined"
          color="error"
          onClick={onMarkUnprocessed}
          sx={{
            borderColor: '#ff4d4f',
            color: '#ff4d4f',
            '&:hover': {
              borderColor: '#d9363e',
              backgroundColor: 'rgba(255,77,79,0.06)',
            },
          }}
        >
          Mark as Unprocessed
        </Button>
      )}
    </Box>
  );
};

export default SelectedRowsActions;
