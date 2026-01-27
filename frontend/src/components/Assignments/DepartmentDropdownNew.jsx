import React, { useState, useEffect, useRef } from 'react';


const DepartmentDropdown = ({ value, onChange, placeholder = "Select Department" }) => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Predefined departments
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

  useEffect(() => {
    setDepartments(predefinedDepartments);
  }, []);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredDepartments = departments.filter(dept =>
    dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsTyping(true);
    setShowDropdown(true);
    setHighlightedIndex(-1);
    
    // Update parent component
    onChange(value);
  };

  const handleDepartmentSelect = (department) => {
    setSearchTerm(department);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setIsTyping(false);
    onChange(department);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredDepartments.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredDepartments.length) {
          handleDepartmentSelect(filteredDepartments[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleBlur = () => {
    // Small delay to allow click on dropdown items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    }, 150);
  };

  return (
    <div className="department-dropdown-container" ref={dropdownRef}>
      <div className="dropdown-input-container">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="department-input"
          autoComplete="off"
        />
        <button
          type="button"
          className="dropdown-toggle"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          ▼
        </button>
      </div>
      
      {showDropdown && filteredDepartments.length > 0 && (
        <div className="dropdown-list">
          {filteredDepartments.map((dept, index) => (
            <div
              key={index}
              className={`dropdown-item ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleDepartmentSelect(dept)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {dept}
            </div>
          ))}
        </div>
      )}
      
      {showDropdown && filteredDepartments.length === 0 && searchTerm && (
        <div className="dropdown-list">
          <div className="dropdown-item disabled">
            No departments found matching "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDropdown;
