import React, { useState, useMemo, useEffect } from 'react';
import { DatePicker, Select, Button, Spin, message, Typography, Modal, Input, Skeleton } from 'antd';
import { LoaderCircle as LoadingOutlined, Pencil as EditOutlined, FileText as FileTextOutlined } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import UserDetailCard from '../../components/user-detail-card.component.jsx';
import TableComponent from '../../components/tables/table.component.jsx';
import '../../assets/styles/legacy/client-detail-page.css'
import { updateStatus, editProject, getProjectDetails, getAllProjectsList, getAllProjectsCount } from '../shared/services/headhunting.js';
import moment from 'moment';
import { Formik, Form, Field } from 'formik';
import dayjs from 'dayjs';
import { createNewProjectValidationSchema } from '../shared/schemas/schema.js';


const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function HeadhuntingProjectsListingForExecutive() {

  const [isEditProjectModalVisible, setIsEditProjectModalVisible] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(undefined);

  const [showRemakrsModal, setShowRemakrsModal] = useState(false);
  const [rowRemakrs, setRowRemarks] = useState("");
  const openRemakrsModal = (remarks)=>{
    setShowRemakrsModal(true);
    setRowRemarks(remarks);
  }

  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [rowDescription, setRowDescription] = useState("");
  const openDescriptionModal = (description)=>{
    setShowDescriptionModal(true);
    setRowDescription(description);
  }

  const formatDate = (date) => {
    return date ? moment(date).format('YYYY-MM-DD') : null;
  };

  const queryClient = useQueryClient();

  // const { id: id } = useParams();

  const navigate = useNavigate();

  const [selectedProjectsTab, setSelectedProjectsTab] = useState("potential_projects");
  const [projectListType, setProjectListType] = useState("Potential")

  const [projectCount, setProjectCount] = useState({});

  const [pagination, setPagination] = useState({
    pageIndex: 0, // Start at page 0
    pageSize: 10, // Default rows per page
  });
  const [search, setSearch] = useState('')
  const [sortingProjects, setSortingProjects] = useState([]);

    // projects listing query
    const { data: projectsList, isLoading: loadingProjectsList } = useQuery({
    queryKey: ['projectsList', projectListType, pagination.pageIndex, pagination.pageSize, sortingProjects, search],
    queryFn: () => getAllProjectsList(projectListType, pagination.pageIndex + 1, pagination.pageSize, sortingProjects, search),
    // enabled: projectsListEnabled, // Only enabled when conditions are met
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    });

    // project detail query
    const { data: projectDetail, isLoading: loadingProjectDetail } = useQuery({
        queryKey: ['projectDetail', selectedProjectId],
        queryFn: () => getProjectDetails(selectedProjectId),
        enabled: !!selectedProjectId,
        staleTime: 0,
        cacheTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });

    // edit project query
    const { mutate:editProjectDetails, isLoading: updatingProject, isError, error } = useMutation({
      mutationFn: ({ id, values }) => editProject({ id, values }),
  
      // onMutate: () => setUpdatingProject(true),
  
      onSuccess: (data) => {
  
        message.success("Project Updated Successfully");
        queryClient.invalidateQueries(['projectsList', projectListType]);
        queryClient.invalidateQueries(['clientProjectCount'],);
        setIsEditProjectModalVisible(false);
  
      },
      onError: (error) => {
        message.error("Something Went Wrong");
      },
  
      // onSettled: () => setUpdatingProject(false);
    });

    // mutation for status change
    const { mutate: statusChangeMutation } = useMutation({
        mutationFn: ({id, value}) => updateStatus({id, value}),
        onSuccess: (data) => {
          message.success("Status changed successfully.");
          queryClient.invalidateQueries(['clientProjectCount']);
          queryClient.invalidateQueries(['projectsList', projectListType]);
        },
        onError: (error) => {
          message.error("Error changing status. Please try again.");
        },
    })
      

    // projects count query
    const { data: clientProjectCount, isLoading: loadingClientProjectCount } = useQuery({
        queryKey: ['clientProjectCount'],
        queryFn: () => getAllProjectsCount(),
        onSuccess: ()=>{
          console.log(clientProjectCount);
        },
        // enabled: !!id,
        staleTime: 0,
        cacheTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });
    
    

    const handleTabClickForProject = (tabValue) => {
        console.log("Selected Tab: ", tabValue);

        // Set projectListType based on the selected tabValue

        switch (tabValue) {
        case 'potential_projects':

            setSortingProjects([]);
            setPagination({ pageIndex: 0, pageSize: 10 });

            setSelectedProjectsTab("potential_projects");

            setProjectListType("Potential");
            console.log("Project Listing Type: Potential");
            break;

        case 'active_projects':

            setSortingProjects([]);
            setPagination({ pageIndex: 0, pageSize: 10 });

            setSelectedProjectsTab("active_projects");

            setProjectListType("Active");
            console.log("Project Listing Type: Active");
            break;

        case 'completed_projects':

            setSortingProjects([]);
            setPagination({ pageIndex: 0, pageSize: 10 });

            setSelectedProjectsTab("completed_projects");

            setProjectListType("Completed");
            console.log("Project Listing Type: Completed");
            break;

        case 'terminated_projects':

            setSortingProjects([]);
            setPagination({ pageIndex: 0, pageSize: 10 });

            setSelectedProjectsTab("terminated_projects");

            setProjectListType("Terminated");
            console.log("Project Listing Type: Terminated");
            break;



        default:

            break;
        }


    };


    useEffect(() => {
      if (!loadingClientProjectCount && clientProjectCount && Object.keys(clientProjectCount).length > 0) {
        setProjectCount({
          potential_projects: clientProjectCount.potential,
          active_projects: clientProjectCount.active,
          completed_projects: clientProjectCount.completed,
          terminated_projects: clientProjectCount.terminated,
        });
      }
    }, [clientProjectCount, loadingClientProjectCount]);
    

  // modal for table
  const columnForTable = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + pagination.pageIndex * pagination.pageSize}</span>,
      },
      {
        header: 'Job Title',
        accessorKey: 'job_title',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div>
              {/* onClick={() => navigate(`/sales-manager/project-detail/${row.id}/${row.job_slug}`)} */}
              <span style={{ display: 'flex', alignItems: 'center', textAlign: 'left', fontWeight:"bold" }}>{row.job_title}</span>
              {/* className="link-style" */}
            </div>
          );
        },
      },
      {
        header: 'Resources Required',
        accessorKey: 'resources_required',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Posted On',
        accessorKey: 'posting_date',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Hiring Deadline',
        accessorKey: 'hiring_deadline',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: "Remarks",
        accessorKey: "remarks",
        size: 150,
        Cell: ({ row }) => {
          const remarksValue = row.original.remarks;
          return remarksValue ? 
              <FileTextOutlined size="1em" className="app-icon" style={{ fontSize: '2rem', cursor: 'pointer', textAlign: "center"}} onClick={() => openRemakrsModal(remarksValue)}/>
            : "-" ;
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        size: 150,
        Cell: ({ row }) => {
          const descriptionValue = row.original.description;
          return descriptionValue ? 
              <FileTextOutlined size="1em" className="app-icon" style={{ fontSize: '2rem', cursor: 'pointer', textAlign: "center"}} onClick={() => openDescriptionModal(descriptionValue)}/>
            : "-" ;
        },
      },
      {
        header: 'Next Follow Up Date',
        accessorKey: 'followup_date',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Last Follow Up Date',
        accessorKey: 'last_followup_date',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 150,
        Cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div className="select-box" style={{ width: "150px" }}>
            <Select
              value={status || ""}
              onChange={(value) => {
                statusChangeMutation({ value, id: row.original.id });
                console.log(value);
                }
              }
              defaultValue={status}
            >
              <Option key="Potential" value="Potential">Potential</Option>
              <Option key="Active" value="Active">Active</Option>
              <Option key="Completed" value="Completed">Completed</Option>
              <Option key="Terminated" value="Terminated">Terminated</Option>
            </Select>
            </div>
          );
        },
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Edit',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <EditOutlined size="1em" className="app-icon"
              onClick={() => {
                setSelectedProjectId(row.id);
                setIsEditProjectModalVisible(true);
              }}
              style={{ cursor: 'pointer', fontSize: '20px', color: '#3E6A9F' }}
            />
          );
        },
      },
    ],
    [navigate]
  );

  // data for table
  const transformedProjectsData = projectsList?.results?.map((project) => ({

    id: project.id ?? "-",
    job_title: project.job_title ?? "-",
    resources_required: project.resources_required ?? '-',

    posting_date: project.posting_date
      ? new Date(project.posting_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : "-",

      hiring_deadline: project.hiring_deadline
      ? new Date(project.hiring_deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : "-",

      remarks: project.remarks ?? '-',
      description: project.description ?? '-',

      followup_date: project.followup_date
      ? new Date(project.followup_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : "-",

      last_followup_date: project.last_followup_date
      ? new Date(project.last_followup_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : "-",

      status: project.status ?? '-',

      created_at: project.created_at
      ? new Date(project.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : "-",
  })) ?? [];
  
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  return (
    <>
        {/* Tabs Section */}
        <div className="client-tabs-container">

          <div>

            {loadingClientProjectCount ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" />
              </div>
            ) : (
              <div className="client-tabs">
                {[
                  { label: 'Potential Projects', key: 'potential_projects' },
                  { label: 'Active Projects', key: 'active_projects' },
                  { label: 'Completed Projects', key: 'completed_projects' },
                  { label: 'Terminated Projects', key: 'terminated_projects' },
                ].map(({ label, key }) => {
                  
                  const count = clientProjectCount[key.split('_')[0]] || 0; // Default to 0 if the key is not found

                  return (
                    <button
                      key={key}
                      className={`tab ${selectedProjectsTab === key ? 'active' : ''}`}
                      onClick={() => handleTabClickForProject(key)}
                      disabled={loadingClientProjectCount}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* table section */}
        <div>
          <TableComponent
            columns={columnForTable}
            data={transformedProjectsData}
            totalCount={projectCount[selectedProjectsTab] || 0}
            heading={selectedProjectsTab.toUpperCase().replace('_', " ")}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sortingProjects}
            onSortingChange={setSortingProjects}
            onGlobalFilterChange={setSearch}
            globalFilter={search}
          />
        </div>

        {/* remarks modal */}
        <Modal
          open={showRemakrsModal}
          onCancel={() => setShowRemakrsModal(false)}
          footer={[
            <Button key="ok" type="primary" onClick={() => setShowRemakrsModal(false)}>
              Ok
            </Button>
          ]}
          centered
          title="Remarks"
        >
          <p style={{ fontSize: '1rem', marginBottom: '12px' }}>
            {showRemakrsModal ? rowRemakrs : ''}
          </p>
        </Modal>

        {/* description modal */}
        <Modal
            open={showDescriptionModal}
            onCancel={() => setShowDescriptionModal(false)}
            footer={[
            <Button key="ok" type="primary" onClick={() => setShowDescriptionModal(false)}>
                Ok
            </Button>
            ]}
            centered
            title="Description"
        >
            <p style={{ fontSize: '1rem', marginBottom: '12px' }}>
            {showDescriptionModal ? rowDescription : ''}
            </p>
        </Modal>

        {/* edit project modal */}
        <Modal
            title={<span className="custom-modal-title">Update Project Details</span>}
            visible={isEditProjectModalVisible}
            onCancel={() => {
            setIsEditProjectModalVisible(false);
            setSelectedProjectId(undefined);
            }}
            footer={null}
            centered
            width={1500}
            className="rounded-modal" // Apply custom styling class for rounded modal
            loading={loadingProjectDetail}
            bodyStyle={{
            overflowX: 'auto', // Enable horizontal scrolling
            maxWidth: '100%',
            }}
        >
    
    
            <div className="form-container" style={{ minWidth: '1300px' }}>
    
            <div className="form-content">
    
            
            { loadingProjectDetail ? (
                <Skeleton active paragraph={{ rows: 8 }} />
                ) : projectDetail && Object.keys(projectDetail).length > 0 ? (
                <Formik
                    initialValues={{
                        job_title: projectDetail?.job_title || "",
                        resources_required:projectDetail?.resources_required || "",
                        posting_date:projectDetail?.posting_date || "",
                        hiring_deadline:projectDetail?.hiring_deadline || "",
                        remarks:projectDetail?.remarks || "",
                        followup_date:projectDetail?.followup_date || "",
                        last_followup_date:projectDetail?.last_followup_date || "",
                        description: projectDetail?.description || "",
                    }}
    
                    validationSchema={ createNewProjectValidationSchema }
    
                    onSubmit={(values) => {
                        editProjectDetails({ id: selectedProjectId, values: values });
                    }}
    
                    >
                    {({ values, setFieldValue, errors, touched }) => (
    
                        <Form layout="vertical">

                        <h3 className="section-heading">Project Details</h3>

                        {/* Three-Column Layout */}
                        <div className="form-section">


                        {/* Company Name */}
                        
                        <div className="form-field">
                            <Field name="job_title">
                            {({ field }) => (
                                <div className="form-item">
                                <label>Job Title<sup>*</sup></label>
                                <Input {...field} placeholder="Enter job title" />
                                {errors.job_title && touched.job_title && (
                                    <div className="error-message">{errors.job_title}</div>
                                )}
                                </div>
                            )}
                            </Field>
                        </div>

                        <div className="form-field">
                            <Field name="resources_required">
                            {({ field }) => (
                                <div className="form-item">
                                <label>Resources Required<sup>*</sup></label>
                                <Input {...field} placeholder="Enter resources required" />
                                {errors.resources_required && touched.resources_required && (
                                    <div className="error-message">{errors.resources_required}</div>
                                )}
                                </div>
                            )}
                            </Field>
                        </div>

                        <div className="form-field">
                            <Field name="posting_date">
                            {({ field }) => (
                                <div className="form-item">
                                <label>Posting Date<sup>*</sup></label>
                                <DatePicker
                                    value={values.posting_date ? dayjs(values.posting_date) : null}
                                    onChange={(date) =>
                                    setFieldValue(
                                        "posting_date",
                                        date ? date.toISOString() : null
                                    )
                                    }
                                    placeholder="Select a date"
                                />
                                {errors.posting_date && touched.posting_date && (
                                    <div className="error-message">{errors.posting_date}</div>
                                )}
                                </div>
                            )}
                            </Field>
                        </div>

                        <div className="form-field">
                            <Field name="hiring_deadline">
                            {({ field }) => (
                                <div className="form-item">
                                <label>Hiring deadline<sup>*</sup></label>
                                <DatePicker
                                    value={values.hiring_deadline ? dayjs(values.hiring_deadline) : null}
                                    onChange={(date) =>
                                    setFieldValue(
                                        "hiring_deadline",
                                        date ? date.toISOString() : null
                                    )
                                    }
                                    placeholder="Select a date"
                                />
                                {errors.hiring_deadline && touched.hiring_deadline && (
                                    <div className="error-message">{errors.hiring_deadline}</div>
                                )}
                                </div>
                            )}
                            </Field>
                        </div>

                        
                        <div className="form-field">
                            <Field name="followup_date">
                            {({ field }) => (
                                <div className="form-item">
                                <label>Followup date<sup>*</sup></label>
                                <DatePicker
                                    value={values.followup_date ? dayjs(values.followup_date) : null}
                                    onChange={(date) =>
                                    setFieldValue(
                                        "followup_date",
                                        date ? date.toISOString() : null
                                    )
                                    }
                                    placeholder="Select a date"
                                />
                                {errors.followup_date && touched.followup_date && (
                                    <div className="error-message">{errors.followup_date}</div>
                                )}
                                </div>
                            )}
                            </Field>
                        </div>

                        <div className="form-field">
                            <Field name="last_followup_date">
                            {({ field }) => (
                                <div className="form-item">
                                <label>Last Followup date<sup>*</sup></label>
                                <DatePicker
                                    value={values.last_followup_date ? dayjs(values.last_followup_date) : null}
                                    onChange={(date) =>
                                    setFieldValue(
                                        "last_followup_date",
                                        date ? date.toISOString() : null
                                    )
                                    }
                                    placeholder="Select a date"
                                />
                                {errors.last_followup_date && touched.last_followup_date && (
                                    <div className="error-message">{errors.last_followup_date}</div>
                                )}
                                </div>
                            )}
                            </Field>
                        </div>

                        </div>

                        <div className="form-section">

                        <div className="form-field">
                            <Field name="remarks">
                            {({ field }) => (
                                <div className="form-item">
                                <label>Remarks<sup>*</sup></label>
                                <TextArea
                                    {...field}
                                    placeholder="Enter remarks"
                                    rows={4}
                                    style={{ width: '100%' }}
                                />
                                {errors.remarks && touched.remarks && (
                                    <div className="error-message">{errors.remarks}</div>
                                )}
                                </div>
                            )}
                            </Field>
                        </div>


                        <div className="form-field">
                            <Field name="description">
                            {({ field }) => (
                                <div className="form-item">
                                <label>Description<sup>*</sup></label>
                                <TextArea
                                    {...field}
                                    placeholder="Enter description"
                                    rows={4}
                                    style={{ width: '100%' }}
                                />
                                {errors.description && touched.description && (
                                    <div className="error-message">{errors.description}</div>
                                )}
                                </div>
                            )}
                            </Field>
                        </div>

                        </div>


                        <div className="form-submit">
                        <Button type="primary" htmlType="submit" style={{ marginBottom: '20px' }} loading={updatingProject} >
                            Update
                        </Button>
                        </div>

                        </Form>

                    )}
                </Formik>              
                ) : (
                <div>No client data found.</div>
                )
            }
    
            </div>
    
            </div>
    
    
        </Modal>
    </>
  );

}
