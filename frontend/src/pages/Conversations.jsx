import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMyConversations } from '../services/conversationService';
import Loader from '../components/common/Loader';
import { Link } from 'react-router-dom';

function Conversations() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch conversations function
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await getMyConversations();
      setConversations(response.data.conversations.docs || []);
      setError('');
    } catch (err) {
      setError('Failed to load conversations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConversations();
  }, [user, navigate]);

  // Format date for better readability
  const formatDate = (date) => 
    new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  if (!user) return <Loader />;

  return (
    <div className="container mx-auto p-4 sm:p-6 min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Conversations</h1>
        {error && (
          <div className="mb-4 p-3 rounded-md shadow-md" style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>
            {error}
          </div>
        )}
        {loading ? (
          <Loader className="text-blue-600" />
        ) : conversations.length > 0 ? (
          <div className="grid gap-4">
            {conversations.map((conv) => {
              const otherUser = conv.participants.find(p => p._id !== user.id) || { name: 'Unknown User' };
              const displayUser = conv.lastMessage?.sender || otherUser;
              return (
              <Link
                key={conv._id}
                to={`/messages/${conv._id}`}
                className="flex items-center p-4 border rounded-2xl transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
                style={{ borderColor: 'var(--color-secondary)', background: 'var(--color-secondary)' }}
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-sm bg-blue-100 flex items-center justify-center text-blue-800 text-xl font-bold mr-4">
                  {displayUser.profilePicture ? (
                    <img src={displayUser.profilePicture} alt={displayUser.name} className="w-full h-full object-cover" />
                  ) : (
                    displayUser.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-lg font-bold truncate" style={{ color: 'var(--color-text)' }}>
                      {displayUser.name}
                    </h3>
                    <span className="text-xs ml-2 flex-shrink-0 font-medium opacity-70" style={{ color: 'var(--color-text)' }}>
                      {formatDate(conv.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: 'var(--color-primary)', color: 'white' }}>
                      {conv.item?.category?.name || 'Unknown'}
                    </span>
                    <span className="text-sm font-semibold truncate opacity-90" style={{ color: 'var(--color-text)' }}>
                      {conv.item?.title || 'Item Chat'}
                    </span>
                  </div>
                  
                  <p className="text-sm truncate opacity-70 overflow-hidden" style={{ color: 'var(--color-text)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                    {conv.lastMessage?.content || 'Started a conversation...'}
                  </p>
                </div>
              </Link>
            )})}
          </div>
        ) : (
          <p className="text-lg text-center py-10" style={{ color: 'var(--color-text)' }}>No conversations found.</p>
        )}
      </div>
    </div>
  );
}

export default Conversations;