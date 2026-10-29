import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { ConfigProvider, theme as antTheme } from 'antd';
import { createAppTheme } from './theme.jsx';
import { AppThemeContext } from './app-theme-context.js';
import { DEFAULT_PRIMARY_COLOR, THEME_COLOR_STORAGE_KEY, primaryTextColor } from './theme-color.js';
import useUserStore from '../../pages/shared/store/user-store.js';

const systemIsDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export default function AppThemeProvider({ children }) {
  const userKey = useUserStore(state => state.user?.id
    ? `${state.user.user_type}:${state.user.id}` : 'signed-out');
  const primaryColor = DEFAULT_PRIMARY_COLOR;
  const [selection, setSelection] = useState(() => ({ userKey, preference: 'system' }));
  const preference = selection.userKey === userKey ? selection.preference : 'system';
  useLayoutEffect(() => {
    setSelection({ userKey, preference: 'system' });
  }, [userKey]);
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
    try { localStorage.removeItem(THEME_COLOR_STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--primary-foreground', primaryTextColor(primaryColor));
  }, [primaryColor]);
  function setTheme(value) {
    if (!['light', 'dark', 'system'].includes(value)) return;
    setSelection({ userKey, preference: value });
  }
  return <AppThemeContext.Provider value={{ preference, mode, setTheme }}>
    <ThemeProvider theme={muiTheme}>
      <ConfigProvider theme={{ algorithm: mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: { colorPrimary: primaryColor, colorTextLightSolid: primaryTextColor(primaryColor), borderRadius: 8, fontFamily: 'Inter, sans-serif' } }}>
        {children}
      </ConfigProvider>
    </ThemeProvider>
  </AppThemeContext.Provider>;
}
