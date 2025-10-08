import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Autocomplete,
  Fab,
  IconButton,
  Chip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Image as ImageIcon, Save as SaveIcon } from '@mui/icons-material';
import { ref, get, set, child } from 'firebase/database';
import { database } from '../firebase';

export default function History() {
  const [city, setCity] = useState('');
  const [place, setPlace] = useState('');
  const [placesData, setPlacesData] = useState({});
  const [historyItems, setHistoryItems] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [snackbar, setSnackbar] = useState({open: false, message: '', severity: 'success'});

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const snapshot = await get(child(ref(database), 'places'));
        if (snapshot.exists()) {
          setPlacesData(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching places:', error);
      }
    };
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (city && place) {
      loadHistory(city, place);
    }
  }, [city, place]);

  const loadHistory = async (cityName, placeName) => {
    try {
      const snapshot = await get(child(ref(database), `history/${cityName}/${placeName}`));
      if (snapshot.exists()) {
        const historyData = snapshot.val();
        const historyArray = Object.entries(historyData).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setHistoryItems(historyArray);
      } else {
        setHistoryItems([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const addParagraph = () => {
    setHistoryItems(prev => [...prev, { 
      id: Date.now().toString(),
      type: 'paragraph', 
      content: '' 
    }]);
  };

  const addImage = () => {
    setHistoryItems(prev => [...prev, { 
      id: Date.now().toString(),
      type: 'image', 
      content: '', 
      previewUrl: '', 
      isUploading: false 
    }]);
  };

  const handleFileChange = async (index, file) => {
    if (!file) return;

    const filename = `img_${Date.now()}.${file.name.split('.').pop()}`;
    const previewUrl = URL.createObjectURL(file);
    
    const updatedItems = [...historyItems];
    updatedItems[index] = { 
      ...updatedItems[index], 
      previewUrl: previewUrl, 
      isUploading: true, 
      uploadError: null 
    };
    setHistoryItems(updatedItems);
    setUploadStatus(`Uploading ${filename}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", filename.split('.')[0]);

      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      const successUpdatedItems = [...historyItems];
      successUpdatedItems[index] = {
        ...successUpdatedItems[index],
        content: data.path,
        isUploading: false,
        uploadError: null
      };
      setHistoryItems(successUpdatedItems);
      setUploadStatus('Upload complete!');
      setTimeout(() => setUploadStatus(''), 2000);
      
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus(`Upload failed: ${err.message}`);
      const errorUpdatedItems = [...historyItems];
      errorUpdatedItems[index] = {
        ...errorUpdatedItems[index],
        isUploading: false,
        uploadError: err.message
      };
      setHistoryItems(errorUpdatedItems);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleContentChange = (index, content) => {
    const updatedItems = [...historyItems];
    updatedItems[index].content = content;
    setHistoryItems(updatedItems);
  };

  const handleRemove = (index) => {
    const updated = [...historyItems];
    const removed = updated.splice(index, 1)[0];
    if (removed.type === 'image' && removed.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    setHistoryItems(updated);
  };

  const handleSubmit = async () => {
    if (!city || !place) {
      setSnackbar({open: true, message: 'Please select city and place', severity: 'error'});
      return;
    }

    if (historyItems.some(item => item.isUploading)) {
      setSnackbar({open: true, message: 'Please wait for image uploads to complete', severity: 'warning'});
      return;
    }

    try {
      const payload = historyItems.map((item) => ({
        type: item.type,
        content: item.content
      }));
      
      await set(ref(database, `history/${city}/${place}`), payload);
      setSnackbar({open: true, message: 'History saved successfully!', severity: 'success'});
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      setSnackbar({open: true, message: 'Failed to save history', severity: 'error'});
    }
  };

  const cityOptions = Object.keys(placesData);
  const placeOptions = city ? Object.keys(placesData[city] || {}) : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Manage Place History
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={cityOptions}
              value={city}
              onChange={(e, value) => setCity(value || '')}
              renderInput={(params) => 
                <TextField {...params} label="Select City" required />
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={placeOptions}
              value={place}
              onChange={(e, value) => setPlace(value || '')}
              renderInput={(params) => 
                <TextField {...params} label="Select Place" required />
              }
              disabled={!city}
            />
          </Grid>
        </Grid>

        {uploadStatus && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {uploadStatus}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={addParagraph}
          >
            Add Paragraph
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ImageIcon />} 
            onClick={addImage}
          >
            Add Image
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />} 
            onClick={handleSubmit}
            disabled={!city || !place}
          >
            Save History
          </Button>
        </Box>

        {historyItems.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                No content added yet. 
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Add Paragraph" or "Add Image" to get started.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box>
            {historyItems.map((item, index) => (
              <Card key={item.id || index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip 
                      label={item.type === 'paragraph' ? 'Paragraph' : 'Image'} 
                      size="small"
                      color={item.type === 'paragraph' ? 'primary' : 'secondary'}
                    />
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemove(index)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  {item.type === 'paragraph' ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={item.content}
                      onChange={(e) => handleContentChange(index, e.target.value)}
                      placeholder="Enter paragraph content..."
                      variant="outlined"
                    />
                  ) : (
                    <Box>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{ mb: 2 }}
                      >
                        Choose Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(index, e.target.files[0])}
                          hidden
                        />
                      </Button>
                      
                      {item.previewUrl && (
                        <Box sx={{ textAlign: 'center' }}>
                          <img
                            src={item.previewUrl}
                            alt="Preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '300px',
                              borderRadius: '8px'
                            }}
                          />
                          {item.isUploading && (
                            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                              Uploading...
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {item.uploadError && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          Upload failed: {item.uploadError}
                        </Alert>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({...snackbar, open: false})}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}