import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Psychology as AIIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as StrengthIcon,
  TrendingDown as WeaknessIcon,
  Lightbulb as RecommendationIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as EducationIcon,
  Work as ExperienceIcon,
  Code as SkillIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { Applicant, ExtractedInfo } from '../types';

interface AIAnalysisDisplayProps {
  applicant: Applicant;
  showExtractedInfo?: boolean;
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({
  applicant,
  showExtractedInfo = true,
}) => {
  const hasAIAnalysis = applicant.analysisCompleted && applicant.matchPercentage !== undefined;
  const hasExtractedInfo = applicant.extractedInfo && Object.keys(applicant.extractedInfo).length > 0;

  if (!hasAIAnalysis && !hasExtractedInfo) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          此應徵者尚未進行 AI 分析，或分析結果不可用。
        </Typography>
      </Alert>
    );
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const renderExtractedInfo = (info: ExtractedInfo) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1 }} />
          提取的個人資訊
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* Basic Info */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                基本資料
              </Typography>
              {info.name && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{info.name}</Typography>
                </Box>
              )}
              {info.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{info.email}</Typography>
                </Box>
              )}
              {info.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{info.phone}</Typography>
                </Box>
              )}
              {info.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{info.location}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Skills */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
            {info.skills && info.skills.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <SkillIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  技能
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {info.skills.slice(0, 8).map((skill, index) => (
                    <Chip key={index} label={skill} size="small" variant="outlined" />
                  ))}
                  {info.skills.length > 8 && (
                    <Chip label={`+${info.skills.length - 8} 更多`} size="small" color="primary" />
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {/* Languages */}
          {info.languages && info.languages.length > 0 && (
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <LanguageIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  語言能力
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {info.languages.map((lang, index) => (
                    <Chip 
                      key={index} 
                      label={`${lang.language} (${lang.level})`} 
                      size="small" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {/* Education */}
          {info.education && info.education.length > 0 && (
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <EducationIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  學歷
                </Typography>
                {info.education.slice(0, 2).map((edu, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>{edu.degree}</strong>
                      {edu.major && ` - ${edu.major}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {edu.school}
                      {edu.graduation_year && ` (${edu.graduation_year})`}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Experience */}
          {info.experience && info.experience.length > 0 && (
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <ExperienceIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  工作經驗
                </Typography>
                {info.experience.slice(0, 3).map((exp, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>{exp.position}</strong> @ {exp.company}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {exp.duration}
                    </Typography>
                    {exp.description && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        {exp.description.length > 100 
                          ? `${exp.description.substring(0, 100)}...` 
                          : exp.description
                        }
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* AI Match Score */}
      {hasAIAnalysis && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AIIcon sx={{ mr: 1 }} />
              AI 分析結果
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  職位適配度
                </Typography>
                <Chip
                  label={`${applicant.matchPercentage}%`}
                  color={getMatchColor(applicant.matchPercentage!)}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={applicant.matchPercentage}
                color={getMatchColor(applicant.matchPercentage!)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {applicant.aiSummary && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  分析摘要
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {applicant.aiSummary}
                </Typography>
              </Box>
            )}

            {applicant.aiAnalysisSummary && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">詳細分析報告</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {applicant.aiAnalysisSummary}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Processing Status */}
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                分析狀態: {applicant.processingStatus || '未知'}
                {applicant.analysisCompletedAt && (
                  <> • 完成時間: {applicant.analysisCompletedAt.toLocaleString()}</>
                )}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Extracted Information */}
      {showExtractedInfo && hasExtractedInfo && renderExtractedInfo(applicant.extractedInfo!)}

      {/* Processing Status for Non-analyzed */}
      {!hasAIAnalysis && applicant.processingStatus && (
        <Alert 
          severity={
            applicant.processingStatus === 'failed' ? 'error' :
            applicant.processingStatus === 'processing' ? 'info' : 'warning'
          }
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            處理狀態: {
              applicant.processingStatus === 'pending' ? '等待處理' :
              applicant.processingStatus === 'processing' ? '分析中...' :
              applicant.processingStatus === 'failed' ? '分析失敗' :
              applicant.processingStatus
            }
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default AIAnalysisDisplay;