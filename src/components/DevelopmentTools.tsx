import React from 'react';
import AIConfigTest from './AIConfigTest';
import AITestButton from './AITestButton';

/**
 * Development Tools Component
 * Only renders in development environment
 */
const DevelopmentTools: React.FC = () => {
  // Only render in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <AIConfigTest />
      <AITestButton />
    </>
  );
};

export default DevelopmentTools;