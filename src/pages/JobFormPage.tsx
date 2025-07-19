import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  CircularProgress,
  Breadcrumbs,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { supabaseService } from '../services/supabaseService';
import { ScoringCriteria } from '../types';
import ScoringCriteriaEditor from '../components/ScoringCriteriaEditor';

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
    jobDescriptionDetail: '', // New: Detailed JD for AI
    isPublic: true,
    aiAnalysisEnabled: true, // New: Enable AI analysis
  });
  
  const [scoringCriteria, setScoringCriteria] = useState<ScoringCriteria>({
    technical_skills: {
      weight: 30,
      required_skills: [],
      preferred_skills: []
    },
    experience: {
      weight: 25,
      min_years: 0,
      preferred_domains: []
    },
    education: {
      weight: 20,
      min_degree: 'bachelor',
      preferred_majors: []
    },
    languages: {
      weight: 15,
      required_languages: ['Chinese', 'English']
    },
    soft_skills: {
      weight: 10,
      preferred_skills: []
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = ['基本資訊', 'Job Description', 'AI 評分標準'];

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
          jobDescriptionDetail: job.jobDescriptionDetail || '',
          isPublic: job.isPublic,
          aiAnalysisEnabled: job.aiAnalysisEnabled ?? true,
        });
        
        // Load scoring criteria if exists
        if (job.scoringCriteria) {
          setScoringCriteria(job.scoringCriteria);
        }
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


  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const jobData = {
        ...formData,
        scoringCriteria
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderBasicInfo = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <WorkIcon sx={{ mr: 1 }} />
          基本職缺資訊
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label={`${t('jobs.jobName')} *`}
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            label={`${t('jobs.department')} *`}
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            required
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label={`${t('jobs.location')} *`}
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth>
            <InputLabel>{t('jobs.jobType')} *</InputLabel>
            <Select
              name="jobType"
              value={formData.jobType}
              label={`${t('jobs.jobType')} *`}
              onChange={(e) => setFormData(prev => ({ ...prev, jobType: e.target.value }))}
            >
              <MenuItem value="fullTime">{t('jobs.jobTypes.fullTime')}</MenuItem>
              <MenuItem value="partTime">{t('jobs.jobTypes.partTime')}</MenuItem>
              <MenuItem value="contract">{t('jobs.jobTypes.contract')}</MenuItem>
              <MenuItem value="internship">{t('jobs.jobTypes.internship')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          label={`${t('jobs.description')} *`}
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          sx={{ mb: 3 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              name="isPublic"
            />
          }
          label={`${t('jobs.isPublic')} (${t('jobs.isPublicHelper')})`}
        />
      </CardContent>
    </Card>
  );

  const renderJobDescription = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <DescriptionIcon sx={{ mr: 1 }} />
          詳細 Job Description
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          此詳細描述將用於 AI 履歷分析，請提供完整的職位要求、技能需求和工作內容描述。
        </Alert>

        <TextField
          fullWidth
          multiline
          rows={12}
          label="詳細 Job Description (用於 AI 分析)"
          name="jobDescriptionDetail"
          value={formData.jobDescriptionDetail}
          onChange={handleInputChange}
          placeholder="請描述詳細的職位要求，包括：
• 主要工作職責和內容
• 必需的技術技能和工具
• 學歷和經驗要求
• 語言能力要求
• 軟技能要求
• 工作環境和團隊描述
• 發展機會和福利待遇

這些資訊將幫助 AI 更準確地評估應徵者的適配度。"
          sx={{ mb: 3 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.aiAnalysisEnabled}
              onChange={(e) => setFormData(prev => ({ ...prev, aiAnalysisEnabled: e.target.checked }))}
              name="aiAnalysisEnabled"
            />
          }
          label="啟用 AI 履歷分析功能"
        />
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Button
          component={Link}
          to="/jobs"
          startIcon={<ArrowBackIcon />}
          color="inherit"
        >
          {t('jobs.jobList')}
        </Button>
        <Typography color="text.primary">
          {isEdit ? t('jobs.editJob') : t('jobs.addJob')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1">
          {isEdit ? t('jobs.editJob') : t('jobs.addJob')}
        </Typography>
      </Paper>

      {/* Stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Form Content */}
      <Box component="form" onSubmit={handleSubmit}>
        {activeStep === 0 && renderBasicInfo()}
        {activeStep === 1 && renderJobDescription()}
        {activeStep === 2 && <ScoringCriteriaEditor 
          scoringCriteria={scoringCriteria}
          onChange={setScoringCriteria}
        />}

        {/* Navigation Buttons */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              上一步
            </Button>
            <Box>
              {activeStep < steps.length - 1 && (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ mr: 1 }}
                >
                  下一步
                </Button>
              )}
              {activeStep === steps.length - 1 && (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {loading 
                    ? (isEdit ? '更新中...' : '建立中...') 
                    : (isEdit ? '更新職缺' : '建立職缺')
                  }
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default JobFormPage;