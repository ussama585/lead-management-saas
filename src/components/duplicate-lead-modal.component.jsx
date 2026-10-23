import React, { useMemo } from 'react';
import { Modal, Button, Descriptions, Typography, Space, Spin, Alert } from 'antd';
import { Info as InfoCircleOutlined, Eye as EyeOutlined } from 'lucide-react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../pages/shared/store/user-store.js';
import { getMetaLeadDuplicateLeads } from '../pages/shared/services/metaLeads.js';
import { getLeadGenerationDuplicateLeads } from '../pages/shared/services/leads.js';
import { getDataLeadDuplicateLeads } from '../pages/shared/services/data-leads-service.js';
import formatDateUniversal from '../pages/shared/utils/formatDate.js';

const { Title } = Typography;

const fetchDuplicateLeadsByType = async (leadType, id) => {
  if (!id) return [];

  let raw;
  switch (leadType) {
    case 'meta-leads':
      raw = await getMetaLeadDuplicateLeads(id);
      break;
    case 'data-leads':
      raw = await getDataLeadDuplicateLeads(id);
      break;
    case 'website-leads':
    default:
      raw = await getLeadGenerationDuplicateLeads(id);
  }

  const value = raw?.data != null ? raw.data : raw;
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

function LeadCard({ lead: L, leadType, title, isFirst, duplicateOf }) {
  const navigate = useNavigate();
  const { user } = useUserStore();

  const effectiveLeadType = useMemo(() => {
    // 1. Trust L.source from API if it exists
    const s = String(L.source || '').toLowerCase();
    if (s.includes('meta')) return 'meta-leads';
    if (s.includes('data')) return 'data-leads';
    if (s.includes('website')) return 'website-leads';

    // 2. If no source field, trust the provided leadType context (e.g. from the page where modal is opened)
    // This prevents a website lead with utm_source="meta" from being classified as a meta-lead incorrectly
    if (leadType === 'meta-leads' || leadType === 'data-leads' || leadType === 'website-leads') {
      return leadType;
    }

    // 3. Fallback to guessing from UTM source only if no other context
    const utm = String(L.utm_source || '').toLowerCase();
    if (utm.includes('meta') || utm.includes('facebook') || utm.includes('instagram')) return 'meta-leads';
    if (utm.includes('data')) return 'data-leads';
    if (utm.includes('website')) return 'website-leads';

    return 'website-leads';
  }, [L.source, L.utm_source, leadType]);

  const handleViewDetails = () => {
    const id = L.id ?? L.lead_id;
    if (!id) return;

    let routePrefix = '';
    const userType = user?.user_type;

    if (userType === 'super_admin') {
      routePrefix = '/admin';
    } else if (userType === 'sales_manager') {
      routePrefix = '/sales-manager';
    } else if (userType === 'sales_executive') {
      routePrefix = '/sales-executive';
    } else if (userType === 'marketing_manager') {
      routePrefix = '/marketing_manager';
    } else {
      routePrefix = '/admin';
    }

    let url = '';
    if (effectiveLeadType === 'meta-leads') {
      url = `${routePrefix}/meta-leads/${id}`;
    } else if (effectiveLeadType === 'data-leads') {
      url = `/data-lead/${id}`;
    } else {
      url = `${routePrefix}/leads/${id}`;
    }
    navigate(url);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <Title level={5} style={{ margin: 0, color: '#666' }}>{title}</Title>
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined size="1em" className="app-icon" />}
          onClick={handleViewDetails}
          style={{ backgroundColor: '#3e6a9f', borderColor: '#3e6a9f' }}
        >
          View Details
        </Button>
      </div>
      {duplicateOf != null && (
        <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
          Duplicate of lead ID: {duplicateOf}
        </div>
      )}
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Created At">
          {formatDateUniversal(L.created_at || L.created_time || L.created_time_format, true) || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="ID">{L.id || L.lead_id || '-'}</Descriptions.Item>
        <Descriptions.Item label="Lead Name">
          {L.full_name || L.contact_person_name || L.name || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Company Name">{L.company_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="Source">
          {L.source || (effectiveLeadType === 'meta-leads' ? 'Meta' : effectiveLeadType === 'data-leads' ? 'Data' : 'Website')}
        </Descriptions.Item>
        {leadType === 'meta-leads' && effectiveLeadType === 'meta-leads' && (
          <Descriptions.Item label="Campaign Name">
            {L.campaign_name || L.utm_campaign || '-'}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Phone Number">{L.phone_number || '-'}</Descriptions.Item>
        <Descriptions.Item label="Email">{L.work_email || L.email || '-'}</Descriptions.Item>
        <Descriptions.Item label="Status">{L.status || '-'}</Descriptions.Item>
        <Descriptions.Item label="Assigned To">
          {L.assigned_to_name ? (
            <Space>
              <span>{L.assigned_to_name}</span>
              {L.assigned_to_type && (
                <span style={{ color: '#666' }}>
                  ({L.assigned_to_type === 'sales_executive' ? 'Executive' : L.assigned_to_type === 'sales_manager' ? 'Manager' : L.assigned_to_type})
                </span>
              )}
            </Space>
          ) : (
            'Unassigned'
          )}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
}

export default function DuplicateLeadModal({ visible, lead, onClose, leadType = 'meta-leads' }) {
  const leadId = lead?.id ?? lead?.lead_id ?? null;

  const {
    data: duplicatesRaw,
    isLoading,
    isError,
    error,
  } = useQuery(
    ['duplicate-leads', leadType, leadId],
    () => fetchDuplicateLeadsByType(leadType, leadId),
    {
      enabled: visible && !!leadId,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const duplicates = useMemo(
    () => Array.isArray(duplicatesRaw) ? duplicatesRaw : [],
    [duplicatesRaw]
  );

  if (!lead) return null;

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined size="1em" className="app-icon" style={{ color: '#faad14' }} />
          <span>Duplicate Lead Information</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={700}
    >
      <div style={{ padding: '8px 0' }}>
        <LeadCard
          lead={lead}
          leadType={leadType}
          title={`Current Lead (ID: ${lead?.id ?? lead?.lead_id ?? '—'})`}
          isFirst
        />

        {isLoading && duplicates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '12px', color: '#666' }}>Loading duplicate chain...</p>
          </div>
        ) : isError ? (
          <Alert
            message="Error Loading Lead"
            description={error?.message || 'Failed to fetch duplicate leads. Please try again later.'}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : duplicates.length > 0 ? (
          (() => {
            const normalizedCurrentId = leadId;
            const sorted = [...duplicates].sort((a, b) => {
              if (a.id === normalizedCurrentId) return -1;
              if (b.id === normalizedCurrentId) return 1;
              return 0;
            });

            const shown = new Set([normalizedCurrentId]);

            return sorted.map((L, index) => {
              const id = L.id ?? L.lead_id;
              if (id != null && shown.has(id)) {
                return null;
              }
              if (id != null) {
                shown.add(id);
              }

              const title = `Duplicate Lead (ID: ${id ?? '—'})`;

              return (
                <LeadCard
                  key={id ?? index}
                  lead={L}
                  leadType={leadType}
                  title={title}
                  isFirst={false}
                  duplicateOf={undefined}
                />
              );
            });
          })()
        ) : null}

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fffbe6', borderRadius: '4px', border: '1px solid #ffe58f' }}>
          <Title level={5} style={{ margin: '0 0 8px 0', color: '#ad6800' }}>
            Duplicate Information
          </Title>
          <p style={{ margin: 0, color: '#614700' }}>
            This lead has been marked as a duplicate of the original lead shown above. Please review the information and take appropriate action.
          </p>
        </div>
      </div>
    </Modal>
  );
}

