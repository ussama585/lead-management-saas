import {
  getResumeProfileDetail,
  getProfileResumeDetail,
  getCandidateProfileDetails,
  resolveCandidateDetailsId,
} from '../../shared/services/resume.js';
import { buildResumeHeaderAddressOnly, getCitiesAndCountriesForHeader } from './resumeHeaderLocation.js';
import { registerPdfInter } from './pdf-fonts.js';

export { buildResumeHeaderAddressOnly, getCitiesAndCountriesForHeader } from './resumeHeaderLocation.js';

export const isProfileSourcedRow = (row) => String(row?.source_type ?? '').toLowerCase().trim() === 'profile';

/** Full profile payload already loaded (e.g. candidate-profile-details response). */
export const hasProfileCvPayload = (row) =>
  !!row &&
  (Array.isArray(row.educations) ||
    Array.isArray(row.work_experiences) ||
    Array.isArray(row.skills));

/** CV Pool: system-generated (blue) CV — profile row, candidate details id, or loaded profile payload. */
export const canPoolGeneratedCv = (row) => {
  if (!row) return false;
  if (hasProfileCvPayload(row)) return true;
  if (isProfileSourcedRow(row)) return true;
  const candidateId = resolveCandidateDetailsId(row);
  if (candidateId != null && candidateId !== '') return true;
  if (row.id != null && row.id !== '') return true;
  return false;
};

const RESERVED_WIN =
  /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;

function stripIllegalFileNameChars(str) {
  const forbidden = new Set('<>:"/\\|?*');
  return str
    .split('')
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      if (c < 32 || c === 127) return false;
      return !forbidden.has(ch);
    })
    .join('');
}

/**
 * Safe download basename: keeps real name (spaces, letters, most punctuation);
 * only strips characters illegal in Windows/macOS filenames.
 */
export function sanitizeCandidateDownloadName(name, fallback = 'Candidate') {
  let s = String(name ?? '').trim();
  if (!s) s = String(fallback ?? '').trim();
  if (!s) return 'Candidate';
  s = stripIllegalFileNameChars(s).replace(/\s+/g, ' ').trim();
  s = s.replace(/^\.+/, '').replace(/\.+$/, '').trim();
  if (!s) return 'Candidate';
  if (RESERVED_WIN.test(s)) {
    s = `${s}_`;
  }
  return s.slice(0, 180);
}

/**
 * Load full profile detail for PDF generation (list rows are often partial).
 */
/**
 * Full candidate payload for jsPDF generation: profile-sourced uses profile-detail API;
 * resume-sourced (and other non-profile) uses standard resume detail API.
 */
export async function resolveProfileDetailForCv(row) {
  if (!row?.id && !resolveCandidateDetailsId(row)) {
    throw new Error('Missing candidate id');
  }
  if (hasProfileCvPayload(row)) {
    return row;
  }
  if (isProfileSourcedRow(row)) {
    const linked = row.resume_id;
    if (linked != null && linked !== '') {
      return getProfileResumeDetail(row.id, linked);
    }
    return getResumeProfileDetail(row.id);
  }
  const candidateDetailsId = resolveCandidateDetailsId(row) ?? row.id;
  if (candidateDetailsId != null && candidateDetailsId !== '') {
    return getCandidateProfileDetails(candidateDetailsId);
  }
  throw new Error('Missing candidate_details_id');
}

const safeArray = (v) => (Array.isArray(v) ? v : []);

const toLabel = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    return v.title || v.name || v.designation || v.university || v.company || '';
  }
  return '';
};

const formatDate = (rawDate) => {
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return '';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const formatExperience = (value) => {
  if (value == null || value === '') return '';
  const m = Number(String(value).match(/\d+/)?.[0]);
  if (!Number.isFinite(m)) return String(value);
  if (m < 12) return `${m} month${m === 1 ? '' : 's'}`;
  const years = Math.floor(m / 12);
  const rem = m % 12;
  if (rem === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${rem} month${rem === 1 ? '' : 's'}`;
};

const formatGender = (v) => {
  if (!v) return '';
  const s = String(v).toLowerCase();
  if (s === 'male') return 'Male';
  if (s === 'female') return 'Female';
  return String(v);
};

const formatMonthYearLong = (rawDate) => {
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return '';
  const monthNames = [
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
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

const formatWorkRangeTemplate = (start, end, isWorking) => {
  const a = formatMonthYearLong(start);
  const b = isWorking ? 'Present' : formatMonthYearLong(end);
  if (a && b) return `${a} to ${b}`;
  if (a && isWorking) return `${a} to Present`;
  return a || b || '';
};

const formatEducationRangeTemplate = (start, end, isStudying) => {
  if (isStudying) {
    const ys = start ? new Date(start).getFullYear() : '';
    return ys ? `${ys} to Present` : 'Present';
  }
  const ys = start ? new Date(start).getFullYear() : '';
  const ye = end ? new Date(end).getFullYear() : '';
  if (ys && ye) return `${ys} to ${ye}`;
  if (ys) return String(ys);
  return ye ? String(ye) : '';
};

const formatDateRange = (start, end, isCurrent = false) => {
  const a = formatDate(start);
  const b = isCurrent ? 'Present' : formatDate(end);
  if (a && b) return `${a} – ${b}`;
  if (a) return a;
  if (b) return b;
  return '';
};

/** Minimal resume palette: black body, #757575 headings, #e0e0e0 rules, link blue. */
const PDF = {
  headingGray: [117, 117, 117],
  bodyBlack: [0, 0, 0],
  metaGray: [102, 102, 102],
  linkBlue: [0, 0, 238],
  rule: [224, 224, 224],
};

/** Generates CV PDF directly using jsPDF (matches ProfileCvPrintView template). */
export async function generateProfileCvPdfBlob(details) {
  const d = details || {};
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF('p', 'mm', 'a4');
  await registerPdfInter(pdf);
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginX = 14;
  const top = 16;
  const bottomReserve = 14;
  const maxLineW = pageW - marginX * 2;
  let y = top;

  const drawFooter = () => {
    pdf.setFont('Inter', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 130, 150);
    pdf.text('CV generated by Search O Pal', pageW - marginX, pageH - 6, { align: 'right' });
  };

  const ensureSpace = (lines = 1, lineH = 5) => {
    if (y + lines * lineH > pageH - bottomReserve) {
      drawFooter();
      pdf.addPage();
      y = top;
    }
  };

  const writeText = (text, opts = {}) => {
    const {
      bold = false,
      size = 11,
      color = PDF.bodyBlack,
      lineH = 5,
      indent = 0,
      after = 1.5,
    } = opts;
    const content = String(text ?? '').trim();
    if (!content) return;
    pdf.setFont('Inter', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
    const lines = pdf.splitTextToSize(content, maxLineW - indent);
    ensureSpace(lines.length, lineH);
    /* drawFooter() inside ensureSpace leaves font 8pt + gray — re-apply before drawing body text */
    pdf.setFont('Inter', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(lines, marginX + indent, y);
    y += lines.length * lineH + after;
  };

  /** Gray section title + thin rule (aligned with ProfileCvPrintView CvSection). */
  const writeSectionHeading = (title) => {
    const content = String(title ?? '').trim();
    if (!content) return;
    y += 2;
    ensureSpace(5, 4);
    pdf.setFont('Inter', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(PDF.headingGray[0], PDF.headingGray[1], PDF.headingGray[2]);
    pdf.text(content, marginX, y);
    y += 1.9;
    pdf.setDrawColor(PDF.rule[0], PDF.rule[1], PDF.rule[2]);
    pdf.setLineWidth(0.3);
    pdf.line(marginX, y, pageW - marginX, y);
    y += 5;
  };

  const writeDescriptionLines = (desc) => {
    const text = String(desc ?? '').trim();
    if (!text) return;
    const parts = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    parts.forEach((line) => {
      writeText(line, { size: 10, color: PDF.bodyBlack, lineH: 4.8, indent: 0, after: 1.1 });
    });
  };

  /* ----- Header (compact: name, address, email / phone, meta) ----- */
  writeText(d.name || 'Candidate', { bold: true, size: 17, color: PDF.bodyBlack, lineH: 6.5, after: 1.2 });
  const addr = buildResumeHeaderAddressOnly(d);
  if (addr) writeText(addr, { size: 10, color: PDF.bodyBlack, lineH: 4.2, after: 1.2 });

  if (d.email) {
    ensureSpace(1, 4.2);
    const email = String(d.email).trim();
    pdf.setFont('Inter', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(PDF.linkBlue[0], PDF.linkBlue[1], PDF.linkBlue[2]);
    if (typeof pdf.textWithLink === 'function') {
      pdf.textWithLink(email, marginX, y, { url: `mailto:${email}` });
    } else {
      pdf.text(email, marginX, y);
    }
    y += 4.5 + 0.8;
    pdf.setTextColor(PDF.bodyBlack[0], PDF.bodyBlack[1], PDF.bodyBlack[2]);
  }
  if (d.phone) {
    writeText(String(d.phone).trim(), { size: 10, color: PDF.bodyBlack, lineH: 4.2, after: 1.2 });
  }

  const extraContact = [d.gender ? `Gender: ${formatGender(d.gender)}` : '', d.experience != null ? `Experience: ${formatExperience(d.experience)}` : '']
    .filter(Boolean)
    .join('  ·  ');
  if (extraContact) {
    writeText(extraContact, { size: 9, color: PDF.metaGray, lineH: 4, after: 1.2 });
  }

  const { cities: cityParts, countries: countryParts } = getCitiesAndCountriesForHeader(d);
  if (cityParts.length) {
    writeText(`Cities: ${cityParts.join(', ')}`, { size: 9, color: PDF.metaGray, lineH: 4, after: 1.2 });
  }
  if (countryParts.length) {
    writeText(`Countries: ${countryParts.join(', ')}`, { size: 9, color: PDF.metaGray, lineH: 4, after: 2 });
  }

  y += 0.5;

  /* ----- Work Experience ----- */
  const workList = safeArray(d.work_experiences);
  if (workList.length) {
    writeSectionHeading('Work Experience');
    workList.forEach((w, idx) => {
      const jobTitle = w?.designation || w?.title || '';
      if (jobTitle) writeText(jobTitle, { bold: true, size: 11, color: PDF.bodyBlack, after: 1.4 });
      const companyLoc = [w?.company, w?.location || w?.city].filter(Boolean).join('-');
      if (companyLoc) writeText(companyLoc, { size: 10, color: PDF.metaGray, after: 1.2 });
      const dr = formatWorkRangeTemplate(w?.start_date, w?.end_date, !!w?.is_working);
      if (dr) writeText(dr, { size: 10, color: PDF.metaGray, after: w?.description ? 1.8 : 2.5 });
      if (w?.description) writeDescriptionLines(w.description);
      if (idx < workList.length - 1) y += 2;
    });
  }

  /* ----- Education ----- */
  const eduList = safeArray(d.educations);
  if (eduList.length) {
    writeSectionHeading('Education');
    eduList.forEach((e, idx) => {
      const boldLine = e?.degree
        ? e?.category
          ? `${e.category} in ${e.degree}`
          : e.degree
        : e?.category || '—';
      writeText(boldLine, { bold: true, size: 11, color: PDF.bodyBlack, after: 1.4 });
      const instLoc = [e?.university, e?.location].filter(Boolean).join(' - ');
      if (instLoc) writeText(instLoc, { size: 10, color: PDF.metaGray, after: 1.2 });
      const er = formatEducationRangeTemplate(e?.start_date, e?.end_date, !!e?.is_studying);
      if (er) writeText(er, { size: 10, color: PDF.metaGray, after: 2.5 });
      if (idx < eduList.length - 1) y += 2;
    });
  }

  /* ----- Designations (same bullet style as skills) ----- */
  const desList = safeArray(d.designations);
  if (desList.length) {
    writeSectionHeading('Designations');
    desList.forEach((des) => {
      if (typeof des === 'string') {
        writeText(`• ${des}`, { size: 10, color: PDF.bodyBlack, indent: 3, lineH: 4.5, after: 0.85 });
        return;
      }
      const title = des?.title || des?.name || des?.designation || '';
      if (!title) return;
      const suffix = des?.experience != null && des?.experience !== '' ? ` (${formatExperience(des.experience)})` : '';
      writeText(`• ${title}${suffix}`, { size: 10, color: PDF.bodyBlack, indent: 3, lineH: 4.5, after: 0.85 });
    });
  }

  /* ----- Skills (bulleted) ----- */
  const skills = safeArray(d.skills);
  if (skills.length) {
    writeSectionHeading('Skills');
    skills.forEach((s) => {
      if (typeof s === 'string') {
        writeText(`• ${s}`, { size: 10, color: PDF.bodyBlack, indent: 3, lineH: 4.5, after: 0.85 });
        return;
      }
      const name = s?.title || s?.name || s?.cat || '';
      if (!name) return;
      const suffix = s?.experience != null && s?.experience !== '' ? ` (${formatExperience(s.experience)})` : '';
      writeText(`• ${name}${suffix}`, { size: 10, color: PDF.bodyBlack, indent: 3, lineH: 4.5, after: 0.85 });
    });
  }

  /* ----- Languages (bulleted: Language - Level) ----- */
  const langs = safeArray(d.languages);
  if (langs.length) {
    writeSectionHeading('Languages');
    langs.forEach((lang) => {
      let line = '';
      if (typeof lang === 'string') line = lang;
      else {
        const name = lang?.title || lang?.name || '';
        const prof = lang?.proficiency || lang?.level;
        line = name && prof ? `${name} - ${prof}` : name || toLabel(lang);
      }
      if (!line) return;
      writeText(`• ${line}`, { size: 10, color: PDF.bodyBlack, indent: 3, lineH: 4.5, after: 0.85 });
    });
  }

  /* ----- Certifications ----- */
  const certs = safeArray(d.certifications);
  if (certs.length) {
    writeSectionHeading('Certifications');
    certs.forEach((c, idx) => {
      writeText(c?.name || '—', { bold: true, size: 11, color: PDF.bodyBlack, after: 1.2 });
      if (c?.organization) writeText(c.organization, { size: 10, color: PDF.metaGray, after: 1.2 });
      const meta = [c?.issue_date ? `Issued ${formatDate(c.issue_date)}` : '', c?.expiry_date ? `Expires ${formatDate(c.expiry_date)}` : '']
        .filter(Boolean)
        .join(' · ');
      if (meta) writeText(meta, { size: 10, color: PDF.metaGray, after: 2 });
      if (idx < certs.length - 1) y += 2;
    });
  }

  /* ----- Trainings ----- */
  const trains = safeArray(d.trainings);
  if (trains.length) {
    writeSectionHeading('Trainings');
    trains.forEach((t, idx) => {
      writeText(t?.name || '—', { bold: true, size: 11, color: PDF.bodyBlack, after: 1.2 });
      if (t?.organization) writeText(t.organization, { size: 10, color: PDF.metaGray, after: 1.2 });
      const range = formatDateRange(t?.start_date, t?.end_date);
      if (range) writeText(range, { size: 10, color: PDF.metaGray, after: 2 });
      if (idx < trains.length - 1) y += 2;
    });
  }

  drawFooter();
  return pdf.output('blob');
}
