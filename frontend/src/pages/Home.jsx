import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchItems } from '../services/searchService'; // Updated to use searchItems endpoint
import ItemCard from '../components/ItemCard';
import { toast } from 'react-toastify';
import Pagination from '../components/common/Pagination'; // Import the Pagination component

function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  // Alert timeout ref (for potential future alerts)
  const alertTimeout = useRef(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit,
          search: searchTerm.trim() || undefined, // Ensure empty search is undefined
          status: statusFilter !== 'All' ? statusFilter : undefined, // Only include status if not 'All'
          isActive: true,
        };
        const response = await searchItems(params); // Use searchItems endpoint
        if (response && Array.isArray(response.data.items)) {
          setItems(response.data.items);
          setTotalPages(response.data.pagination?.totalPages || 1);
        } else {
          setItems([]);
          setTotalPages(1);
        }
      } catch {
        toast.error('Failed to load items. Please try again later.');
        setItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    // Clear error on unmount or change (for potential alerts)
    const timeoutId = alertTimeout.current;
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset to first page on status change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header className="py-4 sm:py-6 shadow-md" style={{ background: 'var(--color-secondary)' }}>  
        <div className="max-w-7xl mx-auto flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-0" style={{ color: 'var(--color-text)' }}>Lost & Found - College Portal</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        {/* Search & Filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <input
            type="text"
            placeholder="Search by title, description, or tags..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full sm:w-2/3 p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition duration-200"
            style={{ 
              border: '1px solid var(--color-secondary)', 
              background: 'var(--color-bg)', 
              color: 'var(--color-text)' 
            }}
          />
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full sm:w-1/3 p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base appearance-none"
            style={{ 
              border: '1px solid var(--color-secondary)', 
              background: 'var(--color-bg)', 
              color: 'var(--color-text)' 
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Lost">Lost</option>
            <option value="Found">Found</option>
            <option value="Claimed">Claimed</option>
            <option value="Returned">Returned</option>
          </select>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-10 w-10" style={{ color: 'var(--color-primary)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} showActions={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 sm:px-8 rounded-lg shadow-md" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
            <p className="text-lg sm:text-xl">No items found matching your search.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      {/* Mobile Add Item Button (Kept as the only option) */}
      <div className="fixed bottom-4 right-4 sm:hidden">
        <Link
          to="/items/create"
          className="text-sm font-medium py-3 px-4 rounded-full shadow-lg transition duration-200"
          style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
        >
          + Add New Item
        </Link>
      </div>
    </div>
  );
}

export default Home;