import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mock login - in real app, call API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (username === 'hr' && password === 'password') {
        localStorage.setItem('hrToken', 'mock-token');
        // Force page reload to trigger authentication check
        window.location.href = '/jobs';
      } else {
        setError(t('auth.loginError'));
      }
    } catch (error) {
      setError(t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 3,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <LoginIcon sx={{ m: 1, bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              {t('auth.loginTitle')}
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label={t('auth.username')}
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={t('auth.password')}
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              >
                {loading ? t('auth.loggingIn') : t('auth.loginButton')}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Card sx={{ mt: 3, maxWidth: 400, width: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              演示帳號
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('auth.demoAccount')}: <strong>hr</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('auth.demoPassword')}: <strong>password</strong>
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ mt: 2 }}>
          <LanguageSwitcher />
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;