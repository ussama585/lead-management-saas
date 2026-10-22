import React from 'react';
import formatDateUniversal, { getDurationBetweenDates } from '../../shared/utils/formatDate.js';
import { buildResumeHeaderAddressOnly, getCitiesAndCountriesForHeader } from '../utils/resumeHeaderLocation.js';
import './profile-cv-print.css';

const safeArray = (v) => (Array.isArray(v) ? v : []);

const formatDesignationExperience = (experience) => {
  if (experience === null || typeof experience === 'undefined') return '';
  const match = String(experience).match(/\d+/);
  if (!match) return String(experience);
  const months = parseInt(match[0], 10);
  if (!Number.isFinite(months) || months <= 0) return String(experience);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (remainder === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${remainder} month${remainder === 1 ? '' : 's'}`;
};

const formatMonthYearLong = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatWorkRangeTemplate = (startStr, endStr, isWorking) => {
  const a = formatMonthYearLong(startStr);
  const b = isWorking ? 'Present' : formatMonthYearLong(endStr);
  if (a && b) return `${a} to ${b}`;
  if (a && isWorking) return `${a} to Present`;
  return a || b || '';
};

const formatEducationYearsTemplate = (startStr, endStr, isStudying) => {
  if (isStudying) {
    const ys = startStr ? new Date(startStr).getFullYear() : '';
    return ys ? `${ys} to Present` : 'Present';
  }
  const ys = startStr ? new Date(startStr).getFullYear() : '';
  const ye = endStr ? new Date(endStr).getFullYear() : '';
  if (ys && ye) return `${ys} to ${ye}`;
  if (ys) return String(ys);
  return ye ? String(ye) : '';
};

/** One line per designation, same pattern as skills: "Title (X years)" */
function designationLineAsSkillStyle(designation) {
  if (!designation) return '';
  if (typeof designation === 'string') return designation;
  const name = designation.title || designation.name || designation.designation || '';
  if (!name) return '';
  const exp =
    designation.experience != null && designation.experience !== ''
      ? ` (${formatDesignationExperience(designation.experience)})`
      : '';
  return `${name}${exp}`;
}

/** Section: muted title, thin rule, then body (matches PDF). Uses a div instead of hr to avoid thick bars in print/preview. */
function CvSection({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionHeading}>{title}</h2>
      <div style={styles.sectionRule} role="presentation" aria-hidden />
      <div style={styles.sectionBody}>{children}</div>
    </section>
  );
}

/** A4-friendly layout for profile CV preview / print (aligned with `profileCvPdf.js`). */
function ProfileCvPrintView({ details }) {
  const d = details || {};
  const educations = safeArray(d.educations);
  const workExperiences = safeArray(d.work_experiences);
  const skills = safeArray(d.skills);
  const designations = safeArray(d.designations);
  const languages = safeArray(d.languages);
  const certifications = safeArray(d.certifications);
  const trainings = safeArray(d.trainings);

  const formatDetailDate = (dateStr) => (dateStr ? formatDateUniversal(dateStr) : '');
  const getDetailDuration = (startStr, endStrOrNull) => getDurationBetweenDates(startStr, endStrOrNull);

  const genderDisplay = (() => {
    const g = d.gender;
    if (!g) return '';
    const lower = String(g).toLowerCase();
    if (lower === 'male') return 'Male';
    if (lower === 'female') return 'Female';
    return String(g).charAt(0).toUpperCase() + String(g).slice(1);
  })();

  const rawAddress = buildResumeHeaderAddressOnly(d);
  const { cities: cityParts, countries: countryParts } = getCitiesAndCountriesForHeader(d);

  return (
    <div className="profile-cv-print-root" style={styles.root}>
      <div style={styles.bodyContent}>
        <header style={styles.header}>
          <h1 style={styles.name}>{d.name || 'Candidate'}</h1>
          {rawAddress ? <p style={styles.addressLine}>{rawAddress}</p> : null}
          {(d.email || d.phone) && (
            <div style={styles.contactRow} aria-label="Contact">
              {d.email ? (
                <>
                  <a href={`mailto:${d.email}`} style={styles.emailLink}>
                    {d.email}
                  </a>
                  {d.phone ? <span style={styles.contactSep}>·</span> : null}
                </>
              ) : null}
              {d.phone ? <span style={styles.phoneInline}>{d.phone}</span> : null}
            </div>
          )}
          {genderDisplay || (d.experience != null && d.experience !== '') ? (
            <p style={styles.metaContact}>
              {[genderDisplay ? `Gender: ${genderDisplay}` : '', d.experience != null && d.experience !== '' ? `Experience: ${formatDesignationExperience(d.experience)}` : '']
                .filter(Boolean)
                .join('  ·  ')}
            </p>
          ) : null}
          {cityParts.length > 0 ? (
            <p style={styles.metaContact}>Cities: {cityParts.join(', ')}</p>
          ) : null}
          {countryParts.length > 0 ? (
            <p style={styles.metaContact}>Countries: {countryParts.join(', ')}</p>
          ) : null}
        </header>

        {workExperiences.length > 0 ? (
          <CvSection title="Work Experience">
            {workExperiences.map((exp, i) => {
              const workRange = formatWorkRangeTemplate(exp.start_date, exp.end_date, !!exp.is_working);
              return (
                <div key={i} style={styles.entryBlock}>
                  <p style={styles.entryTitle}>{exp.designation || exp.title || exp.company || '—'}</p>
                  {exp.designation || exp.title ? (
                    [exp.company, exp.location || exp.city].filter(Boolean).length > 0 ? (
                      <p style={styles.entryMeta}>{[exp.company, exp.location || exp.city].filter(Boolean).join('-')}</p>
                    ) : null
                  ) : [exp.location || exp.city].filter(Boolean).length > 0 ? (
                    <p style={styles.entryMeta}>{[exp.location || exp.city].filter(Boolean).join('-')}</p>
                  ) : null}
                  {workRange ? <p style={styles.entryMeta}>{workRange}</p> : null}
                  {exp.description ? <p style={styles.bodyBlock}>{exp.description}</p> : null}
                </div>
              );
            })}
          </CvSection>
        ) : null}

        {educations.length > 0 ? (
          <CvSection title="Education">
            {educations.map((education, index) => {
              const boldLine = education.degree
                ? education.category
                  ? `${education.category} in ${education.degree}`
                  : education.degree
                : education.category || '—';
              const instLoc = [education.university, education.location].filter(Boolean).join(' - ');
              const eduYears = formatEducationYearsTemplate(
                education.start_date,
                education.end_date,
                !!education.is_studying
              );
              return (
                <div key={index} style={styles.entryBlock}>
                  <p style={styles.entryTitle}>{boldLine}</p>
                  {instLoc ? <p style={styles.entryMeta}>{instLoc}</p> : null}
                  {eduYears ? <p style={styles.entryMeta}>{eduYears}</p> : null}
                </div>
              );
            })}
          </CvSection>
        ) : null}

        {designations.length > 0 ? (
          <CvSection title="Designations">
            <ul style={styles.bulletListCompact}>
              {designations.map((designation, index) => {
                if (!designation) return null;
                const line = designationLineAsSkillStyle(designation);
                return line ? (
                  <li key={typeof designation === 'object' && designation?.id != null ? `des-${designation.id}` : `des-${index}`} style={styles.bulletItemCompact}>
                    {line}
                  </li>
                ) : null;
              })}
            </ul>
          </CvSection>
        ) : null}

        {skills.length > 0 ? (
          <CvSection title="Skills">
            <ul style={styles.bulletListCompact}>
              {skills.map((skill, i) => {
                const skillKey =
                  typeof skill === 'object' && skill != null && skill.id != null ? `skill-${skill.id}` : `skill-${i}`;
                if (typeof skill === 'string') {
                  return (
                    <li key={skillKey} style={styles.bulletItemCompact}>
                      {skill}
                    </li>
                  );
                }
                const name = skill.title || skill.name || skill.cat || String(skill);
                const expText = skill.experience ? formatDesignationExperience(skill.experience) : '';
                return (
                  <li key={skillKey} style={styles.bulletItemCompact}>
                    {name}
                    {expText ? ` (${expText})` : ''}
                  </li>
                );
              })}
            </ul>
          </CvSection>
        ) : null}

        {languages.length > 0 ? (
          <CvSection title="Languages">
            <ul style={styles.bulletListCompact}>
              {languages.map((lang, i) => {
                let label = '';
                if (typeof lang === 'string') label = lang;
                else {
                  const name = lang.title || lang.name || '';
                  const prof = lang.proficiency || lang.level;
                  label = name && prof ? `${name} - ${prof}` : name || lang.title || '';
                }
                return label ? (
                  <li key={i} style={styles.bulletItemCompact}>
                    {label}
                  </li>
                ) : null;
              })}
            </ul>
          </CvSection>
        ) : null}

        {certifications.length > 0 ? (
          <CvSection title="Certifications">
            {certifications.map((cert, i) => (
              <div key={i} style={styles.entryBlock}>
                <p style={styles.entryTitle}>{cert.name || '—'}</p>
                <p style={styles.entryMeta}>{cert.organization || ''}</p>
                <p style={styles.entrySmall}>
                  {cert.issue_date ? `Issued ${formatDetailDate(cert.issue_date)}` : ''}
                  {cert.expiry_date ? ` · Expires ${formatDetailDate(cert.expiry_date)}` : ''}
                </p>
              </div>
            ))}
          </CvSection>
        ) : null}

        {trainings.length > 0 ? (
          <CvSection title="Trainings">
            {trainings.map((training, i) => (
              <div key={i} style={styles.entryBlock}>
                <p style={styles.entryTitle}>{training.name || '—'}</p>
                <p style={styles.entryMeta}>{training.organization || ''}</p>
                <p style={styles.entrySmall}>
                  {(() => {
                    const range = [formatDetailDate(training.start_date), formatDetailDate(training.end_date)]
                      .filter(Boolean)
                      .join(' – ');
                    const duration = getDetailDuration(training.start_date, training.end_date);
                    return duration ? `${range} · ${duration}` : range;
                  })()}
                </p>
              </div>
            ))}
          </CvSection>
        ) : null}

        <footer style={styles.footer}>
          <div style={styles.footerText}>CV generated by Search O Pal</div>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  root: {
    position: 'relative',
    width: '794px',
    minHeight: '200px',
    padding: '28px 32px 32px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    lineHeight: 1.35,
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  bodyContent: {
    position: 'relative',
    zIndex: 1,
  },
  header: {
    marginBottom: '18px',
  },
  name: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#000000',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  addressLine: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#000000',
    fontWeight: 400,
    lineHeight: 1.35,
  },
  contactRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px 10px',
    marginTop: '6px',
    fontSize: '13px',
    lineHeight: 1.35,
  },
  contactSep: {
    color: '#757575',
    userSelect: 'none',
    fontWeight: 400,
  },
  phoneInline: {
    color: '#000000',
  },
  emailLink: {
    color: '#0000ee',
    textDecoration: 'underline',
  },
  metaContact: {
    margin: '6px 0 0 0',
    fontSize: '11px',
    color: '#666666',
    lineHeight: 1.35,
  },
  section: {
    marginBottom: '16px',
    color: '#000000',
  },
  sectionHeading: {
    margin: 0,
    padding: 0,
    marginBottom: 0,
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.15,
    color: '#757575',
    border: 'none',
    background: 'transparent',
  },
  /** 1px hairline (avoids native hr rendering as a thick band in some browsers) */
  sectionRule: {
    display: 'block',
    width: '100%',
    height: '1px',
    margin: '2px 0 14px 0',
    padding: 0,
    border: 'none',
    backgroundColor: '#e0e0e0',
    flexShrink: 0,
  },
  sectionBody: {
    margin: 0,
    padding: 0,
    fontSize: '13px',
    color: '#000000',
  },
  entryBlock: {
    marginBottom: '10px',
  },
  entryTitle: {
    margin: 0,
    fontWeight: 700,
    fontSize: '13px',
    color: '#000000',
  },
  entryMeta: {
    margin: '3px 0 0 0',
    fontSize: '12px',
    color: '#666666',
  },
  entrySmall: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: '#666666',
  },
  bodyBlock: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: '#000000',
    whiteSpace: 'pre-wrap',
  },
  bulletListCompact: {
    margin: 0,
    paddingLeft: '18px',
    color: '#000000',
    fontSize: '13px',
    lineHeight: 1.35,
  },
  /** Explicit size/color so Modal/global CSS cannot shrink or gray the first list item */
  bulletItemCompact: {
    marginBottom: '2px',
    fontSize: '13px',
    lineHeight: 1.35,
    paddingBottom: 0,
    color: '#000000',
    fontWeight: 400,
  },
  footer: {
    marginTop: '18px',
    paddingTop: '8px',
    borderTop: '1px solid #e0e0e0',
    fontSize: '9px',
    color: '#94a3b8',
  },
  footerText: {
    textAlign: 'center',
  },
};

export default ProfileCvPrintView;
