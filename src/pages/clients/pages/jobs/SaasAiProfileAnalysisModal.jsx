import React from 'react';
import { Modal, Progress, Spin, Alert } from 'antd';
import { Clock as ClockCircleOutlined, LoaderCircle as LoadingOutlined } from 'lucide-react';
import ProfileImagePlaceholder from '../../../../assets/images/user-card-icons/user-placeholder.svg';

const BRAND = '#3E6A9F';

const getScoreColor = (score) => {
  const value = Number(score);
  if (Number.isNaN(value)) return '#8c8c8c';
  if (value < 50) return '#ff4d4f';
  if (value < 75) return '#faad14';
  return '#52c41a';
};

const SectionBadge = ({ children }) => (
  <span
    style={{
      display: 'inline-block',
      background: BRAND,
      color: '#fff',
      fontSize: 12,
      fontWeight: 600,
      padding: '4px 12px',
      borderRadius: 16,
      marginBottom: 12,
    }}
  >
    {children}
  </span>
);

const PanelCard = ({ children, style }) => (
  <div
    style={{
      border: '1px solid #e8e8e8',
      borderRadius: 12,
      padding: 8,
      background: '#fff',
      height: '100%',
      ...style,
    }}
  >
    {children}
  </div>
);

const MatchScoreHeader = ({ label, score }) => {
  const color = getScoreColor(score);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <SectionBadge>{label}</SectionBadge>
      <span style={{ color, fontWeight: 700, fontSize: 14 }}>{score}%</span>
    </div>
  );
};

const MatchPairRow = ({ left, right }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
    <PanelCard>{left}</PanelCard>
    <PanelCard>{right}</PanelCard>
  </div>
);

const FullSection = ({ title, children }) => (
  <PanelCard style={{ marginBottom: 10 }}>
    <SectionBadge>{title}</SectionBadge>
    {children}
  </PanelCard>
);

const EmptyRecords = () => (
  <span style={{ color: '#8c8c8c', fontSize: 13 }}>No records found</span>
);

const TextBlockList = ({ items }) => (
  <>
    {items.map((text, index) => (
      <div
        key={index}
        style={{
          marginBottom: index < items.length - 1 ? 10 : 0,
          color: '#666',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {text}
      </div>
    ))}
  </>
);

export default function SaasAiProfileAnalysisModal({ open, onClose, record, loading = false, error = false }) {
  const analysis = record?.ai_profile_analysis || {};
  const profile = analysis.profile || {};
  const aiScore = record?.score ?? record?.ai_score ?? analysis.ai_match_score ?? 0;
  const scoreColor = getScoreColor(aiScore);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="95vw"
      style={{ maxWidth: 1100, top: 24 }}
      destroyOnClose
      title={null}
      closable
      styles={{
        content: { padding: '12px 8px' },
        body: { padding: 0, maxHeight: '88vh', overflowY: 'auto' },
      }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin" style={{ fontSize: 32 }}  />} />
          <div style={{ marginTop: 12, color: '#666' }}>Loading AI profile analysis...</div>
        </div>
      ) : error ? (
        <Alert
          type="error"
          showIcon
          message="Failed to load AI profile analysis"
          description="Could not fetch applicant profile data. Please try again."
        />
      ) : (
      <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 16, paddingRight: 40 }}>
        <h2 style={{ margin: 0, color: BRAND, fontSize: 22, fontWeight: 700, flex: 1, minWidth: 0 }}>
          AI-Powered Profile Analysis
        </h2>
        <div style={{ minWidth: 200, maxWidth: 240, textAlign: 'right', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 6 }}>
            <span
              style={{
                background: BRAND,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: 16,
              }}
            >
              AI Match Score
            </span>
            <span style={{ color: scoreColor, fontWeight: 700, fontSize: 18 }}>{aiScore}%</span>
          </div>
          <Progress
            percent={Number(aiScore) || 0}
            showInfo={false}
            strokeColor={scoreColor}
            trailColor="#f0f0f0"
            size="small"
          />
        </div>
      </div>

      <PanelCard style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <img
            src={profile.profile_pic || record?.profile_pic || ProfileImagePlaceholder}
            alt={profile.name || record?.candidate || 'Candidate'}
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e8e8e8' }}
          />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: BRAND, marginBottom: 6 }}>
              {profile.name || record?.candidate || '-'}
            </div>
            <div style={{ color: '#666', fontSize: 13, lineHeight: 1.7 }}>
              <div>{profile.email || '-'}</div>
              <div>{profile.phone || '-'}</div>
              <div>{profile.location || '-'}</div>
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #e8e8e8', paddingLeft: 12, minWidth: 120 }}>
            <SectionBadge>Salary</SectionBadge>
            <div style={{ color: '#666', fontSize: 13 }}>{profile.salary || '-'}</div>
          </div>
        </div>
      </PanelCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: BRAND, fontSize: 15 }}>Candidate Profile</div>
        <div style={{ fontWeight: 700, color: BRAND, fontSize: 15 }}>AI Match Breakdown</div>
      </div>

      <MatchPairRow
        left={(
          <>
            <SectionBadge>Open To Job Types</SectionBadge>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(profile.open_to_job_types || []).map((type) => (
                <span
                  key={type}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    border: '1px solid #d9d9d9',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 12,
                    color: '#555',
                  }}
                >
                  <ClockCircleOutlined size="1em" className="app-icon" style={{ color: BRAND }} />
                  {type}
                </span>
              ))}
            </div>
          </>
        )}
        right={(
          <>
            <MatchScoreHeader label="Job Type Match" score={analysis.job_type_match?.score ?? 0} />
            <p style={{ margin: 0, color: '#666', fontSize: 13, lineHeight: 1.6 }}>
              {analysis.job_type_match?.summary || '-'}
            </p>
          </>
        )}
      />

      <MatchPairRow
        left={(
          <>
            <SectionBadge>Location</SectionBadge>
            <div style={{ color: '#444', fontSize: 13 }}>{profile.location || '-'}</div>
          </>
        )}
        right={(
          <>
            <MatchScoreHeader label="Location Match" score={analysis.location_match?.score ?? 0} />
            <Progress
              percent={Number(analysis.location_match?.score) || 0}
              showInfo={false}
              strokeColor={getScoreColor(analysis.location_match?.score)}
              trailColor="#f0f0f0"
              size="small"
              style={{ marginBottom: 10 }}
            />
            <p style={{ margin: 0, color: '#666', fontSize: 13, lineHeight: 1.6 }}>
              {analysis.location_match?.summary || '-'}
            </p>
          </>
        )}
      />

      <MatchPairRow
        left={(
          <>
            <SectionBadge>Work Experience</SectionBadge>
            {(profile.work_experience || []).length === 0 ? (
              <EmptyRecords />
            ) : (
              profile.work_experience.map((item, index) => {
                if (typeof item === 'string') {
                  return (
                    <div key={index} style={{ marginBottom: 8, fontSize: 13, color: '#444' }}>
                      {item}
                    </div>
                  );
                }
                return (
                  <div key={index} style={{ marginBottom: index < profile.work_experience.length - 1 ? 12 : 0 }}>
                    <div style={{ fontWeight: 600, color: BRAND, fontSize: 14 }}>
                      {item.role || '-'}
                      {item.company ? ` at ${item.company}` : ''}
                    </div>
                    <div style={{ color: '#888', fontSize: 12 }}>
                      {[item.duration, item.location].filter(Boolean).join(' | ') || '-'}
                    </div>
                    {item.description ? (
                      <div style={{ color: '#666', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                        {item.description}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </>
        )}
        right={(
          <>
            <MatchScoreHeader label="Experience Match" score={analysis.experience_match?.score ?? 0} />
            <p style={{ margin: 0, color: '#666', fontSize: 13, lineHeight: 1.6 }}>
              {analysis.experience_match?.summary || '-'}
            </p>
          </>
        )}
      />

      <MatchPairRow
        left={(
          <>
            <SectionBadge>Education</SectionBadge>
            {(profile.education || []).length === 0 ? (
              <EmptyRecords />
            ) : (
              profile.education.map((edu, index) => (
                <div key={index} style={{ marginBottom: index < profile.education.length - 1 ? 12 : 0 }}>
                  <div style={{ fontWeight: 600, color: BRAND, fontSize: 14 }}>{edu.degree}</div>
                  <div style={{ fontWeight: 600, color: '#5a7fa8', fontSize: 13 }}>{edu.university}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{edu.duration} | {edu.location}</div>
                </div>
              ))
            )}
          </>
        )}
        right={(
          <>
            <MatchScoreHeader label="Education Match" score={analysis.education_match?.score ?? 0} />
            <p style={{ margin: 0, color: '#666', fontSize: 13, lineHeight: 1.6 }}>
              {analysis.education_match?.summary || '-'}
            </p>
          </>
        )}
      />

      <MatchPairRow
        left={(
          <>
            <SectionBadge>Skills</SectionBadge>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {(profile.skills || []).map((skill) => (
                <div
                  key={skill.name}
                  style={{
                    border: '1px solid #e8e8e8',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, color: BRAND, marginBottom: 4 }}>{skill.name}</div>
                  {skill.years != null && skill.years !== '' ? (
                    <div style={{ color: '#666' }}>{skill.years} Years</div>
                  ) : null}
                  {skill.recency ? (
                    <div style={{ color: '#888', fontSize: 11 }}>{skill.recency}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
        right={(
          <>
            <MatchScoreHeader label="Skills Match" score={analysis.skills_match?.score ?? 0} />
            <p style={{ margin: 0, color: '#666', fontSize: 13, lineHeight: 1.6 }}>
              {analysis.skills_match?.summary || '-'}
            </p>
          </>
        )}
      />

      <FullSection title="Projects">
        {(profile.projects || []).length === 0 ? (
          <EmptyRecords />
        ) : (
          profile.projects.map((project, index) => (
            <div
              key={index}
              style={{
                paddingBottom: index < profile.projects.length - 1 ? 12 : 0,
                marginBottom: index < profile.projects.length - 1 ? 12 : 0,
                borderBottom: index < profile.projects.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <div style={{ fontWeight: 600, color: BRAND, fontSize: 14 }}>{project.title || '-'}</div>
              {project.skills ? (
                <div style={{ color: '#5a7fa8', fontSize: 13, marginTop: 4 }}>{project.skills}</div>
              ) : null}
              {project.description ? (
                <div style={{ color: '#666', fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>{project.description}</div>
              ) : null}
              {project.responsibilities ? (
                <div style={{ color: '#888', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{project.responsibilities}</div>
              ) : null}
            </div>
          ))
        )}
      </FullSection>

      <FullSection title="Certifications">
        {(profile.certifications || []).length === 0 ? (
          <EmptyRecords />
        ) : (
          profile.certifications.map((cert, index) => (
            <div
              key={index}
              style={{
                paddingBottom: index < profile.certifications.length - 1 ? 12 : 0,
                marginBottom: index < profile.certifications.length - 1 ? 12 : 0,
                borderBottom: index < profile.certifications.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <div style={{ fontWeight: 600, color: BRAND, fontSize: 14 }}>{cert.name || '-'}</div>
              <div style={{ fontWeight: 600, color: '#5a7fa8', fontSize: 13 }}>{cert.organization || '-'}</div>
              {cert.duration ? (
                <div style={{ color: '#888', fontSize: 12 }}>{cert.duration}</div>
              ) : null}
            </div>
          ))
        )}
      </FullSection>

      <FullSection title="Trainings">
        {(profile.trainings || []).length === 0 ? (
          <EmptyRecords />
        ) : (
          profile.trainings.map((training, index) => (
            <div
              key={index}
              style={{
                paddingBottom: index < profile.trainings.length - 1 ? 12 : 0,
                marginBottom: index < profile.trainings.length - 1 ? 12 : 0,
                borderBottom: index < profile.trainings.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <div style={{ fontWeight: 600, color: BRAND, fontSize: 14 }}>{training.title}</div>
              <div style={{ fontWeight: 600, color: '#5a7fa8', fontSize: 13 }}>{training.institution}</div>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{training.duration}</div>
              <div style={{ color: '#666', fontSize: 13 }}>{training.description}</div>
            </div>
          ))
        )}
      </FullSection>

      <FullSection title="Extra Curricular Activities">
        {(profile.extra_curricular || []).length === 0 ? (
          <EmptyRecords />
        ) : (
          <TextBlockList items={profile.extra_curricular} />
        )}
      </FullSection>

      <FullSection title="Publications">
        {(profile.publications || []).length === 0 ? (
          <EmptyRecords />
        ) : (
          <TextBlockList items={profile.publications} />
        )}
      </FullSection>

      <FullSection title="References">
        {(profile.references || []).length === 0 ? (
          <EmptyRecords />
        ) : (
          <TextBlockList items={profile.references} />
        )}
      </FullSection>

      <FullSection title="Achievements">
        {(profile.achievements || []).length === 0 ? (
          <EmptyRecords />
        ) : (
          <TextBlockList items={profile.achievements} />
        )}
      </FullSection>

      <FullSection title="Volunteer Work">
        {(profile.volunteer_work || []).length === 0 ? (
          <EmptyRecords />
        ) : (
          <TextBlockList items={profile.volunteer_work} />
        )}
      </FullSection>

      <FullSection title="Languages">
        {(profile.languages || []).length === 0 ? (
          <EmptyRecords />
        ) : (
          profile.languages.map((lang, index) => (
            <div key={`${lang.name}-${index}`} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: '#444', marginBottom: 6 }}>{lang.name}</div>
              {lang.score != null && lang.score !== '' ? (
                <div style={{ position: 'relative', height: 28, borderRadius: 6, overflow: 'hidden', background: '#f0f0f0' }}>
                  <div
                    style={{
                      width: `${lang.score}%`,
                      height: '100%',
                      background: getScoreColor(lang.score),
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: lang.score > 0 ? 48 : 0,
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{lang.score}%</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#666', fontSize: 12 }}>{lang.proficiency || '-'}</div>
              )}
            </div>
          ))
        )}
      </FullSection>
      </>
      )}
    </Modal>
  );
}
