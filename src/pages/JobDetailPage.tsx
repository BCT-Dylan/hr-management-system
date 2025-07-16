import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { JobPosting, Applicant } from '../types';
import { storageService } from '../services/storage';
import EmailModal from '../components/EmailModal';

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    aiScore: 'all',
    sortBy: 'newest',
    emailSent: 'all'
  });
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    applicant: Applicant | null;
    type: 'interview' | 'rejection';
  }>({ isOpen: false, applicant: null, type: 'interview' });

  useEffect(() => {
    if (id) {
      loadJobAndApplicants(id);
    }
  }, [id]);

  const loadJobAndApplicants = async (jobId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const jobData = storageService.getJobById(jobId);
      const applicantsData = storageService.getApplicantsByJobId(jobId);

      setJob(jobData);
      setApplicants(applicantsData);
    } catch (error) {
      console.error('Load data failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApplicant = (applicantId: string) => {
    setSelectedApplicants(prev => 
      prev.includes(applicantId) 
        ? prev.filter(id => id !== applicantId)
        : [...prev, applicantId]
    );
  };

  const handleSelectAll = () => {
    const filteredApplicants = getFilteredApplicants();
    const allSelected = filteredApplicants.every(app => selectedApplicants.includes(app.id));
    
    if (allSelected) {
      setSelectedApplicants(prev => prev.filter(id => !filteredApplicants.find(app => app.id === id)));
    } else {
      const newIds = filteredApplicants.map(app => app.id);
      setSelectedApplicants(prev => {
        const combined = [...prev, ...newIds];
        return Array.from(new Set(combined));
      });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      aiScore: 'all',
      sortBy: 'newest',
      emailSent: 'all'
    });
  };

  const getFilteredApplicants = () => {
    let filteredApplicants = [...applicants];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredApplicants = filteredApplicants.filter(applicant => 
        applicant.name.toLowerCase().includes(searchTerm) ||
        applicant.email.toLowerCase().includes(searchTerm) ||
        (applicant.aiSummary && applicant.aiSummary.toLowerCase().includes(searchTerm))
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filteredApplicants = filteredApplicants.filter(applicant => applicant.status === filters.status);
    }

    // AI Score filter
    if (filters.aiScore !== 'all') {
      filteredApplicants = filteredApplicants.filter(applicant => {
        if (!applicant.aiScore) return filters.aiScore === 'no-score';
        if (filters.aiScore === 'high') return applicant.aiScore >= 80;
        if (filters.aiScore === 'medium') return applicant.aiScore >= 60 && applicant.aiScore < 80;
        if (filters.aiScore === 'low') return applicant.aiScore < 60;
        if (filters.aiScore === 'no-score') return !applicant.aiScore;
        return true;
      });
    }

    // Email sent filter
    if (filters.emailSent !== 'all') {
      filteredApplicants = filteredApplicants.filter(applicant => {
        if (filters.emailSent === 'sent') return applicant.emailSent;
        if (filters.emailSent === 'not-sent') return !applicant.emailSent;
        return true;
      });
    }

    // Sort
    filteredApplicants.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'oldest':
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'score-high':
          return (b.aiScore || 0) - (a.aiScore || 0);
        case 'score-low':
          return (a.aiScore || 0) - (b.aiScore || 0);
        default:
          return 0;
      }
    });

    return filteredApplicants;
  };

  const handleSendEmails = () => {
    if (selectedApplicants.length === 0) {
      alert(t('applicants.selectFirst', '請選擇要發送信件的應徵者'));
      return;
    }
    // Navigate to email sending page or show modal
    alert(t('applicants.prepareEmail', '準備發送信件給 {{count}} 位應徵者', { count: selectedApplicants.length }));
  };

  const handleStatusChange = async (applicantId: string, newStatus: string) => {
    try {
      const updatedApplicant = storageService.updateApplicant(applicantId, { 
        status: newStatus as 'pending' | 'reviewed' | 'selected' | 'rejected' 
      });
      
      if (updatedApplicant) {
        setApplicants(prev => 
          prev.map(app => 
            app.id === applicantId ? { ...app, status: newStatus as any } : app
          )
        );
      } else {
        alert(t('applicants.statusUpdate.failed'));
      }
    } catch (error) {
      console.error('Update applicant status failed:', error);
      alert(t('applicants.statusUpdate.failed'));
    }
  };

  const handleSendEmail = (applicant: Applicant, type: 'interview' | 'rejection') => {
    setEmailModal({ isOpen: true, applicant, type });
  };

  const handleEmailSend = async (emailData: any) => {
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update applicant email status
      const updatedApplicant = storageService.updateApplicant(emailModal.applicant!.id, { 
        emailSent: true,
        lastEmailType: emailData.type,
        lastEmailDate: new Date()
      });
      
      if (updatedApplicant) {
        setApplicants(prev => 
          prev.map(app => 
            app.id === emailModal.applicant!.id ? { ...app, emailSent: true } : app
          )
        );
        alert(t('email.sentSuccess', '信件已成功發送'));
      }
    } catch (error) {
      console.error('Send email failed:', error);
      alert(t('email.sendFailed', '信件發送失敗'));
    }
  };

  const closeEmailModal = () => {
    setEmailModal({ isOpen: false, applicant: null, type: 'interview' });
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (!job) {
    return <div className="error">{t('jobs.notFound')}</div>;
  }

  const filteredApplicants = getFilteredApplicants();

  return (
    <div className="job-detail-page">
      <div className="page-header">
        <Link to="/jobs" className="back-link">← {t('common.back')} {t('jobs.jobList')}</Link>
        <h1>{job.title}</h1>
        <div className="job-info">
          <span>{t('jobs.department')}: {job.department}</span>
          <span>{t('jobs.location')}: {job.location}</span>
          <span>{t('jobs.applicantCount')}: {job.applicantCount}</span>
        </div>
      </div>

      <div className="job-actions">
        <Link to={`/jobs/${job.id}/upload`} className="btn btn-primary">
          {t('resumeUpload.title')}
        </Link>
      </div>

      <div className="applicants-section">
        <div className="section-header">
          <h2>{t('applicants.title')}</h2>
        </div>

        {/* Quick Filters for Applicants */}
        <div className="applicant-filters">
          <div className="filter-row">
            <div className="filter-group">
              <input
                type="text"
                placeholder={t('applicants.searchApplicants')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label>{t('applicants.reviewStatus')}</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="all">{t('applicants.status.all', '全部狀態')}</option>
                <option value="pending">{t('applicants.status.pending')}</option>
                <option value="reviewed">{t('applicants.status.reviewed')}</option>
                <option value="selected">{t('applicants.status.selected')}</option>
                <option value="rejected">{t('applicants.status.rejected')}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t('applicants.aiScore')}</label>
              <select
                value={filters.aiScore}
                onChange={(e) => handleFilterChange('aiScore', e.target.value)}
                className="filter-select"
              >
                <option value="all">{t('applicants.aiScoreFilter.all')}</option>
                <option value="high">{t('applicants.aiScoreFilter.high')}</option>
                <option value="medium">{t('applicants.aiScoreFilter.medium')}</option>
                <option value="low">{t('applicants.aiScoreFilter.low')}</option>
                <option value="no-score">{t('applicants.aiScoreFilter.noScore')}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t('applicants.emailStatus.title', '信件狀態')}</label>
              <select
                value={filters.emailSent}
                onChange={(e) => handleFilterChange('emailSent', e.target.value)}
                className="filter-select"
              >
                <option value="all">{t('applicants.emailStatus.all')}</option>
                <option value="sent">{t('applicants.emailStatus.sent')}</option>
                <option value="not-sent">{t('applicants.emailStatus.notSent')}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t('common.sort')}</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="newest">{t('applicants.sortOptions.newest')}</option>
                <option value="oldest">{t('applicants.sortOptions.oldest')}</option>
                <option value="name">{t('applicants.sortOptions.name')}</option>
                <option value="score-high">{t('applicants.sortOptions.scoreHigh')}</option>
                <option value="score-low">{t('applicants.sortOptions.scoreLow')}</option>
              </select>
            </div>

            <button onClick={clearFilters} className="btn btn-secondary btn-sm">
              {t('filters.clearFilters')}
            </button>
          </div>

          <div className="filter-results">
            <span className="results-count">
              {t('applicants.showingResults', '顯示 {{count}} / {{total}} 位應徵者', { count: filteredApplicants.length, total: applicants.length })}
            </span>
          </div>
        </div>

        {selectedApplicants.length > 0 && (
          <div className="selected-actions">
            <span>{t('applicants.selectedActions', '已選擇 {{count}} 位應徵者', { count: selectedApplicants.length })}</span>
            <button onClick={handleSendEmails} className="btn btn-primary">
              {t('applicants.sendThankYou')}
            </button>
          </div>
        )}

        <div className="applicants-table">
          <table>
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={filteredApplicants.length > 0 && filteredApplicants.every(app => selectedApplicants.includes(app.id))}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>{t('applicants.tableHeaders.name')}</th>
                <th>{t('applicants.tableHeaders.uploadTime')}</th>
                <th>{t('applicants.tableHeaders.aiScore')}</th>
                <th>{t('applicants.tableHeaders.reviewStatus')}</th>
                <th>{t('applicants.tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map(applicant => (
                <tr key={applicant.id}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedApplicants.includes(applicant.id)}
                      onChange={() => handleSelectApplicant(applicant.id)}
                    />
                  </td>
                  <td>{applicant.name}</td>
                  <td>{applicant.uploadedAt.toLocaleDateString()}</td>
                  <td>
                    <span className="ai-score">{applicant.aiScore || t('applicants.noScore')}</span>
                  </td>
                  <td>
                    <select 
                      value={applicant.status}
                      onChange={(e) => handleStatusChange(applicant.id, e.target.value)}
                      className={`status-select status-${applicant.status}`}
                    >
                      <option value="pending">{t('applicants.status.pending')}</option>
                      <option value="reviewed">{t('applicants.status.reviewed')}</option>
                      <option value="selected">{t('applicants.status.selected')}</option>
                      <option value="rejected">{t('applicants.status.rejected')}</option>
                    </select>
                  </td>
                  <td className="actions">
                    <button className="btn btn-sm">{t('applicants.viewResume')}</button>
                    {applicant.aiSummary && (
                      <button className="btn btn-sm" title={applicant.aiSummary}>
                        {t('applicants.aiSummary')}
                      </button>
                    )}
                    <div className="email-actions">
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleSendEmail(applicant, 'interview')}
                        title={t('email.sendInterview', '發送面試邀請')}
                      >
                        📧 {t('email.interview', '面試')}
                      </button>
                      <button 
                        className="btn btn-sm btn-warning"
                        onClick={() => handleSendEmail(applicant, 'rejection')}
                        title={t('email.sendRejection', '發送拒絕信')}
                      >
                        ❌ {t('email.reject', '拒絕')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {applicants.length === 0 && (
            <div className="empty-state">
              <p>{t('applicants.noApplicants')}</p>
              <Link to={`/jobs/${job.id}/upload`} className="btn btn-primary btn-sm">
                {t('applicants.uploadFirst')}
              </Link>
            </div>
          )}

          {applicants.length > 0 && filteredApplicants.length === 0 && (
            <div className="empty-state">
              <p>{t('applicants.noResults')}</p>
              <button onClick={clearFilters} className="btn btn-secondary btn-sm">
                {t('applicants.clearFilters')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {emailModal.isOpen && emailModal.applicant && job && (
        <EmailModal
          isOpen={emailModal.isOpen}
          onClose={closeEmailModal}
          onSend={handleEmailSend}
          applicant={emailModal.applicant}
          job={job}
          emailType={emailModal.type}
        />
      )}
    </div>
  );
};

export default JobDetailPage;