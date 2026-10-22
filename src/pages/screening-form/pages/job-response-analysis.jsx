import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Card, Spin, message, Modal, Row, Col, Statistic, Button, Dropdown } from 'antd';
import { User as UserOutlined, CircleCheck as CheckCircleOutlined, Clock as ClockCircleOutlined, FileText as FilePdfOutlined, Download as DownloadOutlined, LoaderCircle as LoadingOutlined } from 'lucide-react';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../components/tables/new-table.jsx';
import { getJobScreeningResponses, getJobScreeningResponsesByPath, getJobBatchScreeningResponsesByPath } from '../../shared/services/headhunting.js';
import { formatDateTime, formatDate } from '../../shared/utils/formatDate.js';

const JobResponseAnalysis = () => {
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const resumeId = searchParams.get('resume_id');

  const isSingleResponse = email != null || resumeId != null;
  const isBatchResponse = false;
  const isJobResponse = true;

  const goBack = () => {
    navigate(-1);
  };
  const [questionModal, setQuestionModal] = useState({ visible: false, question: '' });
  const [answerModal, setAnswerModal] = useState({ visible: false, answer: '', question: '' });

  // Table state management for Material React Table
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 1000 });
  const [sorting, setSorting] = useState([]);

  // Reset pagination when sorting changes
  useEffect(() => {
    if (sorting.length > 0 && pagination.pageIndex !== 0) {
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }
  }, [sorting, pagination.pageIndex]);

  // Map table column id to backend sort field name
  const getBackendSortField = (columnId) => {
    const map = {
      responseNumber: 'id',
      name: 'resume_name',
      mobile: 'resume_phone',
      created_at: 'created_at',
    };
    if (map[columnId] !== undefined) return map[columnId];
    // Check if it's a numeric string (question_id)
    if (columnId && !isNaN(columnId)) return `question_${columnId}`;
    return null;
  };

  // Sort params for backend (non-batch) or for refetch key in batch scenario
  const sortParams = useMemo(() => {
    if (!sorting || sorting.length === 0) return {};
    const first = sorting[0];
    const sortBy = getBackendSortField(first?.id);
    if (!sortBy) return {};
    return {
      sort_by: sortBy,
      order: first.desc ? 'desc' : 'asc',
    };
  }, [sorting]);

  const { data: responsesData, isLoading, error } = useQuery(
    [
      'jobScreeningResponses',
      jobId,
      email,
      resumeId,
      sortParams?.sort_by ?? '',
      sortParams?.order ?? '',
      pagination.pageIndex,
      pagination.pageSize
    ],
    () => {
      if (isSingleResponse) {
        return getJobScreeningResponses(jobId, email ?? '', resumeId ?? '');
      }
      if (isBatchResponse) {
        return getJobBatchScreeningResponsesByPath(jobId, sortParams);
      }
      // Job response list: use job-screening-responses/{jobId} with pagination
      const apiParams = {
        ...sortParams,
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
      };
      return getJobScreeningResponsesByPath(jobId, apiParams);
    },
    {
      enabled: !!jobId,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const normalizedData = useMemo(() => {
    if (!responsesData) return responsesData;

    if (isSingleResponse && !responsesData.batches && !responsesData.responses && !responsesData.results) {
      return responsesData;
    }

    // New API format: { results, count, next, previous, current_page, total_pages }
    if (isJobResponse && responsesData.results) {
      return {
        responses: responsesData.results,
        total_responses: responsesData.count ?? responsesData.results?.length ?? 0,
        ...responsesData,
      };
    }

    if (isJobResponse && responsesData.responses) {
      return responsesData;
    }

    if (isBatchResponse && responsesData.batches) {
      let responses = responsesData.batches.flatMap((batch) =>
        (batch.resumes || []).map((item) => {
          const r = item.response;
          const batchName = batch.batch_name ?? '';
          if (r && (r.id != null || r.resume_name != null || r.answers?.length)) {
            return { ...r, batch_name: batchName };
          }
          return {
            id: item.job_resume_id,
            resume_id: item.resume_id,
            resume_name: null,
            resume_phone: null,
            created_at: null,
            answers: r?.answers ?? [],
            batch_name: batchName,
          };
        })
      );

      // Client-side sort for batch scenario
      if (sorting && sorting.length > 0) {
        const { id: sortField, desc } = sorting[0];

        responses = [...responses].sort((a, b) => {
          let aVal, bVal;
          if (sortField === 'responseNumber') {
            return 0;
          }
          if (sortField === 'name') {
            aVal = a?.resume_name ?? '';
            bVal = b?.resume_name ?? '';
          } else if (sortField === 'mobile') {
            aVal = a?.resume_phone ?? '';
            bVal = b?.resume_phone ?? '';
          } else if (sortField === 'created_at') {
            aVal = a?.created_at ?? '';
            bVal = b?.created_at ?? '';
          } else if (sortField && !isNaN(sortField)) {
            // sortField is the question_id (as a string/number)
            const numericId = Number(sortField);
            aVal = a?.answers?.find((ans) => ans.question_id === numericId)?.value ?? '';
            bVal = b?.answers?.find((ans) => ans.question_id === numericId)?.value ?? '';
          } else {
            return 0;
          }

          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
          }
          const aNum = new Date(aVal).getTime();
          const bNum = new Date(bVal).getTime();
          if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
            return desc ? bNum - aNum : aNum - bNum;
          }
          return desc ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
        });
      }

      return {
        ...responsesData,
        responses,
        total_responses: responsesData.total_resumes ?? responses.length,
      };
    }

    if (isJobResponse && responsesData.responses) {
      return responsesData;
    }

    return responsesData;
  }, [responsesData, isSingleResponse, isBatchResponse, isJobResponse, sorting]);

  // Helper function to format time only
  const formatTime = (rawTime) => {
    if (!rawTime) return '';
    const date = new Date(rawTime);
    if (isNaN(date.getTime())) return '';

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };

  const getQuestionDefinitions = () => {
    const responses = isSingleResponse ? [normalizedData] : normalizedData?.responses;
    if (!responses || responses.length === 0) return [];

    const map = new Map(); // key -> { key, text }
    let fallbackIndex = 0;

    responses.forEach((response) => {
      (response?.answers || []).forEach((answer) => {
        const key =
          answer?.question_id != null ? String(answer.question_id) : `q_fallback_${fallbackIndex++}`;
        if (!map.has(key)) {
          map.set(key, { key, text: answer?.question_text || '' });
        }
      });
    });

    const defs = Array.from(map.values());
    const countsByText = defs.reduce((acc, d) => {
      const t = d.text || '';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    // Keep columns unique without exposing IDs in the header.
    // For duplicate question texts, append a stable (1), (2), ... suffix.
    const seenIndexByText = {};
    return defs.map((d) => {
      const t = d.text || '';
      if (countsByText[t] > 1) {
        const next = (seenIndexByText[t] || 0) + 1;
        seenIndexByText[t] = next;
        return { ...d, header: `${t} (${next})` };
      }
      return { ...d, header: t };
    });
  };

  const generateTableColumns = () => {
    const responses = isSingleResponse ? [normalizedData] : normalizedData?.responses;
    if (!responses || responses.length === 0) return [];

    console.log('=== GENERATING COLUMNS ===');


    const questionDefs = getQuestionDefinitions();
    console.log('All Questions for columns:', questionDefs);

    const columns = [

      {
        accessorKey: 'responseNumber',
        header: '#',
        size: 60,
        Cell: ({ cell }) => <span style={{ fontWeight: 500 }}>{cell.getValue()}</span>
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
        Cell: ({ cell }) => <span style={{ fontSize: '12px' }}>{cell.getValue() || '-'}</span>
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile',
        size: 120,
        Cell: ({ cell }) => <span style={{ fontSize: '12px' }}>{cell.getValue() || '-'}</span>
      }
    ];

    questionDefs.forEach(({ key, text, header }) => {
      const accessorKey = String(key);
      console.log(`Adding column with accessorKey: "${accessorKey}"`);

      columns.push({
        accessorKey, // Must be a string to avoid TanStack Table error
        header: header || text,
        size: 200,
        Cell: ({ cell }) => {
          const data = cell.getValue();
          console.log(`Rendering cell for key "${accessorKey}":`, data);
          if (!data || !data.value) return <span style={{ color: '#ccc' }}>-</span>;

          const { value, type, question: qText } = data;

          // Check if value is a URL (file) - check if it starts with http:// or https://
          if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
            return (
              <Button
                type="link"
                size="small"
                icon={<FilePdfOutlined size="1em" className="app-icon" style={{ fontSize: '18px', color: '#ff4d4f' }} />}
                onClick={() => {
                  const newWindow = window.open(value, '_blank', 'noopener,noreferrer');
                  if (newWindow) {
                    newWindow.opener = null;
                  }
                }}
                style={{ padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Open file in new tab"
              />
            );
          }

          // For date type questions, format as date only
          if ((type === 'date' || type === 'datePicker') && value) {
            try {
              const formattedDate = formatDate(value);
              return <span style={{ fontSize: '12px' }}>{formattedDate}</span>;
            } catch (e) {
              return <span>{value}</span>;
            }
          }

          // For time type questions, format as time only
          if (type === 'time' && value) {
            try {
              const formattedTime = formatTime(value);
              return <span style={{ fontSize: '12px' }}>{formattedTime}</span>;
            } catch (e) {
              return <span>{value}</span>;
            }
          }

          // For datetime type questions, format as date and time
          if ((type === 'datetime' || type === 'dateTime' || type === 'dateTimePicker') && value) {
            try {
              const formattedDateTime = formatDateTime(value);
              return <span style={{ fontSize: '12px' }}>{formattedDateTime}</span>;
            } catch (e) {
              return <span>{value}</span>;
            }
          }

          // For paragraph (long answer) type, show view button
          if (type === 'paragraph' && value) {
            return (
              <Button
                type="link"
                size="small"
                onClick={() => setAnswerModal({ visible: true, answer: value, question: qText })}
                style={{ padding: 0, fontSize: '12px' }}
              >
                View Answer
              </Button>
            );
          }

          // Handle checkboxes array
          if (typeof value === 'string' && value.startsWith('[')) {
            try {
              if (value.includes("'")) {
                const matches = value.match(/'([^']+)'/g);
                return <span>{matches ? matches.map(m => m.slice(1, -1)).join(', ') : value}</span>;
              }
              const parsed = JSON.parse(value);
              return <span>{Array.isArray(parsed) ? parsed.join(', ') : value}</span>;
            } catch (e) {
              const matches = value.match(/'([^']+)'/g);
              return <span>{matches ? matches.map(m => m.slice(1, -1)).join(', ') : value}</span>;
            }
          }

          return <span>{value}</span>;
        }
      });
    });

    // Add "Submitted At" column at the end
    columns.push({
      accessorKey: 'created_at',
      header: 'Submitted At',
      size: 180,
      Cell: ({ cell }) => <span style={{ fontSize: '12px', color: '#666' }}>
        {formatDateTime(cell.getValue())}
      </span>
    });

    console.log('=== FINAL COLUMNS ===', columns.map(c => ({ accessor: c.accessorKey, header: c.header })));
    return columns;
  };

  const generateTableData = () => {
    const responses = isSingleResponse ? [normalizedData] : normalizedData?.responses;
    if (!responses || responses.length === 0) return [];

    console.log('=== GENERATING TABLE DATA ===');
    console.log('Responses:', responses);

    const questionDefs = getQuestionDefinitions();
    console.log('All Questions:', questionDefs);

    const baseNumber = isJobResponse && normalizedData?.results
      ? pagination.pageIndex * pagination.pageSize
      : 0;

    const data = responses.map((response, responseIndex) => {
      console.log(`Processing response ${responseIndex}:`, response);

      const rowData = {
        key: response?.id || `response_${responseIndex}`,
        ...(isBatchResponse && { batch_name: response?.batch_name ?? '' }),
        responseNumber: baseNumber + responseIndex + 1,
        name: response?.resume_name || '',
        mobile: response?.resume_phone || '',
        created_at: response?.created_at
      };

      // Add answer data for each question using question_id (or fallback key)
      questionDefs.forEach(({ key, text }) => {
        const answer =
          !isNaN(key)
            ? response?.answers?.find((ans) => String(ans.question_id) === String(key))
            : response?.answers?.find(
              (ans) => ans.question_id == null && ans.question_text === text
            );

        rowData[String(key)] = {
          value: answer?.value || null,
          type: answer?.question_type || null,
          question: text
        };
      });

      console.log('Final rowData:', rowData);
      return rowData;
    });

    console.log('=== FINAL TABLE DATA ===', data);
    return data;
  };

  const tableData = generateTableData();

  const getStatsCards = () => {
    if (!normalizedData) return [];

    const responses = isSingleResponse ? [normalizedData] : normalizedData?.responses;
    const totalResponses = isSingleResponse ? 1 : (normalizedData.total_responses || responses?.length || 0);
    const totalQuestions = responses?.reduce((total, response) =>
      total + (response?.answers?.length || 0), 0) || 0;
    const uniqueQuestions = new Set();
    responses?.forEach(response => {
      response?.answers?.forEach(answer => {
        uniqueQuestions.add(answer.question_text);
      });
    });

    return [
      {
        title: resumeId ? 'Response' : 'Total Responses',
        value: totalResponses,
        icon: <UserOutlined size="1em" className="app-icon" />,
        color: '#3E6A9F'
      },
      {
        title: 'Total Answers',
        value: totalQuestions,
        icon: <CheckCircleOutlined size="1em" className="app-icon" />,
        color: '#52c41a'
      },
      {
        title: 'Unique Questions',
        value: uniqueQuestions.size,
        icon: <ClockCircleOutlined size="1em" className="app-icon" />,
        color: '#faad14'
      }
    ];
  };

  // Export functions
  const formatValueForExport = (value, type) => {
    if (!value) return '';

    // Handle date type - format as date only
    if ((type === 'date' || type === 'datePicker') && value) {
      try {
        return formatDate(value);
      } catch (e) {
        return String(value);
      }
    }

    // Handle time type - format as time only
    if (type === 'time' && value) {
      try {
        return formatTime(value);
      } catch (e) {
        return String(value);
      }
    }

    // Handle datetime type - format as date and time
    if ((type === 'datetime' || type === 'dateTime' || type === 'dateTimePicker') && value) {
      try {
        return formatDateTime(value);
      } catch (e) {
        return String(value);
      }
    }

    // Handle file types - just show the URL or filename
    if ((type === 'file' || type === 'fileUpload' || type === 'file_upload') && value) {
      const fileUrl = typeof value === 'string' ? value : (value.url || value);
      return fileUrl;
    }

    // Handle array values (checkboxes)
    if (typeof value === 'string' && value.startsWith('[')) {
      try {
        if (value.includes("'")) {
          const matches = value.match(/'([^']+)'/g);
          return matches ? matches.map(m => m.slice(1, -1)).join(', ') : value;
        }
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.join(', ') : value;
      } catch (e) {
        const matches = value.match(/'([^']+)'/g);
        return matches ? matches.map(m => m.slice(1, -1)).join(', ') : value;
      }
    }

    return String(value);
  };

  const exportToCSV = () => {
    try {
      const tableData = generateTableData();

      if (!tableData || tableData.length === 0) {
        message.info('No data to export.');
        return;
      }

      const questionDefs = getQuestionDefinitions();

      const headers = ['#', 'Name', 'Mobile', ...questionDefs.map(q => q.header), 'Submitted At'];

      const csvRows = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')];

      tableData.forEach((row) => {
        const rowData = [row.responseNumber || '', row.name || '', row.mobile || ''];

        // Add answers for each question using the key
        questionDefs.forEach((q) => {
          const answerData = row?.[q.key] || null;
          const value = answerData?.value || '';
          const type = answerData?.type || '';
          rowData.push(formatValueForExport(value, type));
        });

        // Add submitted at with time
        const submittedAt = row.created_at ? formatDateTime(row.created_at) : '';
        rowData.push(submittedAt);

        csvRows.push(rowData.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
      });

      const csvContent = csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `response-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 0);

      message.success('Data exported to CSV successfully!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data to CSV.');
    }
  };

  const exportToGoogleSpreadsheet = async () => {
    try {
      const tableData = generateTableData();

      if (!tableData || tableData.length === 0) {
        message.info('No data to export.');
        return;
      }

      const questionDefs = getQuestionDefinitions();

      const numCols = 3 + questionDefs.length + 1; // #, Name, Mobile, questions, Submitted At
      const excelHeaders = ['#', 'Name', 'Mobile', ...questionDefs.map(q => q.header), 'Submitted At'];

      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Response Analysis');

      // Header row
      const headerRow = worksheet.addRow(excelHeaders);
      headerRow.font = { bold: true };

      const submittedAtColIndex = numCols;

      const addDataRow = (rowData) => {
        const row = worksheet.addRow(rowData);
        const lastCell = row.getCell(submittedAtColIndex);
        if (lastCell.value && lastCell.value instanceof Date) {
          lastCell.numFmt = 'm/d/yyyy h:mm AM/PM';
        }
      };

      if (isBatchResponse) {
        const batchOrder = [];
        const byBatch = new Map();
        tableData.forEach((row) => {
          const name = row.batch_name ?? '';
          if (!byBatch.has(name)) {
            batchOrder.push(name);
            byBatch.set(name, []);
          }
          byBatch.get(name).push(row);
        });

        // Reverse batches so the last batch appears first in Excel
        const reversedBatchOrder = [...batchOrder].reverse();

        reversedBatchOrder.forEach((batchName, reversedIndex) => {
          const batchIndex = batchOrder.indexOf(batchName);
          const rows = byBatch.get(batchName);
          if (!rows || rows.length === 0) return;

          // Before each batch in the final Excel (except very first): blank row + styled batch label row
          if (reversedIndex > 0) {
            worksheet.addRow(Array(numCols).fill(''));
            const label = batchName ? `${batchName}` : `${batchIndex + 1}`;
            const batchLabelRow = worksheet.addRow([label, ...Array(numCols - 1).fill('')]);
            worksheet.mergeCells(batchLabelRow.number, 1, batchLabelRow.number, numCols);
            batchLabelRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF000000' },
            };
            batchLabelRow.font = {
              color: { argb: 'FFFFFFFF' },
              bold: true,
            };
          }

          // Data rows: # restarts at 1 per batch
          rows.forEach((row, idx) => {
            const rowData = [
              idx + 1,
              row.name || '',
              row.mobile || '',
            ];
            questionDefs.forEach((q) => {
              const answerData = row?.[q.key] || null;
              const value = answerData?.value || '';
              const type = answerData?.type || '';
              rowData.push(formatValueForExport(value, type));
            });
            rowData.push(
              row.created_at
                ? (() => {
                  const date = new Date(row.created_at);
                  return isNaN(date.getTime()) ? '' : date;
                })()
                : ''
            );
            addDataRow(rowData);
          });
        });
      } else {
        tableData.forEach((row) => {
          const rowData = [
            row.responseNumber || '',
            row.name || '',
            row.mobile || '',
          ];
          questionDefs.forEach((q) => {
            const answerData = row?.[q.key] || null;
            const value = answerData?.value || '';
            const type = answerData?.type || '';
            rowData.push(formatValueForExport(value, type));
          });
          rowData.push(
            row.created_at
              ? (() => {
                const date = new Date(row.created_at);
                return isNaN(date.getTime()) ? '' : date;
              })()
              : ''
          );
          addDataRow(rowData);
        });
      }

      // Column widths
      const colWidths = [
        { width: 5 },   // #
        { width: 20 },  // Name
        { width: 15 },  // Mobile
        ...questionDefs.map(() => ({ width: 30 })),
        { width: 25 },  // Submitted At
      ];
      worksheet.columns = colWidths;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `google-spreadsheet-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 0);

      message.success('Data exported for Google Spreadsheet successfully!');
    } catch (error) {
      console.error('Google Spreadsheet Export Error:', error);
      message.error('Failed to export data for Google Spreadsheet.');
    }
  };

  const exportToExcel = async () => {
    try {
      const tableData = generateTableData();

      if (!tableData || tableData.length === 0) {
        message.info('No data to export.');
        return;
      }

      const questionDefs = getQuestionDefinitions();

      const numCols = 3 + questionDefs.length + 1; // #, Name, Mobile, questions, Submitted At
      const excelHeaders = ['#', 'Name', 'Mobile', ...questionDefs.map(q => q.header), 'Submitted At'];

      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Response Analysis');

      // Header row
      const headerRow = worksheet.addRow(excelHeaders);
      headerRow.font = { bold: true };

      const submittedAtColIndex = numCols;

      const addDataRow = (rowData) => {
        const row = worksheet.addRow(rowData);
        const lastCell = row.getCell(submittedAtColIndex);
        if (lastCell.value && lastCell.value instanceof Date) {
          lastCell.numFmt = 'm/d/yyyy h:mm AM/PM';
        }
      };

      if (isBatchResponse) {
        const batchOrder = [];
        const byBatch = new Map();
        tableData.forEach((row) => {
          const name = row.batch_name ?? '';
          if (!byBatch.has(name)) {
            batchOrder.push(name);
            byBatch.set(name, []);
          }
          byBatch.get(name).push(row);
        });

        // Reverse batches so the last batch appears first in Excel
        const reversedBatchOrder = [...batchOrder].reverse();

        reversedBatchOrder.forEach((batchName, reversedIndex) => {
          const batchIndex = batchOrder.indexOf(batchName);
          const rows = byBatch.get(batchName);
          if (!rows || rows.length === 0) return;

          // Before each batch in the final Excel (except very first): blank row + styled batch label row
          if (reversedIndex > 0) {
            worksheet.addRow(Array(numCols).fill(''));
            const label = batchName ? `${batchName}` : `${batchIndex + 1}`;
            const batchLabelRow = worksheet.addRow([label, ...Array(numCols - 1).fill('')]);
            worksheet.mergeCells(batchLabelRow.number, 1, batchLabelRow.number, numCols);
            batchLabelRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF000000' },
            };
            batchLabelRow.font = {
              color: { argb: 'FFFFFFFF' },
              bold: true,
            };
          }

          // Data rows: # restarts at 1 per batch
          rows.forEach((row, idx) => {
            const rowData = [
              idx + 1,
              row.name || '',
              row.mobile || '',
            ];
            questionDefs.forEach((q) => {
              const answerData = row?.[q.key] || null;
              const value = answerData?.value || '';
              const type = answerData?.type || '';
              rowData.push(formatValueForExport(value, type));
            });
            rowData.push(
              row.created_at
                ? (() => {
                  const date = new Date(row.created_at);
                  return isNaN(date.getTime()) ? '' : date;
                })()
                : ''
            );
            addDataRow(rowData);
          });
        });
      } else {
        tableData.forEach((row) => {
          const rowData = [
            row.responseNumber || '',
            row.name || '',
            row.mobile || '',
          ];
          questionDefs.forEach((q) => {
            const answerData = row?.[q.key] || null;
            const value = answerData?.value || '';
            const type = answerData?.type || '';
            rowData.push(formatValueForExport(value, type));
          });
          rowData.push(
            row.created_at
              ? (() => {
                const date = new Date(row.created_at);
                return isNaN(date.getTime()) ? '' : date;
              })()
              : ''
          );
          addDataRow(rowData);
        });
      }

      // Column widths
      const colWidths = [
        { width: 5 },   // #
        { width: 20 },  // Name
        { width: 15 },  // Mobile
        ...questionDefs.map(() => ({ width: 30 })),
        { width: 25 },  // Submitted At
      ];
      worksheet.columns = colWidths;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `response-analysis-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 0);

      message.success('Data exported to Excel successfully!');
    } catch (error) {
      console.error('Excel Export Error:', error);
      message.error('Failed to export data to Excel.');
    }
  };

  if (error) {
    return (
      <>
        <BreadCrumb goBack={goBack} linkText={resumeId ? "Individual Response" : "Public CV Responses"} />
        <div style={{ padding: '2rem', color: '#b3261e' }}>
          <h6>Unable to load response analysis</h6>
          <p>{error?.message || "Something went wrong."}</p>
        </div>
      </>
    );
  }

  return (
    <div>
      <BreadCrumb goBack={goBack} linkText={resumeId ? "Individual Response" : "Public CV Responses"} />
      <Spin spinning={isLoading} indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large">
        <style>
          {`
          .response-analysis-table .MuiTableCell-root {
            border: 1px solid #e0e0e0 !important;
          }
          .response-analysis-table .MuiTableHead-root .MuiTableCell-root {
            border: 1px solid #d0d0d0 !important;
            background-color: #f5f5f5;
          }
        `}
        </style>

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h2 style={{ margin: 0 }}>{resumeId ? 'Individual Response Analysis' : 'Screening Questionnaire Response Analysis'}</h2>
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'excel',
                      label: 'Export to Excel',
                      icon: <DownloadOutlined size="1em" className="app-icon" />,
                      onClick: exportToExcel,
                    },
                    {
                      key: 'google-spreadsheet',
                      label: 'Export to Google Spreadsheet',
                      icon: <DownloadOutlined size="1em" className="app-icon" />,
                      onClick: exportToGoogleSpreadsheet,
                    },
                  ],
                }}
                placement="bottomRight"
              >
                <Button
                  type="primary"
                  icon={<DownloadOutlined size="1em" className="app-icon" />}
                  style={{
                    background: '#3E6A9F',
                    borderColor: '#3E6A9F',
                  }}
                >
                  Export
                </Button>
              </Dropdown>
            </div>
            <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
              <p style={{ color: '#666', margin: 0 }}>
                Job ID: {jobId}
              </p>
              {resumeId && (
                <>
                  <p style={{ color: '#666', margin: 0 }}>
                    CV ID: {resumeId}
                  </p>
                  <p style={{ color: '#666', margin: 0 }}>
                    Response ID: {responsesData?.id}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            {getStatsCards().map((stat, index) => (
              <Col span={8} key={index}>
                <Card>
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    prefix={stat.icon}
                    valueStyle={{ color: stat.color }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* Responses Table */}
          <Card className="response-analysis-table">
            <NewTableComponent
              columns={generateTableColumns()}
              data={tableData}
              totalCount={resumeId ? 1 : (normalizedData?.total_responses || 0)}
              heading={resumeId ? "Screening Questionnaire Response" : "Screening Questionnaire Responses"}
              pagination={pagination}
              onPaginationChange={setPagination}
              onPageSizeChange={(pageSize) => setPagination(prev => ({ ...prev, pageSize }))}
              sorting={sorting}
              onSortingChange={setSorting}
              isLoading={isLoading}
              enableRowSelection={false}
              enableGlobalFilter={false}
              enablePagination={false}
            />
          </Card>

        </div>
      </Spin>

      {/* Question Modal */}
      <Modal
        title="Full Question Text"
        open={questionModal.visible}
        onCancel={() => setQuestionModal({ visible: false, question: '' })}
        footer={[
          <Button key="close" onClick={() => setQuestionModal({ visible: false, question: '' })}>
            Close
          </Button>
        ]}
        width={600}
      >
        <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          {questionModal.question}
        </div>
      </Modal>

      {/* Answer Modal for Long Responses */}
      <Modal
        title={`Answer for: ${answerModal.question}`}
        open={answerModal.visible}
        onCancel={() => setAnswerModal({ visible: false, answer: '', question: '' })}
        footer={[
          <Button key="close" onClick={() => setAnswerModal({ visible: false, answer: '', question: '' })}>
            Close
          </Button>
        ]}
        width={700}
      >
        <div style={{
          padding: '16px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {answerModal.answer || 'No answer provided'}
        </div>
      </Modal>
    </div>
  );
};

export default JobResponseAnalysis;
