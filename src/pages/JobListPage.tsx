import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
} from '@mui/icons-material';
import { JobPosting } from '../types';
import { supabaseService } from '../services/supabaseService';

const JobListPage: React.FC = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
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

  const handleDeleteClick = (jobId: string) => {
    setJobToDelete(jobId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    
    try {
      const success = await supabaseService.deleteJob(jobToDelete);
      if (success) {
        setJobs(jobs.filter(job => job.id !== jobToDelete));
      }
    } catch (error) {
      console.error('Delete job failed:', error);
    } finally {
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setJobToDelete(null);
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredJobs = getFilteredJobs();
  const departments = getDepartments();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('jobs.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/jobs/new"
        >
          {t('jobs.addJob')}
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
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
              placeholder={t('filters.searchPlaceholder')}
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
              <InputLabel>{t('jobs.department')}</InputLabel>
              <Select
                value={filters.department}
                label={t('jobs.department')}
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <MenuItem value="all">{t('filters.allDepartments')}</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ minWidth: 150 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('jobs.status')}</InputLabel>
              <Select
                value={filters.status}
                label={t('jobs.status')}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">{t('filters.allStatus')}</MenuItem>
                <MenuItem value="public">{t('jobs.public')}</MenuItem>
                <MenuItem value="private">{t('jobs.private')}</MenuItem>
                <MenuItem value="has-applicants">{t('filters.hasApplicants')}</MenuItem>
                <MenuItem value="no-applicants">{t('filters.noApplicants')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ minWidth: 150 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('filters.sortBy')}</InputLabel>
              <Select
                value={filters.sortBy}
                label={t('filters.sortBy')}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <MenuItem value="newest">{t('filters.newest')}</MenuItem>
                <MenuItem value="oldest">{t('filters.oldest')}</MenuItem>
                <MenuItem value="title">{t('filters.byTitle')}</MenuItem>
                <MenuItem value="applicants">{t('filters.byApplicants')}</MenuItem>
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
            {t('filters.showingResults', { count: filteredJobs.length, total: jobs.length })}
          </Typography>
        </Box>
      </Paper>

      {/* Job List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('jobs.jobName')}</TableCell>
              <TableCell>{t('jobs.department')}</TableCell>
              <TableCell>{t('jobs.status')}</TableCell>
              <TableCell align="center">{t('jobs.applicantCount')}</TableCell>
              <TableCell align="center">{t('jobs.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJobs.map(job => (
              <TableRow key={job.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Button
                      component={Link}
                      to={`/jobs/${job.id}`}
                      variant="text"
                      sx={{ textAlign: 'left', justifyContent: 'flex-start' }}
                    >
                      {job.title}
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>{job.department}</TableCell>
                <TableCell>
                  <Chip
                    icon={job.isPublic ? <PublicIcon /> : <PrivateIcon />}
                    label={job.isPublic ? t('jobs.public') : t('jobs.private')}
                    color={job.isPublic ? 'success' : 'warning'}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PeopleIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
                    {job.applicantCount}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      component={Link}
                      to={`/jobs/${job.id}`}
                      size="small"
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      component={Link}
                      to={`/jobs/${job.id}/edit`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteClick(job.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Empty States */}
      {jobs.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <WorkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {t('jobs.noJobs')}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/jobs/new"
            startIcon={<AddIcon />}
          >
            {t('jobs.createFirst')}
          </Button>
        </Paper>
      )}

      {jobs.length > 0 && filteredJobs.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {t('filters.noResults')}
          </Typography>
          <Button onClick={clearFilters} variant="outlined">
            {t('filters.clearToSeeAll')}
          </Button>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>{t('jobs.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除這個職缺嗎？此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            取消
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        component={Link}
        to="/jobs/new"
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default JobListPage;