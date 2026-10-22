import { createContext, useContext } from 'react';

export const AppThemeContext = createContext(null);
export function useAppTheme() {
  return useContext(AppThemeContext);
}
