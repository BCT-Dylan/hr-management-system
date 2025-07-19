import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Schedule as TimeIcon,
  Psychology as AIIcon,
} from '@mui/icons-material';
import { Applicant } from '../types';
import AIAnalysisDisplay from './AIAnalysisDisplay';

interface ApplicantDetailDialogProps {
  open: boolean;
  onClose: () => void;
  applicant: Applicant | null;
}

const ApplicantDetailDialog: React.FC<ApplicantDetailDialogProps> = ({
  open,
  onClose,
  applicant,
}) => {
  if (!applicant) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selected': return 'success';
      case 'rejected': return 'error';
      case 'reviewed': return 'primary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待審核';
      case 'reviewed': return '已審核';
      case 'selected': return '已選中';
      case 'rejected': return '已拒絕';
      default: return status;
    }
  };

  const score = applicant.matchPercentage || applicant.aiScore;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{applicant.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                應徵者詳情
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Basic Info */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              基本資訊
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{applicant.name}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{applicant.email}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {applicant.uploadedAt.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={getStatusLabel(applicant.status)}
                color={getStatusColor(applicant.status)}
                size="small"
              />
              
              {score && (
                <Chip
                  icon={<AIIcon />}
                  label={`適配度 ${score}%`}
                  color={
                    score >= 80 ? 'success' 
                    : score >= 60 ? 'primary' 
                    : 'warning'
                  }
                  size="small"
                />
              )}
              
              {applicant.emailSent && (
                <Chip
                  label="已發送郵件"
                  color="info"
                  size="small"
                  variant="outlined"
                />
              )}

              {applicant.isSelected && (
                <Chip
                  label="已選中"
                  color="success"
                  size="small"
                />
              )}
            </Box>

            {/* Resume File Info */}
            {(applicant.resumeFileName || applicant.resumeFile) && (
              <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  履歷檔案
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  檔案名稱: {applicant.resumeFileName || applicant.resumeFile}
                </Typography>
                {applicant.resumeFileSize && (
                  <Typography variant="body2" color="text.secondary">
                    檔案大小: {(applicant.resumeFileSize / 1024 / 1024).toFixed(1)} MB
                  </Typography>
                )}
                {applicant.processingStatus && (
                  <Typography variant="body2" color="text.secondary">
                    處理狀態: {
                      applicant.processingStatus === 'pending' ? '等待處理' :
                      applicant.processingStatus === 'processing' ? '處理中' :
                      applicant.processingStatus === 'completed' ? '已完成' :
                      applicant.processingStatus === 'failed' ? '處理失敗' :
                      applicant.processingStatus
                    }
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        {/* AI Analysis Results */}
        <AIAnalysisDisplay applicant={applicant} showExtractedInfo={true} />

        {/* Resume Content Preview */}
        {applicant.resumeContent && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                履歷內容預覽
              </Typography>
              <Box 
                sx={{ 
                  maxHeight: 300, 
                  overflow: 'auto', 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {applicant.resumeContent.length > 2000 
                  ? `${applicant.resumeContent.substring(0, 2000)}...`
                  : applicant.resumeContent
                }
              </Box>
              {applicant.resumeContent.length > 2000 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  僅顯示前 2000 個字符
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicantDetailDialog;