import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Alert,
  Snackbar,
  Fab,
  AppBar,
  Toolbar,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

// Demo page showing Material-UI components integration
const MaterialUIDemo: React.FC = () => {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSnackbar(true);
    console.log('Form submitted:', formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Demo App Bar */}
      <AppBar position="static">
        <Toolbar>
          <WorkIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            HR 系統 - Material-UI 演示
          </Typography>
          <Button color="inherit">登出</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Material-UI 組件演示
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            展示如何在您的HR系統中使用Material-UI組件
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Form Demo */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  表單範例
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="姓名"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="電子郵件"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="職位"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                  <Box sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      fullWidth
                    >
                      提交申請
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Status Chips Demo */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  狀態標籤
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  <Chip label="待審核" color="warning" />
                  <Chip label="已審核" color="info" />
                  <Chip label="已選中" color="success" />
                  <Chip label="已拒絕" color="error" />
                  <Chip label="面試中" color="primary" />
                </Box>

                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                  通知提醒
                </Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                  職缺建立成功！
                </Alert>
                <Alert severity="info" sx={{ mb: 2 }}>
                  您有 3 位新的應徵者
                </Alert>
                <Alert severity="warning">
                  請設定面試時間
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* List Demo */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  應徵者列表範例
                </Typography>
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="王小明"
                      secondary="前端工程師 • AI評分: 85分"
                    />
                    <Chip label="待審核" color="warning" size="small" />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                  
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="李小華"
                      secondary="後端工程師 • AI評分: 92分"
                    />
                    <Chip label="已選中" color="success" size="small" />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                  
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'info.main' }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="張小美"
                      secondary="UI/UX設計師 • AI評分: 78分"
                    />
                    <Chip label="已審核" color="info" size="small" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
          onClick={() => setOpenSnackbar(true)}
        >
          <AddIcon />
        </Fab>

        {/* Snackbar Notification */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={() => setOpenSnackbar(false)}
        >
          <Alert 
            onClose={() => setOpenSnackbar(false)} 
            severity="success"
            sx={{ width: '100%' }}
          >
            操作成功完成！
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default MaterialUIDemo;