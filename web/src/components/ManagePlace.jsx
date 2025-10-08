import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Snackbar,
  Autocomplete,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { ref, get, set, update, remove, child } from "firebase/database";
import { database } from "../firebase";

export default function ManagePlace() {
  const [mode, setMode] = useState("add");
  const [place, setPlace] = useState({
    name: "",
    latitude: "",
    longitude: "",
    address: "",
    duration: "",
    city: "",
  });
  const [allCities, setAllCities] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [cityInput, setCityInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Fetch all cities & places from Firebase
  useEffect(() => {
    async function fetchCities() {
      try {
        const snapshot = await get(child(ref(database), "places"));
        if (snapshot.exists()) setAllCities(snapshot.val());
      } catch (error) {
        console.error("Error fetching places:", error);
      }
    }
    fetchCities();
  }, []);

  const cityOptions = Object.keys(allCities);
  const placeOptions = place.city
    ? Object.keys(allCities[place.city] || {})
    : [];

  function handleInputChange(e) {
    const { name, value } = e.target;
    setPlace((prev) => ({ ...prev, [name]: value }));
    
    // Also update the input values for Autocomplete
    if (name === "city") setCityInput(value);
    if (name === "name") setNameInput(value);
  }

  function handlePlaceSelect(placeName) {
    if (place.city && allCities[place.city] && allCities[place.city][placeName]) {
      setPlace({
        ...allCities[place.city][placeName],
        city: place.city,
        name: placeName,
      });
      setNameInput(placeName);
    }
  }

  async function handleSubmit() {
    // ✅ Validation
    if (!place.name.trim() || !place.city.trim()) {
      setSnackbar({
        open: true,
        message: "Name and City are required.",
        severity: "error",
      });
      return;
    }

    const dbRef = ref(database, `places/${place.city}/${place.name}`);
    try {
      if (mode === "add") {
        await set(dbRef, place);
        setSnackbar({
          open: true,
          message: "Place added successfully!",
          severity: "success",
        });
      } else if (mode === "edit") {
        await update(dbRef, place);
        setSnackbar({
          open: true,
          message: "Place updated successfully!",
          severity: "success",
        });
      } else if (mode === "delete") {
        await remove(dbRef);
        setSnackbar({
          open: true,
          message: "Place deleted successfully!",
          severity: "success",
        });
      }

      // Reset form after successful operation
      setPlace({
        name: "",
        latitude: "",
        longitude: "",
        address: "",
        duration: "",
        city: "",
      });
      setCityInput("");
      setNameInput("");

      // Refresh data
      const snapshot = await get(child(ref(database), "places"));
      if (snapshot.exists()) setAllCities(snapshot.val());
    } catch (e) {
      setSnackbar({
        open: true,
        message: `Error: ${e.message}`,
        severity: "error",
      });
    }
  }

  const rows =
    place.city && allCities[place.city]
      ? Object.entries(allCities[place.city]).map(([key, val], idx) => ({
          id: idx,
          name: key,
          ...val,
        }))
      : [];

  const columns = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "latitude", headerName: "Latitude", flex: 1 },
    { field: "longitude", headerName: "Longitude", flex: 1 },
    { field: "address", headerName: "Address", flex: 2 },
    { field: "duration", headerName: "Duration (min)", flex: 1 },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Manage Places
        </Typography>

        {/* City & Place Autocomplete */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={cityOptions}
              value={place.city}
              inputValue={cityInput}
              onInputChange={(e, newValue) => {
                setCityInput(newValue);
                setPlace((prev) => ({ ...prev, city: newValue }));
              }}
              onChange={(e, v) => {
                setPlace((prev) => ({ ...prev, city: v || "", name: "" }));
                setCityInput(v || "");
                setNameInput("");
              }}
              freeSolo
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="City" 
                  variant="outlined" 
                  required 
                  error={!place.city} // Show error if empty
                  helperText={!place.city ? "City is required" : ""}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={placeOptions}
              value={place.name}
              inputValue={nameInput}
              onInputChange={(e, newValue) => {
                setNameInput(newValue);
                setPlace((prev) => ({ ...prev, name: newValue }));
              }}
              onChange={(e, v) => {
                setPlace((prev) => ({ ...prev, name: v || "" }));
                setNameInput(v || "");
                if (v) handlePlaceSelect(v);
              }}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Place Name"
                  variant="outlined"
                  required
                  error={!place.name} // Show error if empty
                  helperText={!place.name ? "Place name is required" : ""}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Input Fields */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Latitude"
              name="latitude"
              variant="outlined"
              value={place.latitude}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Longitude"
              name="longitude"
              variant="outlined"
              value={place.longitude}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Address"
              name="address"
              variant="outlined"
              value={place.address}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Duration (minutes)"
              name="duration"
              type="number"
              variant="outlined"
              value={place.duration}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mb: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            size="large"
          >
            {mode === "add"
              ? "Add Place"
              : mode === "edit"
              ? "Update Place"
              : "Delete Place"}
          </Button>

          <Button
            variant={mode === "add" ? "contained" : "outlined"}
            color="secondary"
            onClick={() => setMode("add")}
          >
            Add
          </Button>
          <Button
            variant={mode === "edit" ? "contained" : "outlined"}
            color="secondary"
            onClick={() => setMode("edit")}
          >
            Edit
          </Button>
          <Button
            variant={mode === "delete" ? "contained" : "outlined"}
            color="error"
            onClick={() => setMode("delete")}
          >
            Delete
          </Button>
        </Box>

        {/* Data Table */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Places in {place.city || "Select a city"}
        </Typography>
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
          />
        </Box>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}