import { Select } from './ui/app-select.jsx';
import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/headhunting-activate-project-content.css';

const HeadhuntingActivateProjectContent = ({
  jobsList,
  loadingJobsList,
  selectedJobIds,
  jobDeadlines,
  jobSelectionError,
  onToggleJob,
  onDeadlineChange,
  onCvsChange,
  recruiterOptions,
  assigningRecruiter,
  recruiterId,
  onRecruiterChange,
  projectSubmissionDeadline,
  onProjectSubmissionDeadlineChange,
  projectSubmissionLabel = 'Project Completion Deadline',
}) => {
  return (
    <div className="activate-project-content">
      {/* Project Submission Deadline */}
      <div className="activate-project-content__field">
        <label className="activate-project-content__label">
          {projectSubmissionLabel} <span className="activate-project-content__required">*</span>
        </label>
        <DatePicker
          format="DD-MM-YYYY"
          placeholder={`Select ${projectSubmissionLabel}`}
          value={projectSubmissionDeadline ? dayjs(projectSubmissionDeadline) : null}
          onChange={(val) =>
            onProjectSubmissionDeadlineChange(val ? val.toDate() : undefined)
          }
          className="activate-project-content__full-width"
        />
      </div>

      {/* Select Jobs */}
      {loadingJobsList ? (
        <div className="activate-project-content__loading">Loading jobs...</div>
      ) : Array.isArray(jobsList) && jobsList.length > 0 ? (
        <div className="activate-project-content__jobs-list">
          {jobsList.map((job) => (
            <div
              key={job.id}
              className="activate-project-content__job-item"
            >
              {/* First Row: Checkbox + Job Title */}
              <div className="activate-project-content__job-title-row">
                <input
                  type="checkbox"
                  checked={selectedJobIds.includes(job.id)}
                  onChange={(e) => onToggleJob(job.id, e.target.checked)}
                />
                <span className="activate-project-content__job-title">{job.job_title}</span>
              </div>

              {/* Second Row: No of Resources Label */}
              <div className="activate-project-content__vacancies-row">
                No of Resources to be Hired: {job.number_of_vacancies || 0}
              </div>

              {/* Third Row: DatePicker + CVs Dropdown (only when selected) */}
              {selectedJobIds.includes(job.id) && (
                <div className="activate-project-content__job-detail-grid">
                  <DatePicker
                    format="DD-MM-YYYY"
                    placeholder="CV Submission deadline"
                    value={jobDeadlines[job.id] ? dayjs(jobDeadlines[job.id]) : null}
                    onChange={(val) =>
                      onDeadlineChange(job.id, val ? val.toDate() : undefined)
                    }
                    className="activate-project-content__full-width"
                  />
                  <Select
                    placeholder="CVs to be provided"
                    className="activate-project-content__full-width"
                    value={jobDeadlines[`${job.id}_cvs`]}
                    onChange={(value) => onCvsChange(job.id, value)}
                  >
                    {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                      <Select.Option key={num} value={num}>
                        {num}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="activate-project-content__empty">No active jobs found</div>
      )}

      {jobSelectionError && (
        <div className="activate-project-content__error">
          {jobSelectionError}
        </div>
      )}

      {/* Assign Recruiter */}
      <div className="activate-project-content__recruiter-field">
        <label className="activate-project-content__label">
          Assign Recruiter <span className="activate-project-content__required">*</span>
        </label>
        <Select
          className="activate-project-content__full-width"
          value={recruiterId}
          onChange={onRecruiterChange}
          placeholder="Select Recruiter"
          popupMatchSelectWidth={false}
          loading={assigningRecruiter}
          showSearch
          optionFilterProp="children"
        >
          {recruiterOptions.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default HeadhuntingActivateProjectContent;









