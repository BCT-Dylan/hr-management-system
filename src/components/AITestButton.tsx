import React, { useState } from 'react';
import { Button, Card, CardContent, Typography, Alert, CircularProgress } from '@mui/material';
import { aiAnalysisService } from '../services/aiAnalysisService';

const AITestButton: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testAIConnection = async () => {
    setTesting(true);
    setResult('');
    setError('');

    try {
      // 測試簡單的 AI 呼叫
      const testResume = `
        姓名：張小明
        電話：0912-345-678
        經驗：2年 React 開發經驗
        技能：JavaScript, TypeScript, React
      `;
      
      console.log('Testing AI with sample resume...');
      const extractedInfo = await aiAnalysisService.extractPersonalInfo(testResume);
      
      setResult(`測試成功！提取到的資訊：
姓名: ${extractedInfo.name || '未提取到'}
技能: ${extractedInfo.skills?.join(', ') || '未提取到'}`);
      
    } catch (err) {
      console.error('AI Test failed:', err);
      setError(`測試失敗: ${err instanceof Error ? err.message : '未知錯誤'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI 連線測試
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={testAIConnection} 
          disabled={testing || !aiAnalysisService.isConfigured()}
          startIcon={testing ? <CircularProgress size={20} /> : undefined}
          sx={{ mb: 2 }}
        >
          {testing ? '測試中...' : 'TS AI 連線'}
        </Button>
        
        {result && (
          <Alert severity="success" sx={{ mb: 1 }}>
            {result}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        
        {!aiAnalysisService.isConfigured() && (
          <Alert severity="warning">
            AI 服務未配置，無法進行測試
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AITestButton;