import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaChevronDown, FaSearch, FaPlus, FaTimes, FaCheck, FaUser } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DesignationDropdown = ({ value, onChange, placeholder = "Select Designation" }) => {
  const [designations, setDesignations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [newDesignation, setNewDesignation] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Predefined designations
  const predefinedDesignations = [
    'Addl. Director', 'HSE', 'Deputy Director', 'ALA', 'Assistant Director', 'Account Officer',
    'Sr. Protocol Officer', 'Web Master', 'Protocol Officer', 'Sr. Librarian', 'Media Officer',
    'Private Secretary', 'Record Officer', 'Audit Officer', 'Admin. Officer', 'Technical Officer',
    'Sr. Executive Secretary', 'Executive Secretary', 'Technical Assistant', 'Director General',
    'Assistant Database Administrator', 'Personal Assistant', 'Sr. Computer Operator', 'Sr. Caretaker',
    'Office Assistant', 'Medical Assistant', 'Junior Executive', 'Sr. Front Desk Executive',
    'Front Desk Executive', 'Control Room Operator', 'Addl. DG', 'Sub-Engineer (Civil)',
    'Sub-Engineer (HVAC)', 'Sub-Engineer (E&M)', 'Sr. Security Officer', 'Baggage Scanner Operator',
    'Office Boy', 'Qasid', 'Naib Qasid', 'R&I Supervisor', 'R&I Clerk', 'Director',
    'Sr. Dispatch Rider', 'Dispatch Rider', 'Sr. Driver', 'Driver', 'Transport Supervisor',
    'Dispatch Supervisor', 'BMS Technician', 'Sr. Security Guard', 'Security Guard', 'Sanitary Worker',
    'Registrar', 'Photocopier Operator', 'Lift Operator', 'Sr. Gardener', 'Gardener',
    'Generator Operator', 'Machine Room Technician', 'Plumber', 'Painter', 'Electrician',
    'Fire Watcher', 'Legal Advisor', 'Aya/Maid', 'Chowkidar', 'Carpenter', 'Imam Khateeb',
    'Tea Boy', 'Mason', 'Helper', 'Contingent Employee', 'Sr. Sweeper', 'Sweeper',
    'Sr. Advisor', 'Intern', 'Sr. Legal Advisor', 'Sr. R&I Clerk', 'Sr. Photocopier',
    'Sr. Lift Operator', 'Sr. Aya', 'Sr. Office Boy cum Chowkidar', 'Sr. Generator Operator',
    'Sr. Electrician', 'Supervisor', 'Advisor', 'Worker', 'DLA'
  ];

  useEffect(() => {
    setDesignations(predefinedDesignations);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setShowDropdown(true);
    setSelectedIndex(-1);
    onChange(newSearchTerm);
  };

  const handleDesignationSelect = (designation) => {
    onChange(designation);
    setSearchTerm('');
    setShowDropdown(false);
    setShowOtherInput(false);
    setNewDesignation('');
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    const filteredDesignations = getFilteredDesignations();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredDesignations.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredDesignations.length) {
          handleDesignationSelect(filteredDesignations[selectedIndex]);
        } else if (searchTerm.trim()) {
          handleDesignationSelect(searchTerm.trim());
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleOtherSelect = () => {
    setShowOtherInput(true);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleNewDesignationSubmit = () => {
    if (newDesignation.trim()) {
      onChange(newDesignation.trim());
      setShowOtherInput(false);
      setNewDesignation('');
    }
  };

  const getFilteredDesignations = () => {
    if (!searchTerm.trim()) {
      return designations;
    }
    return designations.filter(designation =>
      designation.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredDesignations = getFilteredDesignations();

  const handleInputFocus = () => {
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleToggleClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Main Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaUser className="text-gray-400 text-sm" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleSearchChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleToggleClick}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <FaChevronDown className={`text-gray-400 text-sm transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown List */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Search Header */}
          {searchTerm && (
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <FaSearch className="text-gray-400" />
                <span>Search results for "{searchTerm}"</span>
              </div>
            </div>
          )}

          {/* Designation Options */}
          {filteredDesignations.length > 0 ? (
            <>
              {filteredDesignations.map((designation, index) => (
                <div
                  key={index}
                  className={`px-4 py-3 cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                    index === selectedIndex 
                      ? 'bg-blue-50 text-blue-900' 
                      : 'hover:bg-gray-50 text-gray-900'
                  }`}
                  onClick={() => handleDesignationSelect(designation)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="font-medium">{designation}</span>
                  {value === designation && (
                    <FaCheck className="text-blue-600 text-sm" />
                  )}
                </div>
              ))}
              
              {/* Separator */}
              <div className="border-t border-gray-200"></div>
            </>
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">
              <div className="flex flex-col items-center space-y-2">
                <FaSearch className="text-gray-300 text-lg" />
                <span className="text-sm">No designations found</span>
              </div>
            </div>
          )}
          
          {/* Add Other Option */}
          <div 
            className="px-4 py-3 cursor-pointer hover:bg-gray-50 text-blue-600 font-medium border-t border-gray-200 flex items-center space-x-2"
            onClick={handleOtherSelect}
          >
            <FaPlus className="text-sm" />
            <span>Add Custom Designation</span>
          </div>
        </div>
      )}
      
      {/* Custom Designation Input */}
      {showOtherInput && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <FaPlus className="text-blue-500" />
              <span className="font-medium">Add New Designation</span>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Enter new designation"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNewDesignationSubmit();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                autoFocus
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleNewDesignationSubmit}
                disabled={!newDesignation.trim()}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FaCheck className="text-xs" />
                <span>Add</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOtherInput(false);
                  setNewDesignation('');
                }}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center justify-center space-x-2"
              >
                <FaTimes className="text-xs" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignationDropdown;