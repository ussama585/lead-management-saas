import React from 'react';
import { Box, Typography } from '@mui/material';
import { ListFilter as FilterList } from 'lucide-react';

const ResumeFiltersHeader = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <FilterList size="1em" className="app-icon"  style={{ ...({ color: '#3e6a9f', marginRight: 8 }) }} />
      <Typography variant="h6" sx={{ color: '#3e6a9f', fontWeight: 'bold' }}>
        Filters
      </Typography>
    </Box>
  );
};

export default ResumeFiltersHeader;
