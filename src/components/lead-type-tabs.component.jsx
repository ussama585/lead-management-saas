import React from 'react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs.jsx';
export default function LeadTypeTabs({ selectedType, onTypeChange }) {
  return <Tabs value={selectedType} onValueChange={onTypeChange}><TabsList>
    <TabsTrigger value='meta'>Meta Leads</TabsTrigger><TabsTrigger value='data'>Data Leads</TabsTrigger><TabsTrigger value='website'>Website Leads</TabsTrigger>
  </TabsList></Tabs>;
}
