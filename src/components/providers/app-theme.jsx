import React, { useLayoutEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { ConfigProvider, theme as antTheme } from 'antd';
import { createAppTheme } from './theme.jsx';
import { AppThemeContext } from './app-theme-context.js';
import { DEFAULT_PRIMARY_COLOR, THEME_COLOR_STORAGE_KEY, primaryTextColor } from './theme-color.js';
export default function AppThemeProvider({ children }) {
  const primaryColor = DEFAULT_PRIMARY_COLOR;
  const mode = 'light';
  const muiTheme = useMemo(() => createAppTheme(mode, primaryColor), [mode, primaryColor]);
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.style.colorScheme = mode;
  }, [mode]);
  useLayoutEffect(() => {
    try { localStorage.removeItem(THEME_COLOR_STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--primary-foreground', primaryTextColor(primaryColor));
  }, [primaryColor]);
  return <AppThemeContext.Provider value={{ preference: 'light', mode, setTheme: () => {} }}>
    <ThemeProvider theme={muiTheme}>
      <ConfigProvider theme={{ algorithm: antTheme.defaultAlgorithm,
        token: { colorPrimary: primaryColor, colorTextLightSolid: primaryTextColor(primaryColor), borderRadius: 8, fontFamily: 'Inter, sans-serif' } }}>
        {children}
      </ConfigProvider>
    </ThemeProvider>
  </AppThemeContext.Provider>;
}
