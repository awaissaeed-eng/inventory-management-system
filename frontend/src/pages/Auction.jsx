import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useLocation } from 'react-router-dom';
import { FaSearch, FaDownload, FaTimes, FaCalendarAlt, FaGavel, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const Auction = () => {
  const [formData, setFormData] = useState({
    oracleNumber: '',
    assetType: '',
    brandName: '',
    modelName: '',
    serialNumber: '',
    price: '',
    auctionDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [auctions, setAuctions] = useState([]);
  const [loadingAuctions, setLoadingAuctions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [underRepairOracleNumbers, setUnderRepairOracleNumbers] = useState([]);
  const [auctionedOracleNumbers, setAuctionedOracleNumbers] = useState([]);
  const [repairMessage, setRepairMessage] = useState('');
  const [isUnderRepair, setIsUnderRepair] = useState(false);

  // New state variables for search and date filter
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchAuctions = async () => {
    setLoadingAuctions(true);
    try {
  const response = await fetch(`${API_URL}/api/auctions`);
      if (response.ok) {
        const data = await response.json();
        setAuctions(data);
      } else {
        console.error('Failed to fetch auctions');
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoadingAuctions(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    fetchAuctions();
  }, []);

  useEffect(() => {
    // Fetch under repair oracle numbers
    const fetchUnderRepairOracleNumbers = async () => {
      try {
  const response = await fetch(`${API_URL}/api/repairs`);
        if (response.ok) {
          const data = await response.json();
          const oracleNumbers = data.map(repair => repair.oracle_number);
          setUnderRepairOracleNumbers(oracleNumbers);
        }
      } catch (error) {
        console.error('Error fetching under repair oracle numbers:', error);
      }
    };
    fetchUnderRepairOracleNumbers();

    // Fetch auctioned oracle numbers
    const fetchAuctionedOracleNumbers = async () => {
      try {
  const response = await fetch(`${API_URL}/api/auctions/auctioned/oracle-numbers`);
        if (response.ok) {
          const data = await response.json();
          setAuctionedOracleNumbers(data.oracle_numbers || []);
        }
      } catch (error) {
        console.error('Error fetching auctioned oracle numbers:', error);
      }
    };
    fetchAuctionedOracleNumbers();
  }, []);

  useEffect(() => {
    // Check if we should open the modal from navigation state
    if (location.state && location.state.openViewAllModal) {
      setShowModal(true);
    }
  }, [location.state]);

  const handleOracleNumberChange = async (e) => {
    const oracleNumber = e.target.value;
    setFormData(prev => ({ ...prev, oracleNumber }));

    if (auctionedOracleNumbers.includes(oracleNumber)) {
      setRepairMessage('This asset has already been auctioned and cannot be sent for auction.');
      setFormData(prev => ({
        ...prev,
        assetType: '',
        brandName: '',
        modelName: '',
        serialNumber: ''
      }));
      return;
    }

    if (oracleNumber.trim()) {
      // Check if oracle number is under repair
      const isUnderRepair = underRepairOracleNumbers.includes(oracleNumber);
      setIsUnderRepair(isUnderRepair);
      if (isUnderRepair) {
        setRepairMessage('This asset is currently under repair and cannot be sent for auction.');
        setFormData(prev => ({
          ...prev,
          assetType: '',
          brandName: '',
          modelName: '',
          serialNumber: ''
        }));
        return;
      } else {
        setRepairMessage('');
      }

      setLoadingAsset(true);
      try {
  const response = await fetch(`${API_URL}/api/assets/oracle/${oracleNumber}`);
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            assetType: data.asset_type || '',
            brandName: data.brand_name || '',
            modelName: data.model_name || '',
            serialNumber: data.serial_number || ''
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            assetType: '',
            brandName: '',
            modelName: '',
            serialNumber: ''
          }));
        }
      } catch (error) {
        console.error('Error fetching asset details:', error);
        setFormData(prev => ({
          ...prev,
          assetType: '',
          brandName: '',
          modelName: '',
          serialNumber: ''
        }));
      } finally {
        setLoadingAsset(false);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        assetType: '',
        brandName: '',
        modelName: '',
        serialNumber: ''
      }));
      setRepairMessage('');
      setIsUnderRepair(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle date filter change
  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  // Filter auctions based on searchTerm and dateFilter
  const filteredAuctions = auctions.filter(auction => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      auction.oracle_number?.toLowerCase().includes(search) ||
      auction.asset_type?.toLowerCase().includes(search) ||
      auction.model_name?.toLowerCase().includes(search) ||
      auction.serial_number?.toLowerCase().includes(search) ||
      auction.price?.toString().includes(search);

    const matchesDate = dateFilter ? new Date(auction.auction_date).toISOString().slice(0, 10) === dateFilter : true;

    return matchesSearch && matchesDate;
  });

  // Download CSV helper function
  const downloadCSV = (includeButtons) => {
    const headers = ['Oracle Asset Number', 'Type', 'Model', 'Brand', 'Serial Number', 'Price (PKR)', 'Auction Date'];
    const rows = filteredAuctions.map(auction => [
      auction.oracle_number || '-',
      auction.asset_type || '-',
      auction.model_name || '-',
      auction.brand_name || '-',
      auction.serial_number || '-',
      auction.price,
      new Date(auction.auction_date).toLocaleDateString()
    ]);

    let csvContent = '';
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', includeButtons ? 'auctions_with_buttons.csv' : 'auctions_without_buttons.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
  const response = await fetch(`${API_URL}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oracle_number: formData.oracleNumber,
          price: parseFloat(formData.price),
          auction_date: formData.auctionDate
        })
      });

      if (response.ok) {
        setMessage('Auction details saved successfully!');
        setMessageType('success');
        setFormData({
          oracleNumber: '',
          assetType: '',
          brandName: '',
          modelName: '',
          serialNumber: '',
          price: '',
          auctionDate: ''
        });
        fetchAuctions(); // Refresh the auctions table
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to save auction details.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage('An error occurred while saving auction details.');
      setMessageType('error');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FaGavel className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Auction Management</h1>
          </div>
          <p className="text-gray-600">Manage asset auctions and track auction details efficiently</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FaCalendarAlt className="h-5 w-5 text-blue-600 mr-2" />
                Create Auction
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="oracleNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Oracle Number *
                  </label>
                  <input
                    type="text"
                    id="oracleNumber"
                    name="oracleNumber"
                    value={formData.oracleNumber}
                    onChange={handleOracleNumberChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter Oracle Number"
                  />
                  {loadingAsset && (
                    <div className="flex items-center mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-blue-600">Loading asset details...</span>
                    </div>
                  )}
                  {repairMessage && (
                    <div className="flex items-center mt-2">
                      <FaExclamationTriangle className="h-4 w-4 text-red-600" />
                      <span className="ml-2 text-sm text-red-600">{repairMessage}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Type
                    </label>
                    <input
                      type="text"
                      id="assetType"
                      name="assetType"
                      value={formData.assetType}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      placeholder="Auto-filled"
                    />
                  </div>
                  <div>
                    <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Brand
                    </label>
                    <input
                      type="text"
                      id="brandName"
                      name="brandName"
                      value={formData.brandName}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      placeholder="Auto-filled"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Model
                    </label>
                    <input
                      type="text"
                      id="modelName"
                      name="modelName"
                      value={formData.modelName}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      placeholder="Auto-filled"
                    />
                  </div>
                  <div>
                    <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      id="serialNumber"
                      name="serialNumber"
                      value={formData.serialNumber}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      placeholder="Auto-filled"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Price (PKR) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Enter price"
                    />
                  </div>
                  <div>
                    <label htmlFor="auctionDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Auction Date *
                    </label>
                    <input
                      type="date"
                      id="auctionDate"
                      name="auctionDate"
                      value={formData.auctionDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isUnderRepair || auctionedOracleNumbers.includes(formData.oracleNumber)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : isUnderRepair ? (
                    'Cannot Submit - Asset Under Repair'
                  ) : auctionedOracleNumbers.includes(formData.oracleNumber) ? (
                    'Cannot Submit - Asset Already Auctioned'
                  ) : (
                    'Submit Auction'
                  )}
                </button>

                {message && (
                  <div className={`rounded-lg p-4 ${
                    messageType === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex">
                      {messageType === 'success' ? (
                        <FaCheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <FaExclamationTriangle className="h-5 w-5 text-red-400" />
                      )}
                      <p className={`ml-3 text-sm ${
                        messageType === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {message}
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Table Section */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Recent Auctions</h3>
                <button 
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  View All
                </button>
              </div>

              {loadingAuctions ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading auctions...</span>
                </div>
              ) : auctions.length === 0 ? (
                <div className="text-center py-12">
                  <FaGavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No auctions found.</p>
                  <p className="text-gray-400 text-sm">Create your first auction using the form.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oracle Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (PKR)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auction Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auctions.slice(0, 5).map(auction => (
                        <tr key={auction.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {auction.oracle_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {auction.asset_type || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {auction.model_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {auction.brand_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {auction.serial_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            PKR {auction.price?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(auction.auction_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal for All Auctions */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaGavel className="h-6 w-6 text-blue-600 mr-3" />
                  All Auction Details
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <FaTimes className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Search and Filter Section */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search by Oracle Number, Type, Model, Serial Number, Price..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={handleDateFilterChange}
                        className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <button 
                      onClick={() => downloadCSV(true)}
                      className="flex items-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <FaDownload className="mr-2 h-4 w-4" />
                      Download All
                    </button>
                    <button 
                      onClick={() => downloadCSV(false)}
                      className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <FaDownload className="mr-2 h-4 w-4" />
                      Download Filtered
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-auto max-h-[60vh]">
                {filteredAuctions.length === 0 ? (
                  <div className="text-center py-12">
                    <FaGavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No auctions found matching your criteria.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oracle Number</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (PKR)</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auction Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAuctions.map(auction => (
                        <tr key={auction.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {auction.oracle_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {auction.asset_type || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {auction.model_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {auction.brand_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {auction.serial_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            PKR {auction.price?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(auction.auction_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auction;