import React from 'react';
import { Box, Container } from '@mui/material';
import ApplicationStatusManager from '../components/ApplicationStatusManager';

const ApplicationStatusPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <ApplicationStatusManager />
    </Container>
  );
};

export default ApplicationStatusPage;