import { message } from '../../components/ui/notifications.jsx';
import { Modal } from '../../components/ui/app-modal.jsx';
import { Select } from '../../components/ui/app-select.jsx';
import { Input } from '../../components/ui/app-controls.jsx';
import { Button, Spin } from '../../components/ui/app-controls.jsx';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import moment from 'moment';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { Trash2 as DeleteOutlined, LoaderCircle as LoadingOutlined } from 'lucide-react';
import { Row, Col, Form, Table, DatePicker } from 'antd';
import { Formik, Form as FormikForm, Field, ErrorMessage, useField } from "formik";
import { newTargetValidationSchema } from '../shared/schemas/schema.js';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getTargetDetails, getTargetDetailsByDate } from '../shared/services/stats-service.js';
import '../../assets/styles/legacy/target-detail-page.css';
import useUserStore from '../shared/store/user-store.js';
import SetTargetModal from './components/set-target-modal.jsx';


const { Option } = Select;

export default function TargetListingPage() {

  const defaultStartOfWeek = dayjs().startOf("week").add(1, "day"); // Monday
  const defaultEndOfWeek = defaultStartOfWeek.clone().add(6, "days"); // Sunday

  const { user } = useUserStore();
  const { id, slug } = user;

  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const [timeRange, setTimeRange] = useState({
    start_date: defaultStartOfWeek.format("YYYY-MM-DD"),
    end_date: defaultEndOfWeek.format("YYYY-MM-DD"),
  });
  
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

  };


  const { data: targetForUser, isLoading: loadingTargetForUser, refetch: refetchTargets } = useQuery({
    queryKey: ['targetForUser', timeRange.start_date, timeRange.end_date],
    queryFn: () => getTargetDetailsByDate(id, timeRange.start_date, timeRange.end_date),
    enabled: timeRange.start_date !== undefined && timeRange.end_date !== undefined,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const transformedDataForTargetListing = targetForUser?.results.map((target) => ({
    key: target.id, // Add a unique key for each row
    date: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(target.date)), // Format the date
    week: target.week, // Add the week information
    // name: targetForUser.name, // Add the manager name
    companiesReachedOutTarget: target.companies_reached.target ?? "-", // Use nullish coalescing
    companiesReachedOutCompleted: target.companies_reached.completed ?? "-", // Use actual completed value
    companiesSignUpTarget: target.companies_registered.target ?? "-", // Use nullish coalescing
    companiesSignUpCompleted: target.companies_registered.completed ?? "-", // Use actual completed value
    applicationsReceivedTarget: target.applications_received.target ?? "-", // Use nullish coalescing
    applicationsReceivedCompleted: target.applications_received.completed ?? "-", // Use actual completed value
    hiringsTarget: target.hired.target ?? "-", // Use nullish coalescing
    hiringsCompleted: target.hired.completed ?? "-", // Use actual completed value
    jobPostsTarget: target.job_posted.target ?? "-", // Use nullish coalescing
    jobPostsCompleted: target.job_posted.completed ?? "-", // Use actual completed value
    candidatesReachedTarget: target.candidates_reached.target ?? "-", // Use nullish coalescing
    candidatesReachedCompleted: target.candidates_reached.completed ?? "-", // Use actual completed value
    candidatesRegisteredTarget: target.candidate_registered.target ?? "-", // Use nullish coalescing
    candidatesRegisteredCompleted: target.candidate_registered.completed ?? "-", // Use actual completed value
  })) ?? [];





  return (

    <>

      <BreadCrumb linkText="Targets" />

      <div className="listing-container">


        <div className="btn-container">

          <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingTargetForUser}>

            <h2>{targetForUser?.name ?? ""}</h2>

          </Spin>

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

            <Button className='createUserBtn' variant='filled' type='primary' onClick={() => showModal()}>Add Target</Button>

          </div>


        </div>

        {/* Target listing table */}

        <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" spinning={loadingTargetForUser}>


          <Table
            dataSource={transformedDataForTargetListing}
            pagination={false}
            scroll={{
              x: 2100, // Horizontal scroll for wide tables (set to 'max-content' if needed)
              y: 500,  // Vertical scroll (height in pixels)
            }}

            bordered
            className="custom-table"

            rowClassName={() => 'clickable-row'}

          >
            <Table.Column
              title="#"
              key="sr"
              render={(text, record, index) => index + 1} // Show index + 1 as Sr#
              align="center"
              width={60}
            />
            <Table.Column title="Week" dataIndex="week" key="week" align="center" />
            <Table.Column title="Date" dataIndex="date" key="date" width={200} align="center" />
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

        <SetTargetModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} refetchTargets={refetchTargets} />
      </div>


    </>

  );
}
