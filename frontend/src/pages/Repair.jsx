import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { FaWrench, FaCheckCircle, FaDownload, FaTimes, FaSearch } from "react-icons/fa";

function Repair() {
  const [repairStats, setRepairStats] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [loadingRepairs, setLoadingRepairs] = useState(false);
  
  // Repair request form state
  const [repairForm, setRepairForm] = useState({
    oracle_number: "",
    asset_type: "",
    asset_model: "",
    employee_name: "",
    department: "",
    designation: "",
    problem_description: ""
  });
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);

  // Completion form state
  const [completionForm, setCompletionForm] = useState({
    oracle_number: "",
    asset_type: "",
    asset_model: "",
    employee_name: "",
    department: "",
    designation: "",
    repair_description: "",
    repair_cost: "",
    return_date: "",
    voucher_file: null,
    vendor_name: "",
    is_fixed: ""
  });
  const [completionFormErrors, setCompletionFormErrors] = useState({});
  const [completionSubmitStatus, setCompletionSubmitStatus] = useState(null);
  const [completionSubmitError, setCompletionSubmitError] = useState(null);
  const [underRepairOracleNumbers, setUnderRepairOracleNumbers] = useState([]);
  const [loadingOracleNumbers, setLoadingOracleNumbers] = useState(false);
  const [activeForm, setActiveForm] = useState("request");
  const [requestUnderRepairOracleNumbers, setRequestUnderRepairOracleNumbers] = useState([]);
  const [auctionedOracleNumbers, setAuctionedOracleNumbers] = useState([]);
  const [oracleSuggestions, setOracleSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // New state for search filters
  const [searchFilters, setSearchFilters] = useState({
    oracle_number: "",
    asset_type: "",
    asset_model: "",
    employee_name: "",
    designation: "",
    department: ""
  });
  const [globalSearch, setGlobalSearch] = useState("");

  const fetchRepairStats = () => {
    axios.get(`${API_URL}/api/repairs/stats`)
      .then(res => {
        setRepairStats(res.data);
      })
      .catch(err => {
        console.error("Failed to fetch repair statistics", err);
      });
  };

  useEffect(() => {
    fetchRepairStats();
    
    // Check for URL parameters to automatically open modal
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    if (statusParam && (statusParam === 'in-progress' || statusParam === 'completed')) {
      openModal(statusParam);
    }
  }, []);

  useEffect(() => {
    if (modalOpen && selectedStatus !== null) {
      setLoadingRepairs(true);
      // Fetch repairs with filters
      const query = {
        status: selectedStatus,
        ...searchFilters
      };
  axios.get(`${API_URL}/api/repairs`, { params: query })
        .then(res => {
          setRepairs(res.data);
          setLoadingRepairs(false);
        })
        .catch(err => {
          console.error("Failed to fetch repairs", err);
          setLoadingRepairs(false);
        });
    }
  }, [modalOpen, selectedStatus, searchFilters]);

  // Fetch under repair oracle numbers when completion form becomes active
  useEffect(() => {
    if (activeForm === "completion") {
      fetchUnderRepairOracleNumbers();
    }
  }, [activeForm]);

  // Fetch under repair oracle numbers when request form becomes active
  useEffect(() => {
    if (activeForm === "request") {
      fetchRequestUnderRepairOracleNumbers();
      fetchAuctionedOracleNumbers();
    }
  }, [activeForm]);

  const openModal = (status) => {
    setSelectedStatus(status);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStatus(null);
    setRepairs([]);
  };

  const getStatusDisplayName = (status) => {
    const statusMap = {
      "in-progress": "Under Repair",
      "completed": "Completed"
    };
    return statusMap[status] || status;
  };

  // Handle Oracle Number input change and fetch asset details
  const handleOracleNumberChange = async (e) => {
    const oracleNumber = e.target.value;
    setRepairForm(prev => ({ ...prev, oracle_number: oracleNumber }));

    if (oracleNumber.trim().length > 0) {
      setLoadingAsset(true);
      try {
        console.log(`Fetching asset details for Oracle number: ${oracleNumber}`);
  const response = await axios.get(`${API_URL}/api/assets/oracle/${oracleNumber}`);
        const assetData = response.data;

        console.log('Asset data received:', assetData);

        setRepairForm(prev => ({
          ...prev,
          asset_type: assetData.asset_type || "",
          asset_model: assetData.model || "",
          employee_name: assetData.employee_name || "",
          department: assetData.department || "",
          designation: assetData.designation || ""
        }));

        // Check if oracle number is already under repair request or auctioned
        if (requestUnderRepairOracleNumbers.includes(oracleNumber)) {
          setFormErrors(prev => ({ ...prev, oracle_number: "This asset is already under repair request" }));
        } else if (auctionedOracleNumbers.includes(oracleNumber)) {
          setFormErrors(prev => ({ ...prev, oracle_number: "This asset is currently auctioned and cannot be repaired" }));
        } else {
          setFormErrors(prev => ({ ...prev, oracle_number: "" }));
        }
      } catch (error) {
        console.error('Error fetching asset details:', error);
        if (error.response?.status === 404) {
          setFormErrors(prev => ({ ...prev, oracle_number: "Asset not found with this Oracle number" }));
        } else {
          setFormErrors(prev => ({ ...prev, oracle_number: "Error fetching asset details" }));
        }
        // Clear autofilled fields if asset not found
        setRepairForm(prev => ({
          ...prev,
          asset_type: "",
          asset_model: "",
          employee_name: "",
          department: "",
          designation: ""
        }));
      } finally {
        setLoadingAsset(false);
      }
    } else {
      // Clear fields when Oracle number is empty
      setRepairForm(prev => ({
        ...prev,
        asset_type: "",
        asset_model: "",
        employee_name: "",
        department: "",
        designation: ""
      }));
      setFormErrors(prev => ({ ...prev, oracle_number: "" }));
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRepairForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle search filter input changes
  const handleSearchFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle global search input change
  const handleGlobalSearchChange = (e) => {
    const value = e.target.value;
    setGlobalSearch(value);
    
    // Apply global search to all filter fields
    if (value.trim()) {
      setSearchFilters({
        oracle_number: value,
        asset_type: value,
        asset_model: value,
        employee_name: value,
        designation: value,
        department: value
      });
    } else {
      // Clear all filters if search is empty
      setSearchFilters({
        oracle_number: "",
        asset_type: "",
        asset_model: "",
        employee_name: "",
        designation: "",
        department: ""
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!repairForm.oracle_number.trim()) {
      errors.oracle_number = "Oracle Number is required";
    } else if (requestUnderRepairOracleNumbers.includes(repairForm.oracle_number)) {
      errors.oracle_number = "This asset is already under repair request";
    } else if (auctionedOracleNumbers.includes(repairForm.oracle_number)) {
      errors.oracle_number = "This asset is currently auctioned and cannot be repaired";
    }

    if (!repairForm.problem_description.trim()) {
      errors.problem_description = "Problem Description is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitStatus("submitting");
    
    try {
  const response = await axios.post(`${API_URL}/api/repairs/request`, {
        oracle_number: repairForm.oracle_number,
        repair_description: repairForm.problem_description,
        employee_name: repairForm.employee_name,
        department: repairForm.department,
        designation: repairForm.designation
      });
      
      setSubmitStatus("success");
      setRepairForm({
        oracle_number: "",
        asset_type: "",
        asset_model: "",
        employee_name: "",
        department: "",
        designation: "",
        problem_description: ""
      });
      
      // Refresh repair stats after successful submission
      fetchRepairStats();
      
      setTimeout(() => setSubmitStatus(null), 3000);
    } catch (error) {
      setSubmitStatus("error");
      console.error("Failed to submit repair request:", error);
      setTimeout(() => setSubmitStatus(null), 3000);
    }
  };

  // Reset form
  const handleReset = () => {
    setRepairForm({
      oracle_number: "",
      asset_type: "",
      asset_model: "",
      employee_name: "",
      department: "",
      designation: "",
      problem_description: ""
    });
    setFormErrors({});
    setSubmitStatus(null);
  };

  // Fetch under repair oracle numbers
  const fetchUnderRepairOracleNumbers = async () => {
    setLoadingOracleNumbers(true);
    try {
    const response = await axios.get(`${API_URL}/api/repairs/under-repair/oracle-numbers`);
      setUnderRepairOracleNumbers(response.data.oracle_numbers || []);
    } catch (error) {
      console.error("Failed to fetch under repair oracle numbers:", error);
      setUnderRepairOracleNumbers([]);
    } finally {
      setLoadingOracleNumbers(false);
    }
  };

  // Fetch under repair oracle numbers for request form validation
  const fetchRequestUnderRepairOracleNumbers = async () => {
    try {
    const response = await axios.get(`${API_URL}/api/repairs/under-repair/oracle-numbers`);
      setRequestUnderRepairOracleNumbers(response.data.oracle_numbers || []);
    } catch (error) {
      console.error("Failed to fetch under repair oracle numbers for request:", error);
      setRequestUnderRepairOracleNumbers([]);
    }
  };

  // Fetch auctioned oracle numbers for request form validation
  const fetchAuctionedOracleNumbers = async () => {
    try {
    const response = await axios.get(`${API_URL}/api/auctions/auctioned/oracle-numbers`);
      setAuctionedOracleNumbers(response.data.oracle_numbers || []);
    } catch (error) {
      console.error("Failed to fetch auctioned oracle numbers for request:", error);
      setAuctionedOracleNumbers([]);
    }
  };

  const handleOracleNumberSelect = (number) => {
    setCompletionForm(prev => ({ ...prev, oracle_number: number }));
    setShowSuggestions(false);
    setCompletionFormErrors(prev => ({ ...prev, oracle_number: "" }));
    
    // Fetch asset details when a suggestion is selected
    fetchAssetDetails(number);
    setCompletionFormErrors({});
  };

  const handleCompletionInputChange = (e) => {
    const { name, value } = e.target;
    
    setCompletionForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (completionFormErrors[name]) {
      setCompletionFormErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    // Handle oracle number field specifically
    if (name === "oracle_number") {
      if (value) {
        setShowSuggestions(true);
        
        // Validate if the entered value exists in under-repair oracle numbers
        const isValidOracleNumber = underRepairOracleNumbers.includes(value);
        if (!isValidOracleNumber && value.length > 0) {
          setCompletionFormErrors(prev => ({ 
            ...prev, 
            oracle_number: "Please select a valid under-repair Oracle number" 
          }));
        }
      } else {
        setShowSuggestions(false);
        setCompletionFormErrors(prev => ({ ...prev, oracle_number: "" }));
      }
    }
  };

  // Handle focus on oracle number field
  const handleOracleNumberFocus = () => {
    if (underRepairOracleNumbers.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle blur on oracle number field
  const handleOracleNumberBlur = () => {
    // Use setTimeout to allow click on suggestions before hiding
    setTimeout(() => {
      setShowSuggestions(false);
      
      // Validate the oracle number on blur
      const oracleNumber = completionForm.oracle_number;
      if (oracleNumber && !underRepairOracleNumbers.includes(oracleNumber)) {
        setCompletionFormErrors(prev => ({ 
          ...prev, 
          oracle_number: "Please select a valid under-repair Oracle number from the suggestions" 
        }));
      }
    }, 200);
  };

  // Filter suggestions based on input
  const getFilteredSuggestions = () => {
    const inputValue = completionForm.oracle_number.toLowerCase();
    if (!inputValue) {
      return underRepairOracleNumbers;
    }
    
    return underRepairOracleNumbers.filter(number => 
      number.toLowerCase().includes(inputValue)
    );
  };

  // Fetch asset details based on oracle number
  const fetchAssetDetails = async (oracleNumber) => {
    try {
    const response = await axios.get(`${API_URL}/api/assets/oracle/${oracleNumber}`);
      const assetData = response.data;
      
      setCompletionForm(prev => ({
        ...prev,
        asset_type: assetData.asset_type || "",
        asset_model: assetData.model || "",
        employee_name: assetData.employee_name || "",
        department: assetData.department || "",
        designation: assetData.designation || ""
      }));
    } catch (error) {
      console.error("Failed to fetch asset details:", error);
    }
  };

  // Handle voucher file upload
  const handleVoucherUpload = (e) => {
    const file = e.target.files[0];
    setCompletionForm(prev => ({ ...prev, voucher_file: file }));
  };

  // Validate completion form
  const validateCompletionForm = () => {
    const errors = {};

    if (!completionForm.oracle_number.trim()) {
      errors.oracle_number = "Oracle Number is required";
    }

    if (!completionForm.repair_description.trim()) {
      errors.repair_description = "Repair Description is required";
    }

    if (!completionForm.is_fixed) {
      errors.is_fixed = "Please select if the asset is fixed or not";
    }

    setCompletionFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle completion form submission
  const handleCompletionSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCompletionForm()) {
      return;
    }
    
    setCompletionSubmitStatus("submitting");
    
    try {
      const formData = new FormData();
      formData.append("oracle_number", completionForm.oracle_number);
      formData.append("repair_description", completionForm.repair_description);
      formData.append("repair_cost", completionForm.repair_cost || "");
      formData.append("return_date", completionForm.return_date || "");
      formData.append("vendor_name", completionForm.vendor_name || "");
      formData.append("is_fixed", completionForm.is_fixed);

      if (completionForm.voucher_file) {
        formData.append("voucher_file", completionForm.voucher_file);
      }
      
  const response = await axios.post(`${API_URL}/api/repairs/complete`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      setCompletionSubmitStatus("success");
      setCompletionForm({
        oracle_number: "",
        asset_type: "",
        asset_model: "",
        employee_name: "",
        department: "",
        designation: "",
        repair_description: "",
        repair_cost: "",
        return_date: "",
        voucher_file: null
      });
      
      // Refresh repair stats after successful submission
      fetchRepairStats();
      
      setTimeout(() => setCompletionSubmitStatus(null), 3000);
    } catch (error) {
      setCompletionSubmitStatus("error");
      if (error.response && error.response.data && error.response.data.error) {
        setCompletionSubmitError(error.response.data.error);
      } else {
        setCompletionSubmitError("Failed to submit repair completion. Please try again.");
      }
      console.error("Failed to submit repair completion:", error);
      setTimeout(() => {
        setCompletionSubmitStatus(null);
        setCompletionSubmitError(null);
      }, 3000);
    }
  };

  // Reset completion form
  const handleCompletionReset = () => {
    setCompletionForm({
      oracle_number: "",
      asset_type: "",
      asset_model: "",
      employee_name: "",
      department: "",
      designation: "",
      repair_description: "",
      repair_cost: "",
      return_date: "",
      voucher_file: null,
      vendor_name: "",
      is_fixed: ""
    });
    setCompletionFormErrors({});
    setCompletionSubmitStatus(null);
  };

  // Download repairs as CSV
  const downloadRepairs = async (useFilters = false) => {
    try {
      let dataToDownload = repairs;
      
      // If downloading all repairs, fetch them from the backend
      if (!useFilters) {
        const response = await axios.get(`${API_URL}/api/repairs`, {
          params: { status: selectedStatus }
        });
        dataToDownload = response.data;
      }
      
      const csvContent = "data:text/csv;charset=utf-8," +
        dataToDownload.map(repair => {
          const baseData = [
            repair.oracle_number,
            repair.asset_type,
            repair.asset_model,
            repair.employee_name,
            repair.designation,
            repair.department,
            new Date(repair.start_date).toLocaleDateString(),
            repair.repair_description
          ];

          if (selectedStatus === 'completed') {
            baseData.push(
              repair.repair_cost || '',
              repair.return_date ? new Date(repair.return_date).toLocaleDateString() : '',
              repair.voucher_file ? 'Yes' : 'No',
              repair.vendor_name || '',
              repair.is_fixed === 'fixed' ? 'Fixed' : repair.is_fixed === 'not_fixed' ? 'Not Fixed' : ''
            );
          }

          return baseData.join(",");
        }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", useFilters ? "filtered_repairs.csv" : "all_repairs.csv");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Failed to download repairs:", error);
      alert("Failed to download repairs. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Repair Management System</h1>
          <p className="text-gray-600">Track and manage asset repairs efficiently</p>
        </div>

        {/* Statistics Cards */}
        {repairStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div 
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              onClick={() => openModal('in-progress')}
            >
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FaWrench className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Under Repair</h3>
                  <p className="text-3xl font-bold text-yellow-600">{repairStats.under_repair}</p>
                  <p className="text-sm text-gray-500">Assets currently being repaired</p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
              onClick={() => openModal('completed')}
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaCheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Completed Repairs</h3>
                  <p className="text-3xl font-bold text-green-600">{repairStats.completed}</p>
                  <p className="text-sm text-gray-500">Repairs successfully completed</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading repair statistics...</span>
          </div>
        )}

        {/* Form Toggle */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex border-b border-gray-200 mb-6">
            <button 
              onClick={() => setActiveForm("request")}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
                activeForm === "request" 
                  ? "border-blue-500 text-blue-600 bg-blue-50" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Repair Request Form
            </button>
            <button 
              onClick={() => setActiveForm("completion")}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
                activeForm === "completion" 
                  ? "border-blue-500 text-blue-600 bg-blue-50" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Completion Form
            </button>
          </div>

          {/* Repair Request Form */}
          {activeForm === "request" && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Create Repair Request</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="oracle_number" className="block text-sm font-medium text-gray-700 mb-2">
                      Oracle Number *
                    </label>
                    <input
                      type="text"
                      id="oracle_number"
                      name="oracle_number"
                      value={repairForm.oracle_number}
                      onChange={handleOracleNumberChange}
                      placeholder="Enter Oracle Number"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                        formErrors.oracle_number ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {loadingAsset && (
                      <div className="flex items-center mt-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-blue-600">Loading asset details...</span>
                      </div>
                    )}
                    {formErrors.oracle_number && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.oracle_number}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="asset_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Type
                    </label>
                    <input
                      type="text"
                      id="asset_type"
                      name="asset_type"
                      value={repairForm.asset_type}
                      onChange={handleInputChange}
                      placeholder="Asset Type"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="asset_model" className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Model
                    </label>
                    <input
                      type="text"
                      id="asset_model"
                      name="asset_model"
                      value={repairForm.asset_model}
                      onChange={handleInputChange}
                      placeholder="Asset Model"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Name
                    </label>
                    <input
                      type="text"
                      id="employee_name"
                      name="employee_name"
                      value={repairForm.employee_name}
                      onChange={handleInputChange}
                      placeholder="Employee Name"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={repairForm.department}
                      onChange={handleInputChange}
                      placeholder="Department"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      id="designation"
                      name="designation"
                      value={repairForm.designation}
                      onChange={handleInputChange}
                      placeholder="Designation"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="problem_description" className="block text-sm font-medium text-gray-700 mb-2">
                    Problem Description *
                  </label>
                  <textarea
                    id="problem_description"
                    name="problem_description"
                    value={repairForm.problem_description}
                    onChange={handleInputChange}
                    placeholder="Describe the problem in detail"
                    rows="4"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none ${
                      formErrors.problem_description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.problem_description && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.problem_description}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <button 
                    type="button" 
                    onClick={handleReset}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    Reset
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitStatus === "submitting"}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {submitStatus === "submitting" ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Submit Repair Request"
                    )}
                  </button>
                </div>

                {submitStatus === "success" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                      <FaCheckCircle className="h-5 w-5 text-green-400" />
                      <p className="ml-3 text-sm text-green-800">Repair request submitted successfully!</p>
                    </div>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <FaTimes className="h-5 w-5 text-red-400" />
                      <p className="ml-3 text-sm text-red-800">Failed to submit repair request. Please try again.</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Completion Form */}
          {activeForm === "completion" && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Completion Form</h3>
              <form onSubmit={handleCompletionSubmit} className="space-y-6">
                <div className="relative">
                  <label htmlFor="oracle_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Oracle Number *
                  </label>
                  <input
                    type="text"
                    id="oracle_number"
                    name="oracle_number"
                    value={completionForm.oracle_number}
                    onChange={handleCompletionInputChange}
                    onFocus={handleOracleNumberFocus}
                    onBlur={handleOracleNumberBlur}
                    placeholder="Enter or select Oracle Number"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                      completionFormErrors.oracle_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {completionFormErrors.oracle_number && (
                    <p className="mt-2 text-sm text-red-600">{completionFormErrors.oracle_number}</p>
                  )}
                  {loadingOracleNumbers && (
                    <div className="flex items-center mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-blue-600">Loading Oracle numbers...</span>
                    </div>
                  )}
                  {showSuggestions && getFilteredSuggestions().length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto mt-1">
                      {getFilteredSuggestions().map((number) => (
                        <li 
                          key={number} 
                          onClick={() => handleOracleNumberSelect(number)}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          {number}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="completion_asset_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Type
                    </label>
                    <input
                      type="text"
                      id="completion_asset_type"
                      name="asset_type"
                      value={completionForm.asset_type}
                      onChange={handleCompletionInputChange}
                      placeholder="Asset Type"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="completion_asset_model" className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Model
                    </label>
                    <input
                      type="text"
                      id="completion_asset_model"
                      name="asset_model"
                      value={completionForm.asset_model}
                      onChange={handleCompletionInputChange}
                      placeholder="Asset Model"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="completion_employee_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Name
                    </label>
                    <input
                      type="text"
                      id="completion_employee_name"
                      name="employee_name"
                      value={completionForm.employee_name}
                      onChange={handleCompletionInputChange}
                      placeholder="Employee Name"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="completion_department" className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      id="completion_department"
                      name="department"
                      value={completionForm.department}
                      onChange={handleCompletionInputChange}
                      placeholder="Department"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="completion_designation" className="block text-sm font-medium text-gray-700 mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      id="completion_designation"
                      name="designation"
                      value={completionForm.designation}
                      onChange={handleCompletionInputChange}
                      placeholder="Designation"
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="repair_description" className="block text-sm font-medium text-gray-700 mb-2">
                    Repair Description *
                  </label>
                  <textarea
                    id="repair_description"
                    name="repair_description"
                    value={completionForm.repair_description}
                    onChange={handleCompletionInputChange}
                    placeholder="Describe the repair work done"
                    rows="4"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none ${
                      completionFormErrors.repair_description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {completionFormErrors.repair_description && (
                    <p className="mt-2 text-sm text-red-600">{completionFormErrors.repair_description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Is Fixed or not *
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="is_fixed"
                          value="fixed"
                          checked={completionForm.is_fixed === "fixed"}
                          onChange={handleCompletionInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700">Fixed</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="is_fixed"
                          value="not_fixed"
                          checked={completionForm.is_fixed === "not_fixed"}
                          onChange={handleCompletionInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700">Not Fixed</span>
                      </label>
                    </div>
                    {completionFormErrors.is_fixed && (
                      <p className="mt-2 text-sm text-red-600">{completionFormErrors.is_fixed}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="vendor_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      id="vendor_name"
                      name="vendor_name"
                      value={completionForm.vendor_name}
                      onChange={handleCompletionInputChange}
                      placeholder="Enter vendor name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="repair_cost" className="block text-sm font-medium text-gray-700 mb-2">
                      Repair Cost
                    </label>
                    <input
                      type="number"
                      id="repair_cost"
                      name="repair_cost"
                      value={completionForm.repair_cost}
                      onChange={handleCompletionInputChange}
                      placeholder="Enter repair cost"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="return_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Return Date
                    </label>
                    <input
                      type="date"
                      id="return_date"
                      name="return_date"
                      value={completionForm.return_date}
                      onChange={handleCompletionInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="voucher_file" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Voucher (Optional)
                  </label>
                  <input
                    type="file"
                    id="voucher_file"
                    name="voucher_file"
                    onChange={handleVoucherUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button 
                    type="button" 
                    onClick={handleCompletionReset}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    Reset
                  </button>
                  <button 
                    type="submit" 
                    disabled={completionSubmitStatus === "submitting"}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {completionSubmitStatus === "submitting" ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Submit Completion"
                    )}
                  </button>
                </div>

                {completionSubmitStatus === "success" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                      <FaCheckCircle className="h-5 w-5 text-green-400" />
                      <p className="ml-3 text-sm text-green-800">Repair completion submitted successfully!</p>
                    </div>
                  </div>
                )}

                {completionSubmitStatus === "error" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <FaTimes className="h-5 w-5 text-red-400" />
                      <p className="ml-3 text-sm text-red-800">
                        {completionSubmitError || "Failed to submit repair completion. Please try again."}
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Modal for Repair Lists */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">
                  {getStatusDisplayName(selectedStatus)} Repairs
                </h3>
                <button 
                  onClick={closeModal}
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
                      placeholder="Search by Oracle Number, Asset Type, Employee Name, etc."
                      value={globalSearch}
                      onChange={handleGlobalSearchChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => downloadRepairs(false)}
                      className="flex items-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <FaDownload className="mr-2 h-4 w-4" />
                      Download
                    </button>
                    {/* <button 
                      onClick={() => downloadRepairs(true)}
                      className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <FaDownload className="mr-2 h-4 w-4" />
                      Download Filtered
                    </button> */}
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-auto max-h-[60vh]">
                {loadingRepairs ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading repairs...</span>
                  </div>
                ) : repairs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No repairs found.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oracle Number</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Type</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Model</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time of {selectedStatus === 'completed' ? 'Completion' : 'Addition'}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {selectedStatus === 'completed' ? 'Repair Description' : 'Problem Description'}
                        </th>
                        {selectedStatus === 'completed' && (
                          <>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repair Cost</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Is Fixed</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {repairs.map((repair, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {repair.oracle_number || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {repair.asset_type || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {repair.asset_model || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {repair.employee_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {repair.designation || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {repair.department || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(repair.start_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {repair.repair_description || 'N/A'}
                          </td>
                          {selectedStatus === 'completed' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {repair.repair_cost ? `${repair.repair_cost}` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {repair.return_date ? new Date(repair.return_date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  repair.voucher_file 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {repair.voucher_file ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {repair.vendor_name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  repair.is_fixed === 'fixed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : repair.is_fixed === 'not_fixed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {repair.is_fixed === 'fixed' ? 'Fixed' : repair.is_fixed === 'not_fixed' ? 'Not Fixed' : 'N/A'}
                                </span>
                              </td>
                            </>
                          )}
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
}

export default Repair;