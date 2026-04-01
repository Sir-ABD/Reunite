import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createItem, improveText } from '../services/itemService';
import { getCategories } from '../services/categoryService'; 
import { toast } from 'react-toastify';

function ItemCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'Lost';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: initialStatus,
    location: '',
  });
  const [coordinates, setCoordinates] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // For image preview
  const [alert, setAlert] = useState(null);
  const [previewSuggestions, setPreviewSuggestions] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data.categories || []);
      } catch (err) {
        toast.error('Failed to load categories: ' + (err.response?.data?.message || err.message));
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImproveText = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please enter both title and description before improving.');
      return;
    }
    try {
      const response = await improveText({
        title: formData.title,
        description: formData.description,
      });
      setPreviewSuggestions({
        title: response.data.suggestedTitle,
        description: response.data.suggestedDescription,
      });
    } catch (err) {
      toast.error('Failed to improve text: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAcceptSuggestions = () => {
    setFormData((prev) => ({
      ...prev,
      title: previewSuggestions.title,
      description: previewSuggestions.description,
    }));
    setPreviewSuggestions(null);
    toast.success('Text improved successfully!');
  };

  const handleCancelSuggestions = () => {
    setPreviewSuggestions(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      console.log('Selected image:', file);
      // Preview new image
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview(null);
      console.log('No image selected');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('status', formData.status);
    data.append('location', formData.location);
    if (coordinates) {
      data.append('coordinates', JSON.stringify(coordinates));
    }
    if (image instanceof File) {
      console.log('Appending image file:', image);
      data.append('image', image);
    } else {
      console.log('No valid image file to append');
    }

    // Debug: Log FormData entries
    for (let [key, value] of data.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const response = await createItem(data);
      console.log('Response:', response.data);
      toast.success('Item created successfully!');
      if (response.data.aiMessage) {
        setAlert({ type: 'success', message: response.data.aiMessage });
      }
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        status: 'Lost',
        location: '',
      });
      setCoordinates(null);
      setImage(null);
      setImagePreview(null);
      setPreviewSuggestions(null);
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/dashboard');
        setAlert(null);
      }, 3000);
    } catch (err) {
      console.error('Error:', err.response?.data);
      toast.error('Failed to create item');
      const errorMessage = err.response?.data?.message || err.message;
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.success('Location captured successfully!');
      },
      (err) => {
        toast.error('Unable to retrieve your location');
      }
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center" style={{ color: 'var(--color-text)' }}>Add New Item</h1>

        {alert && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            alert.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
            'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          } shadow-md`}>
            <div className="flex items-center mb-2">
              <svg className={`w-6 h-6 mr-2 ${alert.type === 'success' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={alert.type === 'success' ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"}></path>
              </svg>
              <h2 className="font-bold text-lg">{alert.type === 'success' ? 'AI Verification' : 'Error'}</h2>
            </div>
            <p className="text-sm sm:text-base">{alert.message}</p>
          </div>
        )}

        <div className="mb-6 p-4 rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 shadow-md">
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <h2 className="font-bold text-lg">Important Notice</h2>
          </div>
          <p className="text-sm sm:text-base">
            Please fill in the details carefully. Once posted, you will NOT be able to delete this item. Only limited editing of non-sensitive information is allowed for owners.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 rounded-lg shadow-md" encType="multipart/form-data" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm sm:text-base md:text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              style={{ 
                border: '1px solid var(--color-secondary)', 
                background: 'var(--color-bg)', 
                color: 'var(--color-text)' 
              }}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm sm:text-base md:text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              style={{ 
                border: '1px solid var(--color-secondary)', 
                background: 'var(--color-bg)', 
                color: 'var(--color-text)' 
              }}
              rows="4"
              required
            />
            <button
              type="button"
              onClick={handleImproveText}
              disabled={previewSuggestions !== null}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200 text-sm"
            >
              Improve with AI
            </button>
          </div>

          {previewSuggestions && (
            <div className="mb-6 p-4 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md">
              <h3 className="text-lg font-bold mb-4 text-blue-800 dark:text-blue-200">AI Suggestions Preview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Title:</h4>
                  <p className="p-2 bg-white dark:bg-gray-700 rounded border text-sm">{formData.title}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Suggested Title:</h4>
                  <p className="p-2 bg-green-100 dark:bg-green-900 rounded border text-sm font-medium">{previewSuggestions.title}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Description:</h4>
                  <p className="p-2 bg-white dark:bg-gray-700 rounded border text-sm whitespace-pre-wrap">{formData.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Suggested Description:</h4>
                  <p className="p-2 bg-green-100 dark:bg-green-900 rounded border text-sm font-medium whitespace-pre-wrap">{previewSuggestions.description}</p>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelSuggestions}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAcceptSuggestions}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
                >
                  Accept Suggestions
                </button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="category" className="block text-sm sm:text-base md:text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              style={{ 
                border: '1px solid var(--color-secondary)', 
                background: 'var(--color-bg)', 
                color: 'var(--color-text)' 
              }}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="status" className="block text-sm sm:text-base md:text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              style={{ 
                border: '1px solid var(--color-secondary)', 
                background: 'var(--color-bg)', 
                color: 'var(--color-text)' 
              }}
              required
            >
              <option value="Lost">Lost</option>
              <option value="Found">Found</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="location" className="block text-sm sm:text-base md:text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              style={{ 
                border: '1px solid var(--color-secondary)', 
                background: 'var(--color-bg)', 
                color: 'var(--color-text)' 
              }}
              placeholder="e.g., Main Hall, Room 101"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm sm:text-base md:text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Geographic Coordinates
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={getUserLocation}
                className="w-full sm:w-auto p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
              >
                Use Current Location
              </button>
              {coordinates && (
                <span className="text-sm font-medium text-green-500">
                  Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}
                </span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="image" className="block text-sm sm:text-base md:text-lg font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Image (optional)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full sm:w-auto p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                style={{ 
                  border: '1px solid var(--color-secondary)', 
                  background: 'var(--color-bg)', 
                  color: 'var(--color-text)' 
                }}
              />
              {imagePreview && (
                <div className="mt-2 sm:mt-0">
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-md border" />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 sm:py-3 px-4 rounded-md text-white text-sm sm:text-base font-medium ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors duration-200 flex items-center justify-center`}
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ItemCreate;