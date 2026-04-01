import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserItems, getUserById } from '../services/adminService';
import { toast } from 'react-toastify';
import Pagination from '../components/common/Pagination'; // Import the Pagination component

function UserDetail() {
  const { id } = useParams(); // Get the user ID from the URL
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 5; // Number of items per page

  useEffect(() => {
    const fetchUserAndItems = async () => {
      setLoading(true);
      try {
        // Fetch user details
        const userResponse = await getUserById(id);
        setUser(userResponse.data.user);

        // Fetch items posted by the user with pagination
        const itemsResponse = await getUserItems(id, { page: currentPage, limit }); // Corrected: pass params as object
        setItems(itemsResponse.data.items || []);
        setTotalPages(itemsResponse.data.pagination?.totalPages || 1);
      } catch (err) {
        toast.error('Failed to fetch data: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndItems();
  }, [id, currentPage]); // Re-fetch when id or currentPage changes

  // Handler for page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <p className="text-gray-600 text-center mt-6">Loading...</p>;
  }

  if (!user) {
    return <p className="text-gray-600 text-center mt-6">User not found.</p>;
  }

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>User Details</h1>
        <div className="p-4 sm:p-6 rounded-lg shadow-md" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
          {/* User Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 flex-shrink-0 shadow-lg">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                  <span className="text-4xl font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 flex-grow w-full">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Name</h2>
                <p>{user.name}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Email</h2>
                <p>{user.email}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Role</h2>
                <p className="capitalize">{user.role}</p>
              </div>
              {user.role === 'keeper' && (
                <>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Assigned Items</h2>
                    <p className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user.assignedItemsCount || 0}</span>
                      <span className="text-sm font-medium opacity-60">items currently assigned</span>
                    </p>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Successful Returns</h2>
                    <p className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{user.successfulReturnsCount || 0}</span>
                      <span className="text-sm font-medium opacity-60">items securely handed off</span>
                    </p>
                  </div>
                </>
              )}
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Joined</h2>
                <p>{new Date(user.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Status</h2>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Items Posted by User */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Items Posted</h2>
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-secondary)' }}>
                      <th className="px-4 py-2 text-left text-sm sm:text-base font-medium" style={{ color: 'var(--color-text)' }}>Title</th>
                      <th className="px-4 py-2 text-left text-sm sm:text-base font-medium" style={{ color: 'var(--color-text)' }}>Description</th>
                      <th className="px-4 py-2 text-left text-sm sm:text-base font-medium" style={{ color: 'var(--color-text)' }}>Status</th>
                      <th className="px-4 py-2 text-left text-sm sm:text-base font-medium" style={{ color: 'var(--color-text)' }}>Category</th>
                      <th className="px-4 py-2 text-left text-sm sm:text-base font-medium" style={{ color: 'var(--color-text)' }}>Posted On</th>
                      <th className="px-4 py-2 text-left text-sm sm:text-base font-medium" style={{ color: 'var(--color-text)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id} style={{ borderTop: '1px solid var(--color-secondary)' }}>
                        <td className="px-4 py-2 text-sm sm:text-base">{item.title}</td>
                        <td className="px-4 py-2 text-sm sm:text-base">{item.description}</td>
                        <td className="px-4 py-2 text-sm sm:text-base">{item.status}</td>
                        <td className="px-4 py-2 text-sm sm:text-base">{item.category?.name || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm sm:text-base">{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2">
                          <Link
                            to={`/items/${item._id}`}
                            className="px-3 py-1 rounded-md text-sm transition-colors"
                            style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">No items posted by this user.</p>
            )}
          </div>
        </div>
        <div className="mt-6">
          <Link
            to="/admin"
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors shadow-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default UserDetail;