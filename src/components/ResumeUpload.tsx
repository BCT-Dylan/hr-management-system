import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Psychology as AIIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { JobPosting, Applicant } from '../types';
import { resumeProcessingService } from '../services/resumeProcessingService';
import { resumeParsingService } from '../services/resumeParsingService';
import AIAnalysisDisplay from './AIAnalysisDisplay';

interface ResumeUploadProps {
  jobPosting: JobPosting;
  onSuccess?: (applicant: Applicant) => void;
  onError?: (error: string) => void;
}

interface UploadStep {
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({
  jobPosting,
  onSuccess,
  onError,
}) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<UploadStep[]>([
    { label: '上傳履歷', status: 'pending' },
    { label: '解析文件', status: 'pending' },
    { label: '提取個人資訊', status: 'pending' },
    { label: 'AI 分析', status: 'pending' },
    { label: '完成', status: 'pending' }
  ]);
  const [result, setResult] = useState<Applicant | null>(null);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && resumeParsingService.isSupportedFormat(file)) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('不支援的檔案格式，請上傳 PDF 或 Word 文件 (.pdf, .docx)');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const updateStepStatus = (stepIndex: number, status: UploadStep['status'], message?: string) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, status, message }
        : index < stepIndex 
          ? { ...step, status: 'completed' }
          : step
    ));
    setCurrentStep(stepIndex);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('請選擇履歷檔案');
      return;
    }

    setProcessing(true);
    setError('');
    setResult(null);
    
    try {
      // Step 1: File uploaded
      updateStepStatus(0, 'completed', '檔案上傳成功');
      
      // Step 2: Parse document
      updateStepStatus(1, 'active', '正在解析文件內容...');
      
      // Step 3: Process resume with AI-extracted info
      const processResult = await resumeProcessingService.processResume({
        file: selectedFile,
        notes: notes.trim(),
        jobPosting,
      });

      if (processResult.success && processResult.applicant) {
        updateStepStatus(1, 'completed', '文件解析完成');
        
        updateStepStatus(2, 'completed', '個人資訊提取完成');
        
        if (jobPosting.aiAnalysisEnabled) {
          updateStepStatus(3, 'active', '正在進行 AI 分析...');
          
          // Wait a bit for AI analysis to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (processResult.applicant.analysisCompleted) {
            updateStepStatus(3, 'completed', `AI 分析完成 (適配度: ${processResult.applicant.matchPercentage}%)`);
          } else {
            updateStepStatus(3, 'error', 'AI 分析失敗或未完成');
          }
        } else {
          updateStepStatus(3, 'completed', 'AI 分析已跳過（未啟用）');
        }
        
        updateStepStatus(4, 'completed', '履歷處理完成');
        setResult(processResult.applicant);
        
        if (onSuccess) {
          onSuccess(processResult.applicant);
        }
      } else {
        updateStepStatus(1, 'error', processResult.error || '處理失敗');
        setError(processResult.error || '履歷處理失敗');
        
        if (onError) {
          onError(processResult.error || '履歷處理失敗');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      updateStepStatus(currentStep, 'error', errorMessage);
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setNotes('');
    setSelectedFile(null);
    setProcessing(false);
    setCurrentStep(0);
    setSteps([
      { label: '上傳履歷', status: 'pending' },
      { label: '解析文件', status: 'pending' }, 
      { label: '提取個人資訊', status: 'pending' },
      { label: 'AI 分析', status: 'pending' },
      { label: '完成', status: 'pending' }
    ]);
    setResult(null);
    setError('');
  };

  const getStepIcon = (step: UploadStep) => {
    switch (step.status) {
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'active':
        return <CircularProgress size={24} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<UploadIcon />}
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}
      >
        上傳履歷
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          應徵：{jobPosting.title}
        </DialogTitle>
        
        <DialogContent>
          {!processing && !result && (
            <Box sx={{ mt: 2 }}>
              {/* Notes Section */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    備註資訊 (選填)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="備註"
                    placeholder="可記錄應徵者的特殊情況、來源管道或其他相關資訊..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={processing}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    💡 應徵者的姓名和聯絡資訊將自動從履歷中提取
                  </Typography>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    履歷文件
                  </Typography>
                  
                  <Box
                    {...getRootProps()}
                    sx={{
                      border: 2,
                      borderColor: isDragActive ? 'primary.main' : 'grey.300',
                      borderStyle: 'dashed',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: isDragActive ? 'action.hover' : 'background.default',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <input {...getInputProps()} />
                    <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    
                    {selectedFile ? (
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          已選擇檔案
                        </Typography>
                        <Chip
                          icon={<FileIcon />}
                          label={`${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(1)} MB)`}
                          color="primary"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          點擊或拖拽檔案到此處以更換
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {isDragActive ? '放開以上傳檔案' : '拖拽履歷檔案到此處'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          或點擊選擇檔案
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          支援格式：{resumeParsingService.getFileTypeDescription()}
                          <br />
                          檔案大小限制：10MB
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* AI Analysis Info */}
              {jobPosting.aiAnalysisEnabled && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <AIIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    此職缺已啟用 AI 履歷分析功能，系統將自動：
                    <br />• 提取應徵者的姓名、聯絡資訊和工作經驗
                    <br />• 根據職缺要求計算適配度評分
                    <br />• 提供詳細的分析報告和建議
                  </Typography>
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          )}

          {/* Processing Steps */}
          {processing && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                處理進度
              </Typography>
              <Stepper activeStep={currentStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label} completed={step.status === 'completed'}>
                    <StepLabel
                      error={step.status === 'error'}
                      icon={getStepIcon(step)}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      {step.message && (
                        <Typography variant="body2" color="text.secondary">
                          {step.message}
                        </Typography>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {/* Results */}
          {result && !processing && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  履歷上傳並處理完成！應徵者已成功加入此職缺。
                </Typography>
              </Alert>
              
              <AIAnalysisDisplay applicant={result} />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={processing}>
            {result ? '關閉' : '取消'}
          </Button>
          {!processing && !result && (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!selectedFile}
            >
              提交履歷
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResumeUpload;