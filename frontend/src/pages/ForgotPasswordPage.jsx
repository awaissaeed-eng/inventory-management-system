import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email
      });
      
      // Check if in development mode (email not configured)
      if (response.data.dev_mode && response.data.reset_url) {
        // Show the reset link directly in development mode
        const resetUrl = response.data.reset_url;
        const confirmNavigate = window.confirm(
          `⚠️ EMAIL NOT CONFIGURED (Development Mode)\n\n` +
          `The reset link has been generated but email is not configured.\n\n` +
          `Click OK to go directly to the reset password page, or Cancel to copy the link.\n\n` +
          `Link: ${resetUrl}`
        );
        
        if (confirmNavigate) {
          // Extract token from URL and navigate
          const token = resetUrl.split('token=')[1];
          navigate(`/reset-password?token=${token}`);
        } else {
          // Copy to clipboard
          navigator.clipboard.writeText(resetUrl);
          alert('Reset link copied to clipboard!');
        }
        return;
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/background.jpg)' }}
        ></div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>

        {/* Success Message Container */}
        <div className="w-full max-w-md z-10">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-green-600 text-3xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h1>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <span className="font-semibold">{email}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please check your inbox and click the link to reset your password. The link will expire in 1 hour.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-300 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Back to Login
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-white/80 text-sm">
            <p>&copy; 2024 NEPRA IT Asset Management System</p>
            <p className="mt-1">All rights reserved</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/background.jpg)' }}
      ></div>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
          >
            <FaArrowLeft />
            <span className="text-sm font-medium">Back to Login</span>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-300 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Remember your password?{" "}
              <a
                href="/"
                className="text-green-600 hover:text-green-500 font-medium transition-colors duration-200"
              >
                Sign In
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/80 text-sm">
          <p>&copy; 2024 NEPRA IT Asset Management System</p>
          <p className="mt-1">All rights reserved</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
