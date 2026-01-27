import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import AssetTable from '../components/Assets/AssetTable';
import AssetFormModal from '../components/Assets/AssetFormModal';
import AllAssetsModal from '../components/Assets/AllAssetsModal';
import { FaPlus, FaSearch, FaFilter, FaEye, FaSpinner } from 'react-icons/fa';
import { API_URL } from '../config';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAllAssetsModal, setShowAllAssetsModal] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalAssets, setTotalAssets] = useState(0);

  const location = useLocation();
  
  const fetchAssets = async (showStockAssets = false) => {
    setLoading(true);
    setError('');
    try {
      const params = showStockAssets ? { stock: true } : {};
      const res = await axios.get(`${API_URL}/api/assets`, { params });
      setAssets(res.data);
      setTotalAssets(res.data.length);
    } catch (err) {
      setError('Failed to fetch assets.');
      console.error('Error fetching assets:', err);
    }
    setLoading(false);
  };

  // Expose fetchAssets globally for cross-page refreshes
  window.fetchAssets = fetchAssets;

  useEffect(() => {
    if (location.state && (location.state.showAllAssets || location.state.showStockAssets)) {
      setShowAllAssetsModal(true);
    }
    fetchAssets();
  }, [location.state]);

  const handleAdd = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/assets`, data);
      await fetchAssets();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving asset:', error);
      if (error.response) {
        const errorMessage = error.response.data?.error || 'Failed to save asset.';
        setError(errorMessage);
      } else {
        setError('Error: ' + error.message);
      }
    }
    setLoading(false);
  };

  const sortedAssets = [...assets].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB - dateA;
  });

  const filteredAssets = sortedAssets.filter(asset => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (asset.oracle_number && asset.oracle_number.toLowerCase().includes(q)) ||
      (asset.device_name && asset.device_name.toLowerCase().includes(q)) ||
      (asset.device_type && asset.device_type.toLowerCase().includes(q)) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(q)) ||
      (asset.brand_name && asset.brand_name.toLowerCase().includes(q)) ||
      (asset.model_name && asset.model_name.toLowerCase().includes(q))
    );
  });

  const pagedAssets = filteredAssets.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredAssets.length / pageSize);

  const handleViewAllAssets = (stockOnly = false) => {
    fetchAssets();
    setShowAllAssetsModal(true);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (page > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(page - 1)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          Previous
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
            i === page
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (page < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(page + 1)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          Next
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredAssets.length)} of {filteredAssets.length} results
        </div>
        <div className="flex items-center space-x-1">
          {pages}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header Section */}
      <div className="mb-2">
        {/* <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Asset Management</h1>
            <p className="text-gray-600">Manage your IT inventory and asset lifecycle</p>
          </div>
          
        </div> */}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{totalAssets}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {assets.filter(a => !a.assigned_to && a.status !== 'damaged' && a.status !== 'buyback').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">
                  {assets.filter(a => a.assigned_to && a.assigned_to !== '').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Under Repair</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {assets.filter(a => a.status === 'under repair').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={search}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              {search && (
                <div className="text-sm text-gray-600">
                  {filteredAssets.length} results found
                </div>
              )}
            </div>
            <button
              onClick={handleAdd}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FaPlus className="text-sm" />
              <span>Add Asset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
            <p className="text-gray-600 font-medium">Loading assets...</p>
          </div>
        </div>
      )}

      {/* Asset Table */}
      {!loading && <AssetTable assets={pagedAssets} onViewAll={handleViewAllAssets} />}

      {/* Pagination */}
      {!loading && renderPagination()}

      {/* Modals */}
      {showModal && (
        <AssetFormModal
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}

      {showAllAssetsModal && (
        <AllAssetsModal
          onClose={() => setShowAllAssetsModal(false)}
          assets={assets}
          stockOnly={false}
        />
      )}
    </div>
  );
};

export default Assets;