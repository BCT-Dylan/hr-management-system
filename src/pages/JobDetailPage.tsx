import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Card,
  CardContent,
  Tooltip,
  Avatar,
  Breadcrumbs,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Upload as UploadIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
  Psychology as AIIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as InterviewIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { JobPosting, Applicant } from '../types';
import { supabaseService } from '../services/supabaseService';
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
      const jobData = await supabaseService.getJobById(jobId);
      const applicantsData = await supabaseService.getApplicantsByJobId(jobId);

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
      const updatedApplicant = await supabaseService.updateApplicant(applicantId, { 
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
      const updatedApplicant = await supabaseService.updateApplicant(emailModal.applicant!.id, { 
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!job) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {t('jobs.notFound')}
        </Typography>
        <Button component={Link} to="/jobs" sx={{ mt: 2 }}>
          {t('common.back')} {t('jobs.jobList')}
        </Button>
      </Paper>
    );
  }

  const filteredApplicants = getFilteredApplicants();

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
        <Typography color="text.primary">{job.title}</Typography>
      </Breadcrumbs>

      {/* Job Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {job.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip label={`${t('jobs.department')}: ${job.department}`} variant="outlined" />
              <Chip label={`${t('jobs.location')}: ${job.location}`} variant="outlined" />
              <Chip 
                label={`${t('jobs.applicantCount')}: ${job.applicantCount}`} 
                color="primary"
                icon={<PersonIcon />}
              />
            </Box>
          </Box>
          <Button
            variant="contained"
            component={Link}
            to={`/jobs/${job.id}/upload`}
            startIcon={<UploadIcon />}
          >
            {t('resumeUpload.title')}
          </Button>
        </Box>
      </Paper>

      {/* Applicants Section */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 1 }} />
          <Typography variant="h5" component="h2">
            {t('applicants.title')}
          </Typography>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterIcon sx={{ mr: 1 }} />
              <Typography variant="h6">篩選器</Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              gap: 2, 
              alignItems: { xs: 'stretch', md: 'center' } 
            }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  placeholder={t('applicants.searchApplicants')}
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  size="small"
                />
              </Box>

              <Box sx={{ minWidth: 150 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('applicants.reviewStatus')}</InputLabel>
                  <Select
                    value={filters.status}
                    label={t('applicants.reviewStatus')}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="all">{t('applicants.status.all', '全部狀態')}</MenuItem>
                    <MenuItem value="pending">{t('applicants.status.pending')}</MenuItem>
                    <MenuItem value="reviewed">{t('applicants.status.reviewed')}</MenuItem>
                    <MenuItem value="selected">{t('applicants.status.selected')}</MenuItem>
                    <MenuItem value="rejected">{t('applicants.status.rejected')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ minWidth: 150 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('applicants.aiScore')}</InputLabel>
                  <Select
                    value={filters.aiScore}
                    label={t('applicants.aiScore')}
                    onChange={(e) => handleFilterChange('aiScore', e.target.value)}
                  >
                    <MenuItem value="all">{t('applicants.aiScoreFilter.all')}</MenuItem>
                    <MenuItem value="high">{t('applicants.aiScoreFilter.high')}</MenuItem>
                    <MenuItem value="medium">{t('applicants.aiScoreFilter.medium')}</MenuItem>
                    <MenuItem value="low">{t('applicants.aiScoreFilter.low')}</MenuItem>
                    <MenuItem value="no-score">{t('applicants.aiScoreFilter.noScore')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ minWidth: 150 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('applicants.emailStatus.title', '信件狀態')}</InputLabel>
                  <Select
                    value={filters.emailSent}
                    label={t('applicants.emailStatus.title', '信件狀態')}
                    onChange={(e) => handleFilterChange('emailSent', e.target.value)}
                  >
                    <MenuItem value="all">{t('applicants.emailStatus.all')}</MenuItem>
                    <MenuItem value="sent">{t('applicants.emailStatus.sent')}</MenuItem>
                    <MenuItem value="not-sent">{t('applicants.emailStatus.notSent')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ minWidth: 150 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('common.sort')}</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label={t('common.sort')}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="newest">{t('applicants.sortOptions.newest')}</MenuItem>
                    <MenuItem value="oldest">{t('applicants.sortOptions.oldest')}</MenuItem>
                    <MenuItem value="name">{t('applicants.sortOptions.name')}</MenuItem>
                    <MenuItem value="score-high">{t('applicants.sortOptions.scoreHigh')}</MenuItem>
                    <MenuItem value="score-low">{t('applicants.sortOptions.scoreLow')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ minWidth: 120 }}>
                <Button onClick={clearFilters} variant="outlined" size="small" fullWidth>
                  {t('filters.clearFilters')}
                </Button>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('applicants.showingResults', '顯示 {{count}} / {{total}} 位應徵者', { count: filteredApplicants.length, total: applicants.length })}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {selectedApplicants.length > 0 && (
          <Card sx={{ mb: 2, bgcolor: 'action.selected' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">
                  {t('applicants.selectedActions', '已選擇 {{count}} 位應徵者', { count: selectedApplicants.length })}
                </Typography>
                <Button 
                  onClick={handleSendEmails} 
                  variant="contained"
                  startIcon={<EmailIcon />}
                >
                  {t('applicants.sendThankYou')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={filteredApplicants.length > 0 && filteredApplicants.every(app => selectedApplicants.includes(app.id))}
                    onChange={handleSelectAll}
                    indeterminate={selectedApplicants.length > 0 && selectedApplicants.length < filteredApplicants.length}
                  />
                </TableCell>
                <TableCell>{t('applicants.tableHeaders.name')}</TableCell>
                <TableCell>{t('applicants.tableHeaders.uploadTime')}</TableCell>
                <TableCell align="center">{t('applicants.tableHeaders.aiScore')}</TableCell>
                <TableCell>{t('applicants.tableHeaders.reviewStatus')}</TableCell>
                <TableCell align="center">{t('applicants.tableHeaders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplicants.map(applicant => (
                <TableRow key={applicant.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedApplicants.includes(applicant.id)}
                      onChange={() => handleSelectApplicant(applicant.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="body2">{applicant.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {applicant.uploadedAt.toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AIIcon sx={{ mr: 0.5, color: 'primary.main', fontSize: '1rem' }} />
                      <Chip
                        label={applicant.aiScore || t('applicants.noScore')}
                        color={
                          applicant.aiScore 
                            ? applicant.aiScore >= 80 ? 'success' 
                            : applicant.aiScore >= 60 ? 'primary' 
                            : 'warning'
                            : 'default'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={applicant.status}
                        onChange={(e) => handleStatusChange(applicant.id, e.target.value)}
                        variant="outlined"
                      >
                        <MenuItem value="pending">{t('applicants.status.pending')}</MenuItem>
                        <MenuItem value="reviewed">{t('applicants.status.reviewed')}</MenuItem>
                        <MenuItem value="selected">{t('applicants.status.selected')}</MenuItem>
                        <MenuItem value="rejected">{t('applicants.status.rejected')}</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title={t('applicants.viewResume')}>
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {applicant.aiSummary && (
                        <Tooltip title={applicant.aiSummary}>
                          <IconButton size="small" color="info">
                            <AIIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={t('email.sendInterview', '發送面試邀請')}>
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleSendEmail(applicant, 'interview')}
                        >
                          <InterviewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('email.sendRejection', '發送拒絕信')}>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleSendEmail(applicant, 'rejection')}  
                        >
                          <RejectIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Empty States */}
        {applicants.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('applicants.noApplicants')}
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to={`/jobs/${job.id}/upload`}
              startIcon={<UploadIcon />}
            >
              {t('applicants.uploadFirst')}
            </Button>
          </Paper>
        )}

        {applicants.length > 0 && filteredApplicants.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('applicants.noResults')}
            </Typography>
            <Button onClick={clearFilters} variant="outlined">
              {t('applicants.clearFilters')}
            </Button>
          </Paper>
        )}
      </Paper>

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
    </Box>
  );
};

export default JobDetailPage;