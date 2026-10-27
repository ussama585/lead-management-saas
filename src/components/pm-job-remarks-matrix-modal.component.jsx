import { Modal } from './ui/app-modal.jsx';
import { Spin } from './ui/app-controls.jsx';
import React from 'react';
import { Empty, Tag, Collapse } from 'antd';
import { LoaderCircle as LoadingOutlined, MessageSquare as MessageOutlined, Clock as ClockCircleOutlined } from 'lucide-react';
import { useQuery } from 'react-query';
import { getProjectJobRemarksMatrix } from '../pages/shared/services/headhunting.js';
import './pm-job-remarks-matrix-modal.component.css';

const { Panel } = Collapse;

const statusColors = {
  Active: 'success',
  Pending: 'warning',
  Completed: 'processing',
  Terminated: 'error',
  Inactive: 'default',
};

const formatTimestamp = (createdAt) => {
  if (!createdAt) return null;
  try {
    const d = new Date(createdAt);
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    return `${time}, ${date}`;
  } catch {
    return null;
  }
};

const PmJobRemarksMatrixModal = ({ visible, projectId, onClose, companyName }) => {
  const { data, isLoading } = useQuery(
    ['pmJobRemarksMatrix', projectId],
    () => getProjectJobRemarksMatrix(projectId),
    { enabled: visible && !!projectId, refetchOnWindowFocus: false }
  );

  const jobs = data?.data || [];
  const allKeys = jobs.map((j) => String(j.id));
  const [activeKeys, setActiveKeys] = React.useState(null);

  const resolvedKeys = activeKeys === null ? allKeys : activeKeys;

  return (
    <Modal
      title={
        <div className="pm-remarks-modal-title">
          <MessageOutlined size="1em" className="app-icon" style={{ color: '#3E6A9F', fontSize: 16 }} />
          <span className="pm-remarks-modal-title-text">
            {jobs[0]?.company_name || companyName || 'Job Remarks'}
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width="65vw"
      style={{ maxWidth: 860 }}
      styles={{ body: { padding: '16px 24px 24px', maxHeight: '72vh', overflowY: 'auto' } }}
      destroyOnClose
      centered
    >
      <Spin spinning={isLoading} indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />}>
        {!isLoading && jobs.length === 0 && (
          <Empty description="No jobs found for this project." style={{ margin: '32px 0' }} />
        )}

        {jobs.length > 0 && (
          <Collapse
            accordion={false}
            activeKey={resolvedKeys}
            onChange={setActiveKeys}
            bordered={false}
            className="pm-remarks-collapse"
          >
            {jobs.map((job) => {
              const remarks = Array.isArray(job.remarks) ? job.remarks : [];

              return (
                <Panel
                  key={String(job.id)}
                  className="pm-remarks-panel"
                  header={
                    <div className="pm-remarks-panel-header">
                      <span className="pm-remarks-panel-title">{job.job_title}</span>
                      <Tag color={statusColors[job.status] || 'default'} style={{ margin: 0, fontSize: 11 }}>
                        {job.status}
                      </Tag>
                      <span className="pm-remarks-count-badge">{remarks.length}</span>
                    </div>
                  }
                >
                  {remarks.length === 0 ? (
                    <p className="pm-remarks-empty">No remarks yet.</p>
                  ) : (
                    <div className="pm-remarks-list">
                      {remarks.map((item, idx) => {
                        const remarkNumber = remarks.length - idx;
                        const remarkText = item?.remark ?? String(item ?? '');
                        const remarkTime = formatTimestamp(item?.created_at);
                        return (
                          <div key={idx} className="pm-remark-item">
                            <div className="pm-remark-item-header">
                              <span className="pm-remark-number">Remark {remarkNumber}</span>
                              {remarkTime && (
                                <span className="pm-remark-time">{remarkTime}</span>
                              )}
                            </div>
                            <p className="pm-remark-text">{remarkText}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Panel>
              );
            })}
          </Collapse>
        )}
      </Spin>
    </Modal>
  );
};

export default PmJobRemarksMatrixModal;
