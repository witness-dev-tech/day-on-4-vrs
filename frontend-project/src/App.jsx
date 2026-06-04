import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import CreateAccount from './components/CreateAccount';
import Dashboard from './components/Dashboard';
import Customer from './components/Customer';
import Vehicle from './components/Vehicle';
import Reservationalrental from './components/Reservationalrental';
import Report from './components/Report';
import NotFound from './components/NotFound';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Synchronize authentication status on application boot sequence
  useEffect(() => {
    const cachedUser = localStorage.getItem('vrs_user');
    if (cachedUser) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
        {/* Pass state to Navbar so it can dynamically show logout buttons / user profiles */}
        <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        
        <main className="flex-grow">
          <Routes>
            {/* Open Authentication Paths */}
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/register" element={<CreateAccount />} />

            {/* Shielded Data Administration Routes */}
            {/* We pass the verification status as direct parameters, and pass data context to child layouts */}
            <Route 
              element={
                <PrivateRoute isAuthenticated={isAuthenticated} loading={loading} />
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customer />} />
              <Route path="/vehicles" element={<Vehicle />} />
              <Route path="/reservations" element={<Reservationalrental />} />
              <Route path="/reports" element={<Report />} />
            </Route>

            {/* Error Capture Core Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" reverseOrder={false} />
      </div>
    </Router>
  );
}

export default App;