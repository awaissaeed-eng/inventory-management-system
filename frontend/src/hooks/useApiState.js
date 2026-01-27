import { useState } from 'react';

/**
 * Custom hook to eliminate duplicate loading/error state patterns
 * Used across multiple components for consistent API state management
 */
export const useApiState = (initialData = []) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetError = () => setError('');
  const resetState = () => {
    setData(initialData);
    setLoading(false);
    setError('');
  };

  return {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
    resetError,
    resetState
  };
};

/**
 * Custom hook for form state management
 */
export const useFormState = (initialForm = {}) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setSubmitting(false);
  };

  return {
    form,
    setForm,
    updateForm,
    errors,
    setErrors,
    submitting,
    setSubmitting,
    resetForm
  };
};