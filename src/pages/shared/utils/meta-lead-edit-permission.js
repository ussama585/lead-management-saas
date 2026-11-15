export function canSalesExecutiveEditMetaLead(user) {
  return user?.user_type === 'sales_executive';
}
