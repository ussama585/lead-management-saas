import { Toaster } from 'react-hot-toast';
import React from 'react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App.jsx';
import AppThemeProvider from './components/providers/app-theme.jsx';
import './assets/styles/shadcn.css';
import './assets/styles/responsive-workspace.css';
import './assets/styles/form-controls.css';
import './assets/styles/field-appearance.css';
import './assets/styles/dropdown-fields.css';
import './assets/styles/table-typography.css';

const queryClient = new QueryClient();
createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <AppThemeProvider>
        <Toaster position="top-right" toastOptions={{ className: "!bg-background !text-foreground !border !border-border !rounded-lg" }} />
        <App />
    </AppThemeProvider>
  </QueryClientProvider>
);
