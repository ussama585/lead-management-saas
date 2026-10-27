import { Modal } from '../../../components/ui/app-modal.jsx';
import React, { useEffect } from 'react';

import { Box, Typography, CircularProgress, Alert, Chip, Grid, Divider } from '@mui/material';
import { BriefcaseBusiness as Work, User as Person, MapPin as LocationOn, Folder } from 'lucide-react';

function ResumeUsageModal({ open, onClose, loading, error, usages, resumeName }) {
  // Extract actual array from usages prop (handles different response structures)
  const usagesArray = React.useMemo(() => {
    if (Array.isArray(usages)) {
      return usages;
    }
    if (usages && typeof usages === 'object') {
      return usages.data || usages.results || usages.items || [];
    }
    return [];
  }, [usages]);

 

  const getStatusColor = (status, type) => {
    if (type === 'job') {
      const statusMap = {
        'Active': { bg: '#dcfce7', color: '#15803d' },
        'Closed': { bg: '#fee2e2', color: '#991b1b' },
        'On Hold': { bg: '#fef3c7', color: '#92400e' },
        'Draft': { bg: '#f3f4f6', color: '#374151' },
      };
      return statusMap[status] || { bg: '#f3f4f6', color: '#374151' };
    }

    if (type === 'resume') {
      const statusMap = {
        'Pending': { bg: '#fef3c7', color: '#92400e' },
        'Submitted': { bg: '#dbeafe', color: '#1e40af' },
        'Under Review': { bg: '#fef3c7', color: '#92400e' },
        'Shortlisted': { bg: '#d1fae5', color: '#065f46' },
        'Rejected': { bg: '#fee2e2', color: '#991b1b' },
        'Interview': { bg: '#f5f3ff', color: '#7c3aed' },
        'Interview Scheduled': { bg: '#f5f3ff', color: '#7c3aed' },
        'On Hold': { bg: '#fef3c7', color: '#92400e' },
      };
      return statusMap[status] || { bg: '#e0e7ff', color: '#4338ca' };
    }

    return { bg: '#eff6ff', color: '#1d4ed8' };
  };

  return (
    <Modal
      title={
        <Box
          sx={{
            background: 'linear-gradient(135deg, #3e6a9f 0%, #2d5a8a 100%)',
            color: 'white',
            padding: '16px 24px',
            margin: '-24px -24px 20px -24px',
            borderRadius: '6px 6px 0 0',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px', letterSpacing: '0.02em' }}>
            CV Usage History
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '13px', opacity: 0.92, mt: 0.5, display: 'block' }}>
            {resumeName || 'All usage records'}
          </Typography>
        </Box>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="85vw"
      style={{ maxWidth: '1100px', top: '5vh' }}
      centered
      closeIcon={
        <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 300 }}>
          ×
        </span>
      }
    >
      <Box sx={{ bgcolor: '#f8f9fa', minHeight: '200px' }}>
        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} thickness={4} />
            <Typography variant="body2" sx={{ ml: 2, color: '#64748b', fontSize: '14px' }}>
              Loading usage data...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {!loading && error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Failed to load cv usage information. Please try again.
            </Alert>
          </Box>
        )}

        {/* Empty State */}
        {!loading && !error && usagesArray.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Work size="1em" className="app-icon"  style={{ ...({ fontSize: 48, color: '#cbd5e1', marginBottom: 16 }) }} />
            <Typography variant="body1" sx={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
              No usage records found
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '13px', mt: 0.5 }}>
              This cv has not been used in any jobs yet.
            </Typography>
          </Box>
        )}

        {/* Data Display */}
        {!loading && !error && usagesArray.length > 0 && (
          <Box sx={{ p: 2 }}>
            {/* Summary Header */}
            <Box sx={{ mb: 3, px: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                Total Records: <span style={{ color: '#3e6a9f' }}>{usagesArray.length}</span>
              </Typography>
            </Box>

            {/* Usage List */}
            <Box
              sx={{
                maxHeight: '65vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                px: 1,
                pb: 2,
              }}
            >
              {usagesArray.map((usage, index) => {
                const jobStatusColors = getStatusColor(usage.job_status || usage.status, 'job');
                const resumeStatusColors = getStatusColor(usage.resume_status, 'resume');

                return (
                  <Box
                    key={`${usage.job_id}-${usage.batch_name || 'public'}-${index}`}
                    sx={{
                      bgcolor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      overflow: 'visible', // Changed from 'hidden' to 'visible'
                      transition: 'all 0.2s ease',
                      minHeight: 'auto', // Allow natural height
                      height: 'auto', // Explicit auto height
                      '&:hover': {
                        boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                        borderColor: '#cbd5e1',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {/* Header: Position and Job Status */}
                    <Box sx={{ bgcolor: '#f8fafc', px: 3, py: 2.5 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={8}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 36,
                              height: 36,
                              borderRadius: '8px',
                              bgcolor: '#eff6ff',
                              color: '#3b82f6',
                              flexShrink: 0,
                            }}>
                              <Work size="1em" className="app-icon"  style={{ ...({ fontSize: 20 }) }} />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '15px',
                                  color: '#1e293b',
                                  lineHeight: 1.3,
                                  mb: 0.5,
                                }}
                              >
                                {usage.job_title || usage.job_name || 'Untitled Position'}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '12px',
                                  color: '#64748b',
                                  fontWeight: 500,
                                  display: 'block',
                                }}
                              >
                                Job ID: {usage.job_id ?? 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                            <Chip
                              size="small"
                              label={usage.job_status || usage.status || 'Active'}
                              sx={{
                                bgcolor: jobStatusColors.bg,
                                color: jobStatusColors.color,
                                height: 26,
                                fontWeight: 700,
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                borderRadius: '6px',
                              }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider sx={{ borderColor: '#e2e8f0' }} />

                    {/* Details: Resume Status, Location, Assignment - ALWAYS VISIBLE */}
                    <Box
                      sx={{
                        p: 3,
                        display: 'block', // Force display
                        visibility: 'visible', // Force visibility
                        opacity: 1, // Force opacity
                        minHeight: '120px', // Minimum height to ensure it's visible
                      }}
                    >
                      <Grid container spacing={3}>
                        {/* Resume Status */}
                        <Grid item xs={12} sm={4}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#94a3b8',
                              fontWeight: 700,
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              mb: 1.5,
                              display: 'block',
                            }}
                          >
                            CV Status
                          </Typography>
                          {usage.resume_status ? (
                            <Chip
                              size="small"
                              label={usage.resume_status}
                              sx={{
                                bgcolor: resumeStatusColors.bg,
                                color: resumeStatusColors.color,
                                height: 28,
                                fontWeight: 600,
                                fontSize: '12px',
                                borderRadius: '6px',
                              }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Not specified
                            </Typography>
                          )}
                        </Grid>

                        {/* Location */}
                        <Grid item xs={12} sm={4}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#94a3b8',
                              fontWeight: 700,
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              mb: 1.5,
                              display: 'block',
                            }}
                          >
                            Location
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {usage.usage_location === 'Batch' ? (
                              <Folder size="1em" className="app-icon"  style={{ ...({ fontSize: 18, color: '#6366f1', flexShrink: 0 }) }} />
                            ) : (
                              <LocationOn size="1em" className="app-icon"  style={{ ...({ fontSize: 18, color: '#ef4444', flexShrink: 0 }) }} />
                            )}
                            <Typography variant="body2" sx={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                              {usage.usage_location === 'Batch' && usage.batch_name
                                ? usage.batch_name
                                : (usage.usage_location || 'General Pool')}
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Ownership */}
                        <Grid item xs={12} sm={4}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#94a3b8',
                              fontWeight: 700,
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              mb: 1.5,
                              display: 'block',
                            }}
                          >
                            Ownership
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person size="1em" className="app-icon"  style={{ ...({ fontSize: 16, color: '#94a3b8', flexShrink: 0 }) }} />
                              <Typography variant="body2" sx={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 500, color: '#94a3b8' }}>Recruiter:</span>{' '}
                                {usage.recruiter_name || usage.recruiter || '—'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person size="1em" className="app-icon"  style={{ ...({ fontSize: 16, color: '#94a3b8', flexShrink: 0 }) }} />
                              <Typography variant="body2" sx={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 500, color: '#94a3b8' }}>Assigned:</span>{' '}
                                {usage.assigned_to_name || usage.assigned_to || '—'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
}

export default ResumeUsageModal;