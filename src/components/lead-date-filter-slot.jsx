import React, { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

export const LeadDateFilterSlot = createContext(null);
export const LeadProjectFilterSlot = createContext(null);

export function LeadProjectFilter({ children }) {
  const target = useContext(LeadProjectFilterSlot);
  return target ? createPortal(children, target) : children;
}

export default function LeadDateFilter({ children }) {
  const target = useContext(LeadDateFilterSlot);
  return target ? createPortal(children, target) : children;
}
