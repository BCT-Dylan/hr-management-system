import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Alert } from '@mui/material';
import { aiAnalysisService } from '../services/aiAnalysisService';

const AIConfigTest: React.FC = () => {
  const isConfigured = aiAnalysisService.isConfigured();
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI 配置檢查
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">API Key 狀態:</Typography>
            <Chip 
              label={isConfigured ? '已配置' : '未配置'} 
              color={isConfigured ? 'success' : 'error'}
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">API Key 長度:</Typography>
            <Typography variant="body2">{apiKey?.length || 0} 字符</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">API Key 前綴:</Typography>
            <Typography variant="body2">
              {apiKey ? `${apiKey.substring(0, 10)}...` : '無'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">環境:</Typography>
            <Typography variant="body2">{process.env.NODE_ENV}</Typography>
          </Box>
        </Box>
        
        <Alert severity={isConfigured ? 'success' : 'warning'} sx={{ mt: 2 }}>
          {aiAnalysisService.getConfigurationMessage()}
        </Alert>
        
        {!isConfigured && (
          <Alert severity="info" sx={{ mt: 1 }}>
            請確認 .env 檔案中是否正確設定了 REACT_APP_OPENAI_API_KEY，並重新啟動開發伺服器。
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AIConfigTest;