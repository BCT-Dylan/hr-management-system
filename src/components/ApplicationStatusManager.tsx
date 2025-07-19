import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { SketchPicker } from 'react-color';
import { 
  ApplicationStatus, 
  CreateApplicationStatusRequest, 
  UpdateApplicationStatusRequest 
} from '../types';
import { applicationStatusService } from '../services/applicationStatusService';

interface StatusFormData {
  name: string;
  displayName: string;
  description: string;
  color: string;
  isActive: boolean;
  sortOrder?: number;
}

const ApplicationStatusManager: React.FC = () => {
  const [statuses, setStatuses] = useState<ApplicationStatus[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ApplicationStatus | null>(null);
  const [formData, setFormData] = useState<StatusFormData>({
    name: '',
    displayName: '',
    description: '',
    color: '#6c757d',
    isActive: true,
  });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<Record<string, number>>({});
  
  // Notification states
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Predefined colors for quick selection
  const predefinedColors = [
    '#f39c12', // Orange
    '#17a2b8', // Info blue
    '#007bff', // Primary blue
    '#28a745', // Success green
    '#dc3545', // Danger red
    '#6c757d', // Secondary gray
    '#6f42c1', // Purple
    '#20c997', // Teal
    '#fd7e14', // Orange-red
    '#e83e8c', // Pink
  ];

  useEffect(() => {
    loadStatuses();
    loadUsageStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStatuses = async () => {
    try {
      const data = await applicationStatusService.getAllStatuses();
      setStatuses(data);
    } catch (error) {
      showNotification('載入狀態失敗', 'error');
    }
  };

  const loadUsageStats = async () => {
    try {
      const stats = await applicationStatusService.getStatusUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenDialog = (status?: ApplicationStatus) => {
    if (status) {
      setEditingStatus(status);
      setFormData({
        name: status.name,
        displayName: status.displayName,
        description: status.description || '',
        color: status.color,
        isActive: status.isActive,
        sortOrder: status.sortOrder,
      });
    } else {
      setEditingStatus(null);
      setFormData({
        name: '',
        displayName: '',
        description: '',
        color: '#6c757d',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStatus(null);
    setColorPickerOpen(false);
  };

  const handleFormChange = (field: keyof StatusFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleColorChange = (color: any) => {
    setFormData(prev => ({ ...prev, color: color.hex }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return '狀態名稱不能為空';
    if (!formData.displayName.trim()) return '顯示名稱不能為空';
    if (!/^[a-z_]+$/.test(formData.name)) return '狀態名稱只能包含小寫字母和下底線';
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      showNotification(error, 'error');
      return;
    }

    try {
      if (editingStatus) {
        // Update existing status
        const updateRequest: UpdateApplicationStatusRequest = {
          displayName: formData.displayName,
          description: formData.description,
          color: formData.color,
          isActive: formData.isActive,
          sortOrder: formData.sortOrder,
        };
        
        const result = await applicationStatusService.updateStatus(editingStatus.id, updateRequest);
        if (result.success) {
          showNotification(result.message || '更新成功', 'success');
          await loadStatuses();
          handleCloseDialog();
        } else {
          showNotification(result.error || '更新失敗', 'error');
        }
      } else {
        // Create new status
        const createRequest: CreateApplicationStatusRequest = {
          name: formData.name.toLowerCase().replace(/\s+/g, '_'),
          displayName: formData.displayName,
          description: formData.description,
          color: formData.color,
          sortOrder: formData.sortOrder,
        };
        
        const result = await applicationStatusService.createStatus(createRequest);
        if (result.success) {
          showNotification(result.message || '新增成功', 'success');
          await loadStatuses();
          handleCloseDialog();
        } else {
          showNotification(result.error || '新增失敗', 'error');
        }
      }
    } catch (error) {
      showNotification('操作失敗', 'error');
    }
  };

  const handleDelete = async (status: ApplicationStatus) => {
    if (status.isDefault) {
      showNotification('無法刪除系統預設狀態', 'warning');
      return;
    }

    if (!window.confirm(`確定要刪除狀態「${status.displayName}」嗎？`)) {
      return;
    }

    try {
      const result = await applicationStatusService.deleteStatus(status.id);
      if (result.success) {
        showNotification(result.message || '刪除成功', 'success');
        await loadStatuses();
        await loadUsageStats();
      } else {
        showNotification(result.error || '刪除失敗', 'error');
      }
    } catch (error) {
      showNotification('刪除失敗', 'error');
    }
  };

  const handleToggleActive = async (status: ApplicationStatus) => {
    try {
      const result = await applicationStatusService.updateStatus(status.id, {
        isActive: !status.isActive
      });
      
      if (result.success) {
        showNotification(`狀態已${!status.isActive ? '啟用' : '停用'}`, 'success');
        await loadStatuses();
      } else {
        showNotification(result.error || '操作失敗', 'error');
      }
    } catch (error) {
      showNotification('操作失敗', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          申請狀態管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新增狀態
        </Button>
      </Box>

      {/* Overview Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
        gap: 3,
        mb: 3 
      }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              總狀態數
            </Typography>
            <Typography variant="h4">
              {statuses.length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              啟用狀態
            </Typography>
            <Typography variant="h4" color="success.main">
              {statuses.filter(s => s.isActive).length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              系統預設
            </Typography>
            <Typography variant="h4" color="primary.main">
              {statuses.filter(s => s.isDefault).length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              自訂狀態
            </Typography>
            <Typography variant="h4" color="secondary.main">
              {statuses.filter(s => !s.isDefault).length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Status Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}>順序</TableCell>
              <TableCell>狀態名稱</TableCell>
              <TableCell>顯示名稱</TableCell>
              <TableCell>描述</TableCell>
              <TableCell width={100}>顏色</TableCell>
              <TableCell width={80}>使用數量</TableCell>
              <TableCell width={80}>狀態</TableCell>
              <TableCell width={120}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statuses.map((status) => (
              <TableRow key={status.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DragIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    {status.sortOrder}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <code style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}>
                      {status.name}
                    </code>
                    {status.isDefault && (
                      <Chip 
                        label="系統預設" 
                        size="small" 
                        color="primary" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={status.displayName}
                    sx={{
                      backgroundColor: status.color,
                      color: '#fff',
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {status.description || '無描述'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: status.color,
                      borderRadius: '50%',
                      border: '1px solid #ddd',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {usageStats[status.id] || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={status.isActive ? '點擊停用' : '點擊啟用'}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleActive(status)}
                      color={status.isActive ? 'success' : 'default'}
                    >
                      {status.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="編輯">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(status)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {!status.isDefault && (
                      <Tooltip title="刪除">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(status)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingStatus ? '編輯狀態' : '新增狀態'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {!editingStatus && (
              <TextField
                label="狀態名稱 (英文)"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                helperText="用於系統內部識別，僅限小寫英文字母和底線"
                placeholder="例如：interviewing"
                fullWidth
              />
            )}
            
            <TextField
              label="顯示名稱"
              value={formData.displayName}
              onChange={(e) => handleFormChange('displayName', e.target.value)}
              helperText="在介面中顯示的名稱"
              placeholder="例如：面試中"
              fullWidth
            />
            
            <TextField
              label="描述"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              multiline
              rows={2}
              helperText="此狀態的詳細說明"
              fullWidth
            />

            {/* Color Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                顏色選擇
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {predefinedColors.map((color) => (
                  <Box
                    key={color}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: color,
                      borderRadius: '50%',
                      border: formData.color === color ? '3px solid #000' : '1px solid #ddd',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleFormChange('color', color)}
                  />
                ))}
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
              >
                自訂顏色
              </Button>
              {colorPickerOpen && (
                <Box sx={{ mt: 2 }}>
                  <SketchPicker
                    color={formData.color}
                    onChange={handleColorChange}
                  />
                </Box>
              )}
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => handleFormChange('isActive', e.target.checked)}
                />
              }
              label="啟用此狀態"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            取消
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingStatus ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApplicationStatusManager;