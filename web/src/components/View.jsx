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
  FormControlLabel,
  Checkbox,
  Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ref, get, set, update, remove, child } from 'firebase/database';
import { database } from '../firebase';

export default function View() {
  const [mode, setMode] = useState('add');
  const [virtualView, setVirtualView] = useState({
    placeName: '', viewName: '', embedLink: '', description: '', isDefault: false
  });
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allViews, setAllViews] = useState({});
  const [placeNames, setPlaceNames] = useState([]);
  const [currentPlaceViews, setCurrentPlaceViews] = useState([]);
  const [snackbar, setSnackbar] = useState({open: false, message: '', severity: 'success'});

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const snapshot = await get(child(ref(database), 'virtualViews'));
        if (snapshot.exists()) {
          const viewsData = snapshot.val();
          setAllViews(viewsData);
          
          // Extract unique place names
          const places = new Set();
          Object.values(viewsData).forEach(view => {
            if (view.placeName) places.add(view.placeName);
          });
          setPlaceNames(Array.from(places));
        }
      } catch (error) {
        console.error('Error fetching views:', error);
      }
    };
    fetchViews();
  }, []);

  // Update current place views when placeName changes
  useEffect(() => {
    if (virtualView.placeName && allViews) {
      const viewsForPlace = Object.values(allViews).filter(
        view => view.placeName === virtualView.placeName
      );
      setCurrentPlaceViews(viewsForPlace);
    } else {
      setCurrentPlaceViews([]);
    }
  }, [virtualView.placeName, allViews]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVirtualView(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (value.length > 1) {
      const results = [];
      for (const key in allViews) {
        const viewData = allViews[key];
        if (
          viewData.placeName.toLowerCase().includes(value.toLowerCase()) ||
          viewData.viewName.toLowerCase().includes(value.toLowerCase())
        ) {
          results.push({
            placeName: viewData.placeName,
            viewName: viewData.viewName,
            key: key
          });
        }
      }
      setSuggestions(results.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (item) => {
    setVirtualView(allViews[item.key]);
    setSearchInput(`${item.placeName} - ${item.viewName}`);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!virtualView.placeName || !virtualView.viewName || !virtualView.embedLink) {
      setSnackbar({open: true, message: 'Place Name, View Name and Embed Link are required.', severity: 'error'});
      return;
    }

    // Validate embed link
    if (!virtualView.embedLink.includes('<iframe')) {
      setSnackbar({open: true, message: 'Please provide a valid iframe embed code.', severity: 'error'});
      return;
    }

    const viewKey = `${virtualView.placeName}_${virtualView.viewName}`.replace(/\s+/g, '_');

    try {
      // If setting as default, unset other defaults for this place
      if (virtualView.isDefault) {
        const updates = {};
        Object.keys(allViews).forEach(key => {
          if (allViews[key].placeName === virtualView.placeName && allViews[key].isDefault) {
            updates[`virtualViews/${key}/isDefault`] = false;
          }
        });
        if (Object.keys(updates).length > 0) {
          await update(ref(database), updates);
        }
      }

      const databaseRef = ref(database, `virtualViews/${viewKey}`);
      if (mode === 'add') {
        await set(databaseRef, virtualView);
        setSnackbar({open: true, message: 'Virtual View added successfully!', severity: 'success'});
      } else if (mode === 'edit') {
        await update(databaseRef, virtualView);
        setSnackbar({open: true, message: 'Virtual View updated successfully!', severity: 'success'});
      } else if (mode === 'delete') {
        await remove(databaseRef);
        setSnackbar({open: true, message: 'Virtual View deleted successfully!', severity: 'success'});
      }

      // Reset form
      setVirtualView({
        placeName: mode === 'add' ? '' : virtualView.placeName,
        viewName: '', embedLink: '', description: '', isDefault: false
      });
      setSearchInput('');
      setSuggestions([]);

      // Refresh data
      const snapshot = await get(child(ref(database), 'virtualViews'));
      if (snapshot.exists()) {
        setAllViews(snapshot.val());
      }

    } catch (error) {
      setSnackbar({open: true, message: `Error: ${error.message}`, severity: 'error'});
    }
  };

  const setAsDefault = async (viewKey) => {
    try {
      const updates = {};
      // First unset any existing default for this place
      Object.keys(allViews).forEach(key => {
        if (allViews[key].placeName === allViews[viewKey].placeName && allViews[key].isDefault) {
          updates[`virtualViews/${key}/isDefault`] = false;
        }
      });
      // Set the new default
      updates[`virtualViews/${viewKey}/isDefault`] = true;
      await update(ref(database), updates);
      setSnackbar({open: true, message: 'Default view updated successfully!', severity: 'success'});
      
      // Refresh data
      const snapshot = await get(child(ref(database), 'virtualViews'));
      if (snapshot.exists()) {
        setAllViews(snapshot.val());
      }
    } catch (error) {
      setSnackbar({open: true, message: 'Failed to set default view', severity: 'error'});
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Manage Virtual Views
        </Typography>

        {/* Search Section for Edit/Delete */}
        {(mode === 'edit' || mode === 'delete') && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search Virtual View
              </Typography>
              <Autocomplete
                freeSolo
                options={suggestions}
                getOptionLabel={(option) => typeof option === 'string' ? option : `${option.placeName} - ${option.viewName}`}
                inputValue={searchInput}
                onInputChange={(e, value) => handleSearchChange(value)}
                onChange={(e, value) => value && handleSuggestionClick(value)}
                renderInput={(params) => 
                  <TextField {...params} label="Search by place name or view name" />
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Form Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={placeNames}
              value={virtualView.placeName}
              onChange={(e, value) => setVirtualView(prev => ({...prev, placeName: value || ''}))}
              renderInput={(params) => 
                <TextField {...params} label="Place Name" required />
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="View Name"
              name="viewName"
              value={virtualView.viewName}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Embed Link (iframe code)"
              name="embedLink"
              value={virtualView.embedLink}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              required
              placeholder="<iframe src='...' width='...' height='...'></iframe>"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              name="description"
              value={virtualView.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isDefault"
                  checked={virtualView.isDefault}
                  onChange={handleChange}
                />
              }
              label="Set as default view for this place"
            />
          </Grid>
        </Grid>

        {/* Preview Section */}
        {virtualView.embedLink && mode !== 'delete' && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box 
                sx={{ 
                  '& iframe': { 
                    width: '100%', 
                    height: '400px',
                    border: 'none',
                    borderRadius: 1
                  } 
                }}
                dangerouslySetInnerHTML={{ __html: virtualView.embedLink }}
              />
            </CardContent>
          </Card>
        )}

        <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            size="large"
          >
            {mode === 'add' ? 'Add Virtual View' : mode === 'edit' ? 'Update Virtual View' : 'Delete Virtual View'}
          </Button>
          
          <Button 
            variant={mode === 'add' ? 'contained' : 'outlined'} 
            color="secondary" 
            onClick={() => setMode('add')}
          >
            Add
          </Button>
          <Button 
            variant={mode === 'edit' ? 'contained' : 'outlined'} 
            color="secondary" 
            onClick={() => setMode('edit')}
          >
            Edit
          </Button>
          <Button 
            variant={mode === 'delete' ? 'contained' : 'outlined'} 
            color="error" 
            onClick={() => setMode('delete')}
          >
            Delete
          </Button>
        </Box>

        {/* Current views for selected place */}
        {virtualView.placeName && currentPlaceViews.length > 0 && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Current Views for {virtualView.placeName}
              </Typography>
              <Grid container spacing={2}>
                {currentPlaceViews.map((view, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6">
                          {view.viewName}
                        </Typography>
                        {view.isDefault && (
                          <Chip label="Default" color="success" size="small" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {view.description}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            setVirtualView(view);
                            setMode('delete');
                          }}
                        >
                          Delete
                        </Button>
                        {!view.isDefault && (
                          <Button
                            size="small"
                            color="primary"
                            onClick={() => setAsDefault(
                              `${view.placeName}_${view.viewName}`.replace(/\s+/g, '_')
                            )}
                          >
                            Set Default
                          </Button>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
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