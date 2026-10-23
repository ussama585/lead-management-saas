import React from 'react';
import { Alert, Modal, Button, Tooltip } from 'antd';
import { useQuery } from 'react-query';
import { History as HistoryOutlined } from 'lucide-react';
import formatDateUniversal from '../pages/shared/utils/formatDate.js';
import '../assets/styles/legacy/table-client-actions.css';

const THEME_PRIMARY = '#3E6A9F';

const prettifyFieldName = (field) => {
  if (!field) return 'Updated';
  return String(field)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

const formatAuditValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return '—';

    // Format ISO-like date/datetime strings using the shared date formatter.
    if (ISO_DATE_RE.test(raw)) {
      const timeMatch = raw.match(/(\d{2}):(\d{2})(:(\d{2}))?/);
      const isMidnight = timeMatch && timeMatch[1] === '00' && timeMatch[2] === '00' && (!timeMatch[4] || timeMatch[4] === '00');
      const showTime = !!timeMatch && !isMidnight;
      const formatted = formatDateUniversal(raw, showTime);
      if (formatted) return formatted;
    }

    // Format common status-like literals into Title Case.
    if (/^[a-z0-9_\-\s]+$/i.test(raw)) {
      return raw
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return raw;
  }
  return String(value);
};

const pickHistoryDate = (historyItem, preferredKey) => {
  if (!historyItem || typeof historyItem !== 'object') return null;
  const candidateKeys = [
    preferredKey,
    'changed_at',
    'updated_at',
    'created_at',
    'date',
    'datetime',
    'timestamp',
  ].filter(Boolean);

  for (const key of candidateKeys) {
    const value = historyItem?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value;
    }
  }
  return null;
};


const StatusHistoryModal = ({
  open,
  entity,
  onClose,
  fetchHistoryApi,
  getEntityId = (e) => e?.id,
  title,
  getTitleFromEntity = (e) => e?.company_name || e?.name || 'Item',
  renderSummary,
  historyStatusKey = 'status',
  historyDateKey = 'updated_at',
  recordsFilter,
  renderHistoryItem,
  formatDate: formatDateProp,
  emptyMessage = 'No status history available.',
  queryKeyPrefix = 'statusHistory',
  modalWidth = 600,
}) => {
  const entityId = getEntityId(entity);
  const formatDate = formatDateProp ?? ((dateVal, showTime = true) => formatDateUniversal(dateVal, showTime));

  const {
    data: historyData,
    isLoading: loadingHistory,
    isError,
    error,
    refetch,
  } = useQuery(
    [queryKeyPrefix, entityId ?? 'all'],
    () => fetchHistoryApi(entityId),
    {
      enabled: open && entityId != null,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const modalTitle =
    typeof title === 'function' ? title(entity) : title ?? `Status History - ${getTitleFromEntity(entity) || 'Item'}`;

  const allHistory = Array.isArray(historyData) ? historyData : [];
  const filteredHistory =
    typeof recordsFilter === 'function' ? allHistory.filter((item) => recordsFilter(item, entity)) : allHistory;
  const hasHistory = filteredHistory.length > 0;

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          type="primary"
          onClick={onClose}
          style={{ background: THEME_PRIMARY, borderColor: THEME_PRIMARY }}
        >
          Close
        </Button>,
      ]}
      width={modalWidth}
    >
      {loadingHistory ? (
        <div style={{ textAlign: 'center', padding: '20px', color: THEME_PRIMARY }}>
          <span>Loading status history...</span>
        </div>
      ) : isError ? (
        <Alert type="error" showIcon message={error?.response?.data?.message || error?.message || 'Could not load history.'}
          action={<Button onClick={() => refetch()}>Retry</Button>} />
      ) : (
        <div>
          {hasHistory ? (
            <div>
              {renderSummary && entity && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: `${THEME_PRIMARY}12`,
                    borderRadius: '4px',
                    borderLeft: `4px solid ${THEME_PRIMARY}`,
                  }}
                >
                  {renderSummary(entity)}
                </div>
              )}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {filteredHistory.map((historyItem, index) => {
                  if (typeof renderHistoryItem === 'function') {
                    return (
                      <div key={index}>
                        {renderHistoryItem(historyItem, index)}
                      </div>
                    );
                  }

                  const isAuditItem = !!historyItem?.change && typeof historyItem.change === 'object';
                  const auditField = historyItem?.change?.field;
                  const auditOld = historyItem?.change?.old;
                  const auditNew = historyItem?.change?.new;
                  const changedBy = historyItem?.changed_by;
                  const dateValue = pickHistoryDate(historyItem, historyDateKey);
                  const dateText = dateValue ? formatDate(dateValue, true) : '—';

                  return (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #e8e8e8',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {isAuditItem ? (
                          <>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: THEME_PRIMARY }}>
                              {prettifyFieldName(auditField)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                              <strong>Old:</strong> {formatAuditValue(auditOld)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              <strong>New:</strong> {formatAuditValue(auditNew)}
                            </div>
                            {changedBy ? (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                <strong>By:</strong> {changedBy}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <div style={{ fontWeight: '500', fontSize: '14px', color: THEME_PRIMARY }}>
                            {historyItem?.[historyStatusKey]}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
                        {dateText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              {allHistory.length > 0 && filteredHistory.length === 0
                ? 'History found, but no matching records for this item.'
                : emptyMessage}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

/**
 * Returns a table column config that shows a "Status History" button and triggers onOpenHistory(row.original).
 * Use with StatusHistoryModal: keep modal state in the page and pass the same open/entity/onClose and fetchHistoryApi to the modal.
 *
 * @param {function} onOpenHistory - (entity) => void - Called when the button is clicked
 * @param {string} [header='Status History'] - Column header
 * @param {string} [accessorKey='status_history'] - Column accessor key
 * @param {string} [buttonTitle='View Status History'] - Button tooltip/title
 */
export const createStatusHistoryColumn = ({
  onOpenHistory,
  header = 'Status History',
  accessorKey = 'status_history',
  buttonTitle = 'View Status History',
}) => ({
  header,
  accessorKey,
  enableSorting: false,
  Cell: ({ row }) => (
    <Tooltip title={<span style={{ color: '#fff' }}>{buttonTitle}</span>}>
      <HistoryOutlined size="1em"
        className={["app-icon", "table-icon-action table-icon-action--history"].filter(Boolean).join(' ')}
        onClick={() => onOpenHistory(row.original)}
        aria-label={buttonTitle}
      />
    </Tooltip>
  ),
});

export default StatusHistoryModal;
