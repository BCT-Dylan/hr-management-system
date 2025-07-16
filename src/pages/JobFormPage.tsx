import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabaseService } from '../services/supabaseService';

const JobFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    jobType: 'fullTime',
    description: '',
    isPublic: true
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (isEdit && id) {
      loadJobData(id);
    }
  }, [isEdit, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadJobData = async (jobId: string) => {
    setLoadingData(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const job = await supabaseService.getJobById(jobId);
      if (job) {
        setFormData({
          title: job.title,
          department: job.department,
          location: job.location,
          jobType: job.jobType,
          description: job.description,
          isPublic: job.isPublic
        });
      } else {
        alert(t('jobs.notFound'));
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Load job data failed:', error);
      alert(t('jobs.loadFailed'));
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const jobData = {
        ...formData,
        attachments: attachments.map(file => file.name) // In real app, upload files first
      };

      if (isEdit && id) {
        const updatedJob = await supabaseService.updateJob(id, jobData);
        if (updatedJob) {
          alert(t('jobs.updateSuccess'));
          navigate('/jobs');
        } else {
          alert(t('jobs.updateFailed'));
        }
      } else {
        await supabaseService.createJob(jobData);
        alert(t('jobs.createSuccess'));
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Save job failed:', error);
      alert(isEdit ? t('jobs.updateFailed') : t('jobs.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="job-form-page">
      <div className="page-header">
        <Link to="/jobs" className="back-link">← {t('common.back')} {t('jobs.jobList')}</Link>
        <h1>{isEdit ? t('jobs.editJob') : t('jobs.addJob')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="job-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">{t('jobs.jobName')} *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">{t('jobs.department')} *</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location">{t('jobs.location')} *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="jobType">{t('jobs.jobType')} *</label>
            <select
              id="jobType"
              name="jobType"
              value={formData.jobType}
              onChange={handleInputChange}
              required
            >
              <option value="fullTime">{t('jobs.jobTypes.fullTime')}</option>
              <option value="partTime">{t('jobs.jobTypes.partTime')}</option>
              <option value="contract">{t('jobs.jobTypes.contract')}</option>
              <option value="internship">{t('jobs.jobTypes.internship')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">{t('jobs.description')} *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={6}
            required
            placeholder={t('jobs.description')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="attachments">{t('jobs.attachments')}</label>
          <input
            type="file"
            id="attachments"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
          />
          <small className="form-help">{t('jobs.attachmentsHelper')}</small>
          {attachments.length > 0 && (
            <div className="file-list">
              {attachments.map((file, index) => (
                <div key={index} className="file-item">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
            />
            {t('jobs.isPublic')} ({t('jobs.isPublicHelper')})
          </label>
        </div>

        <div className="form-actions">
          <Link to="/jobs" className="btn btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? (isEdit ? t('jobs.updating', '更新中...') : t('jobs.creating', '建立中...')) : (isEdit ? t('jobs.updateJob', '更新職缺') : t('jobs.createJob', '建立職缺'))}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobFormPage;