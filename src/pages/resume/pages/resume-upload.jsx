import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { X as CloseIcon } from 'lucide-react';
import { sha256 } from "js-sha256";
import NewTableComponent from "../../../components/tables/new-table.jsx";
import {
  requestResumeUpload,
  completeResumeUpload,
} from "../../shared/services/resume_services.js";
import BreadCrumb from "../../../components/breadcrumb.component.jsx";

const styles = {
  page: {
    fontFamily: 'Inter, sans-serif',
    maxWidth: 1200,
    margin: "0 auto",
    padding: "1rem",
  },
  uploadBox: {
    border: "2px dashed #3e6a9f",
    borderRadius: "0.75rem",
    padding: "1.5rem",
    textAlign: "center",
    background: "#f4f7fb",
  },
};

const ResumeUpload = () => {
  const [activityFeed, setActivityFeed] = useState([]);
  const [selectedFilesInfo, setSelectedFilesInfo] = useState([]);
  const [fileMetadata, setFileMetadata] = useState({});
  const [presignedResults, setPresignedResults] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tablePagination, setTablePagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [tableSorting, setTableSorting] = useState([]);
  const [tableGlobalFilter, setTableGlobalFilter] = useState("");
  const fileMapRef = useRef({});
  const navigate = useNavigate();

  const getStatusCategory = useCallback((record) => {
    if (
      record.upload_status === "uploaded" ||
      record.status === "uploaded"
    ) {
      return "completed";
    }
    if (
      record.status === "exists" ||
      record.status === "skipped" ||
      record.status === "pending" ||
      record.upload_status === "skipped"
    ) {
      return "skipped";
    }
    return "failed";
  }, []);

  const pushActivity = useCallback((message, tone = "info", context = {}) => {
    setActivityFeed((prev) => {
      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        message,
        tone,
        timestamp: new Date().toLocaleTimeString(),
        ...context,
      };
      return [entry, ...prev].slice(0, 20);
    });
  }, []);

  const recordError = useCallback(
    (message, context = {}) => {
      pushActivity(message, "error", context);
    },
    [pushActivity],
  );

  const handleFileChange = useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;

      pushActivity(`Selected ${files.length} file(s)`, "info");

      const newFilesPayload = [];
      const newMetadata = {};

      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const hash = sha256(new Uint8Array(buffer));

        if (fileMapRef.current[hash]) {
          pushActivity(`Duplicate skipped: ${file.name}`, "warning");
          continue;
        }

        const contentType = file.type || "application/pdf";
        const payloadItem = {
          file_hash: hash,
          filename: file.name,
          content_type: contentType,
        };

        fileMapRef.current[hash] = file;
        newFilesPayload.push(payloadItem);
        newMetadata[hash] = {
          file_hash: hash,
          filename: file.name,
          size: file.size,
          content_type: contentType,
        };

        pushActivity(`Prepared ${file.name}`, "success");
      }

      if (!newFilesPayload.length) return;

      setSelectedFilesInfo((prev) => [
        ...prev,
        ...Object.values(newMetadata),
      ]);
      setFileMetadata((prev) => ({ ...prev, ...newMetadata }));
      setPendingPayload((prev) => {
        const previous = prev?.files || [];
        return { files: [...previous, ...newFilesPayload] };
      });
    },
    [pushActivity],
  );

  const handleUpload = useCallback(async () => {
    if (!pendingPayload?.files?.length) {
      pushActivity("Please select files to upload first.", "warning");
      return;
    }

    setIsProcessing(true);
    setActivityFeed([]);
    setUploadResults([]);
    setPresignedResults([]);

    let serverResponse;

    try {
      pushActivity("Requesting presigned URLs…", "info");
      serverResponse = await requestResumeUpload(pendingPayload);
      const responseResults = serverResponse.results || [];
      setPresignedResults(responseResults);
      responseResults
        .filter((item) => item.status === "exists")
        .forEach((item) => {
          recordError(item.message || "Resume already uploaded", {
            fileName: `Resume #${item.resume_id || "N/A"}`,
            status: item.status,
          });
        });
      pushActivity("Presigned URLs received", "success");
    } catch (error) {
      recordError(`Request upload failed: ${error}`);
      setIsProcessing(false);
      return;
    }

    const finalResults = [];
    pushActivity("Uploading to storage…", "info");

    for (const item of serverResponse.results || []) {
      const record = {
        resume_id: item.resume_id,
        file_hash: item.file_hash,
          filename:
            fileMetadata[item.file_hash]?.filename || item.filename || null,
        s3_key: item.s3_key,
        upload_status: "skipped",
        get_url: item.get_url,
        status: item.status,
        message: item.message,
      };

      if (!["new", "pending"].includes(item.status)) {
        finalResults.push(record);
        pushActivity(
          `Skipped ${item.file_hash} (${item.status})`,
          "warning",
        );
        continue;
      }

      const localFile = fileMapRef.current[item.file_hash];
      if (!localFile) {
        record.upload_status = "error_file_missing";
        finalResults.push(record);
        recordError(`Local file missing for hash ${item.file_hash}`, {
          fileName: fileMetadata[item.file_hash]?.filename,
        });
        continue;
      }

      try {
        const buffer = await localFile.arrayBuffer();
        const put = await fetch(item.put_url, {
          method: "PUT",
          headers: {
            "Content-Type": localFile.type || "application/pdf",
          },
          body: buffer,
        });

        record.upload_status = put.ok
          ? "uploaded"
          : `error_${put.status}`;

        pushActivity(
          put.ok
            ? `Uploaded ${localFile.name}`
            : `Upload issue for ${localFile.name}`,
          put.ok ? "success" : "warning",
        );
      } catch (error) {
        record.upload_status = "upload_exception";
        recordError(`Upload failed: ${error}`, { fileName: localFile.name });
      }

      finalResults.push(record);
    }

    setUploadResults(finalResults);

    try {
      pushActivity("Confirming uploads with API…", "info");
      const completeData = await completeResumeUpload(finalResults);
      pushActivity("Server confirmation received", "success");
      let mergedResults = finalResults;
      if (completeData?.results?.length) {
        mergedResults = finalResults.map((entry) => {
          const match = completeData.results.find(
            (item) => item.resume_id === entry.resume_id,
          );
          if (!match) return entry;
          return {
            ...entry,
            status: match.status,
            message: match.message || entry.message,
          };
        });
        completeData.results.forEach((item) => {
          if (item.status && item.status !== "uploaded") {
            recordError(item.message || "Unknown error", {
              fileName: `Resume #${item.resume_id || "N/A"}`,
              status: item.status,
            });
          }
        });
      }
      setUploadResults(mergedResults);
      if (completeData?.errors?.length) {
        completeData.errors.forEach((msg) =>
          recordError(`STEP 4: ${msg}`),
        );
      }
    } catch (error) {
      recordError(`Complete upload failed: ${error}`);
    } finally {
      setIsProcessing(false);
      pushActivity("Workflow finished", "success");
      handleClearSelectedFiles();
    }
  }, [fileMetadata, pendingPayload, pushActivity, recordError]);

  const handleRemoveSelectedFile = useCallback((hash) => {
    setSelectedFilesInfo((prev) =>
      prev.filter((file) => file.file_hash !== hash),
    );
    setFileMetadata((prev) => {
      const next = { ...prev };
      delete next[hash];
      return next;
    });
    setPendingPayload((prev) => {
      if (!prev?.files) return prev;
      const filtered = prev.files.filter((file) => file.file_hash !== hash);
      return filtered.length ? { files: filtered } : null;
    });
    delete fileMapRef.current[hash];
  }, []);

  const handleClearSelectedFiles = useCallback(() => {
    setSelectedFilesInfo([]);
    setPendingPayload(null);
    fileMapRef.current = {};
  }, []);

  const statusCounts = useMemo(
    () =>
      uploadResults.reduce(
        (acc, record) => {
          const category = getStatusCategory(record);
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        { completed: 0, skipped: 0, failed: 0 },
      ),
    [getStatusCategory, uploadResults],
  );

  const summaryCards = useMemo(() => {
    const total = uploadResults.length;

    return [
      {
        label: "Total Resumes",
        value: total,
        subtitle: "Tracked",
      },
      {
        label: "Completed",
        value: statusCounts.completed,
        subtitle: "Uploaded",
      },
      {
        label: "Skipped",
        value: statusCounts.skipped,
        subtitle: "Already processed",
      },
      {
        label: "Failed",
        value: statusCounts.failed,
        subtitle: "Needs attention",
      },
    ];
  }, [statusCounts, uploadResults.length]);

  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "resume",
        header: "Resume",
        size: 260,
      },
      {
        accessorKey: "statusLabel",
        header: "Status",
        size: 140,
        Cell: ({ row }) => (
          <Chip
            size="small"
            label={row.original.statusLabel}
            sx={{
              backgroundColor: `${row.original.statusColor}22`,
              color: row.original.statusColor,
              fontWeight: 600,
            }}
          />
        ),
      },
      {
        accessorKey: "details",
        header: "Details",
        size: 420,
      },
    ],
    [],
  );

  const tableData = useMemo(() => {
    const colorMap = {
      completed: "#2e7d32",
      skipped: "#c77800",
      failed: "#c62828",
    };
    const statusTextMap = {
      completed: "Completed",
      skipped: "Skipped",
      failed: "Failed",
    };

    return uploadResults.map((record) => {
      const category = getStatusCategory(record);
      const fallbackMessage =
        category === "completed"
          ? "Uploaded successfully."
          : category === "skipped"
            ? "Skipped by server."
            : "Upload failed.";

      return {
        id: `${record.file_hash}-${record.resume_id || record.status}`,
        resume:
          record.filename ||
          fileMetadata[record.file_hash]?.filename ||
          `Resume #${record.resume_id || "N/A"}`,
        statusLabel: statusTextMap[category],
        statusColor: colorMap[category],
        details: record.message || fallbackMessage,
      };
    });
  }, [fileMetadata, getStatusCategory, uploadResults]);

  const errorLogs = useMemo(
    () =>
      uploadResults.filter(
        (record) => getStatusCategory(record) === "failed",
      ),
    [getStatusCategory, uploadResults],
  );

  return (
    <>
      <BreadCrumb linkText="CVs Upload" goBack={() => navigate(-1)} />
      <Box component="main" sx={styles.page}>
     

      <Box mt={3} sx={styles.uploadBox}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Upload PDF files (multiple selection supported)
        </Typography>
        <Button
          component="label"
          variant="contained"
          sx={{
            backgroundColor: "#3e6a9f",
            "&:hover": { backgroundColor: "#2d5a8a" },
          }}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing…" : "Select Resume Files"}
          <input
            type="file"
            accept=".pdf,application/pdf"
            hidden
            multiple
            onChange={handleFileChange}
          />
        </Button>
        {isProcessing && (
          <Stack direction="row" spacing={1} alignItems="center" mt={2} justifyContent="center">
            <CircularProgress size={22} />
            
          </Stack>
        )}
      </Box>
      <Box mt={3} sx={{ border: "1px solid #e1e8f5", borderRadius: "0.75rem", p: 2 }}>
        <Typography variant="subtitle2" sx={{ color: "#6f7c9b", mb: 1 }}>
          Progress
        </Typography>
        {isProcessing ? (
          <LinearProgress
            sx={{ height: 6, borderRadius: "999px", backgroundColor: "#f1f4fb" }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Waiting for uploads.
          </Typography>
        )}
      </Box>
      {selectedFilesInfo.length > 0 && (
        <Box mt={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography variant="h6" sx={{ color: "#3e6a9f" }}>
              Selected Files
            </Typography>
            <Button
              size="small"
              color="error"
              onClick={handleClearSelectedFiles}
              disabled={isProcessing}
            >
              Remove All
            </Button>
          </Stack>
          <Grid container spacing={2}>
            {selectedFilesInfo.map((file) => (
              <Grid item xs={12} sm={6} md={4} key={file.file_hash}>
                <Card
                  sx={{
                    borderRadius: "0.75rem",
                    border: "1px solid #e1e8f5",
                    height: "100%",
                    position: "relative",
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveSelectedFile(file.file_hash)}
                    sx={{ position: "absolute", top: 4, right: 4 }}
                    disabled={isProcessing}
                  >
                    <CloseIcon size="1em" className="app-icon"  style={{ fontSize: 20 }} />
                  </IconButton>
                  <CardContent sx={{ pr: 4 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {file.filename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                      {file.content_type}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box mt={2} textAlign="right">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#3e6a9f", "&:hover": { backgroundColor: "#2d5a8a" } }}
              disabled={isProcessing || !pendingPayload?.files?.length}
              onClick={handleUpload}
            >
              {isProcessing ? "Uploading..." : "Upload Selected Files"}
            </Button>
          </Box>
        </Box>
      )}
      <Grid container spacing={2} mt={2}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card
              sx={{
                borderRadius: "0.75rem",
                border: "1px solid #e1e8f5",
              }}
            >
              <CardContent>
                <Typography variant="overline" sx={{ color: "#6f7c9b" }}>
                  {card.label}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ color: "#3e6a9f", fontWeight: 700 }}
                >
                  {card.value}
                </Typography>
                <Typography variant="body2" sx={{ color: "#8a8fa3" }}>
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>



      <Box mt={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1, sm: 3 }}
          sx={{ mb: 1, color: "#5f6372" }}
        >
          <Typography variant="body2">
            Completed: {statusCounts.completed}
          </Typography>
          <Typography variant="body2">
            Skipped: {statusCounts.skipped}
          </Typography>
          <Typography variant="body2">
            Failed: {statusCounts.failed}
          </Typography>
        </Stack>
        <NewTableComponent
          totalCount={tableData.length}
          columns={tableColumns}
          data={tableData}
          heading="Upload Records"
          pagination={tablePagination}
          onPaginationChange={setTablePagination}
          onPageSizeChange={() => {}}
          sorting={tableSorting}
          onSortingChange={setTableSorting}
          globalFilter={tableGlobalFilter}
          onGlobalFilterChange={setTableGlobalFilter}
          isLoading={isProcessing && !tableData.length}
          enableRowSelection={false}
          getRowId={(row) => row.id || row.resume}
        />
      </Box>

      {errorLogs.length > 0 && (
        <Box mt={2}>
          <Typography variant="h6" sx={{ color: "#3e6a9f", mb: 1 }}>
            Error Logs
          </Typography>
          <Stack spacing={1}>
            {errorLogs.map((entry) => (
              <Box
                key={`${entry.file_hash}-${entry.resume_id || entry.status}`}
                sx={{
                  border: "1px solid #ffe0e0",
                  borderRadius: "0.5rem",
                  padding: "0.75rem",
                  backgroundColor: "#fff5f5",
                }}
              >
                <Typography sx={{ fontWeight: 600, color: "#c62828" }}>
                  {entry.filename ||
                    fileMetadata[entry.file_hash]?.filename ||
                    `Resume #${entry.resume_id || "N/A"}`}
                </Typography>
                <Typography variant="body2" color="#792626">
                  {entry.message || "Upload failed."}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
     
    </Box>

    </>
  );
};

export default ResumeUpload;
