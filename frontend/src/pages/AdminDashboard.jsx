import {
	useState,
	useEffect,
	useContext,
	useRef,
	useCallback,
	useMemo,
} from "react";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
	getDashboardStats,
	getUsers,
	toggleUserActivation,
	getConversations,
	getAllItems,
} from "../services/adminService";
import {
	addCategory,
	deleteCategory,
	updateCategory,
	getAllCategoriesForAdmin,
} from "../services/categoryService";
import { getKeepers } from "../services/keeperService";
import {
	getItems,
	toggleItemActivation,
	assignKeeperToItem,
} from "../services/itemService";
import { register, verifyOtp } from "../services/authService"; // Added verifyOtp
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import useClickOutside from "../hooks/useClickOutside";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Loader from "../components/common/Loader";
import Pagination from "../components/common/Pagination";
import { toast } from "react-toastify"; // Ensure Toastify is imported

// UsersTab Component (unchanged)
function UsersTab({ user, page, setPage, totalPages, setTotalPages, limit }) {
	const [users, setUsers] = useState([]);
	const [userSearch, setUserSearch] = useState("");
	const [userSortBy, setUserSortBy] = useState("createdAt");
	const [userOrder, setUserOrder] = useState("desc");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const shownToasts = useRef(new Set());

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const response = await getUsers({
				page: page.users,
				limit,
				search: userSearch,
				sortBy: userSortBy,
				order: userOrder,
			});
			setUsers(response.data.users || []);
			setTotalPages((prev) => ({
				...prev,
				users: response.data.pagination?.totalPages || 1,
			}));
		} catch (err) {
			const errorMsg = "Failed to load users: " + (err.response?.data?.message || err.message);
			if (!shownToasts.current.has(errorMsg)) {
				toast.error(errorMsg);
				shownToasts.current.add(errorMsg);
				setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
			}
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	}, [page.users, limit, userSearch, userSortBy, userOrder, setTotalPages]);

	useEffect(() => {
		const debounceFetch = setTimeout(() => fetchUsers(), 300);
		return () => clearTimeout(debounceFetch);
	}, [fetchUsers]);

	useEffect(() => {
		if (success || error) {
			const timeout = setTimeout(() => {
				setSuccess("");
				setError("");
			}, 3000);
			return () => clearTimeout(timeout);
		}
	}, [success, error]);

	const handleToggleUserActivation = useCallback(async (userId, isActive) => {
		if (window.confirm(`Are you sure you want to ${isActive ? "deactivate" : "activate"} this user?`)) {
			setLoading(true);
			try {
				await toggleUserActivation(userId);
				setUsers((prev) =>
					prev.map((u) => (u._id === userId ? { ...u, isActive: !isActive } : u))
				);
				const successMsg = `User ${!isActive ? "activated" : "deactivated"} successfully`;
				if (!shownToasts.current.has(successMsg)) {
					toast.success(successMsg);
					shownToasts.current.add(successMsg);
					setTimeout(() => shownToasts.current.delete(successMsg), 5000);
				}
				setSuccess(successMsg);
			} catch (err) {
				const errorMsg = "Failed to toggle user activation: " + (err.response?.data?.message || err.message);
				if (!shownToasts.current.has(errorMsg)) {
					toast.error(errorMsg);
					shownToasts.current.add(errorMsg);
					setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
				}
				setError(errorMsg);
			} finally {
				setLoading(false);
			}
		}
	}, []);

	const userSearchSection = useMemo(
		() => (
			<div className="mb-6 flex flex-col sm:flex-row gap-4 items-center p-4 rounded-lg shadow-sm" style={{ background: 'var(--color-secondary)' }}>
				<input
					type="text"
					placeholder="Search by name, email, or role..."
					value={userSearch}
					onChange={(e) => {
						setUserSearch(e.target.value);
						setPage((prev) => ({ ...prev, users: 1 }));
					}}
					className="w-full sm:w-1/3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
					style={{ 
						border: '1px solid var(--color-secondary)', 
						background: 'var(--color-bg)', 
						color: 'var(--color-text)' 
					}}
				/>
				<select
					value={userSortBy}
					onChange={(e) => {
						setUserSortBy(e.target.value);
						setPage((prev) => ({ ...prev, users: 1 }));
					}}
					className="w-full sm:w-1/3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
					style={{ 
						border: '1px solid var(--color-secondary)', 
						background: 'var(--color-bg)', 
						color: 'var(--color-text)' 
					}}
				>
					<option value="name">Name</option>
					<option value="email">Email</option>
					<option value="createdAt">Created At</option>
				</select>
				<select
					value={userOrder}
					onChange={(e) => {
						setUserOrder(e.target.value);
						setPage((prev) => ({ ...prev, users: 1 }));
					}}
					className="w-full sm:w-1/3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
					style={{ 
						border: '1px solid var(--color-secondary)', 
						background: 'var(--color-bg)', 
						color: 'var(--color-text)' 
					}}
				>
					<option value="asc">Ascending</option>
					<option value="desc">Descending</option>
				</select>
			</div>
		),
		[userSearch, userSortBy, userOrder, setPage]
	);

	return (
		<div className="p-6 rounded-xl shadow-lg transition-all duration-300" style={{ background: 'var(--color-secondary)' }}>
			{userSearchSection}
			<h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>Manage Users</h2>
			{(success || error) && (
				<div className="mb-4">
					{success && (
						<div className="border-l-4 p-4 rounded-lg shadow-md animate-fade-in" style={{ background: 'var(--color-accent)', borderColor: 'var(--color-primary)', color: 'var(--color-bg)' }}>
							<p className="text-sm font-medium">{success}</p>
						</div>
					)}
					{error && (
						<div className="border-l-4 p-4 rounded-lg shadow-md animate-fade-in" style={{ background: 'var(--color-secondary)', borderColor: 'var(--color-accent)', color: 'var(--color-text)' }}>
							<p className="text-sm font-medium">{error}</p>
						</div>
					)}
				</div>
			)}
			{loading ? (
				<Loader />
			) : (
				<>
					<div className="overflow-x-auto rounded-lg shadow-sm">
						<table className="min-w-full table-auto border-collapse" style={{ background: 'var(--color-secondary)' }}>
							<thead>
								<tr style={{ background: 'var(--color-bg)' }}>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Name</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Email</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Role</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Status</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{users.map((u) => (
									<tr
										key={u._id}
										className="border-t transition-colors duration-200 hover:bg-opacity-50"
										style={{ borderColor: 'var(--color-secondary)', background: 'var(--color-secondary)' }}
									>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>{u.name}</td>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>{u.email}</td>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>{u.role}</td>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
											<span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
												{u.isActive ? "Active" : "Inactive"}
											</span>
										</td>
										<td className="px-6 py-4 text-sm flex gap-3">
											<Link
												to={`../users/${u._id}`}
												className="px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm"
												style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
											>View</Link>
											<button
												onClick={() =>
													handleToggleUserActivation(u._id, u.isActive)
												}
												className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm ${u._id === user._id
													? "opacity-50 cursor-not-allowed"
													: ""
													}`}
												style={{ 
													background: u.isActive ? 'var(--color-accent)' : 'var(--color-primary)',
													color: 'var(--color-bg)'
												}}
												disabled={u._id === user._id}
											>
												{u.isActive ? "Deactivate" : "Activate"}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<Pagination
						currentPage={page.users}
						totalPages={totalPages.users}
						onPageChange={(newPage) => setPage((prev) => ({ ...prev, users: newPage }))}
					/>
				</>
			)}
		</div>
	);
}

function ItemsTab({ page, setPage, totalPages, setTotalPages, limit }) {
	const [items, setItems] = useState([]);
	const [itemSearch, setItemSearch] = useState("");
	const [itemSortBy, setItemSortBy] = useState("createdAt");
	const [itemOrder, setItemOrder] = useState("desc");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [keepers, setKeepers] = useState([]);
	const [selectedKeeperIds, setSelectedKeeperIds] = useState({});
	const shownToasts = useRef(new Set());

	const fetchItems = useCallback(async () => {
		setLoading(true);
		try {
			const [itemsResponse, keepersResponse] = await Promise.all([
				getAllItems({
					page: page.items,
					limit,
					search: itemSearch,
					sortBy: itemSortBy,
					order: itemOrder,
				}),
				getKeepers(),
			]);
			setItems(itemsResponse.data.items || []);
			setKeepers(keepersResponse.data.keepers || []);
			setTotalPages((prev) => ({
				...prev,
				items: itemsResponse.data.pagination?.totalPages || 1,
			}));
			setSelectedKeeperIds(
				itemsResponse.data.items.reduce((acc, item) => ({
					...acc,
					[item._id]: item.keeperId || "",
				}), {})
			);
		} catch (err) {
			const errorMsg = "Failed to load items: " + (err.response?.data?.message || err.message);
			if (!shownToasts.current.has(errorMsg)) {
				toast.error(errorMsg);
				shownToasts.current.add(errorMsg);
				setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
			}
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	}, [page.items, limit, itemSearch, itemSortBy, itemOrder, setTotalPages]);

	useEffect(() => {
		const debounceFetch = setTimeout(() => fetchItems(), 300);
		return () => clearTimeout(debounceFetch);
	}, [fetchItems]);

	useEffect(() => {
		if (success || error) {
			const timeout = setTimeout(() => {
				setSuccess("");
				setError("");
			}, 3000);
			return () => clearTimeout(timeout);
		}
	}, [success, error]);

	const handleToggleItemActivation = useCallback(async (itemId, isActive) => {
		if (window.confirm(`Are you sure you want to ${isActive ? "deactivate" : "activate"} this item?`)) {
			setLoading(true);
			try {
				await toggleItemActivation(itemId);
				setItems((prev) =>
					prev.map((i) => (i._id === itemId ? { ...i, isActive: !isActive } : i))
				);
				const successMsg = `Item ${!isActive ? "activated" : "deactivated"} successfully`;
				if (!shownToasts.current.has(successMsg)) {
					toast.success(successMsg);
					shownToasts.current.add(successMsg);
					setTimeout(() => shownToasts.current.delete(successMsg), 5000);
				}
				setSuccess(successMsg);
			} catch (err) {
				const errorMsg = "Failed to toggle item activation: " + (err.response?.data?.message || err.message);
				if (!shownToasts.current.has(errorMsg)) {
					toast.error(errorMsg);
					shownToasts.current.add(errorMsg);
					setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
				}
				setError(errorMsg);
			} finally {
				setLoading(false);
			}
		}
	}, []);

	const handleAssignKeeper = useCallback(async (itemId) => {
		const currentKeeperId = selectedKeeperIds[itemId];
		if (!currentKeeperId) {
			const errorMsg = "Please select a keeper";
			if (!shownToasts.current.has(errorMsg)) {
				toast.error(errorMsg);
				shownToasts.current.add(errorMsg);
				setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
			}
			setError(errorMsg);
			return;
		}
		setLoading(true);
		try {
			const selectedKeeper = keepers.find((k) => k._id === currentKeeperId);
			if (!selectedKeeper) {
				throw new Error("Selected keeper not found");
			}
			const keeperName = selectedKeeper.name;

			await assignKeeperToItem(itemId, { keeperId: currentKeeperId, keeperName });
			const successMsg = `Keeper ${keeperName} assigned to item ${itemId}`;
			if (!shownToasts.current.has(successMsg)) {
				toast.success(successMsg);
				shownToasts.current.add(successMsg);
				setTimeout(() => shownToasts.current.delete(successMsg), 5000);
			}
			setSuccess(successMsg);

			const updatedItemsResponse = await getAllItems({
				page: page.items,
				limit,
				search: itemSearch,
				sortBy: itemSortBy,
				order: itemOrder,
			});
			setItems(updatedItemsResponse.data.items || []);
			setSelectedKeeperIds((prev) => ({
				...prev,
				[itemId]: updatedItemsResponse.data.items.find((i) => i._id === itemId)?.keeperId || "",
			}));
		} catch (err) {
			const errorMsg = "Failed to assign keeper: " + (err.response?.data?.message || err.message);
			if (!shownToasts.current.has(errorMsg)) {
				toast.error(errorMsg);
				shownToasts.current.add(errorMsg);
				setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
			}
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	}, [selectedKeeperIds, keepers, page.items, limit, itemSearch, itemSortBy, itemOrder]);

	const handleKeeperChange = (itemId, event) => {
		setSelectedKeeperIds((prev) => ({
			...prev,
			[itemId]: event.target.value,
		}));
	};

	const itemSearchSection = useMemo(
		() => (
			<div className="mb-6 flex flex-col sm:flex-row gap-4 items-center p-4 rounded-lg shadow-sm" style={{ background: 'var(--color-secondary)' }}>
				<input
					type="text"
					placeholder="Search by title, description, or status..."
					value={itemSearch}
					onChange={(e) => {
						setItemSearch(e.target.value);
						setPage((prev) => ({ ...prev, items: 1 }));
					}}
					className="w-full sm:w-1/3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
					style={{ 
						border: '1px solid var(--color-secondary)', 
						background: 'var(--color-bg)', 
						color: 'var(--color-text)' 
					}}
				/>
				<select
					value={itemSortBy}
					onChange={(e) => {
						setItemSortBy(e.target.value);
						setPage((prev) => ({ ...prev, items: 1 }));
					}}
					className="w-full sm:w-1/3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
					style={{ 
						border: '1px solid var(--color-secondary)', 
						background: 'var(--color-bg)', 
						color: 'var(--color-text)' 
					}}
				>
					<option value="title">Title</option>
					<option value="status">Status</option>
					<option value="createdAt">Created At</option>
				</select>
				<select
					value={itemOrder}
					onChange={(e) => {
						setItemOrder(e.target.value);
						setPage((prev) => ({ ...prev, items: 1 }));
					}}
					className="w-full sm:w-1/3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
					style={{ 
						border: '1px solid var(--color-secondary)', 
						background: 'var(--color-bg)', 
						color: 'var(--color-text)' 
					}}
				>
					<option value="asc">Ascending</option>
					<option value="desc">Descending</option>
				</select>
			</div>
		),
		[itemSearch, itemSortBy, itemOrder, setPage]
	);

	return (
		<div className="p-6 rounded-xl shadow-lg transition-all duration-300" style={{ background: 'var(--color-secondary)' }}>
			{itemSearchSection}
			<h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>Manage Items</h2>
			{(success || error) && (
				<div className="mb-4">
					{success && (
						<div className="border-l-4 p-4 rounded-lg shadow-md animate-fade-in" style={{ background: 'var(--color-accent)', borderColor: 'var(--color-primary)', color: 'var(--color-bg)' }}>
							<p className="text-sm font-medium">{success}</p>
						</div>
					)}
					{error && (
						<div className="border-l-4 p-4 rounded-lg shadow-md animate-fade-in" style={{ background: 'var(--color-secondary)', borderColor: 'var(--color-accent)', color: 'var(--color-text)' }}>
							<p className="text-sm font-medium">{error}</p>
						</div>
					)}
				</div>
			)}
			{loading ? (
				<Loader />
			) : (
				<>
					<div className="overflow-x-auto rounded-lg shadow-sm">
						<table className="min-w-full table-auto border-collapse" style={{ background: 'var(--color-secondary)' }}>
							<thead>
								<tr style={{ background: 'var(--color-bg)' }}>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Title</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Status</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Posted By</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Category</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Active Status</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Keeper</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Claimed By</th>
									<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Actions</th>
								</tr>
							</thead>
							<tbody>
								{items.map((item) => (
									<tr
										key={item._id}
										className="border-t transition-colors duration-200 hover:bg-opacity-50"
										style={{ borderColor: 'var(--color-secondary)', background: 'var(--color-secondary)' }}
									>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>{item.title}</td>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>{item.status}</td>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
											{item.postedBy?.name || "Unknown"}
										</td>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
											{item.category?.name || "N/A"}
										</td>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
											<span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
												{item.isActive ? "Active" : "Inactive"}
											</span>
										</td>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
											{item.keeperName || "Not Assigned"}
										</td>
										<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
											{item.claimedByName || "Not Claimed"}
										</td>
										<td className="px-6 py-4 text-sm flex gap-3 flex-wrap">
											<Link
												to={`/items/${item._id}`}
												className="px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm"
												style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
											>
												View
											</Link>
											<button
												onClick={() =>
													handleToggleItemActivation(item._id, item.isActive)
												}
												className="px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm"
												style={{ 
													background: item.isActive ? 'var(--color-accent)' : 'var(--color-primary)',
													color: 'var(--color-bg)'
												}}
											>
												{item.isActive ? "Deactivate" : "Activate"}
											</button>
											<select
												value={selectedKeeperIds[item._id] || ""}
												onChange={(e) => handleKeeperChange(item._id, e)}
												className="p-2 border rounded-lg text-sm"
												style={{ 
													border: '1px solid var(--color-secondary)', 
													background: 'var(--color-bg)', 
													color: 'var(--color-text)' 
												}}
											>
												<option value="">Select Keeper</option>
												{keepers.map((k) => (
													<option key={k._id} value={k._id}>
														{k.name}
													</option>
												))}
											</select>
											<button
												onClick={() => handleAssignKeeper(item._id)}
												className="px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm"
												style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
											>
												Assign Keeper
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<Pagination
						currentPage={page.items}
						totalPages={totalPages.items}
						onPageChange={(newPage) =>
							setPage((prev) => ({ ...prev, items: newPage }))
						}
					/>
				</>
			)}
		</div>
	);
}

// Main AdminDashboard Component
function AdminDashboard() {
	const { user } = useContext(AuthContext);
	const { theme } = useTheme();
	const navigate = useNavigate(); // Added for redirection
	const [activeTab, setActiveTab] = useState("overview");
	const [stats, setStats] = useState({});
	const [keepers, setKeepers] = useState([]);
	const [conversations, setConversations] = useState([]);
	const [categories, setCategories] = useState([]);
	const [selectedConversation, setSelectedConversation] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const shownToasts = useRef(new Set());

	const [page, setPage] = useState({
		users: 1,
		items: 1,
		conversations: 1,
		categories: 1,
	});
	const [totalPages, setTotalPages] = useState({
		users: 1,
		items: 1,
		conversations: 1,
		categories: 1,
	});
	const limit = 10;

	const selectedCategory = useRef(null);
	const categoryCardRef = useRef(null);
	const [accountForm, setAccountForm] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		role: "admin",
	});
	const [categoryForm, setCategoryForm] = useState({
		name: "",
		description: "",
	});
	const [editCategoryForm, setEditCategoryForm] = useState({
		name: "",
		description: "",
		isActive: true,
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const alertTimeout = useRef(null);
	const messagesRef = useRef(null);

	useClickOutside(categoryCardRef, () => (selectedCategory.current = null));

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const [
				statsResponse,
				keepersResponse,
				conversationsResponse,
				categoriesResponse,
			] = await Promise.all([
				getDashboardStats(),
				getKeepers(),
				getConversations({ page: page.conversations, limit }),
				getAllCategoriesForAdmin({ page: page.categories, limit }),
			]);
			setStats(statsResponse.data.stats || {});
			setKeepers(keepersResponse.data.keepers || []);
			setConversations(conversationsResponse.data.conversations || []);
			setTotalPages((prev) => ({
				...prev,
				conversations: conversationsResponse.data.pagination?.totalPages || 1,
			}));
			setCategories(categoriesResponse.data.categories || []);
			setTotalPages((prev) => ({
				...prev,
				categories: categoriesResponse.data.pagination?.totalPages || 1,
			}));
		} catch (err) {
			const errorMsg = "Failed to load data: " + (err.response?.data?.message || err.message);
			if (!shownToasts.current.has(errorMsg)) {
				toast.error(errorMsg);
				shownToasts.current.add(errorMsg);
				setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
			}
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	}, [page.conversations, page.categories, limit]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		if (success || error) {
			const timeout = setTimeout(() => {
				setSuccess("");
				setError("");
			}, 3000);
			return () => clearTimeout(timeout);
		}
	}, [success, error]);

	const handleCreateAccount = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		if (
			!accountForm.name ||
			!accountForm.email ||
			!accountForm.password ||
			!accountForm.confirmPassword
		) {
			const errorMsg = "Please fill in all fields";
			if (!shownToasts.current.has(errorMsg)) {
				toast.error(errorMsg);
				shownToasts.current.add(errorMsg);
				setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
			}
			setError(errorMsg);
			setLoading(false);
			return;
		}

		if (accountForm.password !== accountForm.confirmPassword) {
			const errorMsg = "Passwords do not match";
			if (!shownToasts.current.has(errorMsg)) {
				toast.error(errorMsg);
				shownToasts.current.add(errorMsg);
				setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
			}
			setError(errorMsg);
			setLoading(false);
			return;
		}

		try {
			const response = await register({
				name: accountForm.name,
				email: accountForm.email,
				password: accountForm.password,
				role: accountForm.role,
			});
			const successMsg = `Account creation initiated for ${response.data.email}. An OTP has been sent to the email for verification.`;
			if (!shownToasts.current.has(successMsg)) {
				toast.success(successMsg);
				shownToasts.current.add(successMsg);
				setTimeout(() => shownToasts.current.delete(successMsg), 5000);
			}
			setSuccess(successMsg);
			setAccountForm({
				name: "",
				email: "",
				password: "",
				confirmPassword: "",
				role: "admin",
			});
			// Redirect to OTP verification page
			navigate(`/verify-otp?email=${encodeURIComponent(accountForm.email)}`);
		} catch (err) {
			const errorMsg = "Failed to create account: " + (err.response?.data?.message || err.message);
			if (!shownToasts.current.has(errorMsg)) {
				toast.error(errorMsg);
				shownToasts.current.add(errorMsg);
				setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
			}
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const handleAddCategory = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const response = await addCategory(categoryForm);
			setCategories([...categories, response.data.category]);
			const successMsg = `Category added successfully: ${response.data.category.name}`;
			if (!shownToasts.current.has(successMsg)) {
				toast.success(successMsg);
				shownToasts.current.add(successMsg);
				setTimeout(() => shownToasts.current.delete(successMsg), 5000);
			}
			setSuccess(successMsg);
			setCategoryForm({ name: "", description: "" });
		} catch (err) {
			const errorMsg = "Failed to add category: " + (err.response?.data?.message || err.message);
			if (!shownToasts.current.has(errorMsg)) {
				toast.error(errorMsg);
				shownToasts.current.add(errorMsg);
				setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
			}
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const handleEditCategory = (category) => {
		selectedCategory.current = category;
		setEditCategoryForm({ ...category });
	};

	const handleUpdateCategory = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const response = await updateCategory(
				selectedCategory.current._id,
				editCategoryForm
			);
			setCategories(
				categories.map((cat) =>
					cat._id === selectedCategory.current._id ? response.data.category : cat
				)
			);
			const successMsg = `Category updated successfully: ${response.data.category.name}`;
			if (!shownToasts.current.has(successMsg)) {
				toast.success(successMsg);
				shownToasts.current.add(successMsg);
				setTimeout(() => shownToasts.current.delete(successMsg), 5000);
			}
			setSuccess(successMsg);
			selectedCategory.current = null;
		} catch (err) {
			const errorMsg = "Failed to update category: " + (err.response?.data?.message || err.message);
			if (!shownToasts.current.has(errorMsg)) {
				toast.error(errorMsg);
				shownToasts.current.add(errorMsg);
				setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
			}
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteCategory = async (categoryId) => {
		if (window.confirm("Are you sure you want to deactivate this category?")) {
			setLoading(true);
			try {
				await deleteCategory(categoryId);
				setCategories(categories.filter((cat) => cat._id !== categoryId));
				const successMsg = "Category deactivated successfully";
				if (!shownToasts.current.has(successMsg)) {
					toast.success(successMsg);
					shownToasts.current.add(successMsg);
					setTimeout(() => shownToasts.current.delete(successMsg), 5000);
				}
				setSuccess(successMsg);
			} catch (err) {
				const errorMsg = "Failed to deactivate category: " + (err.response?.data?.message || err.message);
				if (!shownToasts.current.has(errorMsg)) {
					toast.error(errorMsg);
					shownToasts.current.add(errorMsg);
					setTimeout(() => shownToasts.current.delete(errorMsg), 5000);
				}
				setError(errorMsg);
			} finally {
				setLoading(false);
			}
		}
	};

	const handleConversationClick = (conversation) => {
		setSelectedConversation(conversation);
	};

	useEffect(() => {
		if (messagesRef.current && selectedConversation) {
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
		}
	}, [selectedConversation, selectedConversation?.messages]);

	const togglePasswordVisibility = () => setShowPassword(!showPassword);
	const toggleConfirmPasswordVisibility = () =>
		setShowConfirmPassword(!showConfirmPassword);

	return (
		<div className="container mx-auto p-6 min-h-screen transition-all duration-300" style={{ background: 'var(--color-bg)' }}>
			<h1 className="text-3xl font-bold mb-8 text-center animate-fade-in-down" style={{ color: 'var(--color-text)' }}>
				Admin Dashboard
			</h1>

			{(success || error) && (
				<div className="fixed top-6 right-6 z-50 w-full max-w-sm">
					{success && (
						<div className="p-4 rounded-lg shadow-md animate-fade-in" style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>
							<p className="text-sm font-medium">{success}</p>
						</div>
					)}
					{error && (
						<div className="p-4 rounded-lg shadow-md animate-fade-in" style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>
							<p className="text-sm font-medium">{error}</p>
						</div>
					)}
				</div>
			)}

			<div className="flex flex-wrap gap-3 mb-8 border-b pb-2" style={{ borderColor: 'var(--color-secondary)' }}>
				{[
					"overview",
					"users",
					"items",
					"keepers",
					"conversations",
					"categories",
					"create-account",
				].map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`py-2 px-5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === tab
							? "shadow-md"
							: "hover:bg-gray-300 hover:text-gray-800"
							}`}
						style={activeTab === tab
							? { background: 'var(--color-primary)', color: 'var(--color-bg)' }
							: { background: 'var(--color-secondary)', color: 'var(--color-text)' }
						}
					>
						{tab
							.split("-")
							.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
							.join(" ")}
					</button>
				))}
			</div>

			{loading ? (
				<Loader />
			) : (
				<div className="space-y-6">
					{activeTab === "overview" && (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{Object.entries(stats).map(([key, value]) => {
								if (key === "mostActiveUsers") return null;
								return (
									<div
										key={key}
										className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
										style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
									>
										<h2 className="text-xl font-semibold mb-4 capitalize" style={{ color: 'var(--color-text)' }}>
											{key.replace(/([A-Z])/g, " $1").trim()}
										</h2>
										<p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{value}</p>
									</div>
								);
							})}
							<div className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 col-span-1 sm:col-span-2 lg:col-span-3" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
								<h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
									Most Active Users
								</h2>
								{stats.mostActiveUsers?.length > 0 ? (
									<ul className="space-y-3">
										{stats.mostActiveUsers.map((activeUser) => (
											<li
												key={activeUser.userId}
												className="flex justify-between items-center p-3 rounded-lg transition-colors duration-200"
												style={{ background: 'var(--color-bg)' }}
											>
												<span className="text-sm" style={{ color: 'var(--color-text)' }}>
													{activeUser.name} ({activeUser.email})
												</span>
												<span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
													{activeUser.itemCount} items
												</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-sm" style={{ color: 'var(--color-text)' }}>No active users yet.</p>
								)}
							</div>
						</div>
					)}

					{activeTab === "users" && (
						<UsersTab
							user={user}
							page={page}
							setPage={setPage}
							totalPages={totalPages}
							setTotalPages={setTotalPages}
							limit={limit}
						/>
					)}

					{activeTab === "items" && (
						<ItemsTab
							page={page}
							setPage={setPage}
							totalPages={totalPages}
							setTotalPages={setTotalPages}
							limit={limit}
						/>
					)}

					{activeTab === "keepers" && (
						<div className="p-6 rounded-xl shadow-lg transition-all duration-300" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
							<h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
								Manage Keepers
							</h2>
							<div className="overflow-x-auto rounded-lg shadow-sm">
								<table className="min-w-full table-auto border-collapse" style={{ background: 'var(--color-secondary)' }}>
									<thead style={{ background: 'var(--color-bg)' }}>
										<tr>
											<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Name</th>
											<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Email</th>
										</tr>
									</thead>
									<tbody>
										{keepers.map((keeper) => (
											<tr
												key={keeper._id}
												className="border-t transition-colors duration-200"
												style={{ borderColor: 'var(--color-secondary)' }}
											>
												<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
													{keeper.name}
												</td>
												<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
													{keeper.email}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{activeTab === "conversations" && (
						<div className="p-6 rounded-xl shadow-lg transition-all duration-300" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
							<h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
								Manage Conversations
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
										Conversations
									</h3>
									<ul className="space-y-3 max-h-80 overflow-y-auto p-4 rounded-lg shadow-inner" style={{ background: 'var(--color-bg)' }}>
										{conversations.map((conv) => (
											<li
												key={conv._id}
												onClick={() => handleConversationClick(conv)}
												className={`p-3 rounded-lg cursor-pointer text-sm transition-colors duration-200 ${
													selectedConversation?._id === conv._id
														? ""
														: ""
												}`}
												style={{
													background: selectedConversation?._id === conv._id ? 'var(--color-primary)' : 'var(--color-secondary)',
													color: selectedConversation?._id === conv._id ? 'var(--color-bg)' : 'var(--color-text)'
												}}
											>
												{conv.item?.title} ({conv.item?.status}) -{" "}
												{conv.participants.map((p) => p.name).join(", ")}
												<p className="text-xs mt-1" style={{ color: selectedConversation?._id === conv._id ? 'var(--color-bg)' : 'var(--color-text)' }}>
													Last Message: {conv.lastMessage?.content || "No messages yet"} (
													{new Date(
														conv.lastMessage?.createdAt || 0
													).toLocaleString()}
													)
												</p>
											</li>
										))}
									</ul>
									<div className="flex justify-center items-center gap-4 mt-6">
										<button
											onClick={() =>
												setPage((prev) => ({
													...prev,
													conversations: Math.max(prev.conversations - 1, 1),
												}))
											}
											disabled={page.conversations === 1}
											className="px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 shadow-sm"
											style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
										>
											Previous
										</button>
										<span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
											Page {page.conversations} of {totalPages.conversations}
										</span>
										<button
											onClick={() =>
												setPage((prev) => ({
													...prev,
													conversations: Math.min(
														prev.conversations + 1,
														totalPages.conversations
													),
												}))
											}
											disabled={page.conversations === totalPages.conversations}
											className="px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 shadow-sm"
											style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
										>
											Next
										</button>
									</div>
								</div>
								<div>
									<h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
										Messages
									</h3>
									{selectedConversation ? (
										<div
											ref={messagesRef}
											className="border rounded-lg p-4 h-80 overflow-y-auto shadow-inner"
											style={{ background: 'var(--color-bg)', borderColor: 'var(--color-secondary)' }}
										>
											{selectedConversation.messages.map((msg) => (
												<div
													key={msg._id}
													className="mb-3 p-3 rounded-lg shadow-sm"
													style={{ background: 'var(--color-secondary)' }}
												>
													<p className="text-xs" style={{ color: 'var(--color-text)' }}>
														{msg.sender?.name} (
														{new Date(msg.createdAt).toLocaleString()}):
													</p>
													<p className="text-sm mt-1" style={{ color: 'var(--color-text)' }}>{msg.content}</p>
												</div>
											))}
										</div>
									) : (
										<p className="text-sm p-4 rounded-lg shadow-inner" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
											Select a conversation to view messages.
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{activeTab === "categories" && (
						<div className="p-6 rounded-xl shadow-lg transition-all duration-300" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
							<div className="mb-6 p-6 rounded-lg shadow-sm" style={{ background: 'var(--color-bg)' }}>
								<h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
									Add New Category
								</h3>
								<form onSubmit={handleAddCategory} className="space-y-4">
									<div>
										<label
											htmlFor="category-name"
											className="block text-sm font-medium"
											style={{ color: 'var(--color-text)' }}
										>
											Name
										</label>
										<input
											id="category-name"
											type="text"
											value={categoryForm.name}
											onChange={(e) =>
												setCategoryForm({
													...categoryForm,
													name: e.target.value,
												})
											}
											className="mt-1 block w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
											style={{ 
												border: '1px solid var(--color-secondary)', 
												background: 'var(--color-bg)', 
												color: 'var(--color-text)' 
											}}
											required
										/>
									</div>
									<div>
										<label
											htmlFor="category-description"
											className="block text-sm font-medium"
											style={{ color: 'var(--color-text)' }}
										>
											Description
										</label>
										<textarea
											id="category-description"
											value={categoryForm.description}
											onChange={(e) =>
												setCategoryForm({
													...categoryForm,
													description: e.target.value,
												})
											}
											className="mt-1 block w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
											style={{ 
												border: '1px solid var(--color-secondary)', 
												background: 'var(--color-bg)', 
												color: 'var(--color-text)' 
											}}
											rows="3"
										/>
									</div>
									<button
										type="submit"
										className="w-full py-3 rounded-lg text-sm transition-colors duration-200 shadow-sm disabled:opacity-50"
										style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
										disabled={loading}
									>
										{loading ? "Adding..." : "Add Category"}
									</button>
								</form>
							</div>
							<div>
								<h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
									Available Categories
								</h3>
								{categories.length > 0 ? (
									<div className="overflow-x-auto rounded-lg shadow-sm">
										<table className="min-w-full table-auto border-collapse" style={{ background: 'var(--color-secondary)' }}>
											<thead style={{ background: 'var(--color-bg)' }}>
												<tr>
													<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Name</th>
													<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Description</th>
													<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Status</th>
													<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Created At</th>
													<th className="px-6 py-4 border-b text-left text-sm font-semibold" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>Actions</th>
												</tr>
											</thead>
											<tbody>
												{categories.map((category) => (
													<tr
														key={category._id}
														className="border-t transition-colors duration-200"
														style={{ borderColor: 'var(--color-secondary)' }}
													>
														<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
															{category.name}
														</td>
														<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
															{category.description || "N/A"}
														</td>
														<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
															<span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
																{category.isActive ? "Active" : "Inactive"}
															</span>
														</td>
														<td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text)' }}>
															{new Date(category.createdAt).toLocaleDateString()}
														</td>
														<td className="px-6 py-4 text-sm flex gap-3">
															<button
																onClick={() => handleEditCategory(category)}
																className="px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm"
																style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
															>
																Edit
															</button>
															<button
																onClick={() => handleDeleteCategory(category._id)}
																className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm ${
																	!category.isActive
																		? "opacity-50 cursor-not-allowed"
																		: ""
																	}`}
																style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
																disabled={!category.isActive}
															>
																Deactivate
															</button>
														</td>
													</tr>
												))}
											</tbody>
										</table>
										<div className="flex justify-center items-center gap-4 mt-6">
											<button
												onClick={() =>
													setPage((prev) => ({
														...prev,
														categories: Math.max(prev.categories - 1, 1),
													}))
												}
												disabled={page.categories === 1}
												className="px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 shadow-sm"
												style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
											>
												Previous
											</button>
											<span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
												Page {page.categories} of {totalPages.categories}
											</span>
											<button
												onClick={() =>
													setPage((prev) => ({
														...prev,
														categories: Math.min(
															prev.categories + 1,
															totalPages.categories
														),
													}))
												}
												disabled={page.categories === totalPages.categories}
												className="px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 shadow-sm"
												style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
											>
												Next
											</button>
										</div>
									</div>
								) : (
									<p className="text-sm p-4 rounded-lg shadow-inner" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
										No categories available.
									</p>
								)}
							</div>
						</div>
					)}

					{selectedCategory.current && (
						<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
							<div
								ref={categoryCardRef}
								className="p-6 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 hover:scale-100"
								style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
							>
								<h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
									Edit Category
								</h3>
								<form onSubmit={handleUpdateCategory} className="space-y-4">
									<div>
										<label
											htmlFor="edit-category-name"
											className="block text-sm font-medium"
											style={{ color: 'var(--color-text)' }}
										>
											Name
										</label>
										<input
											id="edit-category-name"
											type="text"
											value={editCategoryForm.name}
											onChange={(e) =>
												setEditCategoryForm({
													...editCategoryForm,
													name: e.target.value,
												})
											}
											className="mt-1 block w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
											style={{ 
												border: '1px solid var(--color-secondary)', 
												background: 'var(--color-bg)', 
												color: 'var(--color-text)' 
											}}
											required
										/>
									</div>
									<div>
										<label
											htmlFor="edit-category-description"
											className="block text-sm font-medium"
											style={{ color: 'var(--color-text)' }}
										>
											Description
										</label>
										<textarea
											id="edit-category-description"
											value={editCategoryForm.description}
											onChange={(e) =>
												setEditCategoryForm({
													...editCategoryForm,
													description: e.target.value,
												})
											}
											className="mt-1 block w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
											style={{ 
												border: '1px solid var(--color-secondary)', 
												background: 'var(--color-bg)', 
												color: 'var(--color-text)' 
											}}
											rows="3"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
											Status
										</label>
										<div className="flex space-x-6">
											<label className="flex items-center">
												<input
													type="radio"
													name="isActive"
													value="true"
													checked={editCategoryForm.isActive === true}
													onChange={() =>
														setEditCategoryForm({
															...editCategoryForm,
															isActive: true,
														})
													}
													className="mr-2 text-blue-600 focus:ring-blue-400"
												/>
												<span className="text-sm" style={{ color: 'var(--color-text)' }}>Active</span>
											</label>
											<label className="flex items-center">
												<input
													type="radio"
													name="isActive"
													value="false"
													checked={editCategoryForm.isActive === false}
													onChange={() =>
														setEditCategoryForm({
															...editCategoryForm,
															isActive: false,
														})
													}
													className="mr-2 text-blue-600 focus:ring-blue-400"
												/>
												<span className="text-sm" style={{ color: 'var(--color-text)' }}>Inactive</span>
											</label>
										</div>
									</div>
									<div className="flex justify-end gap-4 mt-6">
										<button
											type="submit"
											className="px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm disabled:opacity-50"
											style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
											disabled={loading}
										>
											{loading ? "Updating..." : "Update Category"}
										</button>
										<button
											type="button"
											onClick={() => (selectedCategory.current = null)}
											className="px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm"
											style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
										>
											Cancel
										</button>
									</div>
								</form>
							</div>
						</div>
					)}

					{activeTab === "create-account" && (
						<div className="p-6 rounded-xl shadow-lg transition-all duration-300 max-w-lg mx-auto" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
							<h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
								Create Admin/Keeper Account
							</h2>
							<form onSubmit={handleCreateAccount} className="space-y-6">
								<div>
									<label
										htmlFor="name"
										className="block text-sm font-medium"
										style={{ color: 'var(--color-text)' }}
									>
										Name
									</label>
									<input
										id="name"
										type="text"
										value={accountForm.name}
										onChange={(e) =>
											setAccountForm({ ...accountForm, name: e.target.value })
										}
										className="mt-1 block w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50"
										style={{ 
											border: '1px solid var(--color-secondary)', 
											background: 'var(--color-bg)', 
											color: 'var(--color-text)' 
										}}
										required
										disabled={loading}
									/>
								</div>
								<div>
									<label
										htmlFor="email"
										className="block text-sm font-medium"
										style={{ color: 'var(--color-text)' }}
									>
										Email
									</label>
									<input
										id="email"
										type="email"
										value={accountForm.email}
										onChange={(e) =>
											setAccountForm({ ...accountForm, email: e.target.value })
										}
										className="mt-1 block w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50"
										style={{ 
											border: '1px solid var(--color-secondary)', 
											background: 'var(--color-bg)', 
											color: 'var(--color-text)' 
										}}
										required
										disabled={loading}
									/>
								</div>
								<div className="relative">
									<label
										htmlFor="password"
										className="block text-sm font-medium"
										style={{ color: 'var(--color-text)' }}
									>
										Password
									</label>
									<input
										id="password"
										type={showPassword ? "text" : "password"}
										value={accountForm.password}
										onChange={(e) =>
											setAccountForm({
												...accountForm,
												password: e.target.value,
											})
										}
										className="mt-1 block w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50 pr-12"
										style={{ 
											border: '1px solid var(--color-secondary)', 
											background: 'var(--color-bg)', 
											color: 'var(--color-text)' 
										}}
										required
										disabled={loading}
									/>
									<button
										type="button"
										onClick={togglePasswordVisibility}
										className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full focus:outline-none mt-4"
										style={{ color: 'var(--color-accent)' }}
										disabled={loading}
									>
										{showPassword ? (
											<FaEyeSlash className="h-5 w-5" />
										) : (
											<FaEye className="h-5 w-5" />
										)}
									</button>
								</div>
								<div className="relative">
									<label
										htmlFor="confirm-password"
										className="block text-sm font-medium"
										style={{ color: 'var(--color-text)' }}
									>
										Confirm Password
									</label>
									<input
										id="confirm-password"
										type={showConfirmPassword ? "text" : "password"}
										value={accountForm.confirmPassword}
										onChange={(e) =>
											setAccountForm({
												...accountForm,
												confirmPassword: e.target.value,
											})
										}
										className="mt-1 block w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50 pr-12"
										style={{ 
											border: '1px solid var(--color-secondary)', 
											background: 'var(--color-bg)', 
											color: 'var(--color-text)' 
										}}
										required
										disabled={loading}
									/>
									<button
										type="button"
										onClick={toggleConfirmPasswordVisibility}
										className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full focus:outline-none mt-4"
										style={{ color: 'var(--color-accent)' }}
										disabled={loading}
									>
										{showConfirmPassword ? (
											<FaEyeSlash className="h-5 w-5" />
										) : (
											<FaEye className="h-5 w-5" />
										)}
									</button>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
										Role
									</label>
									<div className="flex space-x-6">
										<label className="flex items-center">
											<input
												type="radio"
												name="role"
												value="admin"
												checked={accountForm.role === "admin"}
												onChange={(e) =>
													setAccountForm({
														...accountForm,
														role: e.target.value,
													})
												}
												className="mr-2 text-blue-600 focus:ring-blue-400 disabled:opacity-50"
												disabled={loading}
											/>
											<span className="text-sm" style={{ color: 'var(--color-text)' }}>Admin</span>
										</label>
										<label className="flex items-center">
											<input
												type="radio"
												name="role"
												value="keeper"
												checked={accountForm.role === "keeper"}
												onChange={(e) =>
													setAccountForm({
														...accountForm,
														role: e.target.value,
													})
												}
												className="mr-2 text-blue-600 focus:ring-blue-400 disabled:opacity-50"
												disabled={loading}
											/>
											<span className="text-sm" style={{ color: 'var(--color-text)' }}>Keeper</span>
										</label>
									</div>
								</div>
								<button
									type="submit"
									className={`w-full py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 shadow-md ${
										loading
											? "opacity-50 cursor-not-allowed"
											: ""
										}`}
									style={{ 
										background: loading ? 'var(--color-secondary)' : 'var(--color-primary)',
										color: 'var(--color-bg)'
									}}
									disabled={loading}
								>
									{loading ? (
										<span className="flex items-center justify-center">
											<svg
												className="animate-spin h-5 w-5 mr-2 text-white"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												></circle>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											Creating...
										</span>
									) : (
										"Create Account"
									)}
								</button>
							</form>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default AdminDashboard;