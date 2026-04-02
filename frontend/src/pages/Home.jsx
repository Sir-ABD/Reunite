import { useState, useEffect, useRef, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { searchItems } from '../services/searchService';
import { getCategories } from '../services/categoryService';
import ItemCard from '../components/ItemCard';
import { toast } from 'react-toastify';
import Pagination from '../components/common/Pagination';

function Home() {
  const { user, socket } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'All';

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [newItemsAvailable, setNewItemsAvailable] = useState(false);

  // Alert timeout ref (for potential future alerts)
  const alertTimeout = useRef(null);
  const limit = 8;

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit,
          search: searchTerm.trim() || undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          sortBy: 'createdAt',
          order: sortOrder === 'newest' ? 'desc' : 'asc',
          isActive: true,
        };
        const response = await searchItems(params);
        if (response && Array.isArray(response.data.items)) {
          setItems(response.data.items);
          setTotalPages(response.data.pagination?.totalPages || 1);
          setLastUpdated(new Date());
        } else {
          setItems([]);
          setTotalPages(1);
        }
      } catch {
        toast.error('Failed to load items.');
        setItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [page, searchTerm, statusFilter, categoryFilter, sortOrder]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        if (res.data && res.data.categories) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Socket listener for new items
  useEffect(() => {
    if (socket) {
      const handleNewItem = (data) => {
        console.log('New item created:', data.item.title);
        setNewItemsAvailable(true);
      };

      socket.on('newItem', handleNewItem);

      return () => {
        socket.off('newItem', handleNewItem);
      };
    }
  }, [socket]);

  useEffect(() => {
    const status = searchParams.get('status') || 'All';
    const category = searchParams.get('category') || 'All';
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';
    const pageParam = parseInt(searchParams.get('page')) || 1;

    setStatusFilter(status);
    setCategoryFilter(category);
    setSortOrder(sort);
    setSearchTerm(search);
    setPage(pageParam);
  }, [searchParams]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setSortOrder('newest');
    setPage(1);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        sortBy: 'createdAt',
        order: sortOrder === 'newest' ? 'desc' : 'asc',
        isActive: true,
      };
      const response = await searchItems(params);
      if (response && Array.isArray(response.data.items)) {
        setItems(response.data.items);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setLastUpdated(new Date());
        setNewItemsAvailable(false);
      } else {
        setItems([]);
        setTotalPages(1);
      }
    } catch {
      toast.error('Failed to refresh items.');
    } finally {
      setLoading(false);
    }
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (categoryFilter !== 'All') params.set('category', categoryFilter);
    if (sortOrder !== 'newest') params.set('sort', sortOrder);
    if (searchTerm) params.set('search', searchTerm);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params);
  }, [statusFilter, categoryFilter, sortOrder, searchTerm, page, setSearchParams]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Advanced Professional Hero Header */}
      <div className="relative bg-blue-600 text-white pt-16 pb-32 px-4 overflow-hidden text-center">
        {/* Welcome Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-700/50 backdrop-blur-sm rounded-full mb-8 animate-fade-in-down border border-blue-400/30">
          <span className="text-[10px] sm:text-xs font-bold tracking-widest italic text-amber-50">⚡ Welcome to Reunite</span>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black italic tracking-tighter mb-6 leading-tight">
            Reunite
          </h1>
          
          <p className="text-sm sm:text-lg font-medium opacity-80 mb-10 max-w-2xl mx-auto leading-relaxed h-[60px] sm:h-auto">
            Reuniting people with their belongings. Find what you lost or help someone find theirs. Fast, secure, and community-driven.
          </p>

          {/* Info Pill Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <div className="px-5 py-2 bg-blue-700/40 rounded-full flex items-center gap-2 border border-blue-400/20 backdrop-blur-sm shadow-lg hover:bg-blue-700/60 transition cursor-default">
              <span className="text-amber-400 text-lg">💼</span>
              <span className="text-[10px] sm:text-xs font-bold tracking-wider opacity-90">{totalPages > 1 ? (totalPages * limit) : items.length}+ Items</span>
            </div>
            <div className="px-5 py-2 bg-blue-700/40 rounded-full flex items-center gap-2 border border-blue-400/20 backdrop-blur-sm shadow-lg hover:bg-blue-700/60 transition cursor-default">
              <span className="text-amber-400 text-lg">👥</span>
              <span className="text-[10px] sm:text-xs font-bold tracking-wider opacity-90">Active Community</span>
            </div>
            <div className="px-5 py-2 bg-blue-700/40 rounded-full flex items-center gap-2 border border-blue-400/20 backdrop-blur-sm shadow-lg hover:bg-blue-700/60 transition cursor-default">
              <span className="text-amber-400 text-lg">🛡️</span>
              <span className="text-[10px] sm:text-xs font-bold tracking-wider opacity-90">Secure Platform</span>
            </div>
          </div>

          {/* Search Bar centered */}
          <div className="relative mb-8 max-w-2xl mx-auto transform transition hover:scale-[1.01] group">
            <input
              type="text"
              placeholder="Search for lost or found items..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-4 pl-14 rounded-2xl shadow-xl outline-none focus:ring-4 focus:ring-blue-400/30 text-gray-800 text-lg font-medium transition-all"
              style={{ background: 'white' }}
            />
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 transition-transform group-focus-within:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <Link 
            to="/items/create" 
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-xl font-bold text-sm tracking-wide hover:bg-gray-50 transition transform hover:scale-105 active:scale-95 shadow-xl border-b-2 border-blue-100"
          >
            <span className="text-lg">+</span> Report Item <span className="ml-1 opacity-40">&gt;</span>
          </Link>
        </div>

        {/* Sophisticated Wave SVG */}
        <div className="absolute bottom-0 left-0 w-full leading-none z-0">
          <svg className="relative block w-full h-[80px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" fill="var(--color-bg)"></path>
          </svg>
        </div>
      </div>

      {/* Filter & Sort Card Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-20">
        <div className="flex items-center gap-3 mb-6 ml-2">
          <div className="p-2 bg-blue-600 rounded-xl shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold italic tracking-tighter text-blue-900 dark:text-blue-400">Filter & Sort</h2>
        </div>

        <div 
          className="p-6 rounded-[2rem] shadow-xl border transition-all grid grid-cols-1 md:grid-cols-4 gap-6 items-end"
          style={{ background: 'var(--color-secondary)', borderColor: 'rgba(0,0,0,0.05)' }}
        >
          <div className="space-y-2">
            <label className="text-xs font-bold opacity-50 tracking-widest translate-x-1 inline-block" style={{ color: 'var(--color-text)' }}>Status</label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full p-3.5 rounded-2xl border-2 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 cursor-pointer font-bold transition-all text-sm"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-bg)' }}
            >
              <option value="All">All Statuses</option>
              <option value="Lost">Lost</option>
              <option value="Found">Found</option>
              <option value="Claimed">Claimed</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold opacity-50 tracking-widest translate-x-1 inline-block" style={{ color: 'var(--color-text)' }}>Category</label>
            <select
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="w-full p-3.5 rounded-2xl border-2 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 cursor-pointer font-bold transition-all text-sm"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-bg)' }}
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold opacity-50 tracking-widest translate-x-1 inline-block flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
              <span className="text-lg">↕</span> Sort By
            </label>
            <select
              value={sortOrder}
              onChange={handleSortChange}
              className="w-full p-3.5 rounded-2xl border-2 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 cursor-pointer font-bold transition-all text-sm"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-bg)' }}
            >
              <option value="newest">📅 Newest First</option>
              <option value="oldest">📅 Oldest First</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="flex-1 p-4 rounded-2xl font-bold text-sm tracking-tight transition flex items-center justify-center gap-2 hover:opacity-80 shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--color-accent)', color: 'white' }}
            >
              <span className="text-xl">🔄</span> Refresh
            </button>
            <button 
              onClick={handleClearFilters}
              className="flex-1 p-4 rounded-2xl font-bold text-sm tracking-tight transition flex items-center justify-center gap-2 hover:opacity-80 shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--color-accent)', color: 'white' }}
            >
              <span className="text-xl">×</span> Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold italic tracking-tighter text-blue-900 dark:text-blue-400 border-l-8 border-blue-600 pl-4">
            Latest Posts
          </h1>
          <div className="text-sm opacity-60" style={{ color: 'var(--color-text)' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
        {newItemsAvailable && (
          <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 dark:text-blue-200 text-sm">
                🚀 New items have been posted! Refresh to see the latest.
              </span>
              <button
                onClick={handleRefresh}
                className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} showActions={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border-2 border-dashed border-gray-200 dark:border-slate-700 transition-colors">
            <p className="text-xl font-bold opacity-60 italic mb-4">No items found matching your criteria.</p>
            <button 
              onClick={() => {setSearchTerm(''); setStatusFilter('All');}}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;
