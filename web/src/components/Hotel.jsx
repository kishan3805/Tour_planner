import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Snackbar,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ref, get, set, update, remove, child } from 'firebase/database';
import { database } from '../firebase';

export default function Hotel() {
  const [mode, setMode] = useState('add');
  const [hotel, setHotel] = useState({
    name: '', city: '', type: 'living', latitude: '', longitude: '',
    address: '', foodDetails: '', foodType: 'veg', openingTime: '', closingTime: ''
  });
  const [allHotels, setAllHotels] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [snackbar, setSnackbar] = useState({open: false, message: '', severity: 'success'});
  const [cityInput, setCityInput] = useState(''); // Added for Autocomplete

  const commonCities = [
    'Ahmedabad', 'Bangalore', 'Chennai', 'Delhi', 'Hyderabad',
    'Kolkata', 'Mumbai', 'Pune', 'Jaipur', 'Lucknow',
    'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'
  ];

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const snapshot = await get(child(ref(database), 'hotels'));
        if (snapshot.exists()) {
          setAllHotels(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
      }
    };
    fetchHotels();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHotel(prev => ({ ...prev, [name]: value }));
    
    // Update city input when typing in the city field
    if (name === 'city') setCityInput(value);
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (value.length > 1) {
      const results = Object.values(allHotels).filter(hotelData =>
        hotelData.name.toLowerCase().includes(value.toLowerCase()) ||
        hotelData.address.toLowerCase().includes(value.toLowerCase()) ||
        (hotelData.city && hotelData.city.toLowerCase().includes(value.toLowerCase()))
      );
      setSuggestions(results.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (selectedHotel) => {
    setHotel(selectedHotel);
    setSearchInput(selectedHotel.name);
    setCityInput(selectedHotel.city || ''); // Set city input when selecting a hotel
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!hotel.name || !hotel.city || !hotel.address) {
      setSnackbar({open: true, message: 'Name, City, and Address are required.', severity: 'error'});
      return;
    }

    const dbRef = ref(database, `hotels/${hotel.name}`);
    try {
      if (mode === 'add') {
        await set(dbRef, hotel);
        setSnackbar({open: true, message: 'Hotel added successfully!', severity: 'success'});
      } else if (mode === 'edit') {
        await update(dbRef, hotel);
        setSnackbar({open: true, message: 'Hotel updated successfully!', severity: 'success'});
      } else if (mode === 'delete') {
        await remove(dbRef);
        setSnackbar({open: true, message: 'Hotel deleted successfully!', severity: 'success'});
      }

      setHotel({
        name: '', city: '', type: 'living', latitude: '', longitude: '',
        address: '', foodDetails: '', foodType: 'veg', openingTime: '', closingTime: ''
      });
      setSearchInput('');
      setCityInput(''); // Reset city input
      setSuggestions([]);

      // Refresh data
      const snapshot = await get(child(ref(database), 'hotels'));
      if (snapshot.exists()) {
        setAllHotels(snapshot.val());
      }

    } catch (error) {
      setSnackbar({open: true, message: `Error: ${error.message}`, severity: 'error'});
    }
  };

  const rows = Object.entries(allHotels).map(([key, val], i) => ({ 
    id: i, 
    name: key,
    ...val 
  }));

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'city', headerName: 'City', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1, 
      renderCell: (params) => params.value === 'living' ? 'Hotel' : 'Restaurant' 
    },
    { field: 'address', headerName: 'Address', flex: 2 },
    { field: 'foodType', headerName: 'Food Type', flex: 1,
      renderCell: (params) => {
        const foodType = params.value === 'veg' ? 'Vegetarian' : 
                        params.value === 'non-veg' ? 'Non-Veg' : 'Both';
        return <Chip label={foodType} size="small" />;
      }
    },
    { field: 'openingTime', headerName: 'Opening', flex: 1 },
    { field: 'closingTime', headerName: 'Closing', flex: 1 }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Manage Hotels & Restaurants
        </Typography>

        {/* Search Section for Edit/Delete */}
        {(mode === 'edit' || mode === 'delete') && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search Hotel/Restaurant
              </Typography>
              <Autocomplete
                freeSolo
                options={suggestions}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                inputValue={searchInput}
                onInputChange={(e, value) => handleSearchChange(value)}
                onChange={(e, value) => value && handleSuggestionClick(value)}
                renderInput={(params) => 
                  <TextField {...params} label="Search by name, city, or address" />
                }
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.address} - {option.city}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Form Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Hotel/Restaurant Name"
              name="name"
              value={hotel.name}
              onChange={handleChange}
              fullWidth
              required
              error={!hotel.name}
              helperText={!hotel.name ? "Name is required" : ""}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={commonCities}
              value={hotel.city}
              inputValue={cityInput}
              onInputChange={(e, newValue) => {
                setCityInput(newValue);
                setHotel(prev => ({...prev, city: newValue}));
              }}
              onChange={(e, value) => {
                setHotel(prev => ({...prev, city: value || ''}));
                setCityInput(value || '');
              }}
              renderInput={(params) => 
                <TextField 
                  {...params} 
                  label="City" 
                  name="city" 
                  required 
                  error={!hotel.city}
                  helperText={!hotel.city ? "City is required" : ""}
                />
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={hotel.type}
                onChange={handleChange}
                label="Type"
              >
                <MenuItem value="living">Hotel</MenuItem>
                <MenuItem value="restaurant">Restaurant</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Food Type</InputLabel>
              <Select
                name="foodType"
                value={hotel.foodType}
                onChange={handleChange}
                label="Food Type"
              >
                <MenuItem value="veg">Vegetarian</MenuItem>
                <MenuItem value="non-veg">Non-Vegetarian</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Latitude"
              name="latitude"
              value={hotel.latitude}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Longitude"
              name="longitude"
              value={hotel.longitude}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Address"
              name="address"
              value={hotel.address}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              required
              error={!hotel.address}
              helperText={!hotel.address ? "Address is required" : ""}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Food Details"
              name="foodDetails"
              value={hotel.foodDetails}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Opening Time"
              name="openingTime"
              type="time"
              value={hotel.openingTime}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Closing Time"
              name="closingTime"
              type="time"
              value={hotel.closingTime}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            size="large"
          >
            {mode === 'add' ? 'Add Hotel' : mode === 'edit' ? 'Update Hotel' : 'Delete Hotel'}
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

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Hotels & Restaurants List
        </Typography>
        <Box sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
          />
        </Box>

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