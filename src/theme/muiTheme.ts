import { createTheme } from '@mui/material/styles';

// Create a custom Material-UI theme for your HR Management System
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50', // Dark blue-gray (matching your navbar)
      light: '#34495e',
      dark: '#1a252f',
    },
    secondary: {
      main: '#3498db', // Light blue (matching your buttons)
      light: '#5dade2',
      dark: '#2980b9',
    },
    success: {
      main: '#27ae60',
      light: '#58d68d',
      dark: '#229954',
    },
    warning: {
      main: '#f39c12',
      light: '#f8c471',
      dark: '#e67e22',
    },
    error: {
      main: '#e74c3c',
      light: '#ec7063',
      dark: '#c0392b',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#2c3e50',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#2c3e50',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Remove uppercase transformation
          borderRadius: '4px',
          padding: '0.75rem 1.5rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderRadius: '8px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '4px',
          },
        },
      },
    },
  },
});