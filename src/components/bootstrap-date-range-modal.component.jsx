import { Tooltip } from './ui/app-controls.jsx';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

import { X as CloseOutlined } from 'lucide-react';
import { DateRangePicker } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import dayjs from 'dayjs';
import { enUS } from "date-fns/locale";
import CustomButton from './custom-button.jsx';
import '../assets/styles/legacy/bootstrap-date-range-modal.css';

// Constants
const MOBILE_BREAKPOINT = 1050;
const MIN_WIDTH_BREAKPOINT = 450;
const DEBOUNCE_DELAY = 150;

const BootstrapDateRangeModal = ({ value, onChange, showModal, setShowModal, onDone, triggerStyle }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isBelowMinWidth, setIsBelowMinWidth] = useState(false);

  // Helper function to normalize dates
  const normalizeDate = useCallback((date) => date?.toDate ? date.toDate() : date, []);

  // Internal selection state for react-date-range
  const [selection, setSelection] = useState([{
    startDate: value && value[0] ? normalizeDate(value[0]) : undefined,
    endDate: value && value[1] ? normalizeDate(value[1]) : undefined,
    key: 'selection'
  }]);

  // Helper function to normalize date range for callbacks
  const normalizeDateRange = useCallback((startDate, endDate) => {
    if (startDate && endDate) {
      return [dayjs(startDate).startOf('day'), dayjs(endDate).endOf('day')];
    }
    return [dayjs(startDate), dayjs(endDate)];
  }, []);

  const handleDoneClick = useCallback(() => {
    setShowModal(false);
    if (typeof onDone === 'function') {
      const sel = selection[0];
      if (sel?.startDate && sel?.endDate) {
        onDone(normalizeDateRange(sel.startDate, sel.endDate));
      } else {
        onDone(null);
      }
    }
  }, [setShowModal, onDone, selection, normalizeDateRange]);

  const handleClearClick = useCallback(() => {
    setSelection([{ key: 'selection' }]);
    onDone?.(null);
    setShowModal(false);
  }, [onDone, setShowModal]);

  useEffect(() => {
    let timeoutId;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        setIsMobile(width < MOBILE_BREAKPOINT);
        setIsBelowMinWidth(width < MIN_WIDTH_BREAKPOINT);
        if (width < MIN_WIDTH_BREAKPOINT) setShowModal(false);
      }, DEBOUNCE_DELAY);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [setShowModal]);

  // Lock body scroll to mimic Bootstrap modal behavior
  useEffect(() => {
    if (showModal) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, [showModal]);

  // Sync incoming value to internal selection
  useEffect(() => {
    if (value && value.length === 2 && value[0] && value[1]) {
      setSelection([{
        startDate: normalizeDate(value[0]),
        endDate: normalizeDate(value[1]),
        key: 'selection'
      }]);
    } else if (value === null) {
      setSelection([{ key: 'selection' }]);
    }
  }, [value, normalizeDate]);

  const handleRangeChange = useCallback((ranges) => {
    const nextSelection = [ranges.selection];
    setSelection(nextSelection);
    // Don't call onChange here - only call when Done is pressed
  }, []);

  const handleTriggerClick = useCallback(() => {
    if (!isBelowMinWidth) setShowModal(true);
  }, [isBelowMinWidth, setShowModal]);

  const handleClose = useCallback(() => setShowModal(false), [setShowModal]);

  // Memoize display text computation
  const displayText = useMemo(() => {
    const currentSelection = selection[0];
    if (currentSelection?.startDate && currentSelection?.endDate) {
      const start = format(currentSelection.startDate, 'do MMM, yyyy');
      const end = format(currentSelection.endDate, 'do MMM, yyyy');
      return `${start} - ${end}`;
    }
    return 'Select Date Range';
  }, [selection]);

  return (
    <>
      <Tooltip
        title={isBelowMinWidth ? 'Date range picker is not available on mobile' : ''}
        placement="top"
      >
        <div
          className={`rounded-pill bg-light d-inline-block cursor-pointer px-3 py-2 date-range-trigger ${isBelowMinWidth ? 'disabled' : ''}`}
          onClick={handleTriggerClick}
          style={triggerStyle}
        >
          {displayText}<i className="fa fa-chevron-down ms-2"></i>
        </div>
      </Tooltip>

      {showModal && createPortal(
        <>
          <div
            className="modal-backdrop fade show modal-backdrop-custom"
            onClick={handleClose}
          ></div>

          <div
            className="bootstrap-modal modal fade show d-block bootstrap-modal-custom"
            id="staticBackdrop"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            tabIndex="-1"
            role="dialog"
          >
            <div
              className="modal-dialog modal-dialog-centered modal-dialog-custom"
              role="document"
            >
              <div
                className="modal-content modal-content-custom"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Close"
                  onClick={handleClose}
                  className="modal-close-button"
                >
                  <CloseOutlined size="1em" className="app-icon" style={{ fontSize: 18, color: '#2F3B52', opacity: 0.7 }} />
                </button>

                <div className="modal-header modal-header-custom">
                  <h5 className="modal-title modal-title-custom">Select Date Range</h5>
                </div>
                <div className="modal-body p-3 modal-body-custom">
                  <DateRangePicker
                    onChange={handleRangeChange}
                    moveRangeOnFirstSelection={false}
                    showSelectionPreview={false}
                    locale={enUS}
                    showDateDisplay={true}
                    ranges={selection}
                    months={2}
                    direction={isMobile ? 'vertical' : 'horizontal'}
                    showMonthAndYearPickers={true}
                    rangeColors={["#3e6a9f"]}
                    staticRanges={isMobile ? [] : undefined}
                    inputRanges={[]}
                  />
                </div>
                <div className="modal-footer modal-footer-custom">
                  <CustomButton type="outline" color="secondary" onClick={handleClearClick} className="custom-button-clear">
                    Clear
                  </CustomButton>
                  <CustomButton type="solid" color="primary" onClick={handleDoneClick} className="custom-button-done">
                    Done
                  </CustomButton>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default BootstrapDateRangeModal;
