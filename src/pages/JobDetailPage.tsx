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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
  Psychology as AIIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as InterviewIcon,
  Cancel as RejectIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
} from '@mui/icons-material';
import { JobPosting, Applicant, ApplicationStatus } from '../types';
import { supabaseService } from '../services/supabaseService';
import { applicationStatusService } from '../services/applicationStatusService';
import EmailModal from '../components/EmailModal';
import ResumeUpload from '../components/ResumeUpload';
import ApplicantDetailDialog from '../components/ApplicantDetailDialog';
import DevelopmentTools from '../components/DevelopmentTools';
import { fileStorageService } from '../services/fileStorageService';

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationStatuses, setApplicationStatuses] = useState<ApplicationStatus[]>([]);
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
  
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    applicant: Applicant | null;
  }>({ open: false, applicant: null });
  
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    applicant: Applicant | null;
  }>({ open: false, applicant: null });

  useEffect(() => {
    if (id) {
      loadJobAndApplicants(id);
    }
    loadApplicationStatuses();
  }, [id]);

  const loadApplicationStatuses = async () => {
    try {
      const statuses = await applicationStatusService.getActiveStatuses();
      setApplicationStatuses(statuses);
    } catch (error) {
      console.error('Failed to load application statuses:', error);
    }
  };

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
        const score = applicant.matchPercentage || applicant.aiScore;
        if (!score) return filters.aiScore === 'no-score';
        if (filters.aiScore === 'high') return score >= 80;
        if (filters.aiScore === 'medium') return score >= 60 && score < 80;
        if (filters.aiScore === 'low') return score < 60;
        if (filters.aiScore === 'no-score') return !score;
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

  const handleStatusChange = async (applicantId: string, newStatusId: string) => {
    try {
      // Find the status name from the ID
      const selectedStatus = applicationStatuses.find(s => s.id === newStatusId);
      if (!selectedStatus) {
        console.error('Status not found:', newStatusId);
        return;
      }

      const updatedApplicant = await supabaseService.updateApplicant(applicantId, { 
        status: selectedStatus.name,
        statusId: newStatusId
      });
      
      if (updatedApplicant) {
        setApplicants(prev => 
          prev.map(app => 
            app.id === applicantId ? { 
              ...app, 
              status: selectedStatus.name,
              statusId: newStatusId 
            } : app
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

  const handleViewDetail = (applicant: Applicant) => {
    setDetailDialog({ open: true, applicant });
  };

  const closeDetailDialog = () => {
    setDetailDialog({ open: false, applicant: null });
  };

  const handleDeleteApplicant = (applicant: Applicant) => {
    setDeleteDialog({ open: true, applicant });
  };

  const confirmDeleteApplicant = async () => {
    if (!deleteDialog.applicant) return;
    
    try {
      const success = await supabaseService.deleteApplicant(deleteDialog.applicant.id);
      if (success) {
        setApplicants(prev => prev.filter(app => app.id !== deleteDialog.applicant!.id));
        setDeleteDialog({ open: false, applicant: null });
        // Refresh job data to update applicant count
        if (id) loadJobAndApplicants(id);
      } else {
        alert('刪除失敗，請稍後再試');
      }
    } catch (error) {
      console.error('Delete applicant failed:', error);
      alert('刪除失敗，請稍後再試');
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, applicant: null });
  };

  const handleDownloadResume = (applicant: Applicant) => {
    try {
      // Try to download original file first
      if (applicant.resumeFile && fileStorageService.fileExists(applicant.resumeFile)) {
        const success = fileStorageService.downloadFile(applicant.resumeFile);
        if (success) {
          return;
        }
      }
      
      // Fallback: create downloadable file from extracted content
      if (applicant.resumeContent) {
        const fileName = applicant.resumeFileName || `${applicant.name}_resume.txt`;
        const fileContent = `履歷內容\n${'='.repeat(50)}\n\n應徵者：${applicant.name}\n電子郵件：${applicant.email}\n上傳時間：${applicant.uploadedAt.toLocaleString()}\n\n履歷內容：\n${applicant.resumeContent}`;
        
        // Create blob and download
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName.replace(/\.[^/.]+$/, '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert(`履歷內容尚未解析，無法下載\n文件名：${applicant.resumeFileName || applicant.resumeFile}`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('下載失敗，請稍後再試');
    }
  };
  
  const handleViewResume = (applicant: Applicant) => {
    // In a real application, this would open the resume file
    // For now, we'll show the applicant detail dialog
    handleViewDetail(applicant);
  };
  
  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    if (extension === 'pdf') {
      return <PdfIcon sx={{ color: 'error.main' }} />;
    } else if (extension === 'docx' || extension === 'doc') {
      return <DocIcon sx={{ color: 'primary.main' }} />;
    }
    return <DocIcon sx={{ color: 'text.secondary' }} />;
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

      {/* Development Tools - Only visible in development environment */}
      <DevelopmentTools />

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
          <ResumeUpload 
            jobPosting={job} 
            onSuccess={(applicant) => {
              setApplicants(prev => [...prev, applicant]);
              // Refresh job data to update applicant count
              loadJobAndApplicants(job.id);
            }}
            onError={(error) => {
              console.error('Resume upload failed:', error);
              alert(`履歷上傳失敗: ${error}`);
            }}
          />
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
                    {applicationStatuses.map(status => (
                      <MenuItem key={status.id} value={status.name}>
                        <Box
                          sx={{
                            backgroundColor: status.color,
                            color: '#fff',
                            borderRadius: '12px',
                            px: 1.5,
                            py: 0.5,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            display: 'inline-block',
                            minWidth: '60px',
                            textAlign: 'center',
                          }}
                        >
                          {status.displayName}
                        </Box>
                      </MenuItem>
                    ))}
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
                <TableCell align="center">履歷檔案</TableCell>
                <TableCell align="center">{t('applicants.tableHeaders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplicants.map(applicant => (
                <TableRow 
                  key={applicant.id} 
                  hover
                  onClick={() => handleViewDetail(applicant)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedApplicants.includes(applicant.id)}
                      onChange={() => handleSelectApplicant(applicant.id)}
                      onClick={(e) => e.stopPropagation()}
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
                      {(() => {
                        const score = applicant.matchPercentage || applicant.aiScore;
                        return (
                          <Chip
                            label={score ? `${score}%` : t('applicants.noScore')}
                            color={
                              score 
                                ? score >= 80 ? 'success' 
                                : score >= 60 ? 'primary' 
                                : 'warning'
                                : 'default'
                            }
                            size="small"
                            variant="outlined"
                          />
                        );
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={applicant.statusId || ''}
                        onChange={(e) => handleStatusChange(applicant.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        variant="standard"
                        displayEmpty
                        sx={{
                          '& .MuiSelect-select': {
                            padding: '8px 0px',
                          },
                          '& .MuiInput-underline:before': {
                            display: 'none',
                          },
                          '& .MuiInput-underline:after': {
                            display: 'none',
                          },
                          '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                            display: 'none',
                          },
                        }}
                        renderValue={(value) => {
                          if (!value) return <Typography variant="body2" color="text.secondary">未設定</Typography>;
                          const status = applicationStatuses.find(s => s.id === value);
                          if (!status) return <Typography variant="body2" color="text.secondary">未知狀態</Typography>;
                          return (
                            <Box
                              sx={{
                                backgroundColor: status.color,
                                color: '#fff',
                                borderRadius: '12px',
                                px: 1.5,
                                py: 0.5,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                display: 'inline-block',
                                minWidth: '60px',
                                textAlign: 'center',
                              }}
                            >
                              {status.displayName}
                            </Box>
                          );
                        }}
                      >
                        {applicationStatuses.map(status => (
                          <MenuItem key={status.id} value={status.id}>
                            <Box
                              sx={{
                                backgroundColor: status.color,
                                color: '#fff',
                                borderRadius: '12px',
                                px: 1.5,
                                py: 0.5,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                display: 'inline-block',
                                minWidth: '70px',
                                textAlign: 'center',
                              }}
                            >
                              {status.displayName}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px' }}>
                          {getFileIcon(applicant.resumeFileName || applicant.resumeFile)}
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.75rem', 
                            maxWidth: '100px', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'left'
                          }}
                        >
                          {applicant.resumeFileName || applicant.resumeFile}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="查看履歷">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewResume(applicant);
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="下載履歷">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadResume(applicant);
                            }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {applicant.aiSummary && (
                        <Tooltip title={applicant.aiSummary}>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <AIIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={t('email.sendInterview', '發送面試邀請')}>
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendEmail(applicant, 'interview');
                          }}
                        >
                          <InterviewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('email.sendRejection', '發送拒絕信')}>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendEmail(applicant, 'rejection');
                          }}  
                        >
                          <RejectIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="刪除履歷">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteApplicant(applicant);
                          }}
                        >
                          <DeleteIcon />
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
            <ResumeUpload 
              jobPosting={job} 
              onSuccess={(applicant) => {
                setApplicants([applicant]);
                loadJobAndApplicants(job.id);
              }}
              onError={(error) => {
                console.error('Resume upload failed:', error);
                alert(`履歷上傳失敗: ${error}`);
              }}
            />
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

      {/* Applicant Detail Dialog */}
      <ApplicantDetailDialog
        open={detailDialog.open}
        onClose={closeDetailDialog}
        applicant={detailDialog.applicant}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          確認刪除履歷
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            您確定要刪除 <strong>{deleteDialog.applicant?.name}</strong> 的履歷嗎？
            <br />
            此操作無法復原，請謹慎操作。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            取消
          </Button>
          <Button onClick={confirmDeleteApplicant} color="error" variant="contained">
            確認刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobDetailPage;