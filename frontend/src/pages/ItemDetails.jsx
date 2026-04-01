import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaSearch, FaImage } from "react-icons/fa";
import {
  getItemDetails,
  claimItem,
  approveClaimRequest,
  rejectClaimRequest,
  updateItem,
  assignKeeperToItem,
  confirmHandoff,
  deleteUserItem,
  confirmMeeting,
  keeperApproveHandoff,
} from "../services/itemService";
import { getCategories } from "../services/categoryService";
import { startConversation } from "../services/conversationService";
import { toast } from "react-toastify";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>Something went wrong: {this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ItemDetails() {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimLoading, setClaimLoading] = useState(false); // Separate loading for claim
  const [conversationLoading, setConversationLoading] = useState(false); // Separate loading for conversation
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    category: "",
    status: "",
    location: "",
    image: null,
  });
  const [removeImage, setRemoveImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const fetchItem = React.useCallback(async () => {
    console.log("Fetching item - id:", id, "user:", user);
    if (!id) {
      console.warn("No id provided for fetch");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log("Sending request to getItemDetails with id:", id);
      const response = await getItemDetails(id);
      console.log("Received response from getItemDetails:", response.data);
      setItem(response.data.item || {});
      setEditFormData({
        title: response.data.item?.title || "",
        description: response.data.item?.description || "",
        category: response.data.item?.category?.name || "",
        status: response.data.item?.status || "",
        location: response.data.item?.location || "",
        image: null,
      });
    } catch (err) {
      console.error(
        "Fetch error:",
        err.message,
        "Response:",
        err.response?.data
      );
      toast.error(
        "Failed to load item: " + (err.response?.data?.message || err.message)
      );
      setItem({});
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await getCategories();
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  useEffect(() => {
    console.log("Initial useEffect running - id:", id, "user:", user);
    fetchItem();
    fetchCategories();
  }, [id, user, fetchItem, fetchCategories]);

  useEffect(() => {
    console.log(
      "Secondary useEffect running - id:",
      id,
      "loading:",
      loading,
      "item:",
      item
    );
    if (!loading && !item) {
      fetchItem();
    }
  }, [loading, item, fetchItem, id]);

  const handleManualFetch = () => {
    console.log("Manual fetch triggered with id:", id);
    fetchItem();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditChange = (e) => {
    const { name, value, files, type } = e.target;
    if (name === "image" && type === "file") {
      setEditFormData((prev) => ({ ...prev, image: files[0] }));
    } else if (name === "removeImage") {
      setRemoveImage(e.target.checked);
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setClaimLoading(true); // Use claimLoading for edit action
    const data = new FormData();
    data.append("title", editFormData.title);
    data.append("description", editFormData.description);
    data.append("category", editFormData.category);
    data.append("status", editFormData.status);
    data.append("location", editFormData.location);
    if (editFormData.image) {
      data.append("image", editFormData.image);
    } else if (removeImage) {
      data.append("image", "");
    }

    try {
      await updateItem(id, data);
      setIsEditing(false);
      await fetchItem();
      toast.success("Item updated successfully");
    } catch (err) {
      toast.error(
        "Failed to update item: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setClaimLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setClaimLoading(true);
      try {
        await deleteUserItem(id);
        toast.success("Item deleted successfully");
        navigate("/dashboard");
      } catch (err) {
        toast.error(
          "Failed to delete item: " + (err.response?.data?.message || err.message)
        );
      } finally {
        setClaimLoading(false);
      }
    }
  };

  const handleClaim = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setClaimLoading(true);
    try {
      await claimItem(id);
      await fetchItem();
      toast.success("Item claimed successfully! The owner will be notified.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(
        "Failed to claim item: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setClaimLoading(false);
    }
  };

  const handleStartConversation = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setConversationLoading(true);
    try {
      const participants = [user.id, item?.postedBy?._id];
      console.log(
        "Starting conversation with participants:",
        participants,
        "and itemId:",
        id
      );
      const response = await startConversation({ itemId: id, participants });
      console.log("Conversation API response:", response.data);
      if (
        response.data &&
        response.data.conversation &&
        response.data.conversation._id
      ) {
        navigate(`/messages/${response.data.conversation._id}`);
      } else if (response.status === 200 && response.data.conversation) {
        navigate(`/messages/${response.data.conversation._id}`);
      } else {
        throw new Error(
          "Invalid conversation response: _id not found in conversation object"
        );
      }
      toast.success("Conversation started successfully");
    } catch (err) {
      console.error(
        "Conversation error:",
        err.response ? err.response.data : err.message
      );
      toast.error(
        "Failed to start conversation: " +
        (err.response?.data?.message ||
          err.message ||
          "Unknown server error. Please try again later.")
      );
    } finally {
      setConversationLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const itemUrl = `${window.location.origin}${location.pathname}`;
      await navigator.clipboard.writeText(itemUrl);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link to clipboard: " + err.message);
    }
  };

  const handleAssignKeeper = async () => {
    if (!user || user.role !== "keeper") return;
    setClaimLoading(true);
    try {
      const payload = { keeperId: user.id, keeperName: user.name };
      await assignKeeperToItem(id, payload);
      await fetchItem();
      toast.success("Assigned as keeper successfully");
    } catch (err) {
      toast.error(
        "Failed to assign keeper: " +
        (err.response?.data?.message || err.message)
      );
    } finally {
      setClaimLoading(false);
    }
  };

  const handleConfirmHandoff = async () => {
    if (!window.confirm("Are you sure you want to confirm this handoff? This will mark the item as returned.")) return;
    setClaimLoading(true);
    try {
      await confirmHandoff(id);
      await fetchItem();
      toast.success("Handoff confirmed successfully! Item marked as returned.");
    } catch (err) {
      toast.error(
        "Failed to confirm handoff: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setClaimLoading(false);
    }
  };

  const handleConfirmMeeting = async () => {
    setClaimLoading(true);
    try {
      await confirmMeeting(id);
      await fetchItem();
      toast.success("Meeting confirmed successfully!");
    } catch(err) {
      toast.error("Failed to confirm meeting: " + (err.response?.data?.message || err.message));
    } finally {
      setClaimLoading(false);
    }
  };

  const handleApproveHandoff = async () => {
    setClaimLoading(true);
    try {
      await keeperApproveHandoff(id);
      await fetchItem();
      toast.success("Handoff approved! Item is now returned.");
    } catch(err) {
      toast.error("Failed to approve handoff: " + (err.response?.data?.message || err.message));
    } finally {
      setClaimLoading(false);
    }
  };

  const handleApproveClaim = async () => {
    setClaimLoading(true);
    try {
      await approveClaimRequest(id);
      await fetchItem();
      toast.success("Claim approved! You can now proceed to handoff.");
    } catch (err) {
      toast.error("Failed to approve claim: " + (err.response?.data?.message || err.message));
    } finally {
      setClaimLoading(false);
    }
  };

  const handleRejectClaim = async () => {
    if (!window.confirm("Are you sure you want to reject this claim?")) return;
    setClaimLoading(true);
    try {
      await rejectClaimRequest(id);
      await fetchItem();
      toast.success("Claim rejected. The item is available again.");
    } catch (err) {
      toast.error("Failed to reject claim: " + (err.response?.data?.message || err.message));
    } finally {
      setClaimLoading(false);
    }
  };

  const isOwner = user && String(user.id) === String(item?.postedBy?._id);
  const isKeeper = user && String(user.id) === String(item?.keeperId);
  const isAdminOrKeeper = user && (user.role === 'admin' || user.role === 'keeper');
  // const isClaimant = user && user.id === item?.claimedById;
  const isPosterOrKeeper =
    user &&
    (String(user.id) === String(item?.postedBy?._id) ||
      String(user.id) === String(item?.keeperId));

  if (loading) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-lg animate-pulse" style={{ color: 'var(--color-text)' }}>Loading...</p>
      </div>
    );
  }

  if (!item || Object.keys(item).length === 0) {
    return (
      <div className="container mx-auto p-6 min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
          Item not found or failed to load.
        </p>
        <button
          onClick={handleManualFetch}
          className="ml-4 py-2 px-4 rounded-md transition-colors duration-200 text-sm font-medium"
          style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
        >
          Retry Fetch
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 border-b-2 pb-2" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>
            {item.title}
          </h1>

          {!isEditing ? (
            <div className="rounded-lg shadow-lg p-6" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
              <div className="mb-6">
                {item.image ? (
                  <div
                    className="relative w-full h-64 rounded-lg overflow-hidden shadow-md cursor-pointer"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-sm font-medium">
                        Click to enlarge
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center group hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 ease-in-out">
                    <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-white bg-opacity-80 backdrop-blur-sm shadow-sm group-hover:shadow-md transition-all duration-300">
                      <div className="relative">
                        <FaSearch className="text-gray-400 text-4xl group-hover:text-blue-400 transition-colors duration-300" />
                        <FaImage className="text-gray-300 text-2xl absolute -bottom-1 -right-1 group-hover:text-blue-300 transition-colors duration-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 text-sm font-medium group-hover:text-gray-600 transition-colors duration-300">
                          No image available
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4 border-b pb-2" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>
                    Item Details
                  </h2>
                  <div className="space-y-3">
                    <p style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                        Description:
                      </span>{" "}
                      {item.description}
                    </p>
                    <p style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>Status:</span>{" "}
                      <span className={`status-badge ${item.status?.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </p>
                    <p style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>Category:</span>{" "}
                      {item.category?.name || "N/A"}
                    </p>
                    <p style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>Location:</span>{" "}
                      {item.location}
                    </p>
                    {item.coordinates && item.coordinates.lat && item.coordinates.lng && (
                      <p style={{ color: 'var(--color-text)' }}>
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>Map:</span>{" "}
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${item.coordinates.lat},${item.coordinates.lng}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 underline flex items-center gap-1 inline-flex"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          View exact coordinates
                        </a>
                      </p>
                    )}
                    <p style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>Posted by:</span>{" "}
                      {item.postedBy?.name || "Unknown"}
                    </p>
                    <p style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>Posted on:</span>{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <p style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>Keeper:</span>{" "}
                      {item.keeperName || "Not assigned"}
                    </p>
                    <p style={{ color: 'var(--color-text)' }}>
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>Claimed by:</span>{" "}
                      {item.claimedByName || "Not claimed"}
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 border-b pb-2" style={{ color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>
                    Actions
                  </h2>
                  <div className="space-y-4">
                    {isOwner ? (
                      <div className="space-y-3">
                        <button
                          onClick={handleEdit}
                          className="w-full py-2 px-4 rounded-md transition-colors duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                          style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
                        >
                          Edit item
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Claim item section for non-owners/non-keepers only when the item is marked as "Found" */}
                        {!isOwner && !isKeeper && item?.status === "Found" && (
                          <button
                            onClick={handleClaim}
                            disabled={claimLoading || item.status === "Claimed"}
                            className={`w-full py-2 px-4 rounded-md text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 ${claimLoading || item.status === "Claimed"
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                              }`}
                            style={{
                              background: claimLoading || item.status === "Claimed" ? '#6b7280' : 'var(--color-primary)',
                              color: claimLoading || item.status === "Claimed" ? '#ffffff' : 'var(--color-bg)'
                            }}
                          >
                            {claimLoading
                              ? "Processing..."
                              : item.status === "Claimed"
                                ? "Already claimed"
                                : "Claim item"}
                          </button>
                        )}
                        <button
                          onClick={handleStartConversation}
                          disabled={conversationLoading}
                          className={`w-full py-2 px-4 rounded-md text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 ${conversationLoading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                            }`}
                          style={{
                            background: conversationLoading ? 'var(--color-secondary)' : 'var(--color-primary)',
                            color: 'var(--color-bg)'
                          }}
                        >
                          {conversationLoading ? "Processing..." : "Message owner"}
                        </button>
                        {isAdminOrKeeper && (
                          <button
                            onClick={handleDelete}
                            disabled={claimLoading}
                            className="w-full py-2 px-4 rounded-md transition-colors duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                            style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
                          >
                            Delete item
                          </button>
                        )}
                      </div>
                    )}
                    {user && user.role === "keeper" && !item.keeperId && (
                      <div className="space-y-3">
                        <button
                          onClick={handleAssignKeeper}
                          disabled={claimLoading}
                          className={`w-full py-2 px-4 rounded-md text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 ${claimLoading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                            }`}
                          style={{
                            background: claimLoading ? 'var(--color-secondary)' : 'var(--color-accent)',
                            color: 'var(--color-bg)'
                          }}
                        >
                          {claimLoading
                            ? "Processing..."
                            : "Assign myself as keeper"}
                        </button>
                      </div>
                    )}
                    {item.status === 'Claimed' && isPosterOrKeeper && (
                      <button
                        onClick={handleConfirmHandoff}
                        disabled={claimLoading}
                        className={`w-full py-2 px-4 rounded-md text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 ${claimLoading
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                          }`}
                        style={{
                          background: claimLoading ? 'var(--color-secondary)' : 'var(--color-accent)',
                          color: 'var(--color-bg)'
                        }}
                      >
                        {claimLoading ? "Processing..." : "Confirm Handoff (Mark as Returned)"}
                      </button>
                    )}
                    
                    {/* NEW: Keeper/Admin Approve/Reject Claim Request */}
                    {isAdminOrKeeper && item.status === "ClaimPending" && (
                      <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--color-secondary)' }}>
                        <h3 className="text-sm font-bold mb-2 text-orange-600">Pending Claim Request</h3>
                    
                        <p className="text-xs mb-3" style={{ color: 'var(--color-text)' }}>
                          A user has requested to claim this item. Please review and approve or reject.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleApproveClaim}
                            disabled={claimLoading}
                            className={`flex-1 py-2 px-3 rounded-md text-white text-sm font-medium shadow-md transition-all duration-200 ${claimLoading ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'}`}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={handleRejectClaim}
                            disabled={claimLoading}
                            className={`flex-1 py-2 px-3 rounded-md text-white text-sm font-medium shadow-md transition-all duration-200 ${claimLoading ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'bg-red-600 hover:bg-red-700 hover:shadow-lg'}`}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {item.status === "Claimed" && item.keeperId && !item.keeperApproval && (
                      <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--color-secondary)' }}>
                        <h3 className="text-sm font-bold mb-2 text-amber-600">Handoff Process</h3>
                        
                        {/* Finder/Owner Confirm button */}
                        {user && (String(user.id) === String(item.postedBy?._id) || String(user.id) === String(item.claimedById)) && (
                          <button
                            onClick={handleConfirmMeeting}
                            disabled={claimLoading || (String(user.id) === String(item.postedBy?._id) ? item.meetingConfirmedByOwner : item.meetingConfirmedByFinder)}
                            className={`w-full py-2 px-4 rounded-md text-white text-sm font-medium shadow-md transition-all duration-200 ${(String(user.id) === String(item.postedBy?._id) ? item.meetingConfirmedByOwner : item.meetingConfirmedByFinder) || claimLoading ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
                          >
                            {(String(user.id) === String(item.postedBy?._id) ? item.meetingConfirmedByOwner : item.meetingConfirmedByFinder) ? "Meeting Confirmed ✓" : "Confirm Meeting"}
                          </button>
                        )}

                        {/* Keeper Approve button */}
                        {isAdminOrKeeper && (
                          <div className="mt-2 text-xs font-semibold p-3 rounded-md shadow-inner" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-secondary)' }}>
                            <div className="mb-2 text-sm">Required Confirmations:</div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="opacity-80">Finder:</span> 
                              <span>{item.meetingConfirmedByFinder ? '✅ Confirmed' : '⏳ Pending'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="opacity-80">Owner:</span> 
                              <span>{item.meetingConfirmedByOwner ? '✅ Confirmed' : '⏳ Pending'}</span>
                            </div>
                          </div>
                        )}
                        
                        {(isKeeper || user.role === 'admin') && (
                          <button
                            onClick={handleApproveHandoff}
                            disabled={claimLoading || !item.meetingConfirmedByFinder || !item.meetingConfirmedByOwner}
                            className={`w-full mt-2 py-2 px-4 rounded-md text-white text-sm font-medium shadow-md transition-all duration-200 ${(!item.meetingConfirmedByFinder || !item.meetingConfirmedByOwner || claimLoading) ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'}`}
                          >
                            {claimLoading ? "Processing..." : "Approve Handoff"}
                          </button>
                        )}
                      </div>
                    )}
                    
                    {(item.status === 'Claimed') && isPosterOrKeeper && (
                      <button
                        onClick={handleConfirmHandoff}
                        disabled={claimLoading}
                        className={`w-full py-2 px-4 rounded-md text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 ${claimLoading
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                          }`}
                        style={{
                          background: claimLoading ? 'var(--color-secondary)' : 'var(--color-accent)',
                          color: 'var(--color-bg)'
                        }}
                      >
                        {claimLoading ? "Processing..." : "Confirm Handoff (Mark as Returned)"}
                      </button>
                    )}
                    <button
                      onClick={handleShare}
                      className="w-full py-2 px-4 rounded-md transition-colors duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                      style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                    >
                      Share item
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleEditSubmit}
              className="rounded-lg shadow-lg p-6"
              encType="multipart/form-data"
              style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
            >
              <div className="mb-6">
                {item.image ? (
                  <div
                    className="relative w-full h-64 rounded-lg overflow-hidden shadow-md mb-2 cursor-pointer"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-sm font-medium">
                        Current image
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No image available</p>
                  </div>
                )}
                <div className="flex items-center space-4">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    style={{
                      border: '1px solid var(--color-secondary)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)'
                    }}
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="removeImage"
                      checked={removeImage}
                      onChange={handleEditChange}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--color-text)' }}>Remove image</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={editFormData.title}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                      htmlFor="description"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-y"
                      style={{
                        border: '1px solid var(--color-secondary)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)'
                      }}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={editFormData.category}
                      onChange={handleEditChange}
                      className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${!isAdminOrKeeper ? 'opacity-75 cursor-not-allowed' : ''}`}
                      style={{
                        border: '1px solid var(--color-secondary)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)'
                      }}
                      required
                      disabled={!isAdminOrKeeper}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditChange}
                      className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${!isAdminOrKeeper ? 'opacity-75 cursor-not-allowed' : ''}`}
                      style={{
                        border: '1px solid var(--color-secondary)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)'
                      }}
                      required
                      disabled={!isAdminOrKeeper}
                    >
                      <option value="Lost">Lost</option>
                      <option value="Found">Found</option>
                      <option value="Claimed">Claimed</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      style={{
                        border: '1px solid var(--color-secondary)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)'
                      }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 rounded-md transition-colors duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                  style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimLoading}
                  className={`py-2 px-4 rounded-md text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 ${claimLoading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                    }`}
                  style={{
                    background: claimLoading ? 'var(--color-secondary)' : 'var(--color-primary)',
                    color: 'var(--color-bg)'
                  }}
                >
                  {claimLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>

        {isImageModalOpen && item.image && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setIsImageModalOpen(false)}
          >
            <div className="relative max-w-4xl w-full h-[80vh] rounded-lg overflow-hidden shadow-2xl" style={{ background: 'var(--color-secondary)' }}>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 text-white bg-red-500 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
              >
                ×
              </button>
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default ItemDetails;