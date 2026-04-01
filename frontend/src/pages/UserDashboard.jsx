import { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getMyItems } from '../services/userService';
import { updateItem, deleteUserItem } from '../services/itemService';
import { getAssignedItems, facilitateMeeting } from '../services/keeperService';
import { getCategories } from '../services/categoryService';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import Pagination from '../components/common/Pagination';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

function UserDashboard() {
  const { user, addNotification } = useContext(AuthContext);
  const isAdminOrKeeper = user?.role === 'admin' || user?.role === 'keeper';
  const { socket } = useOutletContext();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState(() => localStorage.getItem('userDashboardViewType') || 'list');
  const [activeTab, setActiveTab] = useState('myItems');
  const [assignedItems, setAssignedItems] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
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
  const fetchTimeoutRef = useRef(null);
  const limit = 10;

  // Fetch items with debounce
  useEffect(() => {
    if (!user) return;

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const itemsResponse = await getMyItems({ page: itemsPage, limit });
        setItems(itemsResponse.data.items || []);
        setItemsTotalPages(itemsResponse.data.pagination?.totalPages || 1);
        setStats(itemsResponse.data.stats || null);

        if (user?.role === 'keeper') {
          const assignedRes = await getAssignedItems();
          setAssignedItems(assignedRes.data.items || []);
        }
      } catch (err) {
        addNotification(`Failed to load data: ${err.response?.data?.message || err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [itemsPage, user, addNotification]);

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
      setStats(itemsResponse.data.stats || null);
      addNotification('Item updated successfully!', 'success');
      setEditingItemId(null);
    } catch (err) {
      addNotification(`Failed to update item: ${err.response?.data?.message || err.message}`, 'error');
    }
  }, [editFormData, itemsPage, addNotification]);

  const handleDelete = useCallback(async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteUserItem(itemId);
        setItems((prev) => prev.filter((item) => item._id !== itemId));
        const itemsResponse = await getMyItems({ page: itemsPage, limit });
        setItems(itemsResponse.data.items || []);
        setStats(itemsResponse.data.stats || null);
        addNotification('Item deleted successfully!', 'success');
      } catch (err) {
        addNotification(`Failed to delete item: ${err.response?.data?.message || err.message}`, 'error');
      }
    }
  }, [itemsPage, addNotification]);

  const handleFacilitateMeeting = async (itemId) => {
    try {
      const res = await facilitateMeeting(itemId);
      addNotification('Meeting facilitation started!', 'success');
      navigate(`/messages/${res.data.conversation._id}`);
    } catch (err) {
      addNotification(`Failed to facilitate meeting: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold italic opacity-40">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 pb-24 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <ToastContainer position="top-right" autoClose={3000} limit={1} theme="colored" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="animate-fade-in-down">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
              My dashboard
            </h1>
            <p className="text-sm sm:text-lg font-medium opacity-60">
              Manage your reported items on Reunite
            </p>
          </div>

          <div className="flex flex-wrap gap-4 animate-fade-in-down">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/items/create" className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-500/10">
                <span className="text-xl">+</span> Add item
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/profile" className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-md border border-slate-100 dark:border-slate-700">
                <span className="text-lg opacity-40">👤</span> Profile
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/notifications" className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-md border border-slate-100 dark:border-slate-700 relative">
                <span className="text-lg opacity-40">🔔</span> Notifications
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none transition transform hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold text-xl">📦</div>
              <div className="text-3xl font-bold tracking-tight">{stats?.total || 0}</div>
            </div>
            <div className="text-xs font-bold opacity-40 tracking-widest">Total items</div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none transition transform hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center font-bold text-xl">❗</div>
              <div className="text-3xl font-bold tracking-tight">{stats?.lost || 0}</div>
            </div>
            <div className="text-xs font-bold opacity-40 tracking-widest">Lost items</div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none transition transform hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold text-xl">✅</div>
              <div className="text-3xl font-bold tracking-tight">{stats?.found || 0}</div>
            </div>
            <div className="text-xs font-bold opacity-40 tracking-widest">Found items</div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none transition transform hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center font-bold text-xl">🤝</div>
              <div className="text-3xl font-bold tracking-tight">{stats?.claimed || 0}</div>
            </div>
            <div className="text-xs font-bold opacity-40 tracking-widest">Claimed</div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none transition transform hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center font-bold text-xl">🏆</div>
              <div className="text-3xl font-bold tracking-tight">{stats?.returned || 0}</div>
            </div>
            <div className="text-xs font-bold opacity-40 tracking-widest">Returned</div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-slate-800/50 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden mb-12 animate-fade-in-up">
          <div className="p-10 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">Items Dashboard</h2>
                <p className="text-xs font-medium opacity-40">{activeTab === 'myItems' ? items.length : assignedItems.length} total items in view</p>
              </div>
              
              {user?.role === 'keeper' && (
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl ml-4">
                  <button 
                    onClick={() => setActiveTab('myItems')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'myItems' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    My Items
                  </button>
                  <button 
                    onClick={() => setActiveTab('assignedItems')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'assignedItems' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Assigned Items
                    {assignedItems.filter(i => i.status !== 'Returned').length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {assignedItems.filter(i => i.status !== 'Returned').length}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl">
              <button 
                onClick={() => setViewType('card')}
                className={`p-3 rounded-xl transition ${viewType === 'card' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              </button>
              <button 
                onClick={() => setViewType('list')}
                className={`p-3 rounded-xl transition ${viewType === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-20">
                <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin mb-4"></div>
                <p className="font-bold tracking-widest text-xs">Syncing data...</p>
              </div>
            ) : (activeTab === 'myItems' ? items : assignedItems).length > 0 ? (
              viewType === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-bold tracking-widest text-slate-400">
                        <th className="pb-8 pl-4">Image</th>
                        <th className="pb-8">Title</th>
                        <th className="pb-8">Status</th>
                        <th className="pb-8">Category</th>
                        <th className="pb-8">Posted on</th>
                        <th className="pb-8 text-right pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-t border-slate-100 dark:border-slate-700">
                      {(activeTab === 'myItems' ? items : assignedItems).map((item) => (
                        <tr key={item._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                          <td className="py-6 pl-4">
                            <img src={item.image} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-md group-hover:scale-105 transition" />
                          </td>
                          <td className="py-6 font-bold text-lg">{item.title}</td>
                          <td className="py-6">
                            <span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</span>
                          </td>
                          <td className="py-6 text-sm font-medium opacity-60">{item.category?.name || 'Uncategorized'}</td>
                          <td className="py-6 text-sm font-medium opacity-40">{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td className="py-6 text-right pr-4">
                            <div className="flex justify-end gap-2">
                              {activeTab === 'assignedItems' && item.status !== 'Returned' && (
                                <button onClick={() => handleFacilitateMeeting(item._id)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition shadow-sm font-bold text-xs flex items-center gap-1">
                                  <span>👥</span> Facilitate
                                </button>
                              )}
                              <Link to={`/items/${item._id}`} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                              </Link>
                              {activeTab === 'myItems' && (
                                <>
                                  <button onClick={() => handleEdit(item)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition shadow-sm">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                  </button>
                                  <button onClick={() => handleDelete(item._id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {(activeTab === 'myItems' ? items : assignedItems).map((item) => (
                    <ItemCard key={item._id} item={item} showActions={activeTab === 'myItems'} onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item._id)} />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-24 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="text-6xl mb-6 grayscale opacity-20">🍃</div>
                <h3 className="text-xl font-bold opacity-40 mb-2">No items found</h3>
                <p className="text-sm font-medium opacity-30 mb-8">Start by adding your first lost or found item</p>
                <Link to="/items/create" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/10">
                  Add item now
                </Link>
              </div>
            )}
            
            {itemsTotalPages > 1 && (
              <div className="mt-16">
                <Pagination currentPage={itemsPage} totalPages={itemsTotalPages} onPageChange={setItemsPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;