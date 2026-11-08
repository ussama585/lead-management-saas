import { createTheme } from '@mui/material/styles';
import { DEFAULT_PRIMARY_COLOR, primaryTextColor } from './theme-color.js';
export function createAppTheme(mode = 'light', primaryColor = DEFAULT_PRIMARY_COLOR) {
  const dark = mode === 'dark';
  return createTheme({
  typography: { fontFamily: 'Inter, sans-serif', button: { textTransform: 'none', fontWeight: 500 } },
  shape: { borderRadius: 12 },
  palette: { mode, primary: { main: primaryColor, contrastText: primaryTextColor(primaryColor) }, secondary: { main: '#0D9488' }, background: { default: dark ? '#0f172a' : '#F6F7FC', paper: dark ? '#151e30' : '#ffffff' }, divider: dark ? '#334155' : '#e4e7f2' },
  components: { MuiPaper: { defaultProps: { elevation: 0 } }, MuiTableCell: { styleOverrides: { root: { borderColor: dark ? '#334155' : '#e2e8f0' } } } }
  });
}
export default createAppTheme();
