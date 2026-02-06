import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope, FaUserPlus, FaShieldAlt, FaCheck } from 'react-icons/fa';

function RegistrationPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!agreeToTerms) {
      setError('Please accept the terms and conditions');
      setIsLoading(false);
      return;
    }

    try {
  const response = await axios.post(`${API_URL}/api/auth/register`, {
        password,
        email,
        full_name: fullName
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: 'weak', color: 'bg-red-500', width: '33%' };
    if (password.length < 10) return { strength: 'medium', color: 'bg-yellow-500', width: '66%' };
    return { strength: 'strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/background.jpg)' }}
      ></div>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Main Registration Container */}
      <div className="w-full max-w-lg z-10">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-2">
            {/* <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FaUserPlus className="text-white text-2xl" />
            </div> */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join the IT Inventory Management System</p>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="mb-1 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-1 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
              <FaCheck className="mr-2" />
              {success}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-1">
            {/* Full Name Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FaEyeSlash className="text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  ) : (
                    <FaEye className="text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  )}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Password strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.strength === 'weak' ? 'text-red-500' :
                      passwordStrength.strength === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.width }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  ) : (
                    <FaEye className="text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3 !mb-4">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                I agree to the{" "}
                <a href="#" className="text-green-600 hover:text-green-500 font-medium">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-green-600 hover:text-green-500 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading || !agreeToTerms}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-300 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-2 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a
                href="/"
                className="text-green-600 hover:text-green-500 font-medium transition-colors duration-200"
              >
                Sign In
              </a>
            </p>
          </div>

          {/* Security Badge */}
          <div className=" flex items-center justify-center space-x-2 text-xs text-gray-500">
            <FaShieldAlt className="text-green-500" />
            <span>Your data is protected and encrypted</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-2 text-white/80 text-sm">
          <p>&copy; 2024 NEPRA IT Asset Management System</p>
          <p className="mt-1">All rights reserved</p>
        </div>
      </div>

    </div>
  );
}

export default RegistrationPage