import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { ConfigProvider, theme as antTheme } from 'antd';
import { createAppTheme } from './theme.jsx';
import { AppThemeContext } from './app-theme-context.js';
import { DEFAULT_PRIMARY_COLOR, THEME_COLOR_STORAGE_KEY, normalizeThemeColor, primaryTextColor } from './theme-color.js';

const systemIsDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
function savedTheme() {
  try {
    const value = localStorage.getItem('app_theme');
    return ['light', 'dark', 'system'].includes(value) ? value : 'system';
  } catch { return 'system'; }
}

export default function AppThemeProvider({ children }) {
  const [primaryColor, setPrimaryColorState] = useState(() => {
    try { return normalizeThemeColor(localStorage.getItem(THEME_COLOR_STORAGE_KEY)) || DEFAULT_PRIMARY_COLOR; }
    catch { return DEFAULT_PRIMARY_COLOR; }
  });
  const [preference, setPreference] = useState(savedTheme);
  const [systemDark, setSystemDark] = useState(systemIsDark);
  const mode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const muiTheme = useMemo(() => createAppTheme(mode, primaryColor), [mode, primaryColor]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = event => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.style.colorScheme = mode;
  }, [mode]);
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--primary-foreground', primaryTextColor(primaryColor));
  }, [primaryColor]);
  function setPrimaryColor(value) {
    const normalized = normalizeThemeColor(value);
    if (!normalized) return;
    setPrimaryColorState(normalized);
    try { localStorage.setItem(THEME_COLOR_STORAGE_KEY, normalized); } catch { /* Keep the in-memory preference. */ }
  }
  function setTheme(value) {
    if (!['light', 'dark', 'system'].includes(value)) return;
    setPreference(value);
    try { localStorage.setItem('app_theme', value); } catch { /* Theme still works without storage. */ }
  }
  return <AppThemeContext.Provider value={{ preference, mode, setTheme, primaryColor, setPrimaryColor }}>
    <ThemeProvider theme={muiTheme}>
      <ConfigProvider theme={{ algorithm: mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: { colorPrimary: primaryColor, colorTextLightSolid: primaryTextColor(primaryColor), borderRadius: 8, fontFamily: 'Inter, sans-serif' } }}>
        {children}
      </ConfigProvider>
    </ThemeProvider>
  </AppThemeContext.Provider>;
}
