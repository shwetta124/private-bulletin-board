import React from 'react';
import { Box } from '@mui/material';
import { Header } from './Header';

export const MainLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <Box sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      <Header />
      {children}
    </Box>
  );
};
