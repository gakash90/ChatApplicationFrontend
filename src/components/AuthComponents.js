import React, { useState } from 'react';

const AuthComponent = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(`https://chatapplicationbackend-mtt4.onrender.com${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please check if the backend server is running on port 2020.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">💬 Chat App</h1>
          <h2 className="auth-subtitle">
            {isLogin ? 'Welcome Back!' : 'Create Your Account'}
          </h2>
        </div>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your username"
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your password"
              required
              minLength="6"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? '⏳ Please wait...' : (isLogin ? '🚀 Sign In' : '✨ Create Account')}
          </button>
        </form>
        
        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ username: '', email: '', password: '' });
              }}
              className="switch-button"
            >
              {isLogin ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
        </div>

        <div className="auth-footer">
          <p className="footer-text">
            🔒 Your messages are secure and private
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;