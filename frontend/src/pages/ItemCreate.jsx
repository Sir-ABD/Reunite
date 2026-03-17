import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItem } from '../services/itemService';
import { getCategories } from '../services/categoryService'; 
import { toast } from 'react-toastify';

function ItemCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'Lost',
    location: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // For image preview

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
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        status: 'Lost',
        location: '',
      });
      setImage(null);
      setImagePreview(null);
      // Navigate after a short delay to show success message
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      console.error('Error:', err.response?.data);
      if (err.response?.data?.code === 'VALIDATION_ERROR') {
        const errorDetails = err.response.data.details.map(detail => `${detail.field}: ${detail.message}`).join(', ');
        toast.error(`Failed to create item: ${errorDetails}`);
      } else {
        toast.error('Failed to create item: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center" style={{ color: 'var(--color-text)' }}>Add New Item</h1>

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
          </div>

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