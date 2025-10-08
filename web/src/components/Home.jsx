import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper
} from '@mui/material';
import { LocationOn, Hotel, History, Visibility } from '@mui/icons-material';

export default function Home() {
  const stats = [
    {
      title: 'Places Managed',
      value: '330+',
      icon: <LocationOn sx={{ fontSize: 40, color: 'primary.main' }} />,
      description: 'Tourist destinations across Gujarat'
    },
    {
      title: 'Hotels & Restaurants',
      value: '100+',
      icon: <Hotel sx={{ fontSize: 40, color: 'primary.main' }} />,
      description: 'Verified accommodations and dining'
    },
    {
      title: 'Historical Records',
      value: '330+',
      icon: <History sx={{ fontSize: 40, color: 'primary.main' }} />,
      description: 'Rich cultural and historical content'
    },
    {
      title: 'Virtual Views',
      value: '600+',
      icon: <Visibility sx={{ fontSize: 40, color: 'primary.main' }} />,
      description: '360° virtual tour experiences'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Paper 
        sx={{ 
          p: 6, 
          mb: 4, 
          background: 'linear-gradient(135deg, #ff4d4d 0%, #ff7b7b 100%)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Welcome to GujTrip Admin
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
          Manage Gujarat's tourism destinations, hotels, and cultural heritage with our comprehensive admin dashboard.
        </Typography>
      </Paper>

      {/* Quick Stats */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Platform Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  {stat.icon}
                </Box>
                <Typography variant="h4" component="div" color="primary" fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                  {stat.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activities */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Content Management
            </Typography>
            <Typography variant="body1" paragraph>
              Add and manage tourist places, update hotel information, and maintain historical records for Gujarat's rich cultural heritage.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                • Manage Places • Hotel Database • Historical Content
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="primary">
              User Feedback
            </Typography>
            <Typography variant="body1" paragraph>
              Monitor and respond to user feedback from the mobile app. Track user satisfaction and improve services based on real user experiences.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                • Place Reviews • Hotel Feedback • Service Improvements
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Virtual Reality Integration
            </Typography>
            <Typography variant="body1" paragraph>
              Manage virtual tour content and 360° experiences for Gujarat's tourist destinations. Provide immersive experiences to help travelers plan their visits.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                • Virtual Tours • 360° Views • Interactive Maps
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Footer Info */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          System Status: All Services Operational
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Database connected • File uploads enabled • Real-time sync active
        </Typography>
      </Paper>
    </Container>
  );
}