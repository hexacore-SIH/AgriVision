import { createTheme } from "@mui/material/styles";

// Scoped to the new map / profit-calculator / mandi-management surfaces only
// -- matches the existing Tailwind green accent (green-600) rather than
// introducing a second brand color.
export const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#15803d", contrastText: "#ffffff" },
    secondary: { main: "#b45309", contrastText: "#ffffff" },
    error: { main: "#dc2626", contrastText: "#ffffff" },
    background: {
      default: "#f8faf7",
      paper: "#ffffff",
    },
    text: {
      primary: "#1c1917",
      secondary: "#44403c",
    },
    divider: "#e7e5e4",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderColor: "#d6d3d1",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: "#1c1917",
          borderColor: "#e7e5e4",
        },
        head: {
          fontWeight: 700,
          color: "#1c1917",
          backgroundColor: "#f5f5f4",
        },
      },
    },
  },
});
