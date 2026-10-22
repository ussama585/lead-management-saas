import React from 'react';
import { Box, Grid, MenuItem, TextField, Typography } from '@mui/material';

const OverallExperienceFilter = ({
  value,
  mode,
  options,
  onExperienceChange,
  onModeChange,
}) => {
  return (
    <Grid item xs={12} sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: { md: '800px' } }}>
        <Typography variant="body2" sx={{ fontSize: 12, color: '#555', mb: 0.5, fontWeight: 500 }}>
          Experience (Overall)
        </Typography>
        <Box
          className="resume-filter-row-inline"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'stretch',
            border: '1px solid #d9d9d9',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}
        >
          <TextField
            select
            size="small"
            value={value}
            onChange={(event) => onExperienceChange(event.target.value)}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (selected === '') {
                  return 'Select experience';
                }
                const selectedOption = options.find((option) => option.value === selected);
                return selectedOption ? selectedOption.label : selected;
              },
            }}
            sx={{
              flex: 1,
              backgroundColor: '#fff',
              '& .MuiInputBase-input': {
                padding: '8px',
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
          >
            <MenuItem value="">Select experience</MenuItem>
            {options.map((option) => (
              <MenuItem key={option.label} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={mode}
            onChange={(event) => onModeChange(event.target.value)}
            sx={{
              width: { xs: '100%', sm: 150 },
              minWidth: 120,
              backgroundColor: '#fff',
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
                borderLeft: '1px solid #d9d9d9',
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
          >
            <MenuItem value="exact">Exactly</MenuItem>
            <MenuItem value="up_to">Up to</MenuItem>
            <MenuItem value="at_least">At least</MenuItem>
          </TextField>
        </Box>
      </Box>
    </Grid>
  );
};

export default OverallExperienceFilter;
