import React from 'react';
import { Eye, Pencil } from 'lucide-react';
import { Button } from './ui/app-controls.jsx';
import LeadEditModal from './LeadEditModal.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import useUserStore from '../pages/shared/store/user-store.js';
import { getRolePath } from '../pages/auth/role-home.js';
import api from '../pages/shared/services/api.js';
import { updateMetaLead } from '../pages/shared/services/metaLeads.js';

export default function LeadListingActions({ lead, source, onView, onEdit }) {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const client = useQueryClient();
  if (!['super_admin', 'company_admin'].includes(user?.user_type)) return null;
  const meta = source === 'meta';
  return <div className="flex items-center gap-2" onClick={event => event.stopPropagation()}>
    <Button size="small" title="View lead" aria-label="View lead" icon={<Eye size={16} />} onClick={() => onView ? onView() : navigate(getRolePath(user.user_type, `/${meta ? 'meta-leads' : source === 'data' ? 'data-lead' : 'leads'}/${lead.id}`), { state: { leadListingReturnTo: `${location.pathname}${location.search}` } })} />
    {onEdit ? <Button size="small" title="Edit lead" aria-label="Edit lead"  icon={<Pencil size={16} />} onClick={onEdit} />
      : <LeadEditModal lead={lead} user={user} leadType={meta ? 'Meta Lead' : 'Website Lead'} trigger="icon-button"
        buttonProps={{ title: 'Edit lead', 'aria-label': 'Edit lead' }}
        onSubmit={values => meta ? updateMetaLead({ full_name: values.contact_person_name, company_name: values.company_name, phone_number: values.phone_number, work_email: values.email, job_title: values.contact_person_designation }, lead.id)
          : api.patch(`/lead-generation/update/${lead.id}`, values)}
        onSuccess={async () => { await client.invalidateQueries([meta ? 'metaLeads' : 'leads']); await client.invalidateQueries([meta ? 'metaLeadDetail' : 'websiteLeadDetail']); }} />}
  </div>;
}
