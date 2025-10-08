import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ref, get, child } from 'firebase/database';
import { database } from '../firebase';

export default function Feedback() {
  const [feedbackType, setFeedbackType] = useState('place');
  const [placeFeedback, setPlaceFeedback] = useState([]);
  const [hotelFeedback, setHotelFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const snapshot = await get(child(ref(database), 'feedback'));
        
        if (snapshot.exists()) {
          const feedbackData = snapshot.val();
          
          // Extract place feedback
          if (feedbackData.place) {
            const placeData = Object.entries(feedbackData.place).map(([key, value], index) => ({
              id: index,
              key: key,
              ...value
            }));
            setPlaceFeedback(placeData);
          }

          // Extract hotel feedback
          if (feedbackData.hotel) {
            const hotelData = Object.entries(feedbackData.hotel).map(([key, value], index) => ({
              id: index,
              key: key,
              ...value
            }));
            setHotelFeedback(hotelData);
          }
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setError('Failed to load feedback data');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  const handleTypeChange = (event, newType) => {
    if (newType !== null) {
      setFeedbackType(newType);
    }
  };

  const placeColumns = [
    { field: 'name', headerName: 'Place Name', flex: 1 },
    { field: 'mobile', headerName: 'Mobile', flex: 1 },
    { field: 'subject', headerName: 'Subject', flex: 1.5 },
    { field: 'desc', headerName: 'Description', flex: 2 },
  ];

  const hotelColumns = [
    { field: 'name', headerName: 'Hotel Name', flex: 1 },
    { field: 'mobile', headerName: 'Mobile', flex: 1 },
    { field: 'subject', headerName: 'Subject', flex: 1.5 },
    { field: 'desc', headerName: 'Description', flex: 2 },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading feedback...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Paper>
      </Container>
    );
  }

  const currentData = feedbackType === 'place' ? placeFeedback : hotelFeedback;
  const currentColumns = feedbackType === 'place' ? placeColumns : hotelColumns;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Typography variant="h4" color="primary">
            Feedback Management
          </Typography>
          
          <ToggleButtonGroup
            value={feedbackType}
            exclusive
            onChange={handleTypeChange}
            aria-label="feedback type"
          >
            <ToggleButton value="place" aria-label="place feedback">
              Place Feedback
            </ToggleButton>
            <ToggleButton value="hotel" aria-label="hotel feedback">
              Hotel Feedback
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          {feedbackType === 'place' ? 'Place' : 'Hotel'} Feedback 
          ({currentData.length} entries)
        </Typography>

        {currentData.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No {feedbackType} feedback available
          </Alert>
        ) : (
          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={currentData}
              columns={currentColumns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(255, 77, 77, 0.04)',
                },
              }}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
}