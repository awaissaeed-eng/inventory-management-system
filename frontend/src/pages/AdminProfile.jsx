import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaUser, FaEnvelope, FaLock, FaClock, FaCamera, FaSave, FaTimes } from 'react-icons/fa';

const AdminProfile = () => {
  const [profile, setProfile] = useState({
    id: '',
    email: '',
    full_name: '',
    last_login: '',
    profile_picture: null
  });
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    // Get user id from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      setMessage({ type: 'error', text: 'User not logged in. Please login first.' });
      return;
    }

    const user = JSON.parse(userData);
    const userId = user.id;

    try {
  const response = await axios.get(`${API_URL}/api/auth/profile/${userId}`);
      setProfile(response.data);
      setFormData({
        email: response.data.email,
        full_name: response.data.full_name,
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
  setProfilePicturePreview(response.data.profile_picture ? `${API_URL}${response.data.profile_picture}` : null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load profile' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfilePicturePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // Validate password confirmation
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match' });
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    data.append('email', formData.email);
    data.append('full_name', formData.full_name);
    if (formData.current_password) data.append('current_password', formData.current_password);
    if (formData.new_password) data.append('new_password', formData.new_password);
    if (formData.confirm_password) data.append('confirm_password', formData.confirm_password);
    if (profilePictureFile) data.append('profile_picture', profilePictureFile);

    try {
  const response = await axios.put(`${API_URL}/api/auth/profile/${profile.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: response.data.message });
      fetchProfile(); // Refresh profile data
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never';
    return new Date(lastLogin).toLocaleString();
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Picture Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Picture</h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(formData.full_name || 'Admin User')
                )}
              </div>
              {profilePicturePreview && (
                <button
                  type="button"
                  onClick={removeProfilePicture}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="profile-picture"
              />
              <label
                htmlFor="profile-picture"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <FaCamera className="mr-2" />
                {profilePicturePreview ? 'Change Picture' : 'Upload Picture'}
              </label>
              <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaClock className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formatLastLogin(profile.last_login)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Leave password fields empty if you don't want to change your password.</p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-300 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProfile;
