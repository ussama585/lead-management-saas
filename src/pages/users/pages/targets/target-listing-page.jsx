import { message } from '../../../../components/ui/notifications.jsx';
import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Button, Spin } from '../../../../components/ui/app-controls.jsx';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import moment from 'moment';
import formatDateUniversal from '../../../shared/utils/formatDate.js';

import { Trash2 as DeleteOutlined, LoaderCircle as LoadingOutlined } from 'lucide-react';
import { Row, Col, Form, Table, DatePicker } from 'antd';
import { Formik, Form as FormikForm, Field, ErrorMessage,useField  } from "formik";
import { newTargetValidationSchema } from '../../../shared/schemas/schema.js';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import '../../../../assets/styles/legacy/target-detail-page.css';
import { useQuery, useMutation, useQueryClient  } from 'react-query';
import { getTargetListing, getAllUsers, createNewTarget, getTargetForUser, updateTarget } from '../../../shared/services/stats-service.js';


const { Option } = Select;

export default function TargetListingPage() {


  const queryClient = useQueryClient();
  
  const defaultStartOfWeek = dayjs().startOf("week").add(1, "day"); // Monday
  const defaultEndOfWeek = defaultStartOfWeek.clone().add(6, "days"); // Sunday

    const [selectedUserForNewTarget, setSelectedUserForNewTarget] = useState({
      id: undefined,
      combined: undefined
    });

    const [selectedUserForUpdateTarget, setSelectedUserForUpdateTarget] = useState({
      id: undefined,
      combined: undefined
    });


    const [creatingNewTarget, setCreatingNewTarget] = useState(false);
    const [updatingTarget, setUpdatingTarget] = useState(false);

    const [newTargetModalVisible, setNewTargetModalVisible] = useState(false);
    const [updateTargetModalVisible, setUpdateTargetModalVisible] = useState(false);
    

    const [weekStartDateForNewTarget, setWeekStartDateForNewTarget] = useState(null);
    const [weekStartDateForUpdateTarget, setWeekStartDateForUpdateTarget] = useState(null);

    const [timeRange, setTimeRange] = useState({
        start_date: defaultStartOfWeek.format("YYYY-MM-DD"),
        end_date: defaultEndOfWeek.format("YYYY-MM-DD"),
      });


    const [timeRangeForUserTarget, setTimeRangeForUserTarget] = useState({
      start_date: undefined,
      end_date: undefined
    });


    const [initialDataForNewTarget, setInitialDataForNewTarget] = useState([
      { date: '', values: Array(7).fill("") }, // 8 fields for each date
      { date: '', values: Array(7).fill("") },
      { date: '', values: Array(7).fill("") },
      { date: '', values: Array(7).fill("") },
      { date: '', values: Array(7).fill("") },
      { date: '', values: Array(7).fill("") },
      { date: '', values: Array(7).fill("") },
    ]);


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
    


  
    const { mutate: mutateCreateNewTarget, isLoading, isError, error } = useMutation({
      mutationFn: createNewTarget,

      onMutate: () => {
        setCreatingNewTarget(true);
        // setNewTargetModalVisible(false);

        // queryClient.invalidateQueries(['targetListing']);

      },
      onSuccess: (data) => {

        console.log("Successfully Submitted Data");
        message.success("New Targets Created Successfully");

        queryClient.invalidateQueries(['targetListing']);

        setNewTargetModalVisible(false);
        
      },
      onError: (error) => {
        message.error("Something Went Wrong");
          
        console.error('Error Submitting Data', error);
      },
      onSettled: () => {
        setCreatingNewTarget(false);
      }
  });


  const { mutate: mutateUpdateTarget} = useMutation({
    mutationFn: updateTarget,

    onMutate: () => {
      setUpdatingTarget(true);
      // setNewTargetModalVisible(false);

      // queryClient.invalidateQueries(['targetListing']);

    },
    onSuccess: (data) => {

      console.log("Successfully Submitted Data");
      message.success("Targets Updated Successfully");

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


  const {data: targetListing, isLoading: loadingTargetListing} = useQuery({
    queryKey: ['targetListing', timeRange.start_date, timeRange.end_date],
    queryFn: () => getTargetListing(timeRange.start_date, timeRange.end_date),
    enabled: Boolean(timeRange.start_date && timeRange.end_date),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })



  const {data: targetForUser, isLoading: loadingTargetForUser} = useQuery({
    queryKey: ['targetForUser', selectedUserForUpdateTarget.id, timeRangeForUserTarget.start_date, timeRangeForUserTarget.end_date],
    queryFn: () => getTargetForUser(selectedUserForUpdateTarget.id, timeRangeForUserTarget.start_date, timeRangeForUserTarget.end_date),
    enabled: Boolean(timeRangeForUserTarget.start_date && timeRangeForUserTarget.end_date && selectedUserForUpdateTarget.id && selectedUserForUpdateTarget.combined),
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


  const {data: allUsers, isLoading: loadingAllUsers} = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => getAllUsers(),
    enabled: newTargetModalVisible || updateTargetModalVisible,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })


  const transformedDataForTargetListing = targetListing ? 
  Object.keys(targetListing).map(date => {
    return Object.keys(targetListing[date]).map(name => {
      const data = targetListing[date][name];
      return {
        key: data.id,  // Use the 'id' as the key
        weekRange: data.week,
        date: formatDateUniversal(data.date, false),
        name: name,
        companiesReachedOutTarget: data.companies_reached.target,
        companiesReachedOutCompleted: data.companies_reached.completed,
        companiesSignUpTarget: data.companies_registered.target,
        companiesSignUpCompleted: data.companies_registered.completed,
        applicationsReceivedTarget: data.applications_received.target,
        applicationsReceivedCompleted: data.applications_received.completed,
        hiringsTarget: data.hired.target,
        hiringsCompleted: data.hired.completed,
        jobPostsTarget: data.job_posted.target,
        jobPostsCompleted: data.job_posted.completed,
        candidatesReachedTarget: data.candidates_reached.target,
        candidatesReachedCompleted: data.candidates_reached.completed,
        candidatesRegisteredTarget: data.candidate_registered.target,
        candidatesRegisteredCompleted: data.candidate_registered.completed
      };
    });
  }).flat()
  : [];

  

  const handleRowClick = (record) => {

    console.log("Record: ", record);
    // setSelectedUser(record); // Set the clicked user data
    // setUpdateTargetModalVisible(true); // Open the modal
  };

  


  const getWeekDates = (startDate) => {
    if (!startDate) return [];
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(startDate.clone().add(i, 'days').format('ddd, MMM D, YYYY'));
    }
    return dates;
  };

  


  const handleWeekChangeForNewTarget = (date) => {
    if (!date) {
      // If date is null (no week selected), clear the dates in initialData
      setWeekStartDateForNewTarget(null);
      setInitialDataForNewTarget((prevData) =>
        prevData.map((row) => ({
          ...row,
          date: '', // Clear the date for each row
        }))
      );
      return;
    }
  
    // Adjust start of the week to Monday and end to Sunday
    const startOfWeek = date.startOf('week').add(1, 'day'); // Monday
    setWeekStartDateForNewTarget(startOfWeek);
  
    // Get the week dates (Monday to Sunday)
    const weekDates = getWeekDates(startOfWeek);
  
    // Update initialDataForNewTarget with the selected week's dates
    setInitialDataForNewTarget((prevData) =>
      prevData.map((row, index) => ({
        ...row,
        date: weekDates[index] || '', // Update the date for each row
      }))
    );
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

      setTimeRangeForUserTarget({
      start_date: undefined,
      end_date: undefined,
    });


      return;
    }
  

 
    // Adjust start of the week to Monday and end to Sunday
    const startOfWeek = date.startOf('week').add(1, 'day'); // Monday


    const endOfWeek = startOfWeek.clone().add(6, 'days'); // Sunday

    setWeekStartDateForUpdateTarget(startOfWeek);


    setTimeRangeForUserTarget({
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


  const handleSelectedUserForNewTargetChange = (value) => {

    if (value === undefined) {
      // If value is null (i.e., the user cleared the selection), reset the selected user
      setSelectedUserForNewTarget({
        id: undefined,
        combined: undefined
      });
    } else {
      // Find the selected user from the allUsers array
      const selectedUser = allUsers?.find((user) => user.id === value);
      
      // Set the selected user for new target
      if (selectedUser) {
        setSelectedUserForNewTarget({
          id: value,
          combined: selectedUser.combined
        });
      }
    }
  };


  const handleSelectedUserForUpdateTargetChange = (value) => {

    if (value === undefined) {
      // If value is null (i.e., the user cleared the selection), reset the selected user
      setSelectedUserForUpdateTarget({
        id: undefined,
        combined: undefined
      });
    } else {
      // Find the selected user from the allUsers array
      const selectedUser = allUsers?.find((user) => user.id === value);
      
      // Set the selected user for new target
      if (selectedUser) {
        setSelectedUserForUpdateTarget({
          id: value,
          combined: selectedUser.combined
        });
      }
    }
  };


  const submitNewTarget = (values) => {
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

    
    if(selectedUserForNewTarget.id === undefined){
      message.error("Select user");
      return;
    }


    if(weekStartDateForNewTarget === null){
      message.error("Select date");
      return;
    }
  
    const apiData = {
      user: selectedUserForNewTarget.id,
      targets: submittedData,
    };
  
    console.log("After Mutation");
  
    if (submittedData.length <= 0) {
      message.error("Assign at least one target");
    } else {
      mutateCreateNewTarget(apiData);
    }
  
    // Trigger the mutation
    console.log("Data to be submitted: ", apiData);
  };


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
    
    <div className = "listing-container">

    
    <div className="btn-container">

    {/* <button className="createUserBtn" onClick={ () => {

    setNewTargetModalVisible(true);

    }}>
    Add Target

    </button> */}


    <button className="createUserBtn" onClick={ () => {

    setUpdateTargetModalVisible(true);

    }}>
    Update Target

    </button>
   
      {/* Week selector dropdown */}
      <div className="week-selector">
        

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

      </div>


    </div>

      {/* Target listing table */}

      <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingTargetListing}>
      
      
      <Table
        dataSource={transformedDataForTargetListing}
        pagination={false}
        scroll={{
            x: 2100, // Horizontal scroll for wide tables (set to 'max-content' if needed)
            y: 500,  // Vertical scroll (height in pixels)
          }}
    
        bordered
        className="custom-table"
        onRow={(record) => ({
            onClick: () => handleRowClick(record), // Detect row click
          })}

        rowClassName={() => 'clickable-row'}

        >
        <Table.Column
        title="#"
        key="sr"
        render={(text, record, index) => index + 1} // Show index + 1 as Sr#
        align="center"
        width={60}
        />
        <Table.Column
          title="Week"
          dataIndex="weekRange"
          key="weekRange"
          align="center"
        />
        <Table.Column title = "Date" dataIndex="date" key="date" width={200} align="center" />
        <Table.Column title = "Name" dataIndex="name" key="name" align="center" />
        <Table.ColumnGroup title="Companies Reached Out">
          <Table.Column
            title="Target"
            dataIndex="companiesReachedOutTarget"
            key="companiesReachedOutTarget"
            align="center"
            
          />
          <Table.Column
            title="Completed"
            dataIndex="companiesReachedOutCompleted"
            key="companiesReachedOutCompleted"
            align="center"
          />
        </Table.ColumnGroup>
        <Table.ColumnGroup title="Companies Sign Up">
          <Table.Column
            title="Target"
            dataIndex="companiesSignUpTarget"
            key="companiesSignUpTarget"
            align="center"
          />
          <Table.Column
            title="Completed"
            dataIndex="companiesSignUpCompleted"
            key="companiesSignUpCompleted"
            align="center"
          />
        </Table.ColumnGroup>
        <Table.ColumnGroup title="Applications Received">
          <Table.Column
            title="Target"
            dataIndex="applicationsReceivedTarget"
            key="applicationsReceivedTarget"
            align="center"
          />
          <Table.Column
            title="Completed"
            dataIndex="applicationsReceivedCompleted"
            key="applicationsReceivedCompleted"
            align="center"
          />
        </Table.ColumnGroup>
        <Table.ColumnGroup title="Hirings">
          <Table.Column
            title="Target"
            dataIndex="hiringsTarget"
            key="hiringsTarget"
            align="center"
          />
          <Table.Column
            title="Completed"
            dataIndex="hiringsCompleted"
            key="hiringsCompleted"
            align="center"
          />
        </Table.ColumnGroup>
        <Table.ColumnGroup title="Job Posts">
          <Table.Column
            title="Target"
            dataIndex="jobPostsTarget"
            key="jobPostsTarget"
            align="center"
          />
          <Table.Column
            title="Completed"
            dataIndex="jobPostsCompleted"
            key="jobPostsCompleted"
            align="center"
          />
        </Table.ColumnGroup>
        <Table.ColumnGroup title="Candidates Reached">
          <Table.Column
            title="Target"
            dataIndex="candidatesReachedTarget"
            key="candidatesReachedTarget"
            align="center"
          />
          <Table.Column
            title="Completed"
            dataIndex="candidatesReachedCompleted"
            key="candidatesReachedCompleted"
            align="center"
          />
        </Table.ColumnGroup>
        <Table.ColumnGroup title="Candidates Registered">
          <Table.Column
            title="Target"
            dataIndex="candidatesRegisteredTarget"
            key="candidatesRegisteredTarget"
            align="center"
          />
          <Table.Column
            title="Completed"
            dataIndex="candidatesRegisteredCompleted"
            key="candidatesRegisteredCompleted"
            align="center"
          />
        </Table.ColumnGroup>
      </Table> 

      </Spin>

    </div>

    
    {/* New Target Modal  */}

    <Modal
      // title={<span className="custom-modal-title">Set New Targets</span>}
      visible={newTargetModalVisible}
      onCancel={() => setNewTargetModalVisible(false)}
      footer={null}
      centered
      width = {1500}
      className="rounded-modal" // Apply custom styling class for rounded modal
      loading = {creatingNewTarget}
      bodyStyle={{
        overflowX: 'auto', // Enable horizontal scrolling
        maxWidth: '100%',
      }}
    >
    

      <div style={{ minWidth: '1300px' }}>


      <Formik
        initialValues={{ rows: initialDataForNewTarget }}
        validationSchema={newTargetValidationSchema}

        onSubmit={submitNewTarget}

        enableReinitialize
      >
        {({ values, handleChange, errors, touched }) => (
          

          <FormikForm>
      <div className="new-target-modal-container">
        <h2 className="custom-modal-title">Set New Targets</h2>

        {/* Form Header */}
        <div className='form-header'>
          <h3>{selectedUserForNewTarget.combined}</h3>
          <Row gutter={16}>
            <Col span={8}>
              <DatePicker
                picker="week"
                onChange={handleWeekChangeForNewTarget}
                style={{ width: '100%', marginTop: '1px' }}
                placeholder="Select Week"
                defaultValue={weekStartDateForNewTarget ? moment(weekStartDateForNewTarget) : null}
                format={(value) =>
                  `${value.startOf("week").add(1, "day").format("ddd MMM D, YYYY")} - ${value
                    .startOf("week")
                    .add(7, "days")
                    .format("ddd MMM D, YYYY")}`
                }
                
              />
            </Col>
            <Col span={8}>
              <Select
                value={selectedUserForNewTarget.id}
                onChange={handleSelectedUserForNewTargetChange}
                style={{ width: '100%' }}
                placeholder="Select User"
                allowClear
                loading={loadingAllUsers}
              >
                {allUsers?.map((user) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.combined}
                  </Select.Option>
                ))}
              </Select>
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
          <Button type="primary" htmlType="submit" className='custom-save-button' disabled = {creatingNewTarget}>
            Add
          </Button>
        </div>
      </div>
    </FormikForm>


        )}
      </Formik>



      </div>
      

    </Modal>

    

    {/* Edit Target Modal  */}

    <Modal
      // title={<span className="custom-modal-title">Set New Targets</span>}
      visible={updateTargetModalVisible}
      onCancel={() => {

        setUpdateTargetModalVisible(false);
        setWeekStartDateForUpdateTarget(null);

      }}
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


            <Col span={8}>
              <Select
                value={selectedUserForUpdateTarget.id}
                onChange={handleSelectedUserForUpdateTargetChange}
                style={{ width: '100%' }}
                placeholder="Select User"
                allowClear
                loading={loadingAllUsers}
              >
                {allUsers?.map((user) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.combined}
                  </Select.Option>
                ))}
              </Select>
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

  );
}
