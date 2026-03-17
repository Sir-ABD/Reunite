import { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getMyItems } from '../services/userService';
import { updateItem, deleteUserItem, generateOTPForItem, verifyOTPForItem } from '../services/itemService';
import { getCategories } from '../services/categoryService';
import { Link, useOutletContext } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import Pagination from '../components/common/Pagination';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UserDashboard() {
  const { user, addNotification } = useContext(AuthContext);
  const { socket } = useOutletContext();
  const [viewType, setViewType] = useState(() => localStorage.getItem('userDashboardViewType') || 'list');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: '',
    location: '',
    image: null,
  });
  const [currentImage, setCurrentImage] = useState('');
  const [otpItemId, setOtpItemId] = useState(null);
  const [otp, setOtp] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);

  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);
  const limit = 10;

  // Ref to track shown toasts
  // const shownToasts = useRef(new Set());
  const fetchTimeoutRef = useRef(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data.categories || []);
      } catch (err) {
        addNotification(`Failed to load categories: ${err.response?.data?.message || err.message}`, 'error');
      }
    };
    fetchCategories();
  }, [addNotification]);

  // Fetch items with debounce
  useEffect(() => {
    if (!user) return;

    // Clear previous timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const itemsResponse = await getMyItems({ page: itemsPage, limit });
        setItems(itemsResponse.data.items || []);
        setItemsTotalPages(itemsResponse.data.pagination?.totalPages || 1);
      } catch (err) {
        addNotification(`Failed to load data: ${err.response?.data?.message || err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce by 300ms

    // Socket listener
    if (socket) {
      const handleNewNotification = (notification) => {
        if (notification.type === 'item' && user.id === notification.userId) {
          addNotification(notification.message, 'info');
          // Trigger fetch after notification
          clearTimeout(fetchTimeoutRef.current);
          fetchTimeoutRef.current = setTimeout(async () => {
            setLoading(true);
            try {
              const itemsResponse = await getMyItems({ page: itemsPage, limit });
              setItems(itemsResponse.data.items || []);
              setItemsTotalPages(itemsResponse.data.pagination?.totalPages || 1);
            } catch (err) {
              addNotification(`Failed to load data: ${err.response?.data?.message || err.message}`, 'error');
            } finally {
              setLoading(false);
            }
          }, 300);
        }
      };

      socket.on('newNotification', handleNewNotification);

      return () => {
        socket.off('newNotification', handleNewNotification);
      };
    }

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [itemsPage, user, socket, addNotification]);

  useEffect(() => {
    localStorage.setItem('userDashboardViewType', viewType);
  }, [viewType]);

  // Memoized handlers
  const handleEdit = useCallback((item) => {
    setEditingItemId(item._id);
    setEditFormData({
      title: item.title,
      description: item.description,
      category: item.category?.name || '',
      status: item.status,
      location: item.location || '',
      image: null,
    });
    setCurrentImage(item.image || '');
  }, []);

  const handleEditChange = useCallback((e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files && files[0]) {
      const file = files[0];
      setEditFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setCurrentImage(reader.result);
      reader.readAsDataURL(file);
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleEditSubmit = useCallback(async (itemId) => {
    const data = new FormData();
    data.append('title', editFormData.title);
    data.append('description', editFormData.description);
    data.append('category', editFormData.category);
    data.append('status', editFormData.status);
    data.append('location', editFormData.location);
    if (editFormData.image) {
      data.append('image', editFormData.image);
    }

    try {
      await updateItem(itemId, data);
      const itemsResponse = await getMyItems({ page: itemsPage, limit });
      setItems(itemsResponse.data.items || []);
      setItemsTotalPages(itemsResponse.data.pagination?.totalPages || 1);
      addNotification('Item updated successfully!', 'success', { toastId: `update-${itemId}` });
      setEditingItemId(null);
      setEditFormData({ title: '', description: '', category: '', status: '', location: '', image: null });
      setCurrentImage('');
    } catch (err) {
      addNotification(`Failed to update item: ${err.response?.data?.message || err.message}`, 'error', { toastId: `update-error-${itemId}` });
    }
  }, [editFormData, itemsPage, addNotification]);

  const handleDelete = useCallback(async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteUserItem(itemId);
        setItems((prev) => prev.filter((item) => item._id !== itemId));
        if (items.length === 1 && itemsPage > 1) {
          setItemsPage((prev) => prev - 1);
        } else {
          const itemsResponse = await getMyItems({ page: itemsPage, limit });
          setItems(itemsResponse.data.items || []);
          setItemsTotalPages(itemsResponse.data.pagination?.totalPages || 1);
        }
        addNotification('Item deleted successfully!', 'success', { toastId: `delete-${itemId}` });
      } catch (err) {
        addNotification(`Failed to delete item: ${err.response?.data?.message || err.message}`, 'error', { toastId: `delete-error-${itemId}` });
      }
    }
  }, [items, itemsPage, addNotification]);

  const handleGenerateOTP = useCallback(async (itemId) => {
    const item = items.find((i) => i._id === itemId);
    if (!item) return;

    if (user.id !== item.postedBy._id && user.id !== item.keeperId) {
      addNotification('Only the poster or keeper can generate OTP.', 'error', { toastId: `otp-auth-${itemId}` });
      return;
    }

    try {
      const response = await generateOTPForItem(itemId);
      setOtpItemId(itemId);
      setShowOtpVerification(true);
      setOtp('');
      addNotification(`OTP generated: ${response.data.otp}. Share this with the claimant to verify return.`, 'info', { toastId: `otp-gen-${itemId}` });
    } catch (err) {
      addNotification(`Failed to generate OTP: ${err.response?.data?.message || err.message}`, 'error', { toastId: `otp-error-${itemId}` });
    }
  }, [items, user.id, addNotification]);

  const handleVerifyOTP = useCallback(async (itemId) => {
    if (!otp.trim()) {
      addNotification('Please enter the OTP.', 'error', { toastId: `otp-input-${itemId}` });
      return;
    }
    try {
      await verifyOTPForItem(itemId, { otp });
      setItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, status: 'Returned' } : item))
      );
      addNotification('OTP verified successfully! Item marked as returned.', 'success', { toastId: `otp-verify-${itemId}` });
      setShowOtpVerification(false);
      setOtpItemId(null);
      setOtp('');
    } catch (err) {
      addNotification(`Failed to verify OTP: ${err.response?.data?.message || err.message}`, 'error', { toastId: `otp-verify-error-${itemId}` });
    }
  }, [otp, addNotification]);

  const handleCancelOTP = useCallback(() => {
    setShowOtpVerification(false);
    setOtpItemId(null);
    setOtp('');
  }, []);

  // Memoized derived states
  const isClaimant = useMemo(() => user.id === items.find((item) => item._id === editingItemId)?.claimedById, [user.id, items, editingItemId]);
  const isPosterOrKeeper = useMemo(() => user.id === items.find((item) => item._id === editingItemId)?.postedBy._id || user.id === items.find((item) => item._id === editingItemId)?.keeperId, [user.id, items, editingItemId]);

  if (!user) {
    return (
      <div className="container mx-auto p-2 sm:p-4 md:p-6 min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-sm sm:text-lg md:text-xl font-medium" style={{ color: 'var(--color-text)' }}>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={1} // Limit to 3 toasts at a time
      />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-0" style={{ color: 'var(--color-text)' }}>User Dashboard</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-4">
            <Link
              to="/items/create"
              className="py-1 sm:py-2 px-2 sm:px-3 md:px-4 rounded-md transition-colors duration-200 text-xs sm:text-sm md:text-base font-medium shadow-md hover:shadow-lg w-full sm:w-auto text-center"
              style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
            >
              Add New Item
            </Link>
            <Link
              to="/profile"
              className="py-1 sm:py-2 px-2 sm:px-3 md:px-4 rounded-md transition-colors duration-200 text-xs sm:text-sm md:text-base font-medium shadow-md hover:shadow-lg w-full sm:w-auto text-center"
              style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
            >
              Profile
            </Link>
            <Link
              to="/notifications"
              className="py-1 sm:py-2 px-2 sm:px-3 md:px-4 rounded-md transition-colors duration-200 text-xs sm:text-sm md:text-base font-medium shadow-md hover:shadow-lg w-full sm:w-auto text-center"
              style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
            >
              Notifications
            </Link>
            <button
              onClick={() => setViewType(viewType === 'list' ? 'card' : 'list')}
              className="py-1 sm:py-2 px-2 sm:px-3 md:px-4 rounded-md transition-colors duration-200 text-xs sm:text-sm md:text-base font-medium shadow-md hover:shadow-lg w-full sm:w-auto text-center"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
            >
              Switch to {viewType === 'list' ? 'Card' : 'List'} View
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32 sm:h-48 md:h-64">
            <p className="text-sm sm:text-lg md:text-xl animate-pulse" style={{ color: 'var(--color-text)' }}>Loading...</p>
          </div>
        ) : (
          <div>
            {viewType === 'list' ? (
              <div className="rounded-lg shadow-lg p-2 sm:p-4" style={{ background: 'var(--color-secondary)' }}>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-secondary)' }}>
                    <thead style={{ background: 'var(--color-bg)' }}>
                      <tr>
                        <th className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Image</th>
                        <th className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Title</th>
                        <th className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Status</th>
                        <th className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Category</th>
                        <th className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Posted On</th>
                        <th className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-left text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--color-secondary)' }}>
                      {items.map((item) => (
                        <tr key={item._id} className="transition-colors" style={{ background: 'var(--color-secondary)' }}>
                          {editingItemId === item._id ? (
                            <>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2">
                                <div className="flex flex-col items-center">
                                  {currentImage && (
                                    <img src={currentImage} alt={item.title} className="w-8 sm:w-12 md:w-16 h-8 sm:h-12 md:h-16 object-cover rounded-md mb-1 sm:mb-2" />
                                  )}
                                  <input
                                    type="file"
                                    name="image"
                                    onChange={handleEditChange}
                                    className="w-full p-1 sm:p-2 border rounded-md text-xs sm:text-sm"
                                    style={{ 
                                      border: '1px solid var(--color-secondary)', 
                                      background: 'var(--color-bg)', 
                                      color: 'var(--color-text)' 
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2">
                                <input
                                  type="text"
                                  name="title"
                                  value={editFormData.title}
                                  onChange={handleEditChange}
                                  className="w-full p-1 sm:p-2 border rounded-md text-xs sm:text-sm"
                                  style={{ 
                                    border: '1px solid var(--color-secondary)', 
                                    background: 'var(--color-bg)', 
                                    color: 'var(--color-text)' 
                                  }}
                                  required
                                />
                              </td>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2">
                                <select
                                  name="status"
                                  value={editFormData.status}
                                  onChange={handleEditChange}
                                  className="w-full p-1 sm:p-2 border rounded-md text-xs sm:text-sm"
                                  style={{ 
                                    border: '1px solid var(--color-secondary)', 
                                    background: 'var(--color-bg)', 
                                    color: 'var(--color-text)' 
                                  }}
                                  required
                                >
                                  <option value="Lost">Lost</option>
                                  <option value="Found">Found</option>
                                  <option value="Claimed">Claimed</option>
                                  <option value="Returned">Returned</option>
                                </select>
                              </td>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2">
                                <select
                                  name="category"
                                  value={editFormData.category}
                                  onChange={handleEditChange}
                                  className="w-full p-1 sm:p-2 border rounded-md text-xs sm:text-sm"
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
                              </td>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-xs sm:text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 flex flex-col sm:flex-row gap-1 sm:gap-2">
                                <button
                                  onClick={() => handleEditSubmit(item._id)}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm transition-colors w-full sm:w-auto"
                                  style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingItemId(null);
                                    setCurrentImage('');
                                  }}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm transition-colors w-full sm:w-auto mt-1 sm:mt-0"
                                  style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
                                >
                                  Cancel
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2">
                                {item.image && <img src={item.image} alt={item.title} className="w-8 sm:w-12 md:w-16 h-8 sm:h-12 md:h-16 object-cover rounded-md" />}
                              </td>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium">{item.title}</td>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                                <span className={`status-badge ${item.status?.toLowerCase()}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-xs sm:text-sm">{item.category?.name || 'N/A'}</td>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-xs sm:text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                              <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 flex flex-col sm:flex-row gap-1 sm:gap-2 flex-wrap">
                                <Link
                                  to={`/items/${item._id}`}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm transition-colors w-full sm:w-auto"
                                  style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                                >
                                  View
                                </Link>
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm transition-colors w-full sm:w-auto mt-1 sm:mt-0"
                                  style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(item._id)}
                                  className="px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm transition-colors w-full sm:w-auto mt-1 sm:mt-0"
                                  style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
                                >
                                  Delete
                                </button>
                                {item.status === 'Claimed' && !isClaimant && (
                                  <>
                                    {isPosterOrKeeper && (
                                      <button
                                        onClick={() => handleGenerateOTP(item._id)}
                                        className="px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm transition-colors w-full sm:w-auto mt-1 sm:mt-0"
                                        style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
                                      >
                                        Generate OTP
                                      </button>
                                    )}
                                    {showOtpVerification && otpItemId === item._id && (
                                      <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 w-full">
                                        <input
                                          type="text"
                                          value={otp}
                                          onChange={(e) => setOtp(e.target.value)}
                                          placeholder="Enter OTP"
                                          className="p-1 sm:p-2 border rounded-md text-xs sm:text-sm w-full sm:w-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                          style={{ 
                                            border: '1px solid var(--color-secondary)', 
                                            background: 'var(--color-bg)', 
                                            color: 'var(--color-text)' 
                                          }}
                                        />
                                        <button
                                          onClick={() => handleVerifyOTP(item._id)}
                                          className="px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm transition-colors w-full sm:w-auto mt-1 sm:mt-0"
                                          style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
                                        >
                                          Verify
                                        </button>
                                        <button
                                          onClick={handleCancelOTP}
                                          className="px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm transition-colors w-full sm:w-auto mt-1 sm:mt-0"
                                          style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {items.length > 0 && (
                  <div className="mt-2 sm:mt-4 md:mt-6">
                    <Pagination
                      currentPage={itemsPage}
                      totalPages={itemsTotalPages}
                      onPageChange={(page) => setItemsPage(page)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                {items.map((item) => {
                  const isClaimant = user.id === item.claimedById;
                  const isPosterOrKeeper = user.id === item.postedBy._id || user.id === item.keeperId;

                  return (
                    <ItemCard
                      key={item._id}
                      item={item}
                      onEdit={() => handleEdit(item)}
                      onDelete={() => handleDelete(item._id)}
                      showActions={editingItemId !== item._id}
                      isEditing={editingItemId === item._id}
                      editFormData={editingItemId === item._id ? editFormData : null}
                      onEditChange={handleEditChange}
                      onEditSubmit={() => handleEditSubmit(item._id)}
                      onCancelEdit={() => {
                        setEditingItemId(null);
                        setCurrentImage('');
                      }}
                      // Hide Generate OTP and Verify OTP for claimant
                      onGenerateOTP={item.status === 'Claimed' && !isClaimant && isPosterOrKeeper ? () => handleGenerateOTP(item._id) : null}
                      onVerifyOTP={item.status === 'Claimed' && showOtpVerification && otpItemId === item._id && !isClaimant ? () => handleVerifyOTP(item._id) : null}
                      otp={showOtpVerification && otpItemId === item._id && !isClaimant ? otp : ''}
                      setOtp={showOtpVerification && otpItemId === item._id && !isClaimant ? setOtp : null}
                      onCancelOTP={showOtpVerification && otpItemId === item._id && !isClaimant ? handleCancelOTP : null}
                    />
                  );
                })}
              </div>
            )}
            {items.length === 0 && (
              <div className="rounded-lg shadow-lg p-2 sm:p-4 text-center" style={{ background: 'var(--color-secondary)' }}>
                <p className="text-sm sm:text-lg md:text-xl" style={{ color: 'var(--color-text)' }}>No items found. Start by adding a new item!</p>
                <Link
                  to="/items/create"
                  className="mt-2 sm:mt-4 inline-block py-1 sm:py-2 px-2 sm:px-4 rounded-md transition-colors duration-200 text-sm sm:text-base font-medium shadow-md hover:shadow-lg"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                >
                  Add New Item
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;