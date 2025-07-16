import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import JobListPage from './pages/JobListPage';
import JobDetailPage from './pages/JobDetailPage';
import JobFormPage from './pages/JobFormPage';
import FilterSettingPage from './pages/FilterSettingPage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import EmailTemplatePage from './pages/EmailTemplatePage';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('hrToken'));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('hrToken'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Navigate to="/jobs" />} />
            <Route path="jobs" element={<JobListPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="jobs/new" element={<JobFormPage />} />
            <Route path="jobs/:id/edit" element={<JobFormPage />} />
            <Route path="jobs/:id/filter" element={<FilterSettingPage />} />
            <Route path="jobs/:id/upload" element={<ResumeUploadPage />} />
            <Route path="templates" element={<EmailTemplatePage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
