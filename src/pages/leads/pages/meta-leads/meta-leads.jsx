import React from 'react';
import useUserStore from '../../../shared/store/user-store.js';
import MetaLeadsMarketingManager from './meta-leads-marketing-manager.jsx';
import MetaLeadsStandard from './meta-leads-standard.jsx';

export default function MetaLeads() {
  const user = useUserStore((state) => state.user);

  // Render different component based on user type
      if (user?.user_type === 'marketing_manager') {
    return <MetaLeadsMarketingManager />;
  }

  // Default to standard component for admin, sales_manager, sales_executive
  return <MetaLeadsStandard />;
  }
