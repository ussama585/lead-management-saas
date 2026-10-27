import { Modal } from './ui/app-modal.jsx';
import { Spin, Tooltip } from './ui/app-controls.jsx';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Slider } from 'antd';
import { LoaderCircle as LoadingOutlined, FileText as FilePdfOutlined, Download as DownloadOutlined, ZoomIn as ZoomInOutlined, ZoomOut as ZoomOutOutlined } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/resume-pdf-viewer.component.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const DEFAULT_SCALE = 1.5;

function PdfPages({ url, label }) {
  const containerRef = useRef(null);
  const pdfRef = useRef(null);
  const renderTasksRef = useRef([]);
  const renderGenerationRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [rendering, setRendering] = useState(false);

  const renderAllPages = useCallback(async (pdf, currentScale) => {
    if (!containerRef.current) return;
    const generation = ++renderGenerationRef.current;
    renderTasksRef.current.forEach((t) => { try { t.cancel(); } catch (_) {} });
    renderTasksRef.current = [];
    containerRef.current.innerHTML = '';
    setRendering(true);

    for (let i = 1; i <= pdf.numPages; i++) {
      // Bail out if a newer render (e.g. a further zoom change) started while we were awaiting
      if (generation !== renderGenerationRef.current) return;
      const page = await pdf.getPage(i);
      if (generation !== renderGenerationRef.current) return;
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.display = 'block';
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.style.marginBottom = '8px';
      canvas.style.borderRadius = '4px';
      canvas.style.border = '1px solid #e8edf3';
      if (containerRef.current) containerRef.current.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      const task = page.render({ canvasContext: ctx, viewport });
      renderTasksRef.current.push(task);
      try {
        await task.promise;
      } catch (_) {
        // Cancelled by a newer render request; stop this run
        return;
      }
    }

    if (generation === renderGenerationRef.current) setRendering(false);
  }, []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setScale(DEFAULT_SCALE);

    const load = async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        await renderAllPages(pdf, DEFAULT_SCALE);
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) { setError('Failed to load PDF'); setLoading(false); }
      }
    };

    load();

    return () => {
      cancelled = true;
      renderTasksRef.current.forEach((t) => { try { t.cancel(); } catch (_) {} });
      renderTasksRef.current = [];
      pdfRef.current = null;
    };
  }, [url, renderAllPages]);

  // Live-updates the displayed % while dragging, without re-rendering the PDF on every tick
  const handleScalePreview = useCallback((val) => {
    setScale(val);
  }, []);

  // Actually re-renders the PDF at the given scale (on click, or once a slider drag settles)
  const handleScaleCommit = useCallback(async (val) => {
    setScale(val);
    if (pdfRef.current) await renderAllPages(pdfRef.current, val);
  }, [renderAllPages]);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = url;
    a.download = label || 'resume.pdf';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [url, label]);

  return (
    <div className="resume-pdf-viewer__pages-col">
      {/* Header */}
      <div className="resume-pdf-viewer__header">
        <FilePdfOutlined size="1em" className={["app-icon", "resume-pdf-viewer__header-icon"].filter(Boolean).join(' ')} />
        <span className="resume-pdf-viewer__label">
          {label}
        </span>
        {!loading && !error && (
          <span className="resume-pdf-viewer__page-count">{numPages}p</span>
        )}
        <Tooltip title="Download">
          <button
            onClick={handleDownload}
            className="resume-pdf-viewer__icon-btn"
          >
            <DownloadOutlined size="1em" className={["app-icon", "resume-pdf-viewer__download-icon"].filter(Boolean).join(' ')} />
          </button>
        </Tooltip>
      </div>

      {/* Zoom toolbar */}
      {!loading && !error && (
        <div className="resume-pdf-viewer__toolbar">
          <Tooltip title="Zoom out">
            <button
              onClick={() => handleScaleCommit(Math.max(MIN_SCALE, +(scale - 0.25).toFixed(2)))}
              disabled={scale <= MIN_SCALE}
              className="resume-pdf-viewer__icon-btn"
            >
              <ZoomOutOutlined size="1em" className={["app-icon", "resume-pdf-viewer__zoom-icon"].filter(Boolean).join(' ')} />
            </button>
          </Tooltip>
          <Slider
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.25}
            value={scale}
            onChange={handleScalePreview}
            onChangeComplete={handleScaleCommit}
            className="resume-pdf-viewer__slider"
            tooltip={{ formatter: (v) => `${Math.round(v * 100)}%` }}
          />
          <Tooltip title="Zoom in">
            <button
              onClick={() => handleScaleCommit(Math.min(MAX_SCALE, +(scale + 0.25).toFixed(2)))}
              disabled={scale >= MAX_SCALE}
              className="resume-pdf-viewer__icon-btn"
            >
              <ZoomInOutlined size="1em" className={["app-icon", "resume-pdf-viewer__zoom-icon"].filter(Boolean).join(' ')} />
            </button>
          </Tooltip>
          <span className="resume-pdf-viewer__zoom-pct">
            {Math.round(scale * 100)}%
          </span>
        </div>
      )}

      {/* Pages */}
      <div className="resume-pdf-viewer__pages-area">
        {loading && (
          <div className="resume-pdf-viewer__loading">
            <Spin indicator={<LoadingOutlined size="1em"  className={["app-icon app-icon-spin", "resume-pdf-viewer__loading-spin-icon"].filter(Boolean).join(' ')} />} />
          </div>
        )}
        {error && (
          <div className="resume-pdf-viewer__error">{error}</div>
        )}
        {rendering && !loading && (
          <div className="resume-pdf-viewer__rendering-overlay">
            <Spin indicator={<LoadingOutlined size="1em"  className={["app-icon app-icon-spin", "resume-pdf-viewer__rendering-spin-icon"].filter(Boolean).join(' ')} />} />
          </div>
        )}
        <div ref={containerRef} />
      </div>
    </div>
  );
}

function ResumePdfViewer({ open, onClose, files = [], title = 'Resume Preview' }) {
  const validFiles = files.filter((f) => f?.url);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={title}
      width="95vw"
      className="resume-pdf-viewer__modal"
      style={{ '--resume-modal-max-width': validFiles.length > 1 ? '1400px' : '900px' }}
      styles={{ body: { padding: 0, height: '88vh', overflow: 'hidden' } }}
      destroyOnClose
      centered
    >
      {validFiles.length === 0 ? (
        <div className="resume-pdf-viewer__empty">
          No files to display
        </div>
      ) : (
        <div
          className="resume-pdf-viewer__grid"
          style={{ '--resume-grid-cols': Math.min(validFiles.length, 3) }}
        >
          {validFiles.map((file, i) => (
            <div
              key={i}
              className="resume-pdf-viewer__grid-item"
            >
              <PdfPages url={file.url} label={file.label || `Resume ${i + 1}`} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default ResumePdfViewer;
