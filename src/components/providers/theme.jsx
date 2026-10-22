import { createTheme } from '@mui/material/styles';
import { DEFAULT_PRIMARY_COLOR, primaryTextColor } from './theme-color.js';
export function createAppTheme(mode = 'light', primaryColor = DEFAULT_PRIMARY_COLOR) {
  const dark = mode === 'dark';
  return createTheme({
  typography: { fontFamily: 'Inter, sans-serif', button: { textTransform: 'none', fontWeight: 500 } },
  shape: { borderRadius: 8 },
  palette: { mode, primary: { main: primaryColor, contrastText: primaryTextColor(primaryColor) }, background: { default: dark ? '#0f172a' : '#ffffff', paper: dark ? '#151e30' : '#ffffff' }, divider: dark ? '#334155' : '#e2e8f0' },
  components: { MuiPaper: { defaultProps: { elevation: 0 } }, MuiTableCell: { styleOverrides: { root: { borderColor: dark ? '#334155' : '#e2e8f0' } } } }
  });
}
export default createAppTheme();
