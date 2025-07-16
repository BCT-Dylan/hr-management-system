import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('hrToken');
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>{t('auth.loginTitle')}</h2>
        </div>
        <div className="nav-links">
          <Link to="/jobs" className="nav-link">{t('navigation.jobManagement')}</Link>
          <Link to="/templates" className="nav-link">{t('navigation.emailTemplates')}</Link>
          <LanguageSwitcher />
          <button onClick={handleLogout} className="logout-btn">{t('auth.logout')}</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;