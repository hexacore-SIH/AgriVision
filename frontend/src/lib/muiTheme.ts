import { createTheme } from "@mui/material/styles";

// Scoped to the new map / profit-calculator / mandi-management surfaces only
// -- matches the existing Tailwind green accent (green-600) rather than
// introducing a second brand color.
export const muiTheme = createTheme({
  palette: {
    primary: { main: "#16a34a" },
    secondary: { main: "#b97a17" },
    error: { main: "#dc2626" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
