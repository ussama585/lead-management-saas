import { message } from '../../../../components/ui/notifications.jsx';
import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Spin, Button } from '../../../../components/ui/app-controls.jsx';
import React, { useState, useMemo, useEffect } from 'react';

import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { Typography } from 'antd';
import ProjectDetailCard from '../../../../components/project-detail-card.component.jsx';
import RequiredSkillCard from '../../../../components/required-skill-card.component.jsx';
import { getProjectDetails } from '../../../shared/services/executive-service.js';
import { markProjectTerminated } from '../../../shared/services/project-service.js';

import '../../../../assets/styles/legacy/project-detail-page.css';
import { assignProject, getAssigningUsersListing } from '../../../shared/services/users-service.js';
import { getJobDetail } from '../../../shared/services/stats-service.js';


const { Title, Text } = Typography;
const { Option } = Select;

const ProjectDetailPage = () => {
  const navigate = useNavigate();

  const { id, slug } = useParams();

  const queryClient = useQueryClient();


  const [reasonForMarkTerminated, setReasonForMarkTerminated] = useState('');

  const [isMarkTerminatedModalVisible, setIsMarkTerminatedModalVisible] = useState(false);

  const [isMarkingTerminated, setIsMarkingTerminated] = useState(false);

  const { data: jobDetail, isLoading: loadingJobDetail } = useQuery({
    queryKey: ['jobDetail', id],
    queryFn: () => getJobDetail(id),
  })

  const isProjectActive = jobDetail && jobDetail?.status === "Active";


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



  useEffect(() => {


    if (jobDetail) {

      if (jobDetail.assigned_to_type === 'sales_manager') {
        setSelectedManager({ id: jobDetail.assigned_to, name: jobDetail.assigned_to_name });
        setSelectedExecutive({ id: undefined, name: undefined });
      } else if (jobDetail.assigned_to_type === 'sales_executive') {


        setSelectedExecutive({ id: jobDetail.assigned_to, name: jobDetail.assigned_to_name });
        setSelectedManager({ id: undefined, name: undefined });
      }

    }
  }, [jobDetail]);



  const [selectedManager, setSelectedManager] = useState({
    id: undefined,
    name: undefined
  })

  const [selectedExecutive, setSelectedExecutive] = useState({
    id: undefined,
    name: undefined
  })


  const [isAssigning, setIsAssigning] = useState(false);


  const { data: projectDetails, isLoading: loadingProjectDetails } = useQuery({
    queryKey: ['projectDetails'],
    queryFn: () => getProjectDetails(slug),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const { data: assigningExecutives, isLoading: loadingAssigningExecutives } = useQuery({
    queryKey: ['assigningExecutives'],
    queryFn: () => getAssigningUsersListing("sales_executive"),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const { data: assigningManagers, isLoading: loadingAssigningManagers } = useQuery({
    queryKey: ['assigningManagers'],
    queryFn: () => getAssigningUsersListing("sales_manager"),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })


  const assignProjectMutation = useMutation({
    mutationFn: (userId) => assignProject(id, userId),

    onMutate: () => {
      setIsAssigning(true);
    },

    onSuccess: (data) => {

      message.success("Project Assigned Successfully.");

    },

    onError: (error) => {

      message.error("Error assigning project. Please try again.");
    },

    onSettled: () => {
      setIsAssigning(false);
    },
  });



  const handleManagerChange = (id) => {
    const manager = assigningManagers.find((manager) => manager.id === id);
    setSelectedManager(manager || { id: null, name: "" });
    setSelectedExecutive({
      id: undefined,
      name: undefined
    })
  };

  const handleExecutiveChange = (id) => {
    const executive = assigningExecutives.find((executive) => executive.id === id);
    setSelectedExecutive(executive || { id: null, name: "" });
    setSelectedManager({
      id: undefined,
      name: undefined
    })
  };


  const handleSubmit = () => {
    // Determine the userIdToAssign based on whichever role is selected
    const userIdToAssign = selectedManager.id !== undefined ? selectedManager.id : selectedExecutive.id;

    // If neither Manager nor Executive is selected, return an error
    if (!userIdToAssign) {
      message.error("No changes detected. Please select either a Manager or an Executive.");
      return;
    }

    assignProjectMutation.mutate(userIdToAssign);
  };



  return (
    <>
      <BreadCrumb linkText='Projects' />
      <div className="project-detail-page">
        <div className="left-section">

          <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingProjectDetails && loadingJobDetail}>

            <ProjectDetailCard
              title={projectDetails?.title || "Default Title"}
              id={projectDetails?.id || "N/A"}
              company_name={projectDetails?.company_name || "Default Company"}
              company_city={projectDetails?.company_city || "Default City"}
              company_country={projectDetails?.company_country || "Default Country"}
              job_type={projectDetails?.job_type || "Full-time"}
              status={projectDetails?.is_active}
              assigned_to={jobDetail?.assigned_to_name}
              posted_on={jobDetail?.created_at}
              deadline={jobDetail?.deadline}
              experience={projectDetails?.experience}
              positions={projectDetails?.positions}
              degree={projectDetails?.degree}
              salary={projectDetails?.salary}
              gender={projectDetails?.gender}
              industry={projectDetails?.industry_name}
            />
          </Spin>



        </div>
        {/* Left Section: Project Detail Card */}

        {/* Right Section: Project Description */}
        <div className="right-section">
          <div className="section-header" style={{ paddingRight: "15px" }}>
            <Title level={4} className="section-title">Project Description</Title>
            <Button type="primary" className="create-button" onClick={() => navigate(`/admin/project-application/${id}`)}>View Applications</Button>
          </div>

          <div className="selection-section">
            {/* Manager Dropdown */}
            <div className="select-box">
              <Text style={{ fontWeight: "bold", color: "#3E6A9F" }}>Select Manager</Text>
              <Select
                placeholder="Select Manager"
                style={{ width: 200 }}
                loading={loadingAssigningManagers}
                value={selectedManager.id} // Controlled value
                onChange={handleManagerChange} // Update state on change
              >
                {(assigningManagers || []).map((manager) => (
                  <Option key={manager.id} value={manager.id}>
                    {manager.name}
                  </Option>
                ))}
              </Select>

            </div>

            {/* Executive Dropdown */}
            <div className="select-box">
              <Text style={{ fontWeight: "bold", color: "#3E6A9F" }}>Select Executive</Text>
              <Select
                placeholder="Select Executive"
                style={{ width: 200 }}
                loading={loadingAssigningExecutives}
                value={selectedExecutive.id} // Controlled value
                onChange={handleExecutiveChange} // Update state on change
              >
                {(assigningExecutives || []).map((executive) => (
                  <Option key={executive.id} value={executive.id}>
                    {executive.name}
                  </Option>
                ))}
              </Select>

            </div>


          </div>


          <div className="btn-section">
            {/* Update Button */}
            <Button type="primary" className="create-button" onClick={handleSubmit} loading={isAssigning}>
              Update

            </Button>

            <div className="secondary-btn-section">

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


          </div>

          {/* Information Sections */}
          <div className="info-container">
            {/* Degree Names Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Degree Names</Title>
              <ul style={{ fontWeight: '500' }}>
                {projectDetails?.degrees?.map((item, index) => (
                  <li key={index}>{item?.name}</li>
                ))}
              </ul>
            </div>

            {/* Responsibilities Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Responsibilities</Title>
              <span
                dangerouslySetInnerHTML={{ __html: projectDetails?.responsibilities }}
              ></span>
            </div>

            {/* Requirements Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Requirements</Title>
              <span
                dangerouslySetInnerHTML={{ __html: projectDetails?.requirements }}
              ></span>
            </div>

            {/* Benefits Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Benefits</Title>
              <span
                dangerouslySetInnerHTML={{ __html: projectDetails?.benefits }}
              ></span>
            </div>

            {/* Description Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Description</Title>
              <span
                dangerouslySetInnerHTML={{ __html: projectDetails?.description }}
              ></span>
            </div>

            {/* Required Skills Section */}
            <div className="info-section">
              <Title level={4} style={{ fontWeight: 'bold' }}>Required Skills</Title>

              <Spin spinning={loadingProjectDetails} size="large" indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />}>


                <div className="skills-grid">

                  {projectDetails?.skills?.length > 0 ? (
                    projectDetails.skills.map((skill, index) => (
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
