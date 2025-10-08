import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Home from './components/Home';
import ManagePlace from './components/ManagePlace';
import History from './components/History';
import Hotel from './components/Hotel';
import View from './components/View';
import Feedback from './components/Feedback';

// Theme
import theme from './theme';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          Loading...
        </Box>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
          <Navbar onLogout={handleLogout} />
          <Box component="main" sx={{ pt: 2 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/manageplace" element={<ManagePlace />} />
              <Route path="/history" element={<History />} />
              <Route path="/hotel" element={<Hotel />} />
              <Route path="/virtual-view" element={<View />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;