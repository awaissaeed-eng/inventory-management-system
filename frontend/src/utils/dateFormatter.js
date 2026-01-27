/**
 * Utility functions for formatting dates consistently across the application
 */

export const formatDate = (dateString) => {
  if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
    return 'No Expiry';
  }
  
  // Check if it's a year format (e.g., "3 year", "5 years", "2.5 year")
  const yearMatch = dateString.toString().match(/^(\d+(?:\.\d+)?)\s*(?:year|years)$/i);
  if (yearMatch) {
    return `${yearMatch[1]} year${parseFloat(yearMatch[1]) !== 1 ? 's' : ''}`;
  }
  
  // Check if it's a valid date
  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return dateString; // Return as-is if not a date or year format
  }
  
  // Check if it's a reasonable date (not too far in past/future)
  const currentYear = new Date().getFullYear();
  const dateYear = d.getFullYear();
  if (dateYear < 1900 || dateYear > currentYear + 50) {
    return dateString; // Return as-is for unreasonable dates
  }
  
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

// New function specifically for warranty display
export const formatWarrantyExpiry = (warrantyString) => {
  if (!warrantyString || warrantyString === '' || warrantyString === null || warrantyString === undefined) {
    return 'No Expiry';
  }

  // Handle year format (e.g., "3 year", "5 years")
  const yearMatch = warrantyString.toString().match(/^(\d+(?:\.\d+)?)\s*(?:year|years)$/i);
  if (yearMatch) {
    return `${yearMatch[1]} year${parseFloat(yearMatch[1]) !== 1 ? 's' : ''}`;
  }

  // Handle date format (MM/DD/YYYY or other date formats)
  const date = new Date(warrantyString);
  if (!isNaN(date.getTime())) {
    const now = new Date();
    const diffMs = date - now;
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);

    if (diffYears < 0) {
      return 'Expired';
    }

    if (diffYears >= 1) {
      const years = Math.round(diffYears * 10) / 10; // Round to 1 decimal
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      const months = Math.round(diffYears * 12);
      if (months >= 1) {
        return `${months} month${months !== 1 ? 's' : ''}`;
      } else {
        return 'Less than 1 month';
      }
    }
  }

  // Return as-is for any other format
  return warrantyString.toString();
};

export const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const isValidDate = (dateString) => {
  if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
    return false;
  }
  
  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return false;
  }
  
  const currentYear = new Date().getFullYear();
  const dateYear = d.getFullYear();
  if (dateYear < 1900 || dateYear > currentYear + 50) {
    return false;
  }
  
  return true;
};

/**
 * Calculate how much of the assigned period has already passed
 * @param {string} assignmentDate - Assignment start date (YYYY-MM-DD)
 * @param {string} expectedReturnDate - Expected return date (YYYY-MM-DD)
 * @returns {string} Formatted string showing time covered
 */
export const calculateTimeCovered = (assignmentDate, expectedReturnDate) => {
  if (!assignmentDate || !expectedReturnDate) return 'N/A';

  const start = new Date(assignmentDate);
  const end = new Date(expectedReturnDate);
  const now = new Date();

  // Ensure dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid dates';

  // Calculate total duration in days
  const totalDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  // Calculate elapsed time in days
  const elapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
  
  // Ensure elapsed doesn't exceed total duration
  const actualElapsed = Math.min(elapsed, totalDuration);
  
  if (actualElapsed <= 0) return '0 Days';

  // Convert days to appropriate units
  const years = Math.floor(actualElapsed / 365);
  const months = Math.floor((actualElapsed % 365) / 30);
  const days = actualElapsed % 30;

  let result = '';
  
  if (years > 0) {
    result += `${years} Year${years > 1 ? 's' : ''}`;
    if (months > 0) result += ` ${months} Month${months > 1 ? 's' : ''}`;
  } else if (months > 0) {
    result += `${months} Month${months > 1 ? 's' : ''}`;
    if (days > 0) result += ` ${days} Day${days > 1 ? 's' : ''}`;
  } else {
    result += `${actualElapsed} Day${actualElapsed > 1 ? 's' : ''}`;
  }
  
  return `${result}`;
};
