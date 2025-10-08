import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box 
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Manage Places', path: '/manageplace' },
    { label: 'History', path: '/history' },
    { label: 'Hotels', path: '/hotel' },
    { label: 'Virtual View', path: '/virtual-view' },
    { label: 'Feedback', path: '/feedback' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => navigate('/')}
        >
          <Box component="span" sx={{ color: 'white' }}>Guj</Box>
          <Box component="span" sx={{ color: 'primary.light' }}>Trip</Box>
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {menuItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{
                textDecoration: isActive(item.path) ? 'underline' : 'none',
                textUnderlineOffset: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              {item.label}
            </Button>
          ))}
          
          <Button
            color="inherit"
            onClick={onLogout}
            variant="outlined"
            sx={{
              ml: 2,
              borderColor: 'white',
              '&:hover': {
                borderColor: 'primary.light',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}