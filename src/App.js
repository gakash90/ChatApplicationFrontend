import React, { useEffect, useState } from 'react';
import './App.css';
import AuthComponent from './components/AuthComponents';
import ChatApp from './components/ChatApp';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Function to validate token with backend
  const validateToken = async (token) => {
    try {
      const response = await fetch('https://chatapplicationbackend-mtt4.onrender.com/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        // Get user data from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            
            // Validate token with backend
            const isValidToken = await validateToken(token);
            if (isValidToken) {
              setCurrentUser(userData);
              setIsAuthenticated(true);
            } else {
              // Token is invalid, clear everything
              handleLogout();
            }
          } catch (error) {
            console.error('Error parsing saved user data:', error);
            handleLogout();
          }
        } else {
          // Token exists but no user data, clear everything
          handleLogout();
        }
      }
    };

    initializeAuth();
  }, [token]);

  const handleLogin = (userData, authToken) => {
    setCurrentUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!isAuthenticated || !currentUser) {
    return <AuthComponent onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <ChatApp 
        currentUser={currentUser} 
        token={token} 
        onLogout={handleLogout} 
      />
    </div>
  );
};

export default App;