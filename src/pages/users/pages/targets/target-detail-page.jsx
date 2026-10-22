import {React, useEffect, useState} from 'react'
import dayjs from 'dayjs';
import moment from 'moment';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import { Modal, Row, Col, Form, Input, Button, Table, Spin, message, DatePicker } from "antd";
import { Formik, Form as FormikForm, Field, ErrorMessage } from "formik";
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import InputField from '../../../../components/input-field.component.jsx';
import { useQuery, useMutation, useQueryClient  } from 'react-query';
import { getTargetDetailsByDate, createNewTarget } from '../../../shared/services/stats-service.js';
import { useParams } from 'react-router-dom';
import '../../../../assets/styles/legacy/target-detail-page.css';
import { newTargetValidationSchema } from '../../../shared/schemas/schema.js';
import useUserStore from '../../../shared/store/user-store.js';
import { getTargetForUser, updateTarget } from '../../../shared/services/stats-service.js';

export default function TargetDetailPage() {

  const {id} = useParams();

  const defaultStartOfWeek = dayjs().startOf("week").add(1, "day"); // Monday
  const defaultEndOfWeek = defaultStartOfWeek.clone().add(6, "days"); // Sunday

  const formatUserType = (userType) => {
    if (!userType) return '';
    return userType
      .split('_') // Split the string by underscores
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
      .join(' '); // Join the words with spaces
  };

  const [selectedUserForUpdateTarget, setSelectedUserForUpdateTarget] = useState({
    id: id,
    combined: undefined,
  });

  const [updatingTarget, setUpdatingTarget] = useState(false);

  const [updateTargetModalVisible, setUpdateTargetModalVisible] = useState(false);

  const [weekStartDateForUpdateTarget, setWeekStartDateForUpdateTarget] = useState(null);

  const [timeRange, setTimeRange] = useState({
      start_date: defaultStartOfWeek.format("YYYY-MM-DD"),
      end_date: defaultEndOfWeek.format("YYYY-MM-DD"),
    });



  const [initialDataForUpdateTarget, setInitialDataForUpdateTarget] = useState([
    { date: '', values: Array(7).fill("") }, // 8 fields for each date
    { date: '', values: Array(7).fill("") },
    { date: '', values: Array(7).fill("") },
    { date: '', values: Array(7).fill("") },
    { date: '', values: Array(7).fill("") },
    { date: '', values: Array(7).fill("") },
    { date: '', values: Array(7).fill("") },
  ]);



  const handleWeekChange = (date, dateString) => {
    if (!date) {
      setTimeRange({
        start_date: undefined,
        end_date: undefined
      });
      return;
    }
  
    // Start of the week (Monday)
    const startOfWeek = date.startOf('week').add(1, 'day'); // Shift to Monday
    // End of the week (Sunday)
    const endOfWeek = startOfWeek.clone().add(6, 'days');   // Add 6 days to Monday for Sunday
  
    const startDate = startOfWeek.format('YYYY-MM-DD'); // Format as YYYY-MM-DD
    const endDate = endOfWeek.format('YYYY-MM-DD');     // Format as YYYY-MM-DD
  
    setTimeRange({
      start_date: startDate,
      end_date: endDate
    });
  
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
  };



    const queryClient = useQueryClient();

    const {data: targetDetails, isLoading: loadingTargetDetails} = useQuery({
      queryKey: ['targetDetails', id, timeRange.start_date, timeRange.end_date],
      queryFn: () => getTargetDetailsByDate(id, timeRange.start_date, timeRange.end_date),
      enabled: timeRange.start_date !== undefined && timeRange.end_date !==undefined,
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    })


    useEffect(() => {
    
      if(targetDetails){
        setSelectedUserForUpdateTarget({
          id: id,
          combined: `${targetDetails.name} (${formatUserType(targetDetails.user_type)})`
        })

        console.log("Target Details: " + targetDetails)
      }
    }, [targetDetails])


    const { mutate: mutateUpdateTarget} = useMutation({
      mutationFn: updateTarget,
  
      onMutate: () => {
        setUpdatingTarget(true);
        
  
        // queryClient.invalidateQueries(['targetListing']);
  
      },
      onSuccess: (data) => {
  
        console.log("Successfully Submitted Data");
        message.success("Targets Updated Successfully");

        queryClient.invalidateQueries(['targetDetails', id]);
  
        queryClient.invalidateQueries(['targetForUser']);
      },
      onError: (error) => {
        message.error("Something Went Wrong");
          
        console.error('Error Submitting Data', error);
      },
      onSettled: () => {
        setUpdatingTarget(false);
        setUpdateTargetModalVisible(false);
      }
  });


  const {data: targetForUser, isLoading: loadingTargetForUser} = useQuery({
    queryKey: ['targetForUser', selectedUserForUpdateTarget.id, timeRange.start_date, timeRange.end_date],
    queryFn: () => getTargetForUser(selectedUserForUpdateTarget.id, timeRange.start_date, timeRange.end_date),
    enabled: Boolean(timeRange.start_date && timeRange.end_date && selectedUserForUpdateTarget.id && selectedUserForUpdateTarget.combined),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })



  useEffect(() => {
    if (targetForUser && targetForUser.targets) {
      const updatedData = targetForUser.targets.map((target) => ({
        date: formatDateUniversal(target.date, false),
        values: [
          target.companies_reached ?? "",
          target.companies_registered ?? "",
          target.applications_received ?? "",
          target.job_posted ?? "",
          target.candidates_reached ?? "",
          target.candidate_registered ?? "", // Assuming this is the correct field name in API response
          target.hired ?? "",
        ],
      }));
  
      setInitialDataForUpdateTarget(updatedData);
    }
  }, [targetForUser]);




    // Map API response to match the table data structure
    const dataSource = targetDetails?.results?.map((item, index) => ({
      key: item.id, // Use a unique identifier
      week: item?.week ?? "-", // Example week value, modify as per your data
      date: item?.date 
        ? formatDateUniversal(item.date, false)
        : "-", // Format the date, or show "-" if created_at is null/undefined
    
      // Map other fields and use nullish coalescing (??) to handle null/undefined values
      companiesReachedOutTarget: item?.companies_reached?.target ?? "-",
      companiesReachedOutCompleted: item?.companies_reached?.completed ?? "-",
      companiesSignUpTarget: item?.companies_registered?.target ?? "-",
      companiesSignUpCompleted: item?.companies_registered?.completed ?? "-",
      applicationsReceivedTarget: item?.applications_received?.target ?? "-",
      applicationsReceivedCompleted: item?.applications_received?.completed ?? "-",
      hiringsTarget: item?.hired?.target ?? "-",
      hiringsCompleted: item?.hired?.completed ?? "-",
      jobPostsTarget: item?.job_posted?.target ?? "-",
      jobPostsCompleted: item?.job_posted?.completed ?? "-",
      candidatesReachedTarget: item?.candidates_reached?.target ?? "-",
      candidatesReachedCompleted: item?.candidates_reached?.completed ?? "-",
      candidatesRegisteredTarget: item?.candidate_registered?.target ?? "-",
      candidatesRegisteredCompleted: item?.candidate_registered?.completed ?? "-",
    }));
    

    const handleUpdateTarget = (values) => {
      const submittedData = values.rows
        .map((row) => {
          // First, create the row object as usual
          const rowData = {
            date: moment(row.date).format("YYYY-MM-DD"),
            companies_reached: row.values[0] || 0, 
            companies_registered: row.values[1] || 0,
            applications_received: row.values[2] || 0,
            job_posted: row.values[3] || 0,
            candidates_reached: row.values[4] || 0,
            candidate_registered: row.values[5] || 0,
            hired: row.values[6] || 0,
          };
    
          return rowData;
        })
        .filter((row) => {
          // Exclude rows where all key-value pairs (excluding date) are empty (i.e. 0)
          return Object.values(row).some(
            (value, index) => index !== 0 && value !== 0 // Only exclude if all values are 0
          );
        })
        .map((row) => {
          // After filtering, set any empty values to 0
          return Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, value || 0])
          );
        });
  
      
      if(selectedUserForUpdateTarget.id === undefined){
        message.error("Select user");
        return;
      }
  
  
      if(weekStartDateForUpdateTarget === null){
        message.error("Select date");
        return;
      }
    
      const apiData = {
        user: selectedUserForUpdateTarget.id,
        targets: submittedData,
      };
    
      if (submittedData.length <= 0) {
        message.error("Assign at least one target");
      } else {
        mutateUpdateTarget(apiData);
      }
    
      // Trigger the mutation
      console.log("Data to be submitted: ", apiData);
    };

    const getWeekDates = (startDate) => {
      if (!startDate) return [];
      const dates = [];
      for (let i = 0; i < 7; i++) {
        dates.push(startDate.clone().add(i, 'days').format('ddd, MMM D, YYYY'));
      }
      return dates;
    };

    const handleWeekChangeForUpdateTarget = (date) => {
      if (!date) {
        // If date is null (no week selected), clear the dates in initialData
        setWeekStartDateForUpdateTarget(null);
        setInitialDataForUpdateTarget((prevData) =>
          prevData.map((row) => ({
            ...row,
            date: '', // Clear the date for each row
          }))
        );
  
        setTimeRange({
        start_date: undefined,
        end_date: undefined,
      });
  
  
        return;
      }
    
  
   
      // Adjust start of the week to Monday and end to Sunday
      const startOfWeek = date.startOf('week').add(1, 'day'); // Monday
  
  
      const endOfWeek = startOfWeek.clone().add(6, 'days'); // Sunday
  
      setWeekStartDateForUpdateTarget(startOfWeek);
  
  
      setTimeRange({
      start_date: startOfWeek.format("YYYY-MM-DD"),
      end_date: endOfWeek.format("YYYY-MM-DD"),
    });
    
      // Get the week dates (Monday to Sunday)
      const weekDates = getWeekDates(startOfWeek);
    
      // Update initialDataForNewTarget with the selected week's dates
      setInitialDataForUpdateTarget((prevData) =>
        prevData.map((row, index) => ({
          ...row,
          date: weekDates[index] || '', // Update the date for each row
        }))
      );
    };

    const columnHeaders = [
      { label: "Date", key: "date" },
      { label: "Companies Approached", key: "companies_approached" },
      { label: "Companies Registered", key: "companies_registered" },
      { label: "Applications Received", key: "applications_received" },
      { label: "Job Posts", key: "job_posts" },
      { label: "Candidates Approached", key: "candidates_approached" },
      { label: "Candidates Registered", key: "candidates_registered" },
      { label: "Hirings", key: "hirings" },
    ];
  

  return (
    
    <>

    <BreadCrumb linkText="Targets" />
        
        <div className='container'>

            <div className = "header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{targetDetails?.name} ({formatUserType(targetDetails?.user_type)})</h3>

            <div className = "header-right-section" style={{ display: 'flex', alignItems: 'center', gap: "20px" }}>

            <DatePicker 
              style={{ width: '100%' }} // Example styling
              format={(value) =>
                `${value.startOf("week").add(1, "day").format("ddd MMM D, YYYY")} - ${value
                  .startOf("week")
                  .add(7, "days")
                  .format("ddd MMM D, YYYY")}`
              }
              placeholder="Select Week"
              allowClear
              onChange={handleWeekChange}
              picker="week" 
              defaultValue={dayjs()}
            />
            <button style = {{minWidth: "150px"}} className="createUserBtn" onClick={ () => {

                setUpdateTargetModalVisible(true);
                
                }}>
                Update Target
            </button>

            </div>

            </div>

            <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingTargetDetails}>


            <Table dataSource={dataSource} pagination={false} scroll={{ x: "max-content" }} bordered className="custom-table">
            <Table.Column title="Week" dataIndex="week" key="week" align="center" />
            <Table.Column title="Date" dataIndex="date" key="date" align="center" />
            
            {/* Companies Reached Out */}
            <Table.ColumnGroup title="Companies Reached Out" >
                <Table.Column title="Target" dataIndex="companiesReachedOutTarget" key="companiesReachedOutTarget" align="center" />
                <Table.Column title="Completed" dataIndex="companiesReachedOutCompleted" key="companiesReachedOutCompleted" align="center" />
            </Table.ColumnGroup>

            {/* Companies Sign Up */}
            <Table.ColumnGroup title="Companies Sign Up">
                <Table.Column title="Target" dataIndex="companiesSignUpTarget" key="companiesSignUpTarget" align="center" />
                <Table.Column title="Completed" dataIndex="companiesSignUpCompleted" key="companiesSignUpCompleted" align="center" />
            </Table.ColumnGroup>

            {/* Applications Received */}
            <Table.ColumnGroup title="Applications Received">
                <Table.Column title="Target" dataIndex="applicationsReceivedTarget" key="applicationsReceivedTarget" align="center" />
                <Table.Column title="Completed" dataIndex="applicationsReceivedCompleted" key="applicationsReceivedCompleted" align="center" />
            </Table.ColumnGroup>

            {/* Hirings */}
            <Table.ColumnGroup title="Hirings">
                <Table.Column title="Target" dataIndex="hiringsTarget" key="hiringsTarget" align="center" />
                <Table.Column title="Completed" dataIndex="hiringsCompleted" key="hiringsCompleted" align="center" />
            </Table.ColumnGroup>

            {/* Job Posts */}
            <Table.ColumnGroup title="Job Posts">
                <Table.Column title="Target" dataIndex="jobPostsTarget" key="jobPostsTarget" align="center" />
                <Table.Column title="Completed" dataIndex="jobPostsCompleted" key="jobPostsCompleted" align="center" />
            </Table.ColumnGroup>

            {/* Candidates Reached */}
            <Table.ColumnGroup title="Candidates Reached">
                <Table.Column title="Target" dataIndex="candidatesReachedTarget" key="candidatesReachedTarget" align="center" />
                <Table.Column title="Completed" dataIndex="candidatesReachedCompleted" key="candidatesReachedCompleted" align="center" />
            </Table.ColumnGroup>
            {/* Job Posts */}
            <Table.ColumnGroup title="Candidates Registered">
                <Table.Column title="Target" dataIndex="candidatesRegisteredTarget" key="candidatesRegisteredTarget" align="center" />
                <Table.Column title="Completed" dataIndex="candidatesRegisteredCompleted" key="candidatesRegisteredCompleted" align="center" />
            </Table.ColumnGroup>


            </Table>

            </Spin>

        </div>



        
        <Modal
      // title={<span className="custom-modal-title">Set New Targets</span>}
      visible={updateTargetModalVisible}
      onCancel={() => setUpdateTargetModalVisible(false)}
      footer={null}
      centered
      width = {1500}
      className="rounded-modal" // Apply custom styling class for rounded modal
      loading = {updatingTarget}
      bodyStyle={{
        
        overflowX: 'auto', // Enable horizontal scrolling
        maxWidth: '100%',
      }}
    >
      

      <div style={{ minWidth: '1300px' }}>


      <Formik
        initialValues={{ rows: initialDataForUpdateTarget }}
        validationSchema={newTargetValidationSchema}

        onSubmit={handleUpdateTarget}

        enableReinitialize
      >
        {({ values, handleChange, errors, touched }) => (
          

          <FormikForm>
      <div className="new-target-modal-container">
        <h2 className="custom-modal-title">Update Targets</h2>

        {/* Form Header */}
        <div className='form-header'>
          <h3>{selectedUserForUpdateTarget.combined}</h3>

          <Row gutter={16}>
            <Col span={8}>
              <DatePicker
                picker="week"
                onChange={handleWeekChangeForUpdateTarget}
                style={{ width: '100%', marginTop: '1px' }}
                placeholder="Select Week"
                defaultValue={weekStartDateForUpdateTarget ? moment(weekStartDateForUpdateTarget) : null}
                format={(value) =>
                  `${value.startOf("week").add(1, "day").format("ddd MMM D, YYYY")} - ${value
                    .startOf("week")
                    .add(7, "days")
                    .format("ddd MMM D, YYYY")}`
                }
                  
              />
            </Col>


          </Row>

        </div>

        {/* Header Row */}
        <div>
          <Row gutter={16} style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            {columnHeaders.map((header) => (
              <Col className="new-target-modal-header-col" span={3} key={header.key}>
                <div>{header.label}</div>
              </Col>
            ))}
          </Row>

          {/* Data Rows */}
          {values.rows.map((row, rowIndex) => (
            <Row gutter={16} key={rowIndex} style={{ marginBottom: '10px', alignItems: 'center' }}>
              {columnHeaders.map((header, columnIndex) => (
                <Col span={3} key={`${rowIndex}-${header.key}`}>
                  {header.key === "date" ? (
                    <div className="new-target-modal-data-row" style={{ color: "#3E6A9F" }}>
                      {row.date}
                    </div>
                  ) : (
                    <div className="new-target-modal-data-row">
                      <Field name={`rows[${rowIndex}].values[${columnIndex - 1}]`}>
                        {({ field }) => (
                          <Form.Item
                            validateStatus={errors.rows?.[rowIndex]?.values?.[columnIndex - 1] && touched.rows?.[rowIndex]?.values?.[columnIndex - 1] ? 'error' : ''}
                            help={errors.rows?.[rowIndex]?.values?.[columnIndex - 1] && touched.rows?.[rowIndex]?.values?.[columnIndex - 1] ? errors.rows[rowIndex].values[columnIndex - 1] : null}
                          >
                            <Input
                              {...field}
                              type="number"
                              placeholder={`Enter a number`}
                              onChange={(e) => handleChange(e)}
                            />
                          </Form.Item>
                        )}
                      </Field>
                    </div>
                  )}
                </Col>
              ))}
            </Row>
          ))}
        </div>

        {/* Footer */}
        <div className="new-target-modal-footer">
          <Button type="primary" htmlType="submit" className='custom-save-button' disabled = {updatingTarget}>
            Save
          </Button>
        </div>
      </div>
          </FormikForm>


        )}
      </Formik>



      </div>
      

    </Modal>


    </>
  )
}
