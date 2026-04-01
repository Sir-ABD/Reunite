import { Link, useLocation } from 'react-router-dom';
import { FaEdit, FaTrash, FaSearch, FaImage } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ItemCard = ({
  item,
  onEdit,
  onDelete,
  showActions = true,
  isEditing = false,
  editFormData,
  onEditChange,
  onEditSubmit,
  onCancelEdit,
  isAdminOrKeeper = false,
  categories = [],
}) => {
  const location = useLocation();
  return (
    <div className="rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] group overflow-hidden" style={{ background: 'var(--color-secondary)', borderColor: 'var(--color-bg)' }}>
      {isEditing ? (
        <div className="relative w-full h-48 sm:h-56 md:h-64 bg-slate-100 dark:bg-slate-900 overflow-hidden">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 transition-all duration-300">
              <FaImage className="text-slate-300 dark:text-slate-700 text-4xl mb-2" />
              <p className="text-slate-400 dark:text-slate-600 text-xs font-medium">No image available</p>
            </div>
          )}
        </div>
      ) : (
        <Link to={`/items/${item._id}`}>
          <div className="relative w-full h-48 sm:h-56 md:h-64 bg-slate-100 dark:bg-slate-900 overflow-hidden cursor-pointer">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 transition-all duration-300">
                <FaImage className="text-slate-300 dark:text-slate-700 text-4xl mb-2" />
                <p className="text-slate-400 dark:text-slate-600 text-xs font-medium">No image available</p>
              </div>
            )}
            {showActions && (
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit();
                  }}
                  className="p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-blue-600 shadow-md hover:bg-blue-600 hover:text-white transition transform hover:scale-110"
                >
                  <FaEdit size={14} />
                </button>
                {onDelete && isAdminOrKeeper && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete();
                    }}
                    className="p-2.5 rounded-xl bg-white/90 backdrop-blur-sm text-red-600 shadow-md hover:bg-red-600 hover:text-white transition transform hover:scale-110"
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </Link>
      )}

      {isEditing ? (
        <div className="p-5">
          <div className="space-y-4">
            <input
              type="text"
              name="title"
              value={editFormData.title}
              onChange={onEditChange}
              placeholder="Item title"
              className="w-full p-3 border-2 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-bg)' }}
              required
            />
            <textarea
              name="description"
              value={editFormData.description}
              onChange={onEditChange}
              placeholder="Description"
              className="w-full p-3 border-2 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 h-24"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-bg)' }}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                name="status"
                value={editFormData.status}
                onChange={onEditChange}
                className="w-full p-3 border-2 rounded-xl text-sm font-bold"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-bg)' }}
                required
                disabled={!isAdminOrKeeper}
              >
                <option value="Lost">Lost</option>
                <option value="Found">Found</option>
                <option value="Claimed">Claimed</option>
                <option value="Returned">Returned</option>
              </select>
              <select
                name="category"
                value={editFormData.category}
                onChange={onEditChange}
                className="w-full p-3 border-2 rounded-xl text-sm font-bold"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-bg)' }}
                required
                disabled={!isAdminOrKeeper}
              >
                <option value="">Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              name="location"
              value={editFormData.location}
              onChange={onEditChange}
              placeholder="Location"
              className="w-full p-3 border-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-bg)' }}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onCancelEdit} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 transition">Cancel</button>
              <button onClick={onEditSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-md shadow-blue-500/10">Save</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <Link to={`/items/${item._id}`}>
            <h3 className="text-xl font-bold mb-3 tracking-tight line-clamp-1 group-hover:text-blue-600 transition" style={{ color: 'var(--color-text)' }}>
              {item.title}
            </h3>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold opacity-30 tracking-widest">Status</span>
                <span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium opacity-40">Category</span>
                <span className="font-bold opacity-70">{item.category?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium opacity-40">Posted on</span>
                <span className="font-bold opacity-70">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium opacity-40">Location</span>
                <span className="font-bold opacity-70 truncate max-w-[120px]">{item.location || 'N/A'}</span>
              </div>
            </div>
          </Link>
          
        </div>
      )}
    </div>
  );
};

export default ItemCard;