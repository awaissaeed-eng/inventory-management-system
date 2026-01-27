import { useState, useEffect, useRef } from 'react';
import { FaChevronDown, FaSearch, FaPlus, FaTimes, FaCheck, FaBuilding } from 'react-icons/fa';

const DepartmentDropdown = ({ value, onChange, placeholder = "Select Department" }) => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Predefined departments organized by category
  const predefinedDepartments = [
    'Administration',
    'Human Resource',
    'Finance',
    'Information Technology',
    'Legal',
    'Media Affairs',
    'Registrar',
    'Consumer Affairs',
    'Licensing',
    'Technical',
    'Tariff',
    'M&E',
    'Standards',
    'C&I',
    'O&M',
    'Health & Safety',
    'CTBCM',
    'Chairman Office',
    'CAD-Faisalabad',
    'CAD-Peshawar',
    'CAD-Lahore',
    'CAD-Karachi',
    'CAD-Quetta',
    'CAD-Sukkur',
    'CAD-Hyderabad',
    'CAD-Multan',
    'CAD-Gujranwala',
    'CAD-Gwadar',
    'Appellate Tribunal',
    'Office of Chairman',
    'Office of Member Law',
    'Office of Member Tariff',
    'Office of Member Licensing',
    'Office of Member Technical'
  ];

  // Categorize departments for better organization
  const getDepartmentCategory = (dept) => {
    if (dept.startsWith('CAD-')) return 'Regional Offices';
    if (dept.startsWith('Office of')) return 'Executive Offices';
    return 'Core Departments';
  };

  const groupedDepartments = predefinedDepartments.reduce((acc, dept) => {
    const category = getDepartmentCategory(dept);
    if (!acc[category]) acc[category] = [];
    acc[category].push(dept);
    return acc;
  }, {});

  useEffect(() => {
    setDepartments(predefinedDepartments);
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

  const handleDepartmentSelect = (department) => {
    onChange(department);
    setSearchTerm('');
    setShowDropdown(false);
    setShowOtherInput(false);
    setNewDepartment('');
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    const filteredDepartments = getFilteredDepartments();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredDepartments.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredDepartments.length) {
          handleDepartmentSelect(filteredDepartments[selectedIndex]);
        } else if (searchTerm.trim()) {
          handleDepartmentSelect(searchTerm.trim());
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

  const handleNewDepartmentSubmit = () => {
    if (newDepartment.trim()) {
      onChange(newDepartment.trim());
      setShowOtherInput(false);
      setNewDepartment('');
    }
  };

  const getFilteredDepartments = () => {
    if (!searchTerm.trim()) {
      return departments;
    }
    return departments.filter(dept =>
      dept.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredDepartments = getFilteredDepartments();

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

  const renderGroupedDepartments = () => {
    if (searchTerm.trim()) {
      // If searching, show flat filtered list
      return (
        <>
          {filteredDepartments.map((dept, index) => (
            <div
              key={index}
              className={`px-4 py-3 cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                index === selectedIndex 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'hover:bg-gray-50 text-gray-900'
              }`}
              onClick={() => handleDepartmentSelect(dept)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="font-medium">{dept}</span>
              {value === dept && (
                <FaCheck className="text-blue-600 text-sm" />
              )}
            </div>
          ))}
        </>
      );
    }

    // Show grouped departments when not searching
    let currentIndex = 0;
    return Object.entries(groupedDepartments).map(([category, depts]) => (
      <div key={category}>
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
          {category}
        </div>
        {depts.map((dept) => {
          const index = currentIndex++;
          return (
            <div
              key={dept}
              className={`px-4 py-3 cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                index === selectedIndex 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'hover:bg-gray-50 text-gray-900'
              }`}
              onClick={() => handleDepartmentSelect(dept)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="font-medium">{dept}</span>
              {value === dept && (
                <FaCheck className="text-blue-600 text-sm" />
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Main Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaBuilding className="text-gray-400 text-sm" />
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-auto">
          {/* Search Header */}
          {searchTerm && (
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <FaSearch className="text-gray-400" />
                <span>Search results for "{searchTerm}"</span>
                <span className="text-xs text-gray-400">({filteredDepartments.length} found)</span>
              </div>
            </div>
          )}

          {/* Department Options */}
          {filteredDepartments.length > 0 ? (
            <>
              {renderGroupedDepartments()}
              
              {/* Separator */}
              <div className="border-t border-gray-200"></div>
            </>
          ) : (
            <div className="px-4 py-6 text-gray-500 text-center">
              <div className="flex flex-col items-center space-y-2">
                <FaSearch className="text-gray-300 text-lg" />
                <span className="text-sm font-medium">No departments found</span>
                <span className="text-xs text-gray-400">Try a different search term</span>
              </div>
            </div>
          )}
          
          {/* Add Other Option */}
          <div 
            className="px-4 py-3 cursor-pointer hover:bg-gray-50 text-blue-600 font-medium border-t border-gray-200 flex items-center space-x-2"
            onClick={handleOtherSelect}
          >
            <FaPlus className="text-sm" />
            <span>Add Custom Department</span>
          </div>
        </div>
      )}
      
      {/* Custom Department Input */}
      {showOtherInput && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <FaPlus className="text-blue-500" />
              <span className="font-medium">Add New Department</span>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Enter new department name"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNewDepartmentSubmit();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                autoFocus
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleNewDepartmentSubmit}
                disabled={!newDepartment.trim()}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FaCheck className="text-xs" />
                <span>Add</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOtherInput(false);
                  setNewDepartment('');
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

export default DepartmentDropdown;