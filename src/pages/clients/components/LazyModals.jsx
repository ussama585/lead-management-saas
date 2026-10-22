import { lazy } from 'react';

/**
 * Lazy-loaded modal components to improve initial bundle size
 * These components are only loaded when needed
 */

export const ConfirmationModal = lazy(() => import('../../../components/confirmation-modal.component.jsx'));
export const ShowRemarksLead = lazy(() => import('../../../components/show-remarks-lead.jsx'));
export const ProposalModal = lazy(() => import('../../../components/proposal-modal.component.jsx'));
export const ShowRemarksHeadhunting = lazy(() => import('../../../components/show-remarks-headhunting.jsx'));
export const ShareModal = lazy(() => import('../../../components/ShareModal.jsx'));

