import { message } from '../../components/ui/notifications.jsx';
import { Modal } from '../../components/ui/app-modal.jsx';
import { Select } from '../../components/ui/app-select.jsx';
import { Input } from '../../components/ui/app-controls.jsx';
import { Spin, Button } from '../../components/ui/app-controls.jsx';
import React, { useState, useMemo } from 'react';

import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { Typography } from 'antd';
import ProjectDetailCard from '../../components/project-detail-card.component.jsx';
import RequiredSkillCard from '../../components/required-skill-card.component.jsx';
import { getProjectDetails } from '../shared/services/executive-service.js';
import { getJobDetail } from '../shared/services/stats-service.js';
import { markProjectTerminated } from '../shared/services/project-service.js';

import '../../assets/styles/legacy/project-detail-page.css';


const { Title, Text } = Typography;
const { Option } = Select;

const ProjectDetailPage = () => {

  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { id, slug } = useParams();

  const [reasonForMarkTerminated, setReasonForMarkTerminated] = useState('');

  const [isMarkTerminatedModalVisible, setIsMarkTerminatedModalVisible] = useState(false);

  const [isMarkingTerminated, setIsMarkingTerminated] = useState(false);


  const { data: projectDetails, isLoading: loadingProjectDetails } = useQuery({
    queryKey: ['projectDetails', slug],
    queryFn: () => getProjectDetails(slug),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const job = projectDetails ?? [];

  const { data: jobDetail, isLoading: loadingJobDetail } = useQuery({
    queryKey: ['jobDetail', id],
    queryFn: () => getJobDetail(id),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const project = jobDetail ?? {};

  const isProjectActive = jobDetail && project?.status === "Active";

  const markProjectTerminatedMutation = useMutation({
    mutationFn: (reason) => markProjectTerminated(id, reason),

    onMutate: () => {
      setIsMarkingTerminated(true);
    },

    onSuccess: (data) => {

      message.success("Project Terminated Successfully.");
      setIsMarkTerminatedModalVisible(false);

      queryClient.invalidateQueries(['jobDetail', id]);

    },

    onError: (error) => {

      message.error("Error marking project. Please try again.");
    },

    onSettled: () => {
      setIsMarkingTerminated(false);
    },
  });

  const handleMarkTerminated = () => {

    markProjectTerminatedMutation.mutate(reasonForMarkTerminated);
  };

  return (
    <>
      <BreadCrumb linkText='Projects' />
      <div className="project-detail-page">
        <div className="left-section">

          <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingProjectDetails && loadingJobDetail}>

            <ProjectDetailCard
              title={job?.title || "Default Title"}
              id={job?.id || "N/A"}
              company_name={job?.company_name || "Default Company"}
              company_city={job?.company_city || "Default City"}
              company_country={job?.company_country || "Default Country"}
              job_type={job?.job_type || "Full-time"}
              status={job?.is_active}
              assigned_to={project?.assigned_to_name}
              posted_on={job?.created_at}
              deadline={job?.deadline}
              experience={job?.experience}
              positions={job?.positions}
              degree={job?.degree}
              salary={job?.salary}
              gender={job?.gender}
              industry={job?.industry_name}
            />
          </Spin>



        </div>
        {/* Left Section: Project Detail Card */}

        {/* Right Section: Project Description */}
        <div className="right-section">
          <div className="section-header" style={{ paddingRight: "13px" }}>
            <Title level={4} className="section-title">Project Description</Title>
            <Button type="primary" className="create-button" onClick={() => navigate(`/sales-executive/project-application/${project?.job_id}`)}>View Applications</Button>
          </div>


          <div className="btn-section" style={{ display: "flex", justifyContent: "flex-end" }}>

            {isProjectActive && (

              <Button
                type="primary"
                className="custom-btn"
                onClick={() => setIsMarkTerminatedModalVisible(true)}
              >
                Terminate Project
              </Button>

            )}

          </div>


          {/* Information Sections */}
          <div className="info-container">
            {/* Degree Names Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Degree Names</Title>
              <ul style={{ fontWeight: '500' }}>
                {job?.degrees?.map((item, index) => (
                  <li key={index}>{item?.name}</li>
                ))}
              </ul>
            </div>

            {/* Responsibilities Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Responsibilities</Title>
              <span
                dangerouslySetInnerHTML={{ __html: job?.responsibilities }}
              ></span>
            </div>

            {/* Requirements Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Requirements</Title>
              <span
                dangerouslySetInnerHTML={{ __html: job?.requirements }}
              ></span>
            </div>

            {/* Benefits Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Benefits</Title>
              <span
                dangerouslySetInnerHTML={{ __html: job?.benefits }}
              ></span>
            </div>

            {/* Description Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Description</Title>
              <span
                dangerouslySetInnerHTML={{ __html: job?.description }}
              ></span>
            </div>

            {/* Required Skills Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Required Skills</Title>

              <Spin spinning={loadingProjectDetails} size="large" indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />}>


                <div className="skills-grid">

                  {job?.skills?.length > 0 ? (
                    job.skills.map((skill, index) => (
                      <RequiredSkillCard
                        key={index}
                        skillTitle={skill.skill}
                        experience={`${skill.experience} Year${skill.experience > 1 ? 's' : ''}`} // Ensure proper grammar
                        lastUsed={skill.last_used === "0" ? "Currently Using" : `Last Used: ${skill.last_used}`}
                      />
                    ))
                  ) : (
                    !loadingProjectDetails && <div>No skills found for this project.</div>
                  )}

                </div>

              </Spin>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={<span className="lost-client-modal-title">Mark Project As Terminated</span>}
        visible={isMarkTerminatedModalVisible}
        onCancel={() => setIsMarkTerminatedModalVisible(false)}
        footer={null}
        centered
        width={700}
        className="rounded-modal"
      >
        <div className="lost-client-modal-content">
          <label htmlFor="reason" className="modal-label">
            Reason<sp>*</sp>
          </label>
          <Input.TextArea
            id="reason"
            value={reasonForMarkTerminated}
            onChange={(e) => setReasonForMarkTerminated(e.target.value)}
            placeholder="Enter the reason for marking the project as terminated"
            rows={4}
            className="modal-textarea"
          />
          <div className="modal-actions">
            <Button
              className='create-button'
              type="primary"
              onClick={handleMarkTerminated}
              disabled={!reasonForMarkTerminated.trim()}
              loading={isMarkingTerminated}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

    </>
  );
};

export default ProjectDetailPage;
