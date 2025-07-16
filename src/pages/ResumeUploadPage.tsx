import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { JobPosting } from '../types';
import { supabaseService } from '../services/supabaseService';

const ResumeUploadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [job, setJob] = useState<JobPosting | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(true);

  useEffect(() => {
    if (id) {
      loadJobData(id);
    }
  }, [id]);

  const loadJobData = async (jobId: string) => {
    setLoadingJob(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const jobData = await supabaseService.getJobById(jobId);
      setJob(jobData);
    } catch (error) {
      console.error('Load job data failed:', error);
    } finally {
      setLoadingJob(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert(t('resumeUpload.fileTypeError'));
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert(t('resumeUpload.fileSizeError'));
        return;
      }
      
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      alert(t('resumeUpload.selectFile'));
      return;
    }
    
    setLoading(true);

    try {
      // Mock upload and AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate AI processing
      const mockAIResponse = {
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        summary: 'Candidate has relevant technical experience and meets job requirements. Good communication skills and teamwork spirit.'
      };
      
      // Create applicant record
      await supabaseService.createApplicant({
        name: formData.name,
        email: formData.email,
        jobPostingId: id!,
        resumeFile: resumeFile.name,
        aiScore: mockAIResponse.score,
        aiSummary: mockAIResponse.summary,
        status: 'pending',
        isSelected: false,
        emailSent: false
      });
      
      alert(t('resumeUpload.uploadSuccess', { score: mockAIResponse.score }));
      navigate(`/jobs/${id}`);
      
    } catch (error) {
      alert(t('resumeUpload.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingJob) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (!job) {
    return <div className="error">{t('jobs.notFound')}</div>;
  }

  return (
    <div className="resume-upload-page">
      <div className="page-header">
        <Link to={`/jobs/${id}`} className="back-link">← {t('common.back')} {t('jobs.jobDetails')}</Link>
        <h1>{t('resumeUpload.title')}</h1>
      </div>

      <div className="job-info-card">
        <h2>{job.title}</h2>
        <div className="job-details">
          <span>{t('jobs.department')}: {job.department}</span>
          <span>{t('jobs.location')}: {job.location}</span>
          <span>{t('jobs.jobType')}: {t(`jobs.jobTypes.${job.jobType}`)}</span>
        </div>
        <p>{job.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-section">
          <h3>{t('resumeUpload.basicInfo')}</h3>
          
          <div className="form-group">
            <label htmlFor="name">{t('applicants.name')} *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('applicants.email')} *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>{t('resumeUpload.resumeFile')}</h3>
          
          <div className="form-group">
            <label htmlFor="resume">{t('resumeUpload.resumeFile')} *</label>
            <input
              type="file"
              id="resume"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              required
            />
            <small className="form-help">
              {t('resumeUpload.supportedFormats')} | {t('resumeUpload.fileSizeLimit')}
            </small>
            
            {resumeFile && (
              <div className="file-preview">
                <div className="file-info">
                  <span className="file-name">{resumeFile.name}</span>
                  <span className="file-size">({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setResumeFile(null)}
                  className="remove-file"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <Link to={`/jobs/${id}`} className="btn btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? t('resumeUpload.uploading') : t('resumeUpload.uploadResume')}
          </button>
        </div>
      </form>

      {loading && (
        <div className="upload-progress">
          <div className="progress-info">
            <p>{t('resumeUpload.processing')}</p>
            <div className="progress-steps">
              <div className="step active">📁 {t('resumeUpload.processSteps.upload')}</div>
              <div className="step active">🤖 {t('resumeUpload.processSteps.analyzing')}</div>
              <div className="step">✅ {t('resumeUpload.processSteps.complete')}</div>
            </div>
          </div>
        </div>
      )}

      <div className="info-box">
        <h4>📋 {t('resumeUpload.uploadInfo.title')}</h4>
        <ul>
          {(t('resumeUpload.uploadInfo.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ResumeUploadPage;