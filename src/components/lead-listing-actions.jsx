import React from 'react';
import { Eye, Pencil, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx';
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
  if (!['super_admin', 'company_admin', 'sales_manager', 'sales_executive'].includes(user?.user_type)) return null;
  const canEdit = user.user_type !== 'sales_executive' || (user.id != null && user.id === lead.assigned_to);
  const meta = source === 'meta';
  const viewLead = () => onView ? onView() : navigate(getRolePath(user.user_type, `/${meta ? 'meta-leads' : source === 'data' ? 'data-lead' : 'leads'}/${lead.id}`), { state: { leadListingReturnTo: `${location.pathname}${location.search}` } });
  const menu = ({ onClick: editLead, disabled = false } = {}) => <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" title="Lead actions" aria-label="Lead actions" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#3e6a9f] hover:bg-[#3e6a9f]/10 focus-visible:outline-2 focus-visible:outline-[#3e6a9f]">
        <MoreVertical size={32} aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" onClick={event => event.stopPropagation()}>
      <DropdownMenuItem onSelect={viewLead}><Eye size={16} className="text-[#3e6a9f]" /><span>View</span></DropdownMenuItem>
      {canEdit && <DropdownMenuItem disabled={disabled} onSelect={editLead}><Pencil size={16} className="text-[#3e6a9f]" /><span>Edit</span></DropdownMenuItem>}
    </DropdownMenuContent>
  </DropdownMenu>;
  return <div className="flex items-center gap-2" onClick={event => event.stopPropagation()}>
    {!canEdit ? menu() : onEdit ? menu({ onClick: onEdit })
      : <LeadEditModal lead={lead} user={user} leadType={meta ? 'Meta Lead' : 'Website Lead'} trigger={menu}
        buttonProps={{ title: 'Edit lead', 'aria-label': 'Edit lead' }}
        onSubmit={values => meta ? updateMetaLead({ full_name: values.contact_person_name, company_name: values.company_name, phone_number: values.phone_number, work_email: values.email, job_title: values.contact_person_designation }, lead.id)
          : api.patch(`/lead-generation/update/${lead.id}`, values)}
        onSuccess={async () => { await client.invalidateQueries([meta ? 'metaLeads' : 'leads']); await client.invalidateQueries([meta ? 'metaLeadDetail' : 'websiteLeadDetail']); }} />}
  </div>;
}
