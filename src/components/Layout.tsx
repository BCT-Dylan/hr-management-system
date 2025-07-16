import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Work as WorkIcon,
  Email as EmailIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import LanguageSwitcher from './LanguageSwitcher';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('hrToken');
    navigate('/login');
  };

  const getCurrentTab = () => {
    if (location.pathname.startsWith('/jobs')) return 0;
    if (location.pathname.startsWith('/templates')) return 1;
    return 0;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) navigate('/jobs');
    if (newValue === 1) navigate('/templates');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <WorkIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('auth.loginTitle')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LanguageSwitcher />
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              {t('auth.logout')}
            </Button>
          </Box>
        </Toolbar>
        
        <Tabs
          value={getCurrentTab()}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.dark' }}
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab
            icon={<WorkIcon />}
            label={t('navigation.jobManagement')}
            sx={{ color: 'white' }}
          />
          <Tab
            icon={<EmailIcon />}
            label={t('navigation.emailTemplates')}
            sx={{ color: 'white' }}
          />
        </Tabs>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default Layout;