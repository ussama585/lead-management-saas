import React from 'react';
import { Box, Chip, Grid, IconButton, TextField, Typography } from '@mui/material';
import { X as Clear } from 'lucide-react';

const THEME_PRIMARY = '#3E6A9F';
const THEME_PRIMARY_HOVER = '#2E5A8F';

const themeChipSx = {
  backgroundColor: THEME_PRIMARY,
  color: '#ffffff',
  border: 'none',
  fontWeight: 500,
  '& .MuiChip-label': {
    color: '#ffffff',
  },
  '& .MuiChip-deleteIcon': {
    color: '#ffffff',
    '&:hover': {
      color: '#e8f0f8',
    },
  },
  '&:hover': {
    backgroundColor: THEME_PRIMARY_HOVER,
  },
};

/**
 * MUI Autocomplete renderTags chip — app theme primary (#3E6A9F).
 */
export function AutocompleteFilterTagPill({ label, tagProps }) {
  const { className: tagClassName, sx: tagSx, ...restTagProps } = tagProps || {};
  return (
    <Chip
      variant="filled"
      label={label}
      size="small"
      {...restTagProps}
      className={tagClassName ? `${tagClassName} rf-tag-chip` : 'rf-tag-chip'}
      sx={{ ...themeChipSx, ...tagSx }}
    />
  );
}

/** Removable pill for filters outside MUI Autocomplete (e.g. Ant Design multi-select). */
export function RemovableFilterPill({ label, onRemove }) {
  return (
    <AutocompleteFilterTagPill
      label={label}
      tagProps={{ onDelete: onRemove }}
    />
  );
}

/**
 * Pill for per-skill / per-designation experience (label + years + remove).
 */
export function ExperienceFilterPill({ title, yearsDisplay, onYearsChange, onRemove }) {
  return (
    <Grid item>
      <Box className="rf-exp-chip">
        <Typography variant="body2" className="rf-exp-chip-label" title={title}>
          {title}
        </Typography>
        <TextField
          size="small"
          type="number"
          value={yearsDisplay}
          onChange={onYearsChange}
          inputProps={{ min: 0, step: 1 }}
          className="rf-exp-chip-input"
        />
        <Typography variant="caption" className="rf-exp-chip-suffix">
          yr
        </Typography>
        <IconButton size="small" onClick={onRemove} className="rf-exp-chip-remove" aria-label="Remove">
          <Clear size="1em" className="app-icon" style={{ fontSize: '14px' }} />
        </IconButton>
      </Box>
    </Grid>
  );
}
