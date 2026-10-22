import React from 'react';
import { Button } from '@mui/material';
import { X as Clear } from 'lucide-react';

/** Outlined-style control for clearing all active resume filters (theme border in CSS). */
export default function ResumeClearAllFiltersButton({ onClick, disabled = false }) {
  return (
    <Button
      type="button"
      size="small"
      variant="text"
      onClick={onClick}
      disabled={disabled}
      startIcon={<Clear size="1em" className="app-icon" />}
      className="rf-clear-all-btn"
    >
      Clear All
    </Button>
  );
}
