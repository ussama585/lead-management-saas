import React from 'react';
import { useSearchParams } from 'react-router-dom';
import JobResponseAnalysis from './job-response-analysis.jsx';
import BatchResponseAnalysis from './batch-response-analysis.jsx';

const ResponseAnalysisWrapper = () => {
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batch_id');
  const responseType = searchParams.get('type');
  
  const isBatchResponse = responseType === 'batchResponse' || !!batchId;

  if (isBatchResponse) {
    return <BatchResponseAnalysis />;
  }
  return <JobResponseAnalysis />;
};

export default ResponseAnalysisWrapper;
