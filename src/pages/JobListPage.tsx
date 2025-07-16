import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { JobPosting } from '../types';
import { supabaseService } from '../services/supabaseService';

const JobListPage: React.FC = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    department: 'all',
    status: 'all',
    sortBy: 'newest'
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const jobsData = await supabaseService.getJobs();
      setJobs(jobsData);
    } catch (error) {
      console.error('Load jobs failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (window.confirm(t('jobs.deleteConfirm'))) {
      try {
        const success = await supabaseService.deleteJob(jobId);
        if (success) {
          setJobs(jobs.filter(job => job.id !== jobId));
          alert(t('jobs.deleteSuccess'));
        } else {
          alert(t('jobs.deleteFailed'));
        }
      } catch (error) {
        console.error('Delete job failed:', error);
        alert(t('jobs.deleteFailed'));
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      department: 'all',
      status: 'all',
      sortBy: 'newest'
    });
  };

  // Get unique departments from jobs
  const getDepartments = () => {
    const departments = Array.from(new Set(jobs.map(job => job.department)));
    return departments.sort();
  };

  // Apply filters and sorting
  const getFilteredJobs = () => {
    let filteredJobs = [...jobs];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm) ||
        job.department.toLowerCase().includes(searchTerm) ||
        job.location.toLowerCase().includes(searchTerm) ||
        job.description.toLowerCase().includes(searchTerm)
      );
    }

    // Department filter
    if (filters.department !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.department === filters.department);
    }

    // Status filter
    if (filters.status !== 'all') {
      filteredJobs = filteredJobs.filter(job => {
        if (filters.status === 'public') return job.isPublic;
        if (filters.status === 'private') return !job.isPublic;
        if (filters.status === 'has-applicants') return job.applicantCount > 0;
        if (filters.status === 'no-applicants') return job.applicantCount === 0;
        return true;
      });
    }

    // Sort
    filteredJobs.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'applicants':
          return b.applicantCount - a.applicantCount;
        default:
          return 0;
      }
    });

    return filteredJobs;
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  const filteredJobs = getFilteredJobs();
  const departments = getDepartments();

  return (
    <div className="job-list-page">
      <div className="page-header">
        <h1>{t('jobs.title')}</h1>
        <Link to="/jobs/new" className="btn btn-primary">{t('jobs.addJob')}</Link>
      </div>

      {/* Quick Filters */}
      <div className="quick-filters">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder={t('filters.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>{t('jobs.department')}</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('filters.allDepartments')}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('jobs.status')}</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('filters.allStatus')}</option>
              <option value="public">{t('jobs.public')}</option>
              <option value="private">{t('jobs.private')}</option>
              <option value="has-applicants">{t('filters.hasApplicants')}</option>
              <option value="no-applicants">{t('filters.noApplicants')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label>{t('filters.sortBy')}</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="newest">{t('filters.newest')}</option>
              <option value="oldest">{t('filters.oldest')}</option>
              <option value="title">{t('filters.byTitle')}</option>
              <option value="applicants">{t('filters.byApplicants')}</option>
            </select>
          </div>

          <button onClick={clearFilters} className="btn btn-secondary btn-sm">
            {t('filters.clearFilters')}
          </button>
        </div>

        <div className="filter-results">
          <span className="results-count">
            {t('filters.showingResults', { count: filteredJobs.length, total: jobs.length })}
          </span>
        </div>
      </div>

      <div className="job-list">
        <table className="job-table">
          <thead>
            <tr>
              <th>{t('jobs.jobName')}</th>
              <th>{t('jobs.department')}</th>
              <th>{t('jobs.status')}</th>
              <th>{t('jobs.applicantCount')}</th>
              <th>{t('jobs.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map(job => (
              <tr key={job.id}>
                <td>
                  <Link to={`/jobs/${job.id}`} className="job-title-link">
                    {job.title}
                  </Link>
                </td>
                <td>{job.department}</td>
                <td>
                  <span className={`status ${job.isPublic ? 'public' : 'private'}`}>
                    {job.isPublic ? t('jobs.public') : t('jobs.private')}
                  </span>
                </td>
                <td>{job.applicantCount}</td>
                <td className="actions">
                  <Link to={`/jobs/${job.id}`} className="btn btn-sm">{t('common.view')}</Link>
                  <Link to={`/jobs/${job.id}/edit`} className="btn btn-sm">{t('common.edit')}</Link>
                  <button 
                    onClick={() => handleDelete(job.id)}
                    className="btn btn-sm btn-danger"
                  >
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {jobs.length === 0 && (
          <div className="empty-state">
            <p>{t('jobs.noJobs')}, <Link to="/jobs/new">{t('jobs.createFirst')}</Link></p>
          </div>
        )}

        {jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="empty-state">
            <p>{t('filters.noResults')}</p>
            <button onClick={clearFilters} className="btn btn-secondary btn-sm">
              {t('filters.clearToSeeAll')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobListPage;