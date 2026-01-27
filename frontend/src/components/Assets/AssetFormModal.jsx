import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaPlus, FaCheck, FaExclamationTriangle, FaSave } from 'react-icons/fa';

const AssetFormModal = ({ asset, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    oracle_number: '',
    device_type: '',
    brand_name: '',
    model_name: '',
    serial_number: '',
    unit_price: '',
    purchase_date: '',
    warranty_expiry: '',
    vendor_name: '',
    tender_no: '',
    notes: ''
  });

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [customDeviceType, setCustomDeviceType] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [showCustomDevice, setShowCustomDevice] = useState(false);
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [oracleExists, setOracleExists] = useState(false);
  const [serialExists, setSerialExists] = useState(false);

  useEffect(() => {
    if (form.oracle_number) {
      const checkOracle = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/assets/check-oracle/${form.oracle_number}`);
          setOracleExists(response.data.exists);
        } catch (error) {
          console.error('Error checking oracle number uniqueness:', error);
          setOracleExists(false);
        }
      };
      checkOracle();
    } else {
      setOracleExists(false);
    }
  }, [form.oracle_number]);

  useEffect(() => {
    if (form.serial_number) {
      const checkSerial = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/assets/check-serial/${form.serial_number}`);
          setSerialExists(response.data.exists);
        } catch (error) {
          console.error('Error checking serial number existence:', error);
          setSerialExists(false);
        }
      };
      checkSerial();
    } else {
      setSerialExists(false);
    }
  }, [form.serial_number]);

  useEffect(() => {
    fetchDeviceTypes();
  }, []);

  useEffect(() => {
    if (form.device_type && form.device_type !== 'Other') {
      fetchBrandsByType(form.device_type);
    } else {
      setBrands([]);
    }
  }, [form.device_type]);

  const fetchDeviceTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/assets/device-types');
      setDeviceTypes(response.data);
    } catch (error) {
      console.error('Error fetching device types:', error);
      setDeviceTypes([
        'Laptop', 'Desktop', 'Scanner', 'Printer', 'Screen', 'UPS', 
        'Access Point WiFi', 'Switches', 'Server', 'Routers', 
        'Firewall', 'Biometric', 'Other'
      ]);
    }
  };

  const fetchBrandsByType = async (deviceType) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/assets/brands/${deviceType}`);
      const brandsData = response.data || [];
      setBrands(brandsData);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.oracle_number) {
      errs.oracle_number = 'Oracle Number is required';
    } else if (!/^[a-zA-Z0-9]+$/.test(form.oracle_number)) {
      errs.oracle_number = 'Oracle Number must be alphanumeric';
    } else if (oracleExists) {
      errs.oracle_number = 'Oracle Number already exists';
    }

    if (!form.device_type) errs.device_type = 'Device Type is required';
    if (form.device_type === 'Other' && !customDeviceType) errs.customDeviceType = 'Custom device type is required';
    if (!form.brand_name && form.device_type !== 'Other') errs.brand_name = 'Brand Name is required';
    if (form.brand_name === 'Other' && !customBrand) errs.customBrand = 'Custom brand is required';

    if (form.serial_number && !/^[a-zA-Z0-9]+$/.test(form.serial_number)) {
      errs.serial_number = 'Serial Number must be alphanumeric';
    } else if (serialExists) {
      errs.serial_number = 'Serial Number already exists (duplicate)';
    }

    if (!form.unit_price) {
      errs.unit_price = 'Unit Price is required';
    } else if (isNaN(form.unit_price) || Number(form.unit_price) <= 0) {
      errs.unit_price = 'Unit Price must be a positive number';
    }

    if (!form.vendor_name) {
      errs.vendor_name = 'Vendor Name is required';
    } else if (!/^[a-zA-Z0-9\s]+$/.test(form.vendor_name)) {
      errs.vendor_name = 'Vendor Name must be alphanumeric';
    }

    if (form.tender_no && !/^[a-zA-Z0-9]+$/.test(form.tender_no)) {
      errs.tender_no = 'Tender No must be alphanumeric';
    }

    return errs;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));

    if (name === 'device_type') {
      setShowCustomDevice(value === 'Other');
      setShowCustomBrand(false);
      setCustomBrand('');

      if (value !== 'Other') {
        setForm(f => ({ ...f, brand_name: '' }));
        fetchBrandsByType(value);
      } else {
        setBrands([]);
        setForm(f => ({ ...f, brand_name: 'Other' }));
        setShowCustomBrand(true);
      }
    }

    if (name === 'brand_name') {
      setShowCustomBrand(value === 'Other');
      if (value !== 'Other') {
        setCustomBrand('');
      }
    }
  };

  const addNewBrandToDeviceType = async (deviceType, brandName) => {
    try {
      await axios.post('http://localhost:5000/api/assets/add-brand', {
        device_type: deviceType,
        brand_name: brandName
      });
    } catch (error) {
      console.error('Error adding new brand:', error);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    
    const finalDeviceType = form.device_type === 'Other' ? customDeviceType : form.device_type;
    const finalBrand = form.brand_name === 'Other' ? customBrand : form.brand_name;

    if (form.brand_name === 'Other' && customBrand) {
      await addNewBrandToDeviceType(finalDeviceType, finalBrand);
    }

    const submitData = {
      oracle_number: form.oracle_number,
      device_type: finalDeviceType,
      brand_name: finalBrand,
      model_name: form.model_name,
      serial_number: form.serial_number,
      unit_price: form.unit_price,
      purchase_date: form.purchase_date,
      warranty_expiry: form.warranty_expiry,
      vendor_name: form.vendor_name,
      tender_no: form.tender_no,
      notes: form.notes
    };

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting asset:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getInputClasses = (fieldName) => {
    const hasError = errors[fieldName];
    const baseClasses = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200";
    
    if (hasError) {
      return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50`;
    }
    
    if (fieldName === 'oracle_number' && form.oracle_number && !oracleExists) {
      return `${baseClasses} border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50`;
    }
    
    if (fieldName === 'serial_number' && form.serial_number && !serialExists) {
      return `${baseClasses} border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50`;
    }
    
    return `${baseClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <FaPlus className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Add New Asset</h3>
              <p className="text-sm text-gray-600">Please fill in the asset details below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors duration-200 shadow-md"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Oracle Number */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Oracle Asset Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  name="oracle_number" 
                  value={form.oracle_number} 
                  onChange={handleChange} 
                  placeholder="Enter Oracle asset number"
                  className={getInputClasses('oracle_number')}
                  required 
                />
                {form.oracle_number && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {oracleExists ? (
                      <FaExclamationTriangle className="text-red-500" />
                    ) : (
                      <FaCheck className="text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {errors.oracle_number && (
                <p className="text-sm text-red-600 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  {errors.oracle_number}
                </p>
              )}
            </div>

            {/* Device Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Device Type <span className="text-red-500">*</span>
              </label>
              <select 
                name="device_type" 
                value={form.device_type} 
                onChange={handleChange} 
                className={getInputClasses('device_type')}
                required
              >
                <option value="">Select Device Type</option>
                {deviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.device_type && (
                <p className="text-sm text-red-600 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  {errors.device_type}
                </p>
              )}
            </div>

            {/* Custom Device Type */}
            {showCustomDevice && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Custom Device Type <span className="text-red-500">*</span>
                </label>
                <input 
                  name="customDeviceType" 
                  value={customDeviceType} 
                  onChange={(e) => setCustomDeviceType(e.target.value)} 
                  placeholder="Enter custom device type"
                  className={getInputClasses('customDeviceType')}
                  required 
                />
                {errors.customDeviceType && (
                  <p className="text-sm text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    {errors.customDeviceType}
                  </p>
                )}
              </div>
            )}

            {/* Brand Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Brand Name</label>
              <select 
                name="brand_name" 
                value={form.brand_name} 
                onChange={handleChange}
                disabled={!form.device_type || form.device_type === 'Other'}
                className={`${getInputClasses('brand_name')} ${(!form.device_type || form.device_type === 'Other') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
                {form.device_type && form.device_type !== 'Other' && (
                  <option value="Other">Other</option>
                )}
              </select>
              {errors.brand_name && (
                <p className="text-sm text-red-600 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  {errors.brand_name}
                </p>
              )}
            </div>

            {/* Custom Brand */}
            {showCustomBrand && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Custom Brand</label>
                <input 
                  name="customBrand" 
                  value={customBrand} 
                  onChange={(e) => setCustomBrand(e.target.value)} 
                  placeholder="Enter custom brand"
                  className={getInputClasses('customBrand')}
                />
                {errors.customBrand && (
                  <p className="text-sm text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    {errors.customBrand}
                  </p>
                )}
              </div>
            )}

            {/* Model and Serial Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Model Name</label>
                <input 
                  name="model_name" 
                  value={form.model_name} 
                  onChange={handleChange} 
                  placeholder="Enter model name"
                  className={getInputClasses('model_name')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                <div className="relative">
                  <input
                    name="serial_number"
                    value={form.serial_number}
                    onChange={handleChange}
                    placeholder="Enter serial number"
                    className={getInputClasses('serial_number')}
                  />
                  {form.serial_number && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {serialExists ? (
                        <FaExclamationTriangle className="text-red-500" />
                      ) : (
                        <FaCheck className="text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                {errors.serial_number && (
                  <p className="text-sm text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    {errors.serial_number}
                  </p>
                )}
              </div>
            </div>

            {/* Price and Purchase Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Unit Price (PKR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={form.unit_price}
                  onChange={handleChange}
                  placeholder="Enter price in PKR"
                  className={getInputClasses('unit_price')}
                  required
                />
                {errors.unit_price && (
                  <p className="text-sm text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    {errors.unit_price}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                <input
                  type="date"
                  name="purchase_date"
                  value={form.purchase_date}
                  onChange={handleChange}
                  className={getInputClasses('purchase_date')}
                />
              </div>
            </div>

            {/* Warranty and Vendor Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Warranty / Expiry</label>
                <input
                  name="warranty_expiry"
                  value={form.warranty_expiry}
                  onChange={handleChange}
                  placeholder="e.g., 3 years"
                  className={getInputClasses('warranty_expiry')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="vendor_name"
                  value={form.vendor_name}
                  onChange={handleChange}
                  placeholder="Enter vendor name"
                  className={getInputClasses('vendor_name')}
                  required
                />
                {errors.vendor_name && (
                  <p className="text-sm text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    {errors.vendor_name}
                  </p>
                )}
              </div>
            </div>

            {/* Tender Number */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Tender No</label>
              <input
                name="tender_no"
                value={form.tender_no}
                onChange={handleChange}
                placeholder="Enter tender number"
                className={getInputClasses('tender_no')}
              />
              {errors.tender_no && (
                <p className="text-sm text-red-600 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  {errors.tender_no}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Comments (if any)</label>
              <textarea 
                name="notes" 
                value={form.notes} 
                onChange={handleChange} 
                placeholder="Enter any additional notes"
                rows="4"
                className={getInputClasses('notes')}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetFormModal;