import React from 'react';
import { Box, Button, Chip, Typography, Grid } from '@mui/material';
import { ChevronDown as ExpandMore, ChevronUp as ExpandLess, User as Person, Mail as Email, Phone, Calendar as Event, BriefcaseBusiness as Work, Facebook, Linkedin as LinkedIn, Twitter, Instagram, Globe as Language, Link as LinkIcon } from 'lucide-react';
import formatDateUniversal, { getDurationBetweenDates } from '../../shared/utils/formatDate.js';

export const INITIAL_VISIBLE = 3;
export const INITIAL_VISIBLE_CHIPS = 6;

const safeArray = (v) => (Array.isArray(v) ? v : []);

export const formatDesignationExperience = (experience) => {
  if (experience === null || typeof experience === 'undefined') return '';
  const match = String(experience).match(/\d+/);
  if (!match) return String(experience);
  const months = parseInt(match[0], 10);
  if (!Number.isFinite(months) || months <= 0) return String(experience);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearPart = `${years} year${years === 1 ? '' : 's'}`;
  if (remainingMonths === 0) return yearPart;
  const monthPart = `${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
  return `${yearPart} ${monthPart}`;
};

const sectionCardSx = {
  border: '1px solid #e8eaed',
  borderRadius: '10px',
  overflow: 'hidden',
  height: '100%',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  bgcolor: '#fff',
};
const sectionHeaderSx = { bgcolor: '#fafbfc', py: 1, px: 1.5, borderBottom: '1px solid #e8eaed' };
const sectionTitleSx = { fontWeight: 600, color: '#2c5282', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' };
const sectionBodySx = { p: 1.5 };
const seeMoreBtnSx = { mt: 1, color: '#3e6a9f', fontSize: '11px', textTransform: 'none', minWidth: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } };

/**
 * Full CV detail sections (education, work, skills, etc.) — shared by Resume detail modal and profile CV preview modal.
 */
export default function ResumeCvDetailGrid({
  details,
  expanded,
  onToggleSection,
  personalFooter,
  profileDateLabel = 'Uploaded',
  showAdditionalFields = false,
  onOpenPdfViewer,
}) {
  const formatDetailDate = (dateStr) => (dateStr ? formatDateUniversal(dateStr) : '');
  const getDetailDuration = (startStr, endStrOrNull) => getDurationBetweenDates(startStr, endStrOrNull);

  const educations = safeArray(details?.educations);
  const workExperiences = safeArray(details?.work_experiences);
  const skills = safeArray(details?.skills);
  const designations = safeArray(details?.designations);
  const languages = safeArray(details?.languages);
  const universities = safeArray(details?.universities);
  const cities = safeArray(details?.cities);
  const countries = safeArray(details?.countries);
  const companies = safeArray(details?.companies);
  const certifications = safeArray(details?.certifications);
  const trainings = safeArray(details?.trainings);
  const projects = safeArray(details?.projects);
  const socialLinks = safeArray(details?.social_links);
  const extraCurricularActivities = safeArray(details?.extra_curricular_activities);
  const references = safeArray(details?.references);
  const publications = safeArray(details?.publications);
  const volunteerWorks = safeArray(details?.volunteer_works);
  const achievements = safeArray(details?.achievements);

  const subtitleLabel = details?.current_designation || '';

  const socialIconFor = (name) => {
    const key = String(name || '').toLowerCase();
    const iconSx = { fontSize: 16, color: '#64748b' };
    if (key.includes('facebook')) return <Facebook size="1em" className="app-icon"  style={{ ...(iconSx) }} />;
    if (key.includes('linkedin')) return <LinkedIn size="1em" className="app-icon"  style={{ ...(iconSx) }} />;
    if (key.includes('twitter') || key === 'x') return <Twitter size="1em" className="app-icon"  style={{ ...(iconSx) }} />;
    if (key.includes('instagram')) return <Instagram size="1em" className="app-icon"  style={{ ...(iconSx) }} />;
    if (key.includes('website') || key.includes('site')) return <Language size="1em" className="app-icon"  style={{ ...(iconSx) }} />;
    return <LinkIcon size="1em" className="app-icon"  style={{ ...(iconSx) }} />;
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box sx={{ ...sectionCardSx, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Box sx={sectionHeaderSx}>
            <Typography component="h3" sx={sectionTitleSx}>Personal</Typography>
          </Box>
          <Box sx={{ ...sectionBodySx, p: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: '1 1 auto', minWidth: 0 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '22px' }}>
                  {(details?.name && String(details.name).charAt(0).toUpperCase()) || '?'}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '16px', color: '#1e293b', mb: 0.25 }}>
                    {details?.name || '—'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px' }}>
                    {subtitleLabel}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 260 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' }, columnGap: 2, rowGap: 1 }}>
                  {[
                    { icon: <Email size="1em" className="app-icon"  style={{ ...({ fontSize: 16, color: '#64748b' }) }} />, label: 'Email', value: details?.email || '—' },
                    { icon: <Phone size="1em" className="app-icon"  style={{ ...({ fontSize: 16, color: '#64748b' }) }} />, label: 'Phone', value: details?.phone || '—' },
                    { icon: <Person size="1em" className="app-icon"  style={{ ...({ fontSize: 16, color: '#64748b' }) }} />, label: 'Gender', value: (() => {
                      const g = details?.gender;
                      if (!g) return '—';
                      const lower = String(g).toLowerCase();
                      if (lower === 'male') return 'Male';
                      if (lower === 'female') return 'Female';
                      return String(g).charAt(0).toUpperCase() + String(g).slice(1);
                    })() },
                    { icon: <Work size="1em" className="app-icon"  style={{ ...({ fontSize: 16, color: '#64748b' }) }} />, label: 'Experience', value: details?.experience ? formatDesignationExperience(details.experience) : '—' },
                    { icon: <Event size="1em" className="app-icon"  style={{ ...({ fontSize: 16, color: '#64748b' }) }} />, label: profileDateLabel, value: details?.created_at ? formatDateUniversal(details.created_at) : '—' },
                  ].map(({ icon, label, value }) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                      {icon}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '9px', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: 0.2 }}>{label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b', lineHeight: 1.35, wordBreak: 'break-word' }}>{value}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
                {personalFooter != null && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75, mt: 0.5 }}>
                    {personalFooter}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Summary</Typography></Box>
          <Box sx={sectionBodySx}>
            {details?.summary ? (
              <Typography variant="body2" sx={{ color: '#334155', fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {details.summary}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No summary</Typography>
            )}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Education</Typography></Box>
          <Box sx={sectionBodySx}>
            {educations.length > 0 ? (
              <>
                {(expanded.education ? educations : educations.slice(0, INITIAL_VISIBLE)).map((education, index) => (
                  <Box key={index} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.5, '&:last-of-type': { mb: 0 } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{education.university || '—'}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: '#475569', mt: 0.25 }}>{education.category && education.degree ? `${education.category} · ${education.degree}` : education.category || education.degree || '—'}</Typography>
                    <Typography variant="caption" sx={{ fontSize: '11px', color: '#64748b', display: 'block', mt: 0.25 }}>
                      {education.is_studying ? (education.start_date ? `Since ${formatDetailDate(education.start_date)} · ${getDetailDuration(education.start_date, null)}` : 'Currently studying')
                        : (() => { const range = [formatDetailDate(education.start_date), formatDetailDate(education.end_date)].filter(Boolean).join(' – ') || (education.end_date ? `Completed ${formatDetailDate(education.end_date)}` : ''); const duration = getDetailDuration(education.start_date, education.end_date); return duration ? `${range} · ${duration}` : range; })()}
                    </Typography>
                    {(education.city || education.country) && (
                      <Typography variant="caption" sx={{ fontSize: '11px', color: '#64748b', display: 'block', mt: 0.25 }}>
                        {[education.city, education.country].filter(Boolean).join(', ')}
                      </Typography>
                    )}
                    {education.description && (
                      <Typography variant="caption" sx={{ fontSize: '11px', color: '#475569', display: 'block', mt: 0.25, lineHeight: 1.4 }}>
                        {education.description}
                      </Typography>
                    )}
                  </Box>
                ))}
                {educations.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.education ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('education')} sx={seeMoreBtnSx}>
                    {expanded.education ? 'See less' : `See more (${educations.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No education</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Work experience</Typography></Box>
          <Box sx={sectionBodySx}>
            {workExperiences.length > 0 ? (
              <>
                {(expanded.work ? workExperiences : workExperiences.slice(0, INITIAL_VISIBLE)).map((exp, i) => (
                  <Box key={i} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.5, '&:last-of-type': { mb: 0 } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{exp.company || '—'}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: '#475569', mt: 0.25 }}>{exp.designation || '—'}</Typography>
                    <Typography variant="caption" sx={{ fontSize: '11px', color: '#64748b', display: 'block', mt: 0.25 }}>
                      {exp.is_working ? (exp.start_date ? `${formatDetailDate(exp.start_date)} – Present · ${getDetailDuration(exp.start_date, null)}` : 'Current')
                        : (() => { const range = [formatDetailDate(exp.start_date), formatDetailDate(exp.end_date)].filter(Boolean).join(' – ') || (exp.end_date ? `Ended ${formatDetailDate(exp.end_date)}` : exp.start_date ? `From ${formatDetailDate(exp.start_date)}` : ''); const duration = getDetailDuration(exp.start_date, exp.end_date); return duration ? `${range} · ${duration}` : range; })()}
                    </Typography>
                    {(exp.city || exp.country) && (
                      <Typography variant="caption" sx={{ fontSize: '11px', color: '#64748b', display: 'block', mt: 0.25 }}>
                        {[exp.city, exp.country].filter(Boolean).join(', ')}
                      </Typography>
                    )}
                    {exp.description && (
                      <Typography variant="caption" sx={{ fontSize: '11px', color: '#475569', display: 'block', mt: 0.25, lineHeight: 1.4 }}>
                        {exp.description}
                      </Typography>
                    )}
                  </Box>
                ))}
                {workExperiences.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.work ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('work')} sx={seeMoreBtnSx}>
                    {expanded.work ? 'See less' : `See more (${workExperiences.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No work experience</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Skills</Typography></Box>
          <Box sx={sectionBodySx}>
            {skills.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {(expanded.skills ? skills : skills.slice(0, INITIAL_VISIBLE_CHIPS)).map((skill, i) => {
                    if (typeof skill === 'string') {
                      return <Box key={i} sx={{ p: 1, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}><Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{skill}</Typography></Box>;
                    }
                    const name = skill.title || skill.name || skill.cat || String(skill);
                    const expText = skill.experience ? formatDesignationExperience(skill.experience) : '';
                    const reason = skill.reason || '';
                    return (
                      <Box key={i} sx={{ p: 1, borderRadius: '8px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{name}</Typography>
                          {expText && <Chip label={expText} size="small" sx={{ bgcolor: '#e2f3ff', color: '#0f172a', fontSize: '10px', height: '22px', borderRadius: '999px', '& .MuiChip-label': { px: 1 } }} />}
                        </Box>
                        {reason && <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748b', fontSize: '11px', lineHeight: 1.4 }}>{reason}</Typography>}
                      </Box>
                    );
                  })}
                </Box>
                {skills.length > INITIAL_VISIBLE_CHIPS && (
                  <Button size="small" startIcon={expanded.skills ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('skills')} sx={seeMoreBtnSx}>
                    {expanded.skills ? 'See less' : `See more (${skills.length - INITIAL_VISIBLE_CHIPS} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No skills</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Designations</Typography></Box>
          <Box sx={sectionBodySx}>
            {designations.length > 0 ? (
              <>
                {(expanded.designations ? designations : designations.slice(0, INITIAL_VISIBLE)).map((designation, index) => {
                  if (!designation) return null;
                  if (typeof designation === 'string') return <Box key={index} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.25 }}><Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{designation}</Typography></Box>;
                  const title = designation.title || designation.name || designation.designation || '—';
                  const company = designation.company || designation.organization || designation.company_name;
                  const startDate = designation.start_date || designation.from || designation.start;
                  const endDate = designation.end_date || designation.to || designation.end;
                  const isCurrent = typeof designation.is_current === 'boolean' ? designation.is_current : (typeof designation.is_working === 'boolean' ? designation.is_working : undefined);
                  const hasExperience = typeof designation.experience !== 'undefined' && designation.experience !== null;
                  return (
                    <Box key={index} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{title}</Typography>
                      {company && <Typography variant="caption" sx={{ fontSize: '11px', color: '#475569', display: 'block' }}>{company}</Typography>}
                      {(startDate || endDate || isCurrent) && (
                        <Typography variant="caption" sx={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                          {isCurrent ? (startDate ? `Since ${formatDetailDate(startDate)} · ${getDetailDuration(startDate, null)}` : 'Current') : (() => { const range = [formatDetailDate(startDate), formatDetailDate(endDate)].filter(Boolean).join(' – ') || ''; const duration = getDetailDuration(startDate, endDate); return duration ? `${range} · ${duration}` : range; })()}
                        </Typography>
                      )}
                      {hasExperience && <Typography variant="caption" sx={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Exp: {formatDesignationExperience(designation.experience)}</Typography>}
                    </Box>
                  );
                })}
                {designations.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.designations ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('designations')} sx={seeMoreBtnSx}>
                    {expanded.designations ? 'See less' : `See more (${designations.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No designations</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Languages</Typography></Box>
          <Box sx={sectionBodySx}>
            {languages.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(expanded.languages ? languages : languages.slice(0, INITIAL_VISIBLE_CHIPS)).map((lang, i) => (
                    <Chip key={i} label={typeof lang === 'string' ? lang : lang.title || lang.name || String(lang)} size="small" sx={{ bgcolor: '#6c757d', color: '#fff', fontSize: '11px', height: '22px', '& .MuiChip-label': { px: 0.75 } }} />
                  ))}
                </Box>
                {languages.length > INITIAL_VISIBLE_CHIPS && (
                  <Button size="small" startIcon={expanded.languages ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('languages')} sx={seeMoreBtnSx}>
                    {expanded.languages ? 'See less' : `See more (${languages.length - INITIAL_VISIBLE_CHIPS} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No languages</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Universities</Typography></Box>
          <Box sx={sectionBodySx}>
            {universities.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(expanded.universities ? universities : universities.slice(0, INITIAL_VISIBLE_CHIPS)).map((u, i) => (
                    <Chip key={i} label={typeof u === 'string' ? u : u.university || u.title || u.name || String(u)} size="small" variant="outlined" sx={{ borderColor: '#3e6a9f', color: '#3e6a9f', fontSize: '11px', height: '22px', '& .MuiChip-label': { px: 0.75 } }} />
                  ))}
                </Box>
                {universities.length > INITIAL_VISIBLE_CHIPS && (
                  <Button size="small" startIcon={expanded.universities ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('universities')} sx={seeMoreBtnSx}>
                    {expanded.universities ? 'See less' : `See more (${universities.length - INITIAL_VISIBLE_CHIPS} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No universities</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Cities</Typography></Box>
          <Box sx={sectionBodySx}>
            {cities.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(expanded.cities ? cities : cities.slice(0, INITIAL_VISIBLE_CHIPS)).map((city, i) => (
                    <Chip key={i} label={typeof city === 'string' ? city : city.title || city.name || String(city)} size="small" variant="outlined" sx={{ borderColor: '#28a745', color: '#28a745', fontSize: '11px', height: '22px', '& .MuiChip-label': { px: 0.75 } }} />
                  ))}
                </Box>
                {cities.length > INITIAL_VISIBLE_CHIPS && (
                  <Button size="small" startIcon={expanded.cities ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('cities')} sx={seeMoreBtnSx}>
                    {expanded.cities ? 'See less' : `See more (${cities.length - INITIAL_VISIBLE_CHIPS} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No cities</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Countries</Typography></Box>
          <Box sx={sectionBodySx}>
            {countries.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(expanded.countries ? countries : countries.slice(0, INITIAL_VISIBLE_CHIPS)).map((country, i) => (
                    <Chip key={i} label={typeof country === 'string' ? country : country.title || country.name || String(country)} size="small" variant="outlined" sx={{ borderColor: '#fd7e14', color: '#fd7e14', fontSize: '11px', height: '22px', '& .MuiChip-label': { px: 0.75 } }} />
                  ))}
                </Box>
                {countries.length > INITIAL_VISIBLE_CHIPS && (
                  <Button size="small" startIcon={expanded.countries ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('countries')} sx={seeMoreBtnSx}>
                    {expanded.countries ? 'See less' : `See more (${countries.length - INITIAL_VISIBLE_CHIPS} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No countries</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Companies</Typography></Box>
          <Box sx={sectionBodySx}>
            {companies.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(expanded.companies ? companies : companies.slice(0, INITIAL_VISIBLE_CHIPS)).map((company, i) => (
                    <Chip key={i} label={typeof company === 'string' ? company : company.title || company.name || String(company)} size="small" variant="outlined" sx={{ borderColor: '#17a2b8', color: '#17a2b8', fontSize: '11px', height: '22px', '& .MuiChip-label': { px: 0.75 } }} />
                  ))}
                </Box>
                {companies.length > INITIAL_VISIBLE_CHIPS && (
                  <Button size="small" startIcon={expanded.companies ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('companies')} sx={seeMoreBtnSx}>
                    {expanded.companies ? 'See less' : `See more (${companies.length - INITIAL_VISIBLE_CHIPS} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No companies</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Certifications</Typography></Box>
          <Box sx={sectionBodySx}>
            {certifications.length > 0 ? (
              <>
                {(expanded.certifications ? certifications : certifications.slice(0, INITIAL_VISIBLE)).map((cert, i) => (
                  <Box key={i} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{cert.name || '—'}</Typography>
                    <Typography variant="caption" sx={{ fontSize: '11px', color: '#475569', display: 'block' }}>{cert.organization || '—'}</Typography>
                    <Typography variant="caption" sx={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{cert.issue_date ? `Issued ${formatDetailDate(cert.issue_date)}` : cert.expiry_date ? `Expires ${formatDetailDate(cert.expiry_date)}` : ''}</Typography>
                  </Box>
                ))}
                {certifications.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.certifications ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('certifications')} sx={seeMoreBtnSx}>
                    {expanded.certifications ? 'See less' : `See more (${certifications.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No certifications</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Trainings</Typography></Box>
          <Box sx={sectionBodySx}>
            {trainings.length > 0 ? (
              <>
                {(expanded.trainings ? trainings : trainings.slice(0, INITIAL_VISIBLE)).map((training, i) => (
                  <Box key={i} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{training.name || '—'}</Typography>
                    <Typography variant="caption" sx={{ fontSize: '11px', color: '#475569', display: 'block' }}>{training.organization || '—'}</Typography>
                    <Typography variant="caption" sx={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                      {(() => { const range = [formatDetailDate(training.start_date), formatDetailDate(training.end_date)].filter(Boolean).join(' – ') || ''; const duration = getDetailDuration(training.start_date, training.end_date); return duration ? `${range} · ${duration}` : range; })()}
                    </Typography>
                    {training.description && (
                      <Typography variant="caption" sx={{ fontSize: '11px', color: '#475569', display: 'block', mt: 0.25, lineHeight: 1.4 }}>
                        {training.description}
                      </Typography>
                    )}
                  </Box>
                ))}
                {trainings.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.trainings ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('trainings')} sx={seeMoreBtnSx}>
                    {expanded.trainings ? 'See less' : `See more (${trainings.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No trainings</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Projects</Typography></Box>
          <Box sx={sectionBodySx}>
            {projects.length > 0 ? (
              <>
                {(expanded.projects ? projects : projects.slice(0, INITIAL_VISIBLE)).map((project, i) => (
                  <Box key={project.id ?? i} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.5, '&:last-of-type': { mb: 0 } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>{project.title || '—'}</Typography>
                    {project.description && (
                      <Typography variant="caption" sx={{ fontSize: '11px', color: '#475569', display: 'block', mt: 0.25, lineHeight: 1.4 }}>
                        {project.description}
                      </Typography>
                    )}
                    {project.responsibilities && (
                      <Typography variant="caption" sx={{ fontSize: '11px', color: '#64748b', display: 'block', mt: 0.25, lineHeight: 1.4 }}>
                        <strong>Responsibilities:</strong> {project.responsibilities}
                      </Typography>
                    )}
                    {safeArray(project.skills).length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {safeArray(project.skills).map((skill, si) => (
                          <Chip key={si} label={typeof skill === 'string' ? skill : skill.name || String(skill)} size="small" variant="outlined" sx={{ borderColor: '#3e6a9f', color: '#3e6a9f', fontSize: '10px', height: '20px', '& .MuiChip-label': { px: 0.75 } }} />
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
                {projects.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.projects ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('projects')} sx={seeMoreBtnSx}>
                    {expanded.projects ? 'See less' : `See more (${projects.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No projects</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Social Links</Typography></Box>
          <Box sx={sectionBodySx}>
            {socialLinks.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {socialLinks.map((social, i) => {
                  const url = social.url || social.links || '';
                  return (
                    <Box key={social.id ?? i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {socialIconFor(social.name)}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '9px', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: 0.1 }}>{social.name || 'Link'}</Typography>
                        {url ? (
                          <Typography
                            component="a"
                            href={/^https?:\/\//i.test(url) ? url : `https://${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="body2"
                            sx={{ fontWeight: 600, fontSize: '12px', color: '#3e6a9f', wordBreak: 'break-word', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {url}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>—</Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No social links</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Extra Curricular Activities</Typography></Box>
          <Box sx={sectionBodySx}>
            {extraCurricularActivities.length > 0 ? (
              <>
                {(expanded.extraCurricularActivities ? extraCurricularActivities : extraCurricularActivities.slice(0, INITIAL_VISIBLE)).map((activity, i) => (
                  <Box key={activity.id ?? i} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.25 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.4 }}>{activity.description || '—'}</Typography>
                  </Box>
                ))}
                {extraCurricularActivities.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.extraCurricularActivities ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('extraCurricularActivities')} sx={seeMoreBtnSx}>
                    {expanded.extraCurricularActivities ? 'See less' : `See more (${extraCurricularActivities.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No extra curricular activities</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>References</Typography></Box>
          <Box sx={sectionBodySx}>
            {references.length > 0 ? (
              <>
                {(expanded.references ? references : references.slice(0, INITIAL_VISIBLE)).map((reference, i) => (
                  <Box key={reference.id ?? i} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.25 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.4 }}>{reference.description || '—'}</Typography>
                  </Box>
                ))}
                {references.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.references ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('references')} sx={seeMoreBtnSx}>
                    {expanded.references ? 'See less' : `See more (${references.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No references</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Publications</Typography></Box>
          <Box sx={sectionBodySx}>
            {publications.length > 0 ? (
              <>
                {(expanded.publications ? publications : publications.slice(0, INITIAL_VISIBLE)).map((publication, i) => (
                  <Box key={publication.id ?? i} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.25 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.4 }}>{publication.description || '—'}</Typography>
                  </Box>
                ))}
                {publications.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.publications ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('publications')} sx={seeMoreBtnSx}>
                    {expanded.publications ? 'See less' : `See more (${publications.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No publications</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Volunteer Work</Typography></Box>
          <Box sx={sectionBodySx}>
            {volunteerWorks.length > 0 ? (
              <>
                {(expanded.volunteerWorks ? volunteerWorks : volunteerWorks.slice(0, INITIAL_VISIBLE)).map((work, i) => (
                  <Box key={work.id ?? i} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.25 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.4 }}>{work.description || '—'}</Typography>
                  </Box>
                ))}
                {volunteerWorks.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.volunteerWorks ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('volunteerWorks')} sx={seeMoreBtnSx}>
                    {expanded.volunteerWorks ? 'See less' : `See more (${volunteerWorks.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No volunteer work</Typography>}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Box sx={sectionCardSx}>
          <Box sx={sectionHeaderSx}><Typography component="h3" sx={sectionTitleSx}>Achievements</Typography></Box>
          <Box sx={sectionBodySx}>
            {achievements.length > 0 ? (
              <>
                {(expanded.achievements ? achievements : achievements.slice(0, INITIAL_VISIBLE)).map((achievement, i) => (
                  <Box key={achievement.id ?? i} sx={{ pl: 1.5, borderLeft: '2px solid #e2e8f0', mb: 1.25 }}>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.4 }}>{achievement.description || '—'}</Typography>
                  </Box>
                ))}
                {achievements.length > INITIAL_VISIBLE && (
                  <Button size="small" startIcon={expanded.achievements ? <ExpandLess size="1em" className="app-icon" /> : <ExpandMore size="1em" className="app-icon" />} onClick={() => onToggleSection('achievements')} sx={seeMoreBtnSx}>
                    {expanded.achievements ? 'See less' : `See more (${achievements.length - INITIAL_VISIBLE} more)`}
                  </Button>
                )}
              </>
            ) : <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>No achievements</Typography>}
          </Box>
        </Box>
      </Grid>

      {(() => {
        const allFiles = safeArray(details?.all_files).filter(Boolean);
        const singleFile = details?.file;
        const seen = new Set(allFiles);
        const files = [...allFiles, ...(singleFile && !seen.has(singleFile) ? [singleFile] : [])];
        if (files.length === 0) return null;
        return (
          <Grid item xs={12}>
            <Box sx={sectionCardSx}>
              <Box sx={sectionHeaderSx}>
                <Typography component="h3" sx={sectionTitleSx}>Resume Files</Typography>
              </Box>
              <Box sx={{ ...sectionBodySx, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {files.map((url, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      bgcolor: '#fafbfc',
                      minWidth: 220,
                      maxWidth: 340,
                      flex: '1 1 220px',
                    }}
                  >
                    <Box sx={{ color: '#dc2626', fontSize: 28, lineHeight: 1, flexShrink: 0 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                      </svg>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>
                        Resume {i + 1}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>PDF Document</Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const w = window.open(url, '_blank', 'noopener,noreferrer');
                        if (w) w.opener = null;
                      }}
                      sx={{ borderColor: '#3e6a9f', color: '#3e6a9f', fontSize: '10px', fontWeight: 600, px: 1, py: 0.25, minWidth: 'auto', flexShrink: 0, textTransform: 'none', borderRadius: '6px', '&:hover': { bgcolor: '#3e6a9f', color: '#fff' } }}
                    >
                      View
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        );
      })()}

      {showAdditionalFields && (
        <DetailApiExtraFields details={details} formatDetailDate={formatDetailDate} />
      )}
    </Grid>
  );
}

/**
 * Renders remaining top-level fields from the detail API as simple key/value rows (excluding large arrays handled above).
 */
function DetailApiExtraFields({ details, formatDetailDate }) {
  if (!details || typeof details !== 'object') return null;

  const skip = new Set([
    'educations',
    'work_experiences',
    'skills',
    'designations',
    'languages',
    'universities',
    'cities',
    'countries',
    'companies',
    'certifications',
    'trainings',
    'summary',
    'projects',
    'social_links',
    'extra_curricular_activities',
    'references',
    'publications',
    'volunteer_works',
    'achievements',
    'name',
    'email',
    'phone',
    'gender',
    'experience',
    'created_at',
    'file',
    'all_files',
    'id',
  ]);

  const entries = Object.entries(details).filter(([k, v]) => {
    if (skip.has(k)) return false;
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false;
    return true;
  });

  if (entries.length === 0) return null;

  const formatValue = (key, val) => {
    if (Array.isArray(val)) {
      return val.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
    }
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    if (String(key).toLowerCase().includes('date') || String(key).endsWith('_at')) {
      const asDate = formatDetailDate(val);
      return asDate || String(val);
    }
    return String(val);
  };

  return (
    <Grid item xs={12}>
      <Box sx={{ ...sectionCardSx }}>
        <Box sx={sectionHeaderSx}>
          <Typography component="h3" sx={sectionTitleSx}>Additional fields</Typography>
        </Box>
        <Box sx={{ ...sectionBodySx, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {entries.map(([key, val]) => (
            <Box key={key} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, borderBottom: '1px solid #f1f5f9', pb: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', minWidth: '140px', textTransform: 'capitalize' }}>
                {key.replace(/_/g, ' ')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', flex: 1, wordBreak: 'break-word', fontSize: '12px' }}>
                {formatValue(key, val)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Grid>
  );
}
