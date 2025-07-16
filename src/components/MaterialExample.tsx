import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  Box,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Work as WorkIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { JobPosting } from '../types';

interface MaterialJobCardProps {
  job: JobPosting;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Example of how to use Material-UI components in your HR system
export const MaterialJobCard: React.FC<MaterialJobCardProps> = ({
  job,
  onView,
  onEdit,
  onDelete
}) => {
  return (
    <Card 
      sx={{ 
        maxWidth: 400, 
        m: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            <WorkIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              {job.title}
            </Typography>
            <Chip 
              label={job.isPublic ? '公開' : '不公開'} 
              color={job.isPublic ? 'success' : 'warning'}
              size="small"
            />
          </Box>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          <LocationIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="body2" color="text.secondary">
            {job.department} • {job.location}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={2}>
          <PeopleIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="body2" color="text.secondary">
            {job.applicantCount} 位應徵者
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {job.description.length > 100 
            ? `${job.description.substring(0, 100)}...` 
            : job.description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary">
          建立於: {job.createdAt.toLocaleDateString()}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button 
          size="small" 
          variant="contained" 
          color="primary"
          onClick={() => onView(job.id)}
          startIcon={<EmailIcon />}
        >
          查看
        </Button>
        <Box>
          <Button 
            size="small" 
            onClick={() => onEdit(job.id)}
            sx={{ mr: 1 }}
          >
            編輯
          </Button>
          <Button 
            size="small" 
            color="error"
            onClick={() => onDelete(job.id)}
          >
            刪除
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

export default MaterialJobCard;