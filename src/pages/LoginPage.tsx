import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock login - in real app, call API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (username === 'hr' && password === 'password') {
        localStorage.setItem('hrToken', 'mock-token');
        // Force page reload to trigger authentication check
        window.location.href = '/jobs';
      } else {
        alert(t('auth.loginError'));
      }
    } catch (error) {
      alert(t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>{t('auth.loginTitle')}</h1>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">{t('auth.username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? t('auth.loggingIn') : t('auth.loginButton')}
          </button>
        </form>
        <div className="demo-info">
          <p>{t('auth.demoAccount')}: hr</p>
          <p>{t('auth.demoPassword')}: password</p>
        </div>
        <div className="language-switcher-bottom">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;