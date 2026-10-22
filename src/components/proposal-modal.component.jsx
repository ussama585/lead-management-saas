import React, { useRef, useEffect, useCallback } from 'react';
import { Modal, Button, message, Spin, Input, InputNumber } from 'antd';
import { Download as DownloadOutlined, LoaderCircle as LoadingOutlined } from 'lucide-react';
import { formatDateOrdinal } from '../pages/shared/utils/formatDate.js';
import '../assets/styles/legacy/table-client-actions.css';
import '../assets/styles/legacy/proposal-modal.css';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/proposal-modal.component.css';

/** Normalize contract currency string like "Pakistani Rupee (PKR)" → "PKR" */
const getCurrencyCode = (currency) => {
  if (!currency) return 'PKR';
  const match = String(currency).match(/\(([^)]+)\)/);
  if (match && match[1]) return match[1]; // e.g. "PKR"
  // If it's already a short code (e.g. "PKR", "USD"), keep as is
  if (String(currency).length <= 4) return String(currency);
  return 'PKR';
};

/** Format job salary range as "PKR 45,000 - 65,000" */
const formatSalaryRange = (job, currency = 'PKR') => {
  const code = getCurrencyCode(currency);
  const min = job?.min_salary != null ? Number(job.min_salary) : null;
  const max = job?.max_salary != null ? Number(job.max_salary) : null;

  if (min != null && max != null) return `${code} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (min != null) return `${code} ${min.toLocaleString()}`;
  if (max != null) return `${code} ${max.toLocaleString()}`;

  if (job?.salary_range) {
    // As a fallback, try to strip long currency name and keep code/numbers
    return job.salary_range.replace(/Pakistani Rupee\s*\(PKR\)\s*/gi, 'PKR ');
  }
  return '—';
};

/** Display name for salutation: "Dear Arsam," when first name provided, else full name */
const getSalutationName = (client) => {
  if (client?.salutation_name) return client.salutation_name;
  if (client?.contact_person_first_name) return client.contact_person_first_name;
  return client?.contact_person_name ?? 'Sir/Madam';
};

const deepClone = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
};

const hasText = (value) => String(value ?? '').trim() !== '';

/** Fallback dummy data – used when proposalData is missing */
const DUMMY_PROPOSAL = {
  date: '2025-10-21T00:00:00Z',
  client: {
    company_name: 'BOLT Contractors Pvt. Ltd.',
    contact_person_name: 'Amir',
    contact_person_designation: 'Project Manager',
    email: 'amir@boltcontractors.com',
    phone_number: '+92-300-1234567',
    industry: 'Construction',
    location: {
      city: 'Lahore',
      country: 'Pakistan',
    },
  },
  project: {
    pricing: {
      pricing_type: '1 gross salary',
      contract_currency: 'PKR',
      contract_subtotal_amount: 60000,
      contract_price: 60000,
      mobilization_charges: 30000,
      remaining_payment: 30000,
      discount_amount: 0,
      discount_percentage: 0,
    },
  },
  jobs: [
    {
      job_title: 'Senior Accountant',
      number_of_vacancies: 1,
      salary_range: 'PKR 45,000 – 65,000',
      location_city: 'Lahore',
    },
  ],
  search_o_pal_representative: {
    name: 'Madeeha Nasim',
    designation: 'Head of Department',
  },
  summary: {
    total_positions: 1,
    total_salary_range: 'PKR 45,000 – 65,000',
  },
  service_terms: {
    replacement_guarantee_duration: '2 weeks',
    turnaround_text: '10-12 working days',
  },
};

const ProposalModal = ({
  visible,
  onClose,
  proposalData,
  loading = false,
  /** When true, modal opens in edit mode (activated from table column, not footer) */
  openInCustomizeMode = false,
  /** Called when user clicks "Done editing" so parent can clear openInCustomizeMode flag */
  onExitCustomizeMode,
}) => {
  const proposalRef = useRef(null); // keeps overall DOM for preview/scroll
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);
  const page3Ref = useRef(null);
  const appliedCustomizeFromPropRef = useRef(false);
  const [generating, setGenerating] = React.useState(false);
  /** Full proposal snapshot while customizing; kept after "Done" so PDF uses edits */
  const [draftProposal, setDraftProposal] = React.useState(null);
  /** When true, key fields render as inputs */
  const [customizeMode, setCustomizeMode] = React.useState(false);

  useEffect(() => {
    if (!visible) {
      setDraftProposal(null);
      setCustomizeMode(false);
      appliedCustomizeFromPropRef.current = false;
      return;
    }
    if (openInCustomizeMode && proposalData && !loading && !appliedCustomizeFromPropRef.current) {
      appliedCustomizeFromPropRef.current = true;
      setDraftProposal(deepClone(proposalData));
      setCustomizeMode(true);
    }
    if (!openInCustomizeMode && appliedCustomizeFromPropRef.current) {
      appliedCustomizeFromPropRef.current = false;
      setCustomizeMode(false);
    }
  }, [visible, openInCustomizeMode, proposalData, loading]);

  const displayProposal = draftProposal ?? proposalData ?? DUMMY_PROPOSAL;

  const finishCustomize = useCallback(() => {
    setCustomizeMode(false);
    onExitCustomizeMode?.();
  }, [onExitCustomizeMode]);

  const patchDraft = useCallback((updater) => {
    setDraftProposal((prev) => {
      const base = prev ?? deepClone(proposalData || DUMMY_PROPOSAL);
      return typeof updater === 'function' ? updater(base) : updater;
    });
  }, [proposalData]);

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pdfWidth = pageWidth - margin * 2;

      const addPageFromRef = async (ref, isFirstPage = false) => {
        if (!ref.current) return;
        const canvas = await html2canvas(ref.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (!isFirstPage) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, imgHeight);
      };

      // Page 1: header, intro, section 1
      await addPageFromRef(page1Ref, true);
      // Page 2: section 2 + 3
      await addPageFromRef(page2Ref, false);
      // Page 3: section 4 + 5 + signatures
      await addPageFromRef(page3Ref, false);

      const fileName = `Proposal_${(displayProposal?.client?.company_name || 'Client')
        .replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      message.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const safeDate =
    displayProposal?.date || new Date().toISOString();

  const { client, project, jobs, summary, search_o_pal_representative, service_terms } =
    displayProposal;
  const proposalLoadingIndicator = (
    <LoadingOutlined size="1em" className={["app-icon app-icon-spin", "sop-branded-spin-icon"].filter(Boolean).join(' ')}  aria-hidden />
  );
  const replacementGuarantee = service_terms?.replacement_guarantee_duration ?? '2 weeks';
  const turnaroundText = service_terms?.turnaround_text ?? '10-12 working days';
  // In customize mode, keep raw draft values so clearing an input does not bounce back to fallback values.
  const hiringCity = customizeMode
    ? (client?.location?.city ?? '')
    : (client?.location?.city || jobs?.[0]?.location_city || 'Lahore');
  const salutationName = customizeMode ? (client?.salutation_name ?? '') : getSalutationName(client);
  const totalPositions = summary?.total_positions ?? 0;
  const currency = project?.pricing?.contract_currency || 'PKR';
  const currencyCode = getCurrencyCode(currency);
  const contractPrice = project?.pricing?.contract_price ?? 0;
  const mobilizationCharges = project?.pricing?.mobilization_charges ?? 0;
  const remainingPayment = project?.pricing?.remaining_payment ?? Math.max(0, contractPrice - mobilizationCharges);
  const discountedServiceChargesText =
    project?.pricing?.discounted_service_charges_text
      ? project.pricing.discounted_service_charges_text.replace(/[A-Za-z\s]+\(([A-Z]{3})\)/g, '$1')
      : `${currencyCode} ${Number(contractPrice).toLocaleString()}${totalPositions > 1 ? ` for ${totalPositions} Resources.` : ' for one Resource.'}`;
  const datePickerValue =
    typeof safeDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(safeDate)
      ? safeDate.slice(0, 10)
      : (() => {
          try {
            const d = new Date(safeDate);
            return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
          } catch {
            return '';
          }
        })();

  const salaryCellDisplay = (job) =>
    job?.salary_range || formatSalaryRange(job, currencyCode);

  // Download should only appear when key proposal fields are complete.
  const hasIncompleteRequiredFields = (() => {
    const requiredTopLevel = [
      hasText(datePickerValue),
      hasText(client?.company_name),
      hasText(salutationName),
      hasText(hiringCity),
      Number(totalPositions) > 0,
      hasText(search_o_pal_representative?.name),
      hasText(search_o_pal_representative?.designation),
      hasText(client?.contact_person_name),
      hasText(client?.contact_person_designation),
      hasText(replacementGuarantee),
      hasText(turnaroundText),
    ];

    const jobsValid =
      Array.isArray(jobs) &&
      jobs.length > 0 &&
      jobs.every(
        (job) =>
          hasText(job?.job_title) &&
          hasText(salaryCellDisplay(job)) &&
          Number(job?.number_of_vacancies || 0) > 0
      );

    return requiredTopLevel.some((ok) => !ok) || !jobsValid;
  })();

  return (
    <Modal
      // Simple header without action buttons (no download/delete in header)
      title="Recruitment Proposal"
      open={visible}
      onCancel={onClose}
      width="90%"
      className="proposal-modal__dialog"
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        ...(customizeMode
          ? [
              <Button key="done-edit" onClick={finishCustomize}>
                Done editing
              </Button>,
            ]
          : []),
        ...(!customizeMode && !hasIncompleteRequiredFields
          ? [
              <Button
                key="download"
                type="primary"
                icon={<DownloadOutlined size="1em" className="app-icon" />}
                onClick={handleGeneratePDF}
                loading={generating}
                className="sop-brand-primary"
              >
                Download PDF
              </Button>,
            ]
          : []),
      ]}
    >
      {loading ? (
        <div className="sop-branded-spin-wrap">
          <Spin indicator={proposalLoadingIndicator} size="large" />
          <p className="sop-branded-spin-text">Loading proposal data...</p>
        </div>
      ) : (
        <div ref={proposalRef} className="proposal-document">
          {!customizeMode && hasIncompleteRequiredFields && (
            <div className="proposal-modal__hint">
              Please complete all required proposal fields, then click Done editing to enable Download PDF.
            </div>
          )}
          {/* PAGE 1: Header, Intro, Section 1 */}
          <div ref={page1Ref}>
            {/* Header */}
            <div className="proposal-header">
            <h1 className="proposal-modal__title">
              RECRUITMENT PROPOSAL
            </h1>
          </div>

          <div className="proposal-modal__date-row">
            {customizeMode ? (
              <p className="proposal-modal__date-text">
                <strong>Date:</strong>{' '}
                <Input
                  className="proposal-field-input proposal-modal__date-input"
                  type="date"
                  value={datePickerValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    patchDraft((d) => ({
                      ...d,
                      date: v ? `${v}T12:00:00.000Z` : d.date,
                    }));
                  }}
                />
              </p>
            ) : (
              <p className="proposal-modal__date-text">
                <strong>Date:</strong> {formatDateOrdinal(safeDate)}
              </p>
            )}
          </div>

          {/* Company Info */}
          <div className="company-info">
            <h2 className="proposal-modal__company-name">
              <em>Search O Pal</em>
            </h2>
            <p className="proposal-modal__tagline">
              A Premium Recruitment &amp; Headhunting Firm – Pakistan
            </p>
            <h3 className="proposal-modal__proposal-for">
              Proposal for the Recruitment of{' '}
              {customizeMode ? (
                <Input
                  className="proposal-field-input proposal-modal__inline-input--company"
                  value={client?.company_name ?? ''}
                  onChange={(e) =>
                    patchDraft((d) => ({
                      ...d,
                      client: { ...d.client, company_name: e.target.value },
                    }))
                  }
                />
              ) : (
                <>{client?.company_name ?? 'Client'}</>
              )}
            </h3>
          </div>

          {/* Introduction */}
          <div className="proposal-section">
          <p className="proposal-modal__greeting">
              Dear{' '}
              {customizeMode ? (
                <Input
                  className="proposal-field-input proposal-modal__inline-input--salutation"
                  value={salutationName}
                  onChange={(e) =>
                    patchDraft((d) => ({
                      ...d,
                      client: { ...d.client, salutation_name: e.target.value },
                    }))
                  }
                />
              ) : (
                salutationName
              )}
              ,
            </p>
            <p className="proposal-modal__body-text">
              We sincerely thank you for considering <strong>Search O Pal</strong> as your trusted recruitment partner
              for your upcoming hiring needs in{' '}
              {customizeMode ? (
                <Input
                  className="proposal-field-input proposal-modal__inline-input--city"
                  value={hiringCity}
                  onChange={(e) =>
                    patchDraft((d) => ({
                      ...d,
                      client: {
                        ...d.client,
                        location: { ...(d.client?.location || {}), city: e.target.value },
                      },
                    }))
                  }
                />
              ) : (
                hiringCity
              )}
              . As a reputed and experienced recruitment agency in
              Pakistan, we specialize in headhunting and placing top-tier professionals across global markets.
            </p>
            <p className="proposal-modal__body-text--last">
              This proposal outlines our comprehensive recruitment strategy and pricing model tailored to meet your
              specific requirement of hiring{' '}
              {customizeMode ? (
                <strong className="proposal-modal__inline-strong--normal">
                  <InputNumber
                    className="proposal-field-input proposal-modal__inline-input--positions"
                    min={1}
                    value={totalPositions}
                    onChange={(v) =>
                      patchDraft((d) => ({
                        ...d,
                        summary: { ...d.summary, total_positions: v ?? 1 },
                      }))
                    }
                  />{' '}
                  professional{totalPositions > 1 ? 's' : ''} in{' '}
                  <Input
                    className="proposal-field-input proposal-modal__inline-input--city"
                    value={hiringCity}
                    onChange={(e) =>
                      patchDraft((d) => ({
                        ...d,
                        client: {
                          ...d.client,
                          location: { ...(d.client?.location || {}), city: e.target.value },
                        },
                      }))
                    }
                  />
                  .
                </strong>
              ) : (
                <strong>{`${totalPositions} professional${totalPositions > 1 ? 's' : ''} in ${hiringCity}.`}</strong>
              )}
            </p>
          </div>

          {/* Section 1: Recruitment Scope */}
          <div className="proposal-section">
            <h3 className="proposal-modal__section-heading">
              1. Recruitment Scope & Breakdown
            </h3>
            <p className="proposal-modal__section-text">
              You have requested our services to hire {totalPositions > 1 ? 'resources' : 'a resource'}:
            </p>

            <table className="proposal-modal__table">
              <thead>
                <tr>
                  <th className="proposal-modal__table-th--position">
                    Position
                  </th>
                  <th className="proposal-modal__table-th--salary">
                    Salary Range
                  </th>
                  <th className="proposal-modal__table-th--qty">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs?.map((job, index) => (
                  <tr key={index}>
                    <td className="proposal-modal__table-td--position">
                      {customizeMode ? (
                        <Input
                          className="proposal-field-input"
                          value={job.job_title ?? ''}
                          onChange={(e) =>
                            patchDraft((d) => {
                              const next = [...(d.jobs || [])];
                              next[index] = { ...next[index], job_title: e.target.value };
                              return { ...d, jobs: next };
                            })
                          }
                        />
                      ) : (
                        job.job_title
                      )}
                    </td>
                    <td className="proposal-modal__table-td--center">
                      {customizeMode ? (
                        <Input
                          className="proposal-field-input"
                          value={salaryCellDisplay(job)}
                          onChange={(e) =>
                            patchDraft((d) => {
                              const next = [...(d.jobs || [])];
                              next[index] = {
                                ...next[index],
                                salary_range: e.target.value,
                                min_salary: null,
                                max_salary: null,
                              };
                              return { ...d, jobs: next };
                            })
                          }
                        />
                      ) : (
                        formatSalaryRange(job, currency)
                      )}
                    </td>
                    <td className="proposal-modal__table-td--center">
                      {customizeMode ? (
                        <InputNumber
                          className="proposal-field-input proposal-modal__inline-input--full-width"
                          min={1}
                          value={job.number_of_vacancies ?? 1}
                          onChange={(v) =>
                            patchDraft((d) => {
                              const next = [...(d.jobs || [])];
                              next[index] = { ...next[index], number_of_vacancies: v ?? 1 };
                              return { ...d, jobs: next };
                            })
                          }
                        />
                      ) : (
                        job.number_of_vacancies
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="proposal-modal__section-text--top">
              Our strategy will be aligned to identify, attract, and engage high-caliber professionals matching your job descriptions.
            </p>
          </div>
          </div>

          {/* PAGE 2: Section 2 + 3 */}
          <div ref={page2Ref}>
            {/* Section 2: Service Offering */}
            <div className="proposal-section">
            <h3 className="proposal-modal__section-heading">
              2. Our Service Offering – "Top-Notch Headhunting"
            </h3>
            <p className="proposal-modal__section-text">
              As part of our <strong>Premium Headhunting Service</strong>, Search O Pal will deliver:
            </p>

            <div className="proposal-modal__offering-list">
              <div className="proposal-modal__offering-block">
                <p className="proposal-modal__offering-heading">
                  ✓ Complete End-to-End Recruitment Process
                </p>
                <ul className="proposal-modal__offering-sublist">
                  <li>Development & placement of job advertisements</li>
                  <li>Candidate shortlisting & screening</li>
                  <li>CV database management and data punching</li>
                  <li>Final candidate pool submission as per your Job Descriptions & hiring SOPs</li>
                </ul>
              </div>

              <div className="proposal-modal__offering-block">
                <p className="proposal-modal__offering-heading">
                  ✓ Interview Scheduling & Offer Placement
                </p>
                <ul className="proposal-modal__offering-sublist">
                  <li>Coordinating and facilitating interview rounds</li>
                  <li>Drafting and issuing offer letters on your behalf (if required)</li>
                </ul>
              </div>

              <div className="proposal-modal__offering-block">
                <p className="proposal-modal__offering-heading">
                  ✓ Replacement Guarantee
                </p>
                <ul className="proposal-modal__offering-sublist">
                  <li>
                    Free of charge, one-time replacement in case a hired candidate resigns or leaves within{' '}
                    {customizeMode ? (
                      <Input
                        className="proposal-field-input proposal-modal__inline-input--replacement"
                        value={replacementGuarantee}
                        onChange={(e) =>
                          patchDraft((d) => ({
                            ...d,
                            service_terms: {
                              ...d.service_terms,
                              replacement_guarantee_duration: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <strong>{replacementGuarantee}</strong>
                    )}{' '}
                    of deployment.
                  </li>
                </ul>
              </div>

              <div className="proposal-modal__offering-block">
                <p className="proposal-modal__offering-heading">
                  ✓ Fast Turnaround
                </p>
                <ul className="proposal-modal__offering-sublist">
                  <li>
                    Submission of the initial batch of screened candidates within{' '}
                    {customizeMode ? (
                      <Input
                        className="proposal-field-input proposal-modal__inline-input--turnaround"
                        value={turnaroundText}
                        onChange={(e) =>
                          patchDraft((d) => ({
                            ...d,
                            service_terms: {
                              ...d.service_terms,
                              turnaround_text: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <strong>{turnaroundText}</strong>
                    )}
                    , thanks to our <strong>dedicated senior recruitment team</strong> and a global contact network.
                  </li>
                </ul>
              </div>
            </div>
            </div>

            {/* Section 3: Financial Proposal */}
          <div className="proposal-section">
            <h3 className="proposal-modal__section-heading">
              3. Financial Proposal
            </h3>
            <p className="proposal-modal__section-text--tight">
              We charge <strong>One (1) Month Gross Salary Per Resource.</strong> However, we are pleased to offer you a{' '}
              <strong>Flat Discounted Amount</strong> as a token of our long-term commitment and collaboration.
            </p>

            <table className="proposal-modal__financial-table">
              <tbody>
                <tr>
                  <td className="proposal-modal__financial-label">
                    Standard Service Charges
                  </td>
                  <td className="proposal-modal__financial-value">
                    1 Month Gross Salary Per Resource
                  </td>
                </tr>
                <tr>
                  <td className="proposal-modal__financial-label--no-width">
                    Discounted Service Charges
                  </td>
                  <td className="proposal-modal__financial-value">
                    {customizeMode ? (
                      <Input
                        className="proposal-field-input"
                        value={discountedServiceChargesText}
                        onChange={(e) =>
                          patchDraft((d) => ({
                            ...d,
                            project: {
                              ...d.project,
                              pricing: {
                                ...(d.project?.pricing || {}),
                                discounted_service_charges_text: e.target.value,
                              },
                            },
                          }))
                        }
                      />
                    ) : (
                      <strong>{discountedServiceChargesText}</strong>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="proposal-modal__financial-label--no-width">
                    Mobilization Charges
                  </td>
                  <td className="proposal-modal__financial-value">
                    {customizeMode ? (
                      <>
                        <span>{currencyCode} </span>
                        <InputNumber
                          className="proposal-field-input proposal-modal__inline-input--charges"
                          min={0}
                          value={mobilizationCharges}
                          onChange={(v) =>
                            patchDraft((d) => ({
                              ...d,
                              project: {
                                ...d.project,
                                pricing: {
                                  ...(d.project?.pricing || {}),
                                  mobilization_charges: v ?? 0,
                                },
                              },
                            }))
                          }
                        />
                        <span> /- Payable at the time of project commencement.</span>
                      </>
                    ) : (
                      <>
                        <strong>
                          {currencyCode} {Number(mobilizationCharges).toLocaleString()}/-
                        </strong>{' '}
                        Payable at the time of project commencement.
                      </>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="proposal-modal__financial-label--no-width">
                    Remaining Payment Terms
                  </td>
                  <td className="proposal-modal__financial-value">
                    Invoice will be generated as soon as each resource is hired. Based on how many resources are hired at a given time, invoice for that will be generated which client shall pay within 5 working days until remaining amount (
                    {customizeMode ? (
                      <>
                        <strong className="proposal-modal__inline-strong--normal">
                          {currencyCode}{' '}
                          <InputNumber
                            className="proposal-field-input proposal-modal__inline-input--charges"
                            min={0}
                            value={remainingPayment}
                            onChange={(v) =>
                              patchDraft((d) => ({
                                ...d,
                                project: {
                                  ...d.project,
                                  pricing: {
                                    ...(d.project?.pricing || {}),
                                    remaining_payment: v ?? 0,
                                  },
                                },
                              }))
                            }
                          />
                        </strong>
                      </>
                    ) : (
                      <strong>
                        {currencyCode} {Number(remainingPayment).toLocaleString()}/-
                      </strong>
                    )}
                    ) is paid.
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="proposal-modal__section-text--bottom-8">
              • In case of in-house or reference-based hiring, remaining payment will be cleared by the client as committed.
            </p>
            <p className="proposal-modal__section-text--bottom-8">
              • No upfront payment will be refunded after the delivery of batch of CVs during the committed time period.
            </p>
            <p className="proposal-modal__section-text--bottom-20">
              • In case of no delivery of batch of CVs during committed time period, client can ask refund of upfront payment which will be paid within 5 working days after deduction of 35% service charges.
            </p>
          </div>
          </div>

          {/* PAGE 3: Section 4 + 5 + Signatures */}
          <div ref={page3Ref}>
            {/* Section 4: Why Choose Search O Pal */}
            <div className="proposal-section">
            <h3 className="proposal-modal__section-heading">
              4. Why Choose Search O Pal
            </h3>
            <ul className="proposal-modal__bullet-list">
              <li><strong>Globally Connected:</strong> Strong headhunting and candidate sourcing network worldwide.</li>
              <li><strong>Senior Recruitment Specialists:</strong> Each vertical is managed by a domain-expert recruiter.</li>
              <li><strong>Speed & Quality:</strong> Quick candidate turnaround without compromising quality.</li>
              <li><strong>Proven Track Record:</strong> Trusted by leading international firms for workforce acquisition.</li>
            </ul>
            </div>

            {/* Section 5: Next Steps */}
            <div className="proposal-section">
            <h3 className="proposal-modal__section-heading">
              5. Next Steps
            </h3>
            <p className="proposal-modal__section-text--bottom-10">
              To initiate the recruitment process, we would require:
            </p>
            <ul className="proposal-modal__bullet-list--bottom-15">
              <li>Signed approval of this proposal</li>
              <li>Job Descriptions for the position{summary?.total_positions > 1 ? 's' : ''} you are hiring</li>
              <li>Payment of Mobilization Charges</li>
            </ul>
            <p className="proposal-modal__section-text--bottom-15">
              Once we receive the above, we will immediately commence the recruitment cycle and share the first pool of shortlisted candidates for one position within{' '}
              {customizeMode ? (
                <Input
                  className="proposal-field-input proposal-modal__inline-input--turnaround"
                  value={turnaroundText}
                  onChange={(e) =>
                    patchDraft((d) => ({
                      ...d,
                      service_terms: {
                        ...d.service_terms,
                        turnaround_text: e.target.value,
                      },
                    }))
                  }
                />
              ) : (
                <strong>{turnaroundText}</strong>
              )}
              .
            </p>
            <p className="proposal-modal__section-text--tight">
              We are excited to support your staffing needs and look forward to a fruitful partnership.
            </p>
            <p className="proposal-modal__section-text--plain">
              Should you have any questions or need further clarification, please feel free to reach out directly.
            </p>
            </div>

            {/* Signatures */}
            <div className="proposal-signatures proposal-modal__signatures">
            <div className="proposal-modal__signature-col">
              <p className="proposal-modal__signature-name">
                {customizeMode ? (
                  <Input
                    className="proposal-field-input proposal-modal__inline-input--signature"
                    value={search_o_pal_representative?.name || ''}
                    onChange={(e) =>
                      patchDraft((d) => ({
                        ...d,
                        search_o_pal_representative: {
                          ...d.search_o_pal_representative,
                          name: e.target.value,
                        },
                      }))
                    }
                  />
                ) : (
                  <strong>{search_o_pal_representative?.name || 'Madeeha Nasim'}</strong>
                )}
              </p>
              <p className="proposal-modal__signature-designation">
                {customizeMode ? (
                  <Input
                    className="proposal-field-input proposal-modal__inline-input--signature"
                    value={search_o_pal_representative?.designation || ''}
                    onChange={(e) =>
                      patchDraft((d) => ({
                        ...d,
                        search_o_pal_representative: {
                          ...d.search_o_pal_representative,
                          designation: e.target.value,
                        },
                      }))
                    }
                  />
                ) : (
                  search_o_pal_representative?.designation
                )}
              </p>
              <p className="proposal-modal__signature-company">Search O Pal</p>
              <img
                src="/signature.svg"
                alt="Authorized Signature"
                className="proposal-modal__signature-img"
              />
              <p className="proposal-modal__signature-label">Signature:</p>
            </div>
            <div className="proposal-modal__signature-col">
              <p className="proposal-modal__signature-name">
                {customizeMode ? (
                  <Input
                    className="proposal-field-input proposal-modal__inline-input--signature"
                    value={client?.contact_person_name ?? ''}
                    onChange={(e) =>
                      patchDraft((d) => ({
                        ...d,
                        client: { ...d.client, contact_person_name: e.target.value },
                      }))
                    }
                  />
                ) : (
                  <strong>{client?.contact_person_name ?? 'Client Representative'}</strong>
                )}
              </p>
              <p className="proposal-modal__signature-designation">
                {customizeMode ? (
                  <Input
                    className="proposal-field-input proposal-modal__inline-input--signature"
                    value={client?.contact_person_designation ?? ''}
                    onChange={(e) =>
                      patchDraft((d) => ({
                        ...d,
                        client: { ...d.client, contact_person_designation: e.target.value },
                      }))
                    }
                  />
                ) : (
                  client?.contact_person_designation ?? 'Director'
                )}
              </p>
              <p className="proposal-modal__signature-company--spaced">
                {customizeMode ? (
                  <Input
                    className="proposal-field-input proposal-modal__inline-input--signature"
                    value={client?.company_name ?? ''}
                    onChange={(e) =>
                      patchDraft((d) => ({
                        ...d,
                        client: { ...d.client, company_name: e.target.value },
                      }))
                    }
                  />
                ) : (
                  client?.company_name ?? 'Company'
                )}
              </p>
              <p className="proposal-modal__signature-label">Signature:------------</p>
            </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProposalModal;

